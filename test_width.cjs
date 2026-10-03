// Launch edge with remote debugging and inspect widths
const { exec, spawn } = require('child_process');
const http = require('http');

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const port = 9222;
  
  const proc = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=' + port,
    '--disable-gpu',
    '--window-size=390,844',
    'http://localhost:5173/?mode=client'
  ]);

  // wait 2 seconds for browser to open
  await new Promise(r => setTimeout(r, 2000));

  // get debugging websocket url
  http.get(`http://127.0.0.1:${port}/json`, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const list = JSON.parse(data);
      const page = list.find(p => p.type === 'page');
      if (!page) {
        console.error('No page found');
        proc.kill();
        return;
      }
      console.log('Page URL:', page.url);
      
      // Connect websocket
      const WebSocket = require('ws'); // wait, check if ws is installed
    });
  }).on('error', err => {
    console.error('Error connecting to edge:', err);
    proc.kill();
  });
}
run();
