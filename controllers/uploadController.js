// controllers/uploadController.js
const { processUploadedFile } = require('../middleware/fileUpload');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Upload single file
exports.uploadFile = async (req, res) => {
  try {
    // The file is already uploaded by multer middleware
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Process the file to get relative path
    const filePath = req.file.path.replace(/\\/g, '/');
    const fileUrl = `/uploads/${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`;
    
    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: fileUrl
      }
    });
  } catch (err) {
    console.error('Error uploading file:', err);
    
    // Clean up the file if it was uploaded
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting file: ${unlinkErr}`);
      });
    }
    
    res.status(500).json({ message: 'Failed to upload file' });
  }
};

// Upload multiple files
exports.uploadMultipleFiles = async (req, res) => {
  try {
    // The files are already uploaded by multer middleware
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    // Process the files to get relative paths
    const fileDetails = req.files.map(file => {
      const filePath = file.path.replace(/\\/g, '/');
      const fileUrl = `/uploads/${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`;
      
      return {
        originalName: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        path: fileUrl
      };
    });
    
    res.status(200).json({
      message: 'Files uploaded successfully',
      files: fileDetails
    });
  } catch (err) {
    console.error('Error uploading files:', err);
    
    // Clean up the files if they were uploaded
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        fs.unlink(file.path, (unlinkErr) => {
          if (unlinkErr) console.error(`Error deleting file: ${unlinkErr}`);
        });
      });
    }
    
    res.status(500).json({ message: 'Failed to upload files' });
  }
};

// Delete file
exports.deleteFile = async (req, res) => {
  const { filename } = req.params;
  
  // Validate filename to prevent path traversal attacks
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ message: 'Invalid filename' });
  }
  
  try {
    // Find the file in the uploads directory
    const uploadsDir = path.join(__dirname, '../uploads');
    let filePath = null;
    let found = false;
    
    // Check in each uploads subdirectory
    const subdirs = ['pdfs', 'images', 'newspapers'];
    
    for (const subdir of subdirs) {
      filePath = path.join(uploadsDir, subdir, filename);
      
      if (fs.existsSync(filePath)) {
        found = true;
        break;
      }
    }
    
    if (!found) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Delete the file
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error deleting file: ${err}`);
        return res.status(500).json({ message: 'Failed to delete file' });
      }
      
      res.status(200).json({ message: 'File deleted successfully' });
    });
  } catch (err) {
    console.error('Error deleting file:', err);
    res.status(500).json({ message: 'Failed to delete file' });
  }
};

// Get temporary upload URL (for direct uploads from browser)
exports.getUploadUrl = async (req, res) => {
  try {
    // Generate a unique filename
    const filename = `${crypto.randomBytes(16).toString('hex')}${path.extname(req.body.originalname || '')}`;
    
    // Determine the appropriate upload directory based on file type
    let uploadDir = 'images'; // Default
    
    if (req.body.fileType) {
      const mimeType = req.body.fileType.toLowerCase();
      
      if (mimeType === 'application/pdf') {
        uploadDir = 'pdfs';
      } else if (mimeType.startsWith('image/')) {
        uploadDir = 'images';
      } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                mimeType === 'application/msword' ||
                mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                mimeType === 'application/vnd.ms-excel') {
        uploadDir = 'documents';
      }
    }
    
    // Create the upload URL
    const uploadUrl = `/api/uploads/direct/${uploadDir}/${filename}`;
    
    res.status(200).json({
      uploadUrl,
      filename,
      filePath: `/uploads/${uploadDir}/${filename}`
    });
  } catch (err) {
    console.error('Error generating upload URL:', err);
    res.status(500).json({ message: 'Failed to generate upload URL' });
  }
};

// Handle direct upload from browser
exports.directUpload = async (req, res) => {
  try {
    // The file is already uploaded by multer middleware
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Process the file to get relative path
    const filePath = req.file.path.replace(/\\/g, '/');
    const fileUrl = `/uploads/${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`;
    
    res.status(200).json({
      message: 'File uploaded successfully',
      file: {
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: fileUrl
      }
    });
  } catch (err) {
    console.error('Error with direct upload:', err);
    
    // Clean up the file if it was uploaded
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error(`Error deleting file: ${unlinkErr}`);
      });
    }
    
    res.status(500).json({ message: 'Failed to upload file' });
  }
};