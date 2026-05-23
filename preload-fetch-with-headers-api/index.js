import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync("./.certs/api.local-key.pem"),
  cert: fs.readFileSync("./.certs/api.local.pem")
};

const server = https.createServer(options, (req, res) => {
  console.log(`[API Server] ${req.method} ${req.url} from ${req.headers.origin}`);
  console.log('[API Server] Custom header:', req.headers['x-custom-header']);

  const url = new URL(req.url, `https://${req.headers.host}`);
  const useCache = url.searchParams.get('cache') === 'true';

  if (req.method === 'OPTIONS') {
    console.log('[API Server] Preflight request');
    res.writeHead(204, {
      'Access-Control-Allow-Origin': 'https://html.local:3020',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'x-custom-header',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    });
    res.end();
    return;
  }

  if (req.url.startsWith('/api')) {
    const cacheControl = useCache ? 'public, max-age=10' : 'no-store';
    console.log('[API Server] Cache-Control:', cacheControl);
    
    console.log('[API Server] Delaying response by 5 seconds...');
    setTimeout(() => {
      const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://html.local:3020',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'x-custom-header',
        'Cache-Control': cacheControl
      };
      res.writeHead(200, headers);
      res.end(JSON.stringify({
        message: 'Cross-origin API response (5s delay)',
        customHeader: req.headers['x-custom-header'] || 'none',
        cacheEnabled: useCache,
        timestamp: Date.now()
      }));
    }, 5000);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3021, () => {
  console.log('Cross-origin API (delayed): https://api.local:3021');
});