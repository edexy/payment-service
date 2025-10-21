#!/usr/bin/env node

/**
 * Test setup script to prepare the test environment
 * This script ensures the data directory exists and is clean for testing
 */

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const testDataDir = path.join(__dirname, '..', 'test-data');

// Ensure data directories exist
[dataDir, testDataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Clean test data directory
if (fs.existsSync(testDataDir)) {
  const files = fs.readdirSync(testDataDir);
  files.forEach(file => {
    const filePath = path.join(testDataDir, file);
    fs.unlinkSync(filePath);
    console.log(`Removed test file: ${filePath}`);
  });
}

console.log('Test environment setup completed');
