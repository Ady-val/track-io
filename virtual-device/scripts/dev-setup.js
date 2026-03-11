#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ENV_TEMPLATE = `# API Configuration
VITE_API_URL=http://localhost:3000
# Optional: token JWT para consultar catalogos protegidos (/devices)
# VITE_AUTH_TOKEN=

# App Configuration
VITE_APP_NAME=Virtual Device Simulator
VITE_APP_VERSION=1.0.0
`;

function createEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, ENV_TEMPLATE);
  }
}

function checkBackendConnection() {
  const http = require('http');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/signals/count',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
  });

  req.on('error', (err) => {
  });

  req.on('timeout', () => {
  });

  req.end();
}

function main() {
  createEnvFile();
  checkBackendConnection();
}

main();
