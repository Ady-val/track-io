#!/usr/bin/env node

/**
 * Development Setup Script for Virtual Device App
 * This script helps set up the development environment
 */

const fs = require('fs');
const path = require('path');

const ENV_TEMPLATE = `# API Configuration
VITE_API_URL=http://localhost:3000

# App Configuration
VITE_APP_NAME=Virtual Device Simulator
VITE_APP_VERSION=1.0.0
`;

function createEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, ENV_TEMPLATE);
    console.log('✅ Created .env file');
  } else {
    console.log('ℹ️  .env file already exists');
  }
}

function checkBackendConnection() {
  const http = require('http');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/devices',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 200 || res.statusCode === 404) {
      console.log('✅ Backend is running on port 3000');
    } else {
      console.log('⚠️  Backend responded with status:', res.statusCode);
    }
  });

  req.on('error', (err) => {
    console.log('❌ Backend is not running on port 3000');
    console.log('   Please start the backend with: npm run start:dev');
  });

  req.on('timeout', () => {
    console.log('⏰ Backend connection timeout');
  });

  req.end();
}

function main() {
  console.log('🚀 Setting up Virtual Device App development environment...\n');
  
  createEnvFile();
  console.log('');
  
  console.log('🔍 Checking backend connection...');
  checkBackendConnection();
  
  console.log('\n📋 Next steps:');
  console.log('1. Start the backend: cd ../backend-receptor && npm run start:dev');
  console.log('2. Start this app: npm run dev');
  console.log('3. Open http://localhost:5174');
}

main();
