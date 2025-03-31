// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.sqlserver');
const authMiddleware = require('../middleware/auth.sqlserver');

// Public routes
router.post('/login', authController.login);

// Protected routes
router.get('/me', authMiddleware.verifyToken, authController.getCurrentUser);
router.put('/password', authMiddleware.verifyToken, authController.updatePassword);

module.exports = router;
