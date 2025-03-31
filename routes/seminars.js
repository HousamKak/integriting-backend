// routes/seminars.js
const express = require('express');
const router = express.Router();
const seminarController = require('../controllers/seminarController');
const authMiddleware = require('../middleware/auth');
const { uploadImage } = require('../middleware/fileUpload');

// Public routes
router.get('/', seminarController.getAllSeminars);
router.get('/upcoming', seminarController.getUpcomingSeminars);
router.get('/past', seminarController.getPastSeminars);
router.get('/:id', seminarController.getSeminarById);

// Protected routes (admin only)
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  uploadImage.single('image'), 
  seminarController.createSeminar
);

router.put(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  uploadImage.single('image'), 
  seminarController.updateSeminar
);

router.delete(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  seminarController.deleteSeminar
);

module.exports = router;