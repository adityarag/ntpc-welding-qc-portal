const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const moduleName = (req.query.module || 'misc').toLowerCase();
    // Valid modules: rt, pwht, paut, mpi
    const targetDir = path.join(__dirname, '../uploads', moduleName);
    
    // Ensure directory exists recursively
    fs.mkdirSync(targetDir, { recursive: true });
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    // Generate clean filename with timestamp
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

// PDF file filter
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

exports.uploadMiddleware = upload.single('file');

exports.handleUpload = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded or file type is not PDF.' });
    }
    
    const moduleName = (req.query.module || 'misc').toLowerCase();
    // Return the relative path to be stored in the DB
    const relativePath = `/uploads/${moduleName}/${req.file.filename}`;
    res.status(200).json({ 
      filePath: relativePath,
      filename: req.file.filename,
      originalName: req.file.originalname 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
