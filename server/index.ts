import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

// Dynamic imports for optional modules
let connectToMongoDB, registerMongoDBRoutes, registerEvidenceRoutes, setupVite, serveStatic, log, seedGeofiles;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

function maskMongoUri(uri) {
  if (!uri) return "[NOT SET]";
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:***@");
}

console.log("Starting Police Management System with MongoDB Atlas...");
console.log(`MONGODB_URI = ${maskMongoUri(process.env.MONGODB_URI)}`);

// Check if MongoDB URI is set
if (!process.env.MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI environment variable is not set');
  console.log('🔄 Starting server in fallback mode without database...');
}

const app = express();
const server = createServer(app);

// Configure multer for geofile uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.shp', '.kml', '.geojson', '.csv', '.gpx', '.kmz', '.gml'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  }
});

// Configure multer for custodial records (ID photos)
const uploadCustodial = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for photos
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedImageTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid image file type. Only JPG, PNG, JPEG allowed'), false);
    }
  }
});

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'police-management-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

async function startServer() {
  let mongoConnected = false;

  try {
    // Load modules dynamically
    const mongoConnection = await import('./mongodb-connection.js').catch(() => null);
    const mongoRoutes = await import('./mongodb-routes.js').catch(() => null);
    const evidenceRoutes = await import('./evidence-routes.js').catch(() => null);
    const viteModule = await import('./vite.js').catch(() => null);
    const seedModule = await import('./seed-geofiles.js').catch(() => null);

    if (mongoConnection) connectToMongoDB = mongoConnection.connectToMongoDB;
    if (mongoRoutes) registerMongoDBRoutes = mongoRoutes.registerMongoDBRoutes;
    if (evidenceRoutes) registerEvidenceRoutes = evidenceRoutes.registerEvidenceRoutes;
    if (viteModule) {
      setupVite = viteModule.setupVite;
      serveStatic = viteModule.serveStatic;
      log = viteModule.log;
    }
    if (seedModule) seedGeofiles = seedModule.seedGeofiles;

    // Fallback log function if vite module fails
    if (!log) {
      log = (message, source = "express") => {
        const formattedTime = new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        });
        console.log(`${formattedTime} [${source}] ${message}`);
      };
    }

    // Connect to MongoDB if available
    if (connectToMongoDB) {
      console.log('🔗 Connecting to MongoDB...');
      await connectToMongoDB();
      console.log('✅ MongoDB connected successfully!');
      mongoConnected = true;
    }
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed:', error.message);
    console.log('🔄 Starting server in fallback mode without database...');
    console.log('📝 Update your .env file with proper MongoDB credentials to enable full functionality');
  }

  try {
    // Register routes (even without MongoDB for basic functionality)
    if (mongoConnected && registerMongoDBRoutes && registerEvidenceRoutes) {
      registerMongoDBRoutes(app, upload, uploadCustodial);
      registerEvidenceRoutes(app);
    }

    // Import and register additional routes (optional)
    try {
      const additionalRoutes = await import('./api-routes.js');
      if (additionalRoutes && additionalRoutes.registerAdditionalRoutes) {
        additionalRoutes.registerAdditionalRoutes(app);
        console.log('✅ Additional routes loaded successfully');
      }
    } catch (error) {
      console.log('⚠️  Additional routes file not found - continuing without it');
    }

    // Serve uploaded files statically
    app.use('/uploads', express.static('uploads'));

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        mongodb: mongoConnected ? 'connected' : 'disconnected',
        message: mongoConnected ? 'All systems operational' : 'Running in fallback mode - update MongoDB URI in .env'
      });
    });

    // Basic fallback route when MongoDB is not connected
    if (!mongoConnected) {
      app.get('/api/*', (req, res) => {
        res.status(503).json({ 
          message: 'Database not available. Please configure MongoDB URI in .env file.',
          status: 'service_unavailable'
        });
      });
    }

    if (process.env.NODE_ENV === 'production') {
      // Serve static files from React build
      const buildPath = path.join(__dirname, '../dist/public');

      app.use(express.static(buildPath));

      // Handle React Router - send all non-API requests to index.html
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
          res.sendFile(path.join(buildPath, 'index.html'));
        }
      });
    } else {
      if (setupVite) {
        await setupVite(app, server);
      } else {
        console.log('⚠️ Vite module not available, serving basic static content');
        // Basic fallback for development
        app.get('*', (req, res) => {
          if (!req.path.startsWith('/api')) {
            res.send(`
              <html>
                <head><title>Police Management System</title></head>
                <body>
                  <h1>Police Management System</h1>
                  <p>Server is running but frontend build required.</p>
                  <p>Check console for more details.</p>
                </body>
              </html>
            `);
          }
        });
      }
    }

    // Seed development data (only if MongoDB is connected)
    if (mongoConnected) {
      try {
        if (seedGeofiles) {
          console.log('🌱 Seeding sample geofiles...');
          await seedGeofiles();
        }

        // Seed admin user for login
        console.log('🌱 Seeding admin user...');
        const seedAdminModule = await import('./seed-admin.js').catch(() => null);
        if (seedAdminModule && seedAdminModule.seedAdminUser) {
          await seedAdminModule.seedAdminUser();
        }
      } catch (error) {
        console.warn('⚠️ Failed to seed data:', error.message);
      }
    }

    const port = parseInt(process.env.PORT || '5000', 10);
    server.listen(port, '0.0.0.0', () => {
      log(`Police Management System running on port ${port}`);
      log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      log(`MongoDB Status: ${mongoConnected ? 'Connected' : 'Disconnected (Fallback Mode)'}`);
      log(`Server accessible at: http://0.0.0.0:${port}`);
      console.log(`🌐 Server is ready and listening on http://0.0.0.0:${port}`);
      console.log(`📱 Replit webview should be accessible now`);
      console.log(`🚀 Click the webview button or open the URL above to access your Police Management System`);

      if (!mongoConnected) {
        console.log(`⚠️  Note: Running without database. Update MONGODB_URI in .env to enable full functionality`);
      }
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

startServer();