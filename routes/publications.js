// routes/publications.js
const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publicationController');
const authMiddleware = require('../middleware/auth');
const { uploadPDF } = require('../middleware/fileUpload');

// Public routes
router.get('/', publicationController.getAllPublications);
router.get('/categories', publicationController.getAllCategories);
router.get('/:id', publicationController.getPublicationById);

// Protected routes (admin only)
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  uploadPDF.single('pdf_file'),
  publicationController.createPublication
);

router.put(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  uploadPDF.single('pdf_file'),
  publicationController.updatePublication
);

router.delete(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  publicationController.deletePublication
);

module.exports = router;