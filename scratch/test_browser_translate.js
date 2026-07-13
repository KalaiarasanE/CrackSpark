const { exec } = require('child_process');
const http = require('http');

// Launch headless Chrome with remote debugging on port 9222
const chromeProcess = exec(
  `"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --headless --disable-gpu --remote-debugging-port=9222 --user-data-dir=C:\\Users\\km451\\Downloads\\crack-prep-zone-main\\chrome-profile http://localhost:8080`
);

setTimeout(() => {
  // Query Chrome targets to find the websocket URL
  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const targets = JSON.parse(data);
        const page = targets.find(t => t.type === 'page');
        if (!page) {
          console.error("No active page found in Chrome target list!");
          chromeProcess.kill();
          process.exit(1);
        }

        console.log("Found Chrome Page Target:", page.title, page.webSocketDebuggerUrl);

        // Connect to Chrome's WebSocket Debugger
        const wsUrl = page.webSocketDebuggerUrl;
        const WebSocket = require('ws'); // wait, is ws installed? Let's check.
        // If 'ws' might not be installed, we can check. Let's see if ws package exists.
      } catch (e) {
        console.error("Failed to parse target JSON:", e);
        chromeProcess.kill();
      }
    });
  }).on('error', (err) => {
    console.error("HTTP error connecting to Chrome debugging port:", err);
    chromeProcess.kill();
  });
}, 3000);
