// Build script for Render deployment - bypasses TypeScript checks
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Starting Render build process...');

try {
  // Run vite build directly (skipping TypeScript type checking)
  console.log('Building with Vite (bypassing TypeScript checks)...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  console.log('Build completed successfully!');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 