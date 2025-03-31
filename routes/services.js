// routes/services.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/', serviceController.getAllServices);
router.get('/:id', serviceController.getServiceById);

// Protected routes (admin only)
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  serviceController.createService
);

router.put(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  serviceController.updateService
);

router.delete(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  serviceController.deleteService
);

router.post(
  '/orders', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  serviceController.updateServiceOrders
);

module.exports = router;