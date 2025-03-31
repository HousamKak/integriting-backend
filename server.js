// server.js
require('dotenv').config();
const app = require('./app');
const { initializeDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

// Initialize database before starting server
const startServer = async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();