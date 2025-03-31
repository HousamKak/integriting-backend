// routes/whistleblower.js
const express = require('express');
const router = express.Router();
const whistleblowerController = require('../controllers/whistleblowerController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/report', whistleblowerController.submitReport);
router.get('/status/:referenceNumber', whistleblowerController.getReportByReference);

// Protected routes (admin only)
router.get(
  '/reports', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  whistleblowerController.getAllReports
);

router.get(
  '/reports/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  whistleblowerController.getReportById
);

router.put(
  '/reports/:id/status', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  whistleblowerController.updateReportStatus
);

router.post(
  '/reports/:id/notes', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  whistleblowerController.addReportNote
);

router.get(
  '/statistics', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  whistleblowerController.getReportStatistics
);

module.exports = router;