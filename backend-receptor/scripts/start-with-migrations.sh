#!/bin/sh
# Script to start the backend with migrations
# This script runs migrations before starting the application

echo "🔄 Running database migrations..."
npm run migration:run

if [ $? -ne 0 ]; then
  echo "❌ Migration failed. Exiting."
  exit 1
fi

echo "✅ Migrations completed successfully"
echo "🚀 Starting application..."
node --experimental-global-webcrypto dist/main.js





