import multer from 'multer';
import path from 'path';

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// Enhanced file filter with strict validation
const fileFilter = (req, file, cb) => {
  // Allowed MIME types with their corresponding extensions
  const allowedMimeTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'audio/mpeg': ['.mp3'],
    'audio/mp4': ['.m4a'],
    'audio/ogg': ['.ogg'],
    'audio/webm': ['.webm'],
    'video/mp4': ['.mp4'],
    'audio/wav': ['.wav'],
  };

  const fileExt = path.extname(file.originalname).toLowerCase();
  const allowedExtensions = allowedMimeTypes[file.mimetype];

  // Validate both MIME type and extension
  if (allowedExtensions && allowedExtensions.includes(fileExt)) {
    // Additional security: Check for double extensions
    const fileName = file.originalname.toLowerCase();
    const extensionCount = (fileName.match(/\./g) || []).length;
    
    if (extensionCount > 1) {
      return cb(new Error('Invalid file name. Multiple extensions detected.'));
    }
    
    // Prevent path traversal attacks
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      return cb(new Error('Invalid file name. Path traversal detected.'));
    }
    
    return cb(null, true);
  } else {
    cb(new Error('Invalid file type. Please upload only allowed file formats.'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter,
});

// Avatar-specific upload configuration
const avatarStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const avatarFileFilter = (req, file, cb) => {
  // Strict image validation for avatars
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  const fileName = file.originalname.toLowerCase();

  // Validate MIME type
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
  }

  // Validate extension
  if (!allowedExtensions.includes(fileExt)) {
    return cb(new Error('Invalid file extension.'));
  }

  // Check for double extensions
  if ((fileName.match(/\./g) || []).length > 1) {
    return cb(new Error('Invalid file name. Multiple extensions detected.'));
  }

  // Prevent path traversal
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    return cb(new Error('Invalid file name. Path traversal detected.'));
  }

  // Additional check: Validate file size in filter (for early rejection)
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 5 * 1024 * 1024) {
    return cb(new Error('File too large. Maximum size is 5MB.'));
  }

  cb(null, true);
};

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  },
  fileFilter: avatarFileFilter,
});
