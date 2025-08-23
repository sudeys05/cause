
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Simple server running'
  });
});

// Basic API fallback
app.get('/api/*', (req, res) => {
  res.json({ message: 'API endpoint not implemented in simple mode' });
});

// Serve static files in production or simple HTML in development
if (process.env.NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../dist/public');
  app.use(express.static(buildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Police Management System</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .container { max-width: 800px; margin: 0 auto; }
            .status { padding: 20px; background: #f0f8ff; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🚨 Police Management System</h1>
            <div class="status">
              <h2>Server Status: Running</h2>
              <p>✅ Express server is operational</p>
              <p>📍 Listening on port ${port}</p>
              <p>🔗 API Health: <a href="/api/health">/api/health</a></p>
            </div>
            <h3>Next Steps:</h3>
            <ul>
              <li>Configure MongoDB connection in .env file</li>
              <li>Run the full application with proper dependencies</li>
              <li>Build the React frontend</li>
            </ul>
          </div>
        </body>
      </html>
    `);
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Simple server running on http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://0.0.0.0:${port}/api/health`);
});
