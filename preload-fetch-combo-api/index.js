import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync("./.certs/api.local-key.pem"),
  cert: fs.readFileSync("./.certs/api.local.pem")
};

const server = https.createServer(options, (req, res) => {
  console.log(`[API Server] ${req.method} ${req.url} from ${req.headers.origin}`, 'cookie:', req.headers.cookie);

  if (req.url === '/api') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://html.local:3016',
      'Access-Control-Allow-Credentials': 'true',
    });
    res.end(JSON.stringify({
      message: 'Cross-origin API response',
      receivedCookies: req.headers.cookie || 'none',
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3017, () => {
  console.log('Cross-origin API: https://api.local:3017');
});