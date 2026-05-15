// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler').errorHandler;
const notFoundHandler = require('./middleware/errorHandler').notFoundHandler;
const swagger = require('./config/swagger');

// Create Express app
const app = express();

// Trust the single nginx reverse proxy in front of the app so req.ip and
// rate limiting use the real client IP (X-Forwarded-For), not 127.0.0.1.
app.set('trust proxy', 1);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: [
    'http://localhost:3000',  // Frontend dev server (default Vite port)
    'http://localhost:5173',  // Vite dev server (alternative port)
    'http://localhost:4173',  // Vite preview server
    process.env.CORS_ORIGIN   // Environment specific origin
  ].filter(Boolean)
}));   // CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Logging

// Serve static files (e.g. for uploaded images/pdfs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger API docs
app.use('/api-docs', swagger.serve, swagger.setup);

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rate limiting. A generous global cap on the API, plus a strict cap on the
// login endpoint to slow credential brute-forcing.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' }
});
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/publications', require('./routes/publications'));
app.use('/api/services', require('./routes/services'));
app.use('/api/seminars', require('./routes/seminars'));
app.use('/api/newspapers', require('./routes/newspapers'));
app.use('/api/whistleblower', require('./routes/whistleblower'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/admin', require('./routes/admin'));

// In production, serve the React app's build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../integriting-frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../integriting-frontend/dist/index.html'));
  });
}

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Export the express app (server.js will actually start it)
module.exports = app;