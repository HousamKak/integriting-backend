// middleware/fileUpload.js (enhanced version)
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    './uploads',
    './uploads/pdfs',
    './uploads/images',
    './uploads/newspapers',
    './uploads/documents',
    './uploads/temp'
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Call this function when the app starts
createUploadDirs();

// Generate a unique filename
const generateFilename = (file) => {
  const randomString = crypto.randomBytes(8).toString('hex');
  const fileExtension = path.extname(file.originalname);
  const timestamp = Date.now();
  
  // Create a sanitized base filename without spaces
  const sanitizedBasename = path.basename(file.originalname, fileExtension)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .trim();
  
  return `${sanitizedBasename}-${timestamp}-${randomString}${fileExtension}`;
};

// Determine storage destination based on file type
const getDestination = (req, file, cb) => {
  const mimeType = file.mimetype.toLowerCase();
  
  if (mimeType === 'application/pdf') {
    cb(null, './uploads/pdfs');
  } else if (mimeType.startsWith('image/')) {
    cb(null, './uploads/images');
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
            mimeType === 'application/msword' ||
            mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            mimeType === 'application/vnd.ms-excel') {
    cb(null, './uploads/documents');
  } else {
    // Check if request specifies a particular destination
    if (req.params.folder && ['pdfs', 'images', 'newspapers', 'documents', 'temp'].includes(req.params.folder)) {
      cb(null, `./uploads/${req.params.folder}`);
    } else {
      cb(null, './uploads/temp');
    }
  }
};

// Storage configuration
const storage = multer.diskStorage({
  destination: getDestination,
  filename: (req, file, cb) => {
    // Use request filename parameter if available (for direct uploads)
    if (req.params.filename) {
      cb(null, req.params.filename);
    } else {
      cb(null, generateFilename(file));
    }
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Define allowed MIME types
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
  }
};

// Create multer instances
exports.uploadPDF = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});

exports.uploadImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

exports.uploadNewspaper = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and image files are allowed'), false);
    }
  },
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB
  }
});

exports.uploadAny = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 30 * 1024 * 1024 // 30MB
  }
});

// Process uploaded file and add file data to request
exports.processUploadedFile = (req, res, next) => {
  if (!req.file) {
    // If no file was uploaded and it's a PUT request, continue
    if (req.method === 'PUT') {
      return next();
    }
    
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  // Add file information to request body
  const filePath = req.file.path.replace(/\\/g, '/');
  const fileUrl = `/uploads/${path.basename(path.dirname(filePath))}/${path.basename(filePath)}`;
  
  req.body.file_path = fileUrl;
  req.body.file_size = req.file.size;
  req.body.file_name = req.file.originalname;
  req.body.file_type = req.file.mimetype;
  
  next();
};

// Error handler for multer
exports.handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large' });
    }
    return res.status(400).json({ message: err.message });
  }
  
  if (err) {
    return res.status(400).json({ message: err.message });
  }
  
  next();
};

// File service utility functions
exports.fileService = {
  // Delete file by path
  deleteFile: (filePath) => {
    return new Promise((resolve, reject) => {
      fs.unlink(filePath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
  
  // Get file size
  getFileSize: (filePath) => {
    return new Promise((resolve, reject) => {
      fs.stat(filePath, (err, stats) => {
        if (err) {
          reject(err);
        } else {
          resolve(stats.size);
        }
      });
    });
  },
  
  // Check if file exists
  fileExists: (filePath) => {
    return new Promise((resolve) => {
      fs.access(filePath, fs.constants.F_OK, (err) => {
        resolve(!err);
      });
    });
  },
  
  // Format file size for display
  formatFileSize: (bytes) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  }
};