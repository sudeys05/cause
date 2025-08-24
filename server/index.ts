import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import MongoStore from 'connect-mongo';
import { connectToMongoDB } from './mongodb-connection.js'; // new module

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);

// Mask MongoDB URI in logs
function maskMongoUri(uri: string | undefined) {
  if (!uri) return '[NOT SET]';
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:***@');
}

console.log('🚀 Starting Police Management System...');
console.log(`MONGODB_URI = ${maskMongoUri(process.env.MONGODB_URI)}`);

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer configs
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.shp', '.kml', '.geojson', '.csv', '.gpx', '.kmz', '.gml'];
    cb(allowed.includes(path.extname(file.originalname).toLowerCase()) ? null : new Error('Invalid file type'), true);
  },
});

const uploadCustodial = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png'];
    cb(allowed.includes(path.extname(file.originalname).toLowerCase()) ? null : new Error('Invalid image type'), true);
  },
});

// Serve uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

async function startServer() {
  let mongoConnected = false;

  // Connect to MongoDB with retries
  try {
    console.log('🔗 Connecting to MongoDB...');
    mongoConnected = await connectToMongoDB();
  } catch (err: any) {
    console.error('❌ MongoDB connection failed:', err.message);
  }

  // Session store
  const sessionStore = mongoConnected && process.env.MONGODB_URI
    ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI })
    : undefined;

  app.use(session({
    secret: process.env.SESSION_SECRET || 'police-management-secret-key',
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 24 * 60 * 60 * 1000 },
  }));

  // Register routes
  try {
    const mongoRoutes = await import('./mongodb-routes.js').catch(() => null);
    const evidenceRoutes = await import('./evidence-routes.js').catch(() => null);
    const additionalRoutes = await import('./api-routes.js').catch(() => null);

    if (mongoConnected && mongoRoutes?.registerMongoDBRoutes) {
      mongoRoutes.registerMongoDBRoutes(app, upload, uploadCustodial);
    }
    if (mongoConnected && evidenceRoutes?.registerEvidenceRoutes) {
      evidenceRoutes.registerEvidenceRoutes(app);
    }
    if (additionalRoutes?.registerAdditionalRoutes) {
      additionalRoutes.registerAdditionalRoutes(app);
      console.log('✅ Additional routes loaded');
    }
  } catch (err) {
    console.error('❌ Failed to load routes:', err);
  }

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      mongodb: mongoConnected ? 'connected' : 'disconnected',
    });
  });

  if (!mongoConnected) {
    app.get('/api/*', (req, res) => res.status(503).json({
      message: 'Database not available',
      status: 'service_unavailable',
    }));
  }

  // Serve frontend (React build) in production
  if (process.env.NODE_ENV === 'production') {
    const buildPath = path.join(process.cwd(), 'dist/public');
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(buildPath, 'index.html'));
      }
    });
  } else {
    console.log('⚠️ Development mode: Vite server handles frontend.');
  }

  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, '0.0.0.0', () => {
    console.log(`✅ Police Management System running on port ${port}`);
    console.log(`📌 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📌 MongoDB Status: ${mongoConnected ? 'Connected' : 'Disconnected'}`);
  });
}

startServer();
