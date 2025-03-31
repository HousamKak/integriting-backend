// routes/newspapers.js
const express = require('express');
const router = express.Router();
const newspaperController = require('../controllers/newspaperController');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const { uploadPDF, uploadImage } = require('../middleware/fileUpload');

// Configure multer for multiple file types
const upload = multer();
const multiUpload = upload.fields([
  { name: 'pdf_file', maxCount: 1 },
  { name: 'cover_image', maxCount: 1 }
]);

// Public routes
router.get('/', newspaperController.getAllNewspapers);
router.get('/latest', newspaperController.getLatestNewspaper);
router.get('/years', newspaperController.getAvailableYears);
router.get('/:id', newspaperController.getNewspaperById);

// Protected routes (admin only)
router.post(
  '/', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  multiUpload,
  newspaperController.createNewspaper
);

router.put(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  multiUpload,
  newspaperController.updateNewspaper
);

router.delete(
  '/:id', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  newspaperController.deleteNewspaper
);

module.exports = router;