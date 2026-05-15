// routes/newspapers.js
const express = require('express');
const router = express.Router();
const newspaperController = require('../controllers/newspaperController');
const authMiddleware = require('../middleware/auth');
const { uploadNewspaper } = require('../middleware/fileUpload');

// Disk-backed storage (memory storage has no file.path and never persists
// the file, which broke newspaper create/update entirely).
const multiUpload = uploadNewspaper.fields([
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