// routes/publications.js
const express = require('express');
const router = express.Router();
const publicationController = require('../controllers/publicationController');
const authMiddleware = require('../middleware/auth');
const { uploadAny } = require('../middleware/fileUpload');

const publicationUpload = uploadAny.fields([
  { name: 'pdf_file', maxCount: 1 },
  { name: 'cover_image', maxCount: 1 }
]);

// Public routes
router.get('/', publicationController.getAllPublications);
router.get('/categories', publicationController.getAllCategories);
router.get('/:id', publicationController.getPublicationById);

// Protected routes (admin only)
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  publicationUpload,
  publicationController.createPublication
);

router.put(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  publicationUpload,
  publicationController.updatePublication
);

router.delete(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  publicationController.deletePublication
);

module.exports = router;
