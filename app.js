// app.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler').errorHandler;
const notFoundHandler = require('./middleware/errorHandler').notFoundHandler;
const swagger = require('./config/swagger');

// Create Express app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/publications', require('./routes/publications'));
app.use('/api/services', require('./routes/services'));
app.use('/api/seminars', require('./routes/seminars'));
app.use('/api/newspapers', require('./routes/newspapers'));
app.use('/api/whistleblower', require('./routes/whistleblower'));
app.use('/api/uploads', require('./routes/uploads'));

// In production, serve the React app's build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../integriting-frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../integriting-frontend/build/index.html'));
  });
}

// 404 handler
app.use(notFoundHandler);

// Error handling middleware
app.use(errorHandler);

// Export the express app (server.js will actually start it)
module.exports = app;