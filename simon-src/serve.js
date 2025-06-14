const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5000;

// MIME types for different file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon',
    '.svg': 'image/svg+xml',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf'
};

function serveFile(filePath, response) {
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found
                response.writeHead(404, { 'Content-Type': 'text/plain' });
                response.end('404 - File Not Found');
            } else {
                // Server error
                response.writeHead(500);
                response.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            response.writeHead(200, { 
                'Content-Type': contentType,
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            });
            response.end(content, 'utf-8');
        }
    });
}

const server = http.createServer((request, response) => {
    const parsedUrl = url.parse(request.url);
    let pathname = parsedUrl.pathname;

    // Handle root path
    if (pathname === '/') {
        pathname = '/index.html';
    }

    // Remove leading slash and construct file path
    const filePath = path.join(__dirname, pathname.substring(1));

    // Security check - prevent directory traversal
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(__dirname)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
    }

    // Check if file exists
    fs.access(normalizedPath, fs.constants.F_OK, (err) => {
        if (err) {
            // File doesn't exist, try to serve index.html for SPA routing
            const indexPath = path.join(__dirname, 'index.html');
            fs.access(indexPath, fs.constants.F_OK, (indexErr) => {
                if (indexErr) {
                    response.writeHead(404);
                    response.end('404 - File Not Found');
                } else {
                    serveFile(indexPath, response);
                }
            });
        } else {
            serveFile(normalizedPath, response);
        }
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Simon Says game server running at:`);
    console.log(`   Local:   http://localhost:${PORT}`);
    console.log(`   Network: http://0.0.0.0:${PORT}`);
    console.log('');
    console.log('📝 Available commands:');
    console.log('   npm run build      - Build the game');
    console.log('   npm run build:watch - Build and watch for changes');
    console.log('   npm run serve      - Start development server');
    console.log('');
    console.log('🎮 Game Controls:');
    console.log('   F, D, J, K - Control squares');
    console.log('   H - Use hint (when available)');
    console.log('   X - Use 50/50 (when available)');
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
