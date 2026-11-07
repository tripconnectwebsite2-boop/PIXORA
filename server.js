const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = path.resolve(__dirname);

// Permitted public static MIME types
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

// Blacklisted files that must never be served
const FORBIDDEN_EXTENSIONS = new Set(['.js_map', '.map', '.env', '.git', '.log', '.jsonl', '.ps1', '.bat', '.cmd', '.sh']);
const FORBIDDEN_FILES = new Set(['server.js', 'package.json', 'package-lock.json']);

const server = http.createServer((req, res) => {
  // 1. Remove Server Fingerprints
  res.removeHeader('X-Powered-By');

  // 2. Strict Military-Grade Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://storage.googleapis.com blob: data:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; worker-src 'self' blob: data:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https:; connect-src 'self' data: blob: https://cdn.jsdelivr.net https://storage.googleapis.com;"
  );

  // 3. HTTP Verb Hardening: Only allow GET and HEAD
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('405 Method Not Allowed');
  }

  // 4. Input Sanitization & Anti-Traversal Path Resolution
  let rawUrl = req.url.split('?')[0];
  let decodedPath = '';
  try {
    decodedPath = decodeURIComponent(rawUrl);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('400 Bad Request');
  }

  // Null byte injection protection
  if (decodedPath.indexOf('\0') !== -1) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('400 Bad Request');
  }

  let cleanRelative = path.normalize(decodedPath).replace(/^(\.\.[\/\\])+/, '');
  if (cleanRelative === '/' || cleanRelative === '\\' || cleanRelative === '') {
    cleanRelative = '/index.html';
  }

  const resolvedPath = path.resolve(PUBLIC_DIR, '.' + cleanRelative);

  // 5. Bulletproof Path Traversal Check (Must strictly live inside PUBLIC_DIR)
  if (!resolvedPath.startsWith(PUBLIC_DIR + path.sep) && resolvedPath !== path.join(PUBLIC_DIR, 'index.html')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden: Access Denied');
  }

  // 6. Sensitive File Blacklist Check (Check every path segment for hidden dotfiles/folders)
  const pathParts = cleanRelative.split(/[/\\]/);
  const hasHiddenSegment = pathParts.some(part => part.startsWith('.') && part !== '.' && part !== '..');
  const baseName = path.basename(resolvedPath).toLowerCase();
  const extName = path.extname(resolvedPath).toLowerCase();

  if (hasHiddenSegment || FORBIDDEN_FILES.has(baseName) || FORBIDDEN_EXTENSIONS.has(extName) || baseName.startsWith('.')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('403 Forbidden: Protected System File');
  }

  // 7. File Existence & Stat Validation (with clean extension fallback for /studio, /admin, etc.)
  fs.stat(resolvedPath, (err, stats) => {
    let finalPath = resolvedPath;
    let finalExt = extName;

    if (err || !stats.isFile()) {
      // Check if appending .html matches a valid file
      const htmlFallback = resolvedPath + '.html';
      if (fs.existsSync(htmlFallback) && fs.statSync(htmlFallback).isFile()) {
        finalPath = htmlFallback;
        finalExt = '.html';
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 Not Found');
      }
    }

    const contentType = MIME_TYPES[finalExt] || 'application/octet-stream';
    const finalStat = fs.statSync(finalPath);

    // Disable caching for active JS and HTML development to ensure immediate AI updates
    const isCodeOrHtml = finalExt === '.js' || finalExt === '.html' || finalExt === '.css';
    const cacheHeader = isCodeOrHtml ? 'no-cache, no-store, must-revalidate' : 'public, max-age=3600';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': finalStat.size,
      'Cache-Control': cacheHeader
    });

    if (req.method === 'HEAD') {
      return res.end();
    }

    const stream = fs.createReadStream(finalPath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('500 Internal Server Error');
    });
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`   PIXORA Hardened Production Server Online`);
  console.log(`   - Local PC : http://localhost:${PORT}`);
  console.log(`   - Port: ${PORT} | Security: Enforced (Anti-Traversal, CSP, OWASP)`);
  console.log(`=======================================================`);
});
