// middleware/auth.js
const jwt = require('jsonwebtoken');
const sql = require('mssql');
const { getConnection } = require('../config/database.sqlserver');

// Verify JWT token
exports.verifyToken = (req, res, next) => {
  // Get auth header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No token provided' });
  }
  
  // Check if it's Bearer token
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token error' });
  }
  
  const token = parts[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Add user ID and role to request object
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    return next();
  } catch (err) {
    console.error('Token verification failed:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Check if user is admin
exports.isAdmin = async (req, res, next) => {
  try {
    if (req.userRole === 'admin') {
      return next();
    }
    
    // Double check from database
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, req.userId)
      .query('SELECT role FROM Users WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.recordset[0];
    if (user.role === 'admin') {
      return next();
    }
    
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  } catch (err) {
    console.error('Error checking admin role:', err);
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};

// Check if user is editor or admin
exports.isEditorOrAdmin = async (req, res, next) => {
  try {
    if (req.userRole === 'admin' || req.userRole === 'editor') {
      return next();
    }
    
    // Double check from database
    const pool = await getConnection();
    const result = await pool.request()
      .input('id', sql.Int, req.userId)
      .query('SELECT role FROM Users WHERE id = @id');
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.recordset[0];
    if (user.role === 'admin' || user.role === 'editor') {
      return next();
    }
    
    return res.status(403).json({ message: 'Access denied. Editor or Admin role required.' });
  } catch (err) {
    console.error('Error checking editor/admin role:', err);
    return res.status(500).json({ message: 'Authorization check failed' });
  }
};