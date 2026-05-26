import https from 'https';
import fs from 'fs';

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Preload + Fetch Combination Test</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    form { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
    label { display: block; margin: 5px 0; }
    button { margin: 10px 0; }
    pre { background: #f5f5f5; padding: 10px; }
    h3 { margin-top: 0; }
    #preload-status { color: green; margin-bottom: 10px; }
    #result { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Preload + Fetch Combination Test</h1>
  
  <h3>Form 1: Configure Preload</h3>
  <form id="preload-form">
    <label>API Route:
      <select name="apiRoute">
        <option value="same">Same origin (/api)</option>
        <option value="cross">Cross origin (https://api.local:3017/api)</option>
      </select>
    </label>
    <label>crossorigin attribute:
      <select name="crossorigin">
        <option value="none">No attribute</option>
        <option value="anonymous">anonymous</option>
        <option value="use-credentials">use-credentials</option>
      </select>
    </label>
    <button type="submit">Create Preload</button>
  </form>
  <div id="preload-status"></div>

  <hr>

  <h3>Form 2: Perform Fetch</h3>
  <form id="fetch-form">
    <label>API Route:
      <select name="fetchApiRoute">
        <option value="same">Same origin (/api)</option>
        <option value="cross">Cross origin (https://api.local:3017/api)</option>
      </select>
    </label>
    <label>mode:
      <select name="fetchMode">
        <option value="cors">cors</option>
        <option value="no-cors">no-cors</option>
        <option value="same-origin">same-origin</option>
      </select>
    </label>
    <label>credentials:
      <select name="fetchCredentials">
        <option value="none">none (default)</option>
        <option value="include">include</option>
        <option value="omit">omit</option>
      </select>
    </label>
    <button type="submit">Fetch</button>
  </form>
  
  <div id="result"></div>

  <script>
    const preloadForm = document.getElementById('preload-form');
    const fetchForm = document.getElementById('fetch-form');
    const preloadStatus = document.getElementById('preload-status');
    const resultDiv = document.getElementById('result');

    preloadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(preloadForm);
      const apiRoute = formData.get('apiRoute');
      const crossorigin = formData.get('crossorigin');

      // Remove existing preload if any
      const existingPreload = document.querySelector('link[rel="preload"]');
      if (existingPreload) {
        existingPreload.remove();
      }

      // Create new preload
      const preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'fetch';
      
      if (apiRoute === 'same') {
        preload.href = '/api';
      } else {
        preload.href = 'https://api.local:3017/api';
      }

      if (crossorigin !== 'none') {
        preload.crossOrigin = crossorigin;
      }

      document.head.appendChild(preload);
      preloadStatus.textContent = 'Preload created: ' + preload.outerHTML;
    });

    fetchForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(fetchForm);
      const apiRoute = formData.get('fetchApiRoute');
      const fetchMode = formData.get('fetchMode');
      const fetchCredentials = formData.get('fetchCredentials');

      let url = apiRoute === 'same' ? '/api' : 'https://api.local:3017/api';
      let options = { mode: fetchMode };
      
      if (fetchCredentials === 'include') {
        options.credentials = 'include';
      } else if (fetchCredentials === 'omit') {
        options.credentials = 'omit';
      }

      resultDiv.innerHTML = 'Fetching: ' + url + '<br>Options: ' + JSON.stringify(options) + '<br><br>';

      try {
        const res = await fetch(url, options);
        resultDiv.innerHTML += 'Response type: ' + res.type + '<br>';
        resultDiv.innerHTML += 'Response status: ' + res.status + '<br>';
        
        try {
          const data = await res.json();
          resultDiv.innerHTML += 'Response body: ' + JSON.stringify(data);
        } catch (err) {
          try {
            const text = await res.text();
            resultDiv.innerHTML += 'Response body (text): ' + text;
          } catch (err2) {
            resultDiv.innerHTML += 'Response body: (unable to read)';
          }
        }
      } catch (e) {
        resultDiv.innerHTML += 'Error: ' + e.message;
      }
    });
  </script>
</body>
</html>`;

const options = {
  key: fs.readFileSync("./.certs/html.local-key.pem"),
  cert: fs.readFileSync("./.certs/html.local.pem")
};

const server = https.createServer(options, (req, res) => {
  console.log(`[HTML Server] ${req.method} ${req.url}`);

  if (req.url === '/') {
    res.writeHead(200, { 
      'Content-Type': 'text/html',
      'Cache-Control': 'no-store'
    });
    res.end(html);
  } else if (req.url === '/api') {
    console.log('[Same-origin API] Request received', 'cookie:', req.headers.cookie);
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify({
      message: 'Same-origin API response',
      receivedCookies: req.headers.cookie || 'none',
    }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3016, () => {
  console.log('HTML + Same-origin API: https://html.local:3016');
});