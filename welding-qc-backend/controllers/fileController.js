const path = require('path');
const fs = require('fs');

exports.downloadFile = (req, res) => {
  try {
    const filePath = req.query.path;
    
    if (!filePath) {
      return res.status(400).json({ message: 'File path is required.' });
    }

    // Ensure the path starts with /uploads/ to prevent directory traversal
    if (!filePath.startsWith('/uploads/')) {
      return res.status(403).json({ message: 'Unauthorized file access.' });
    }

    // Resolve the absolute path
    const absolutePath = path.join(__dirname, '..', filePath);

    // Check if the path actually resolves inside the uploads directory
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!absolutePath.startsWith(uploadsDir)) {
      return res.status(403).json({ message: 'Unauthorized file access.' });
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'File not found.' });
    }

    res.sendFile(absolutePath);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
