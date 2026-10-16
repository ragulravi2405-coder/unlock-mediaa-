const fs = require('fs');
const path = require('path');

const ORIGINALS_DIR = path.resolve(__dirname, '../../uploads/originals');
const PREVIEWS_DIR = path.resolve(__dirname, '../../uploads/previews');

// Ensure upload directories exist
[ORIGINALS_DIR, PREVIEWS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Resolves local file path safely inside designated directory
 */
function resolveFilePath(fileKey, isOriginal = true) {
  const baseDir = isOriginal ? ORIGINALS_DIR : PREVIEWS_DIR;
  const safeKey = path.basename(fileKey); // Prevent directory traversal
  return path.join(baseDir, safeKey);
}

/**
 * Checks if local file exists
 */
function fileExists(fileKey, isOriginal = true) {
  const filePath = resolveFilePath(fileKey, isOriginal);
  return fs.existsSync(filePath);
}

/**
 * Streams protected media file with HTTP 206 Partial Content support for videos and downloads
 */
function streamProtectedMedia(req, res, fileKey, mimeType, isDownload = false, downloadName = 'media') {
  const filePath = resolveFilePath(fileKey, true);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Protected media file not found on storage server' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // Set security and cache headers
  res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Content-Type', mimeType || 'application/octet-stream');
  res.setHeader('Accept-Ranges', 'bytes');

  if (isDownload) {
    const safeFilename = encodeURIComponent(downloadName);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
  }

  if (range) {
    // Handle HTTP Range header for video seeking & chunks
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize || end >= fileSize || start > end) {
      res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
      return res.end();
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
    res.setHeader('Content-Length', chunksize);

    file.pipe(res);
  } else {
    // Return full stream
    res.setHeader('Content-Length', fileSize);
    fs.createReadStream(filePath).pipe(res);
  }
}

module.exports = {
  ORIGINALS_DIR,
  PREVIEWS_DIR,
  resolveFilePath,
  fileExists,
  streamProtectedMedia
};
