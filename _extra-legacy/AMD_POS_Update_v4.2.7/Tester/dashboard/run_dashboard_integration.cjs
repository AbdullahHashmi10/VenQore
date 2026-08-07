const path = require('path');
const WebSocket = require('ws');

// Dynamically resolve default project path as the parent of the dashboard folder (the root D:\AMD POS)
const defaultProjectPath = path.resolve(__dirname, '../..');
const projectPath = process.argv[2] || process.env.PROJECT_PATH || defaultProjectPath;
const wsUrl = process.env.WEBSOCKET_URL || 'ws://127.0.0.1:7821';

console.log(`Connecting to WebSocket server at ${wsUrl}...`);
const ws = new WebSocket(wsUrl);

const completedModules = {}; // map of module -> status
const totalModulesExpected = 79;

ws.on('open', () => {
  console.log(`Connected! Starting test run in: "${projectPath}"`);
  ws.send(JSON.stringify({ action: 'run', projectPath }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  if (msg.type === 'module_start') {
    console.log(`[START] Module: ${msg.module}`);
  } else if (msg.type === 'module_done') {
    completedModules[msg.module] = msg.status;
    console.log(`[DONE] Module: ${msg.module} -> ${msg.status}`);
  } else if (msg.type === 'complete') {
    let passedCount = 0;
    let failedCount = 0;
    const failedModules = [];
    const completedKeys = Object.keys(completedModules);
    
    for (const [mod, status] of Object.entries(completedModules)) {
      if (status === 'passed') {
        passedCount++;
      } else if (status === 'failed') {
        failedCount++;
        failedModules.push(mod);
      }
    }
    
    console.log("\n==============================");
    console.log("Test Run Complete!");
    console.log(`Total completed: ${completedKeys.length}`);
    console.log(`Passed: ${passedCount}`);
    console.log(`Failed: ${failedCount}`);
    if (failedModules.length > 0) {
      console.log(`Failed Modules: ${failedModules.join(', ')}`);
    }
    console.log("==============================\n");
    ws.close();
    if (failedCount > 0 || completedKeys.length !== totalModulesExpected) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } else if (msg.type === 'error') {
    console.error(`[ERROR] Server reported error: ${msg.message}`);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', (err) => {
  console.error("WebSocket Error:", err.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log("Connection closed.");
});
