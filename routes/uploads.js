// routes/uploads.js
const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const authMiddleware = require('../middleware/auth.sqlserver');
const { uploadPDF, uploadImage, uploadAny } = require('../middleware/fileUpload');

// Protected routes (admin only)
router.post(
  '/file', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  uploadAny.single('file'), 
  uploadController.uploadFile
);

router.post(
  '/files', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  uploadAny.array('files', 10), 
  uploadController.uploadMultipleFiles
);

router.delete(
  '/file/:filename', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  uploadController.deleteFile
);

router.post(
  '/get-upload-url', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  uploadController.getUploadUrl
);

// Special route for direct uploads from browser
router.post(
  '/direct/:folder/:filename', 
  authMiddleware.verifyToken, 
  authMiddleware.isAdmin, 
  uploadAny.single('file'), 
  uploadController.directUpload
);

module.exports = router;