import https from 'https';
import fs from 'fs';

const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Preload + Fetch with Delay & Cache</title>
  <style>
    body { font-family: monospace; padding: 20px; }
    form { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
    label { display: block; margin: 5px 0; }
    button { margin: 10px 0; }
    pre { background: #f5f5f5; padding: 10px; }
    h3 { margin-top: 0; }
    #result { margin-top: 20px; }
  </style>
</head>
<body>
  <h1>Preload + Fetch with Delay & Cache</h1>
  <p>Cross-origin fetch with mode: cors. API waits 5 seconds before responding.</p>
  
  <form id="preload-form">
    <label>crossorigin attribute:
      <select name="crossorigin">
        <option value="anonymous">anonymous</option>
        <option value="use-credentials">use-credentials</option>
      </select>
    </label>
    <label>
      <input type="checkbox" name="cache"> Add ?cache=true
    </label>
    <button type="submit">Create Preload</button>
    <button type="button" id="fetch-btn">Fetch</button>
  </form>

  <div id="result"></div>

  <script>
    const form = document.getElementById('preload-form');
    const fetchBtn = document.getElementById('fetch-btn');
    const resultDiv = document.getElementById('result');

    let currentUrl = '';

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const crossorigin = formData.get('crossorigin');
      const cache = formData.get('cache');

      currentUrl = 'https://api.local:3021/api';
      if (cache) {
        currentUrl += '?cache=true';
      }

      // Remove existing preload if any
      const existingPreload = document.querySelector('link[rel="preload"]');
      if (existingPreload) {
        existingPreload.remove();
      }

      // Create new preload
      const preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'fetch';
      preload.href = currentUrl;

      if (crossorigin !== 'none') {
        preload.crossOrigin = crossorigin;
      }

      document.head.appendChild(preload);
      resultDiv.innerHTML = 'Preload created: ' + preload.outerHTML;
    });

    fetchBtn.addEventListener('click', async () => {
      const formData = new FormData(form);
      const crossorigin = formData.get('crossorigin');
      const cache = formData.get('cache');

      let url = 'https://api.local:3021/api';
      if (cache) {
        url += '?cache=true';
      }

      // Determine credentials based on crossorigin
      // anonymous -> no credentials option
      // use-credentials -> credentials: 'include'
      // none -> no credentials option (same as anonymous)
      let options = { 
        mode: 'cors',
        headers: { 'X-Custom-Header': 'test' }
      };

      if (crossorigin === 'use-credentials') {
        options.credentials = 'include';
      }

      resultDiv.innerHTML = 'Fetching: ' + url + '<br>Options: ' + JSON.stringify(options) + '<br><br>';

      const startTime = Date.now();

      try {
        const res = await fetch(url, options);
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        resultDiv.innerHTML += 'Response type: ' + res.type + '<br>';
        resultDiv.innerHTML += 'Response status: ' + res.status + '<br>';
        resultDiv.innerHTML += 'Duration: ' + duration + 'ms<br><br>';
        
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
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3020, () => {
  console.log('HTML Server (no same-origin API): https://html.local:3020');
});