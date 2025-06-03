// ESM script to run the equipment descriptions update
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';
import { exit } from 'process';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

try {
  console.log('Running equipment description update script...');
  
  // Use Node.js with ESM import support
  execSync('node --experimental-json-modules update-equipment-descriptions.js', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('Script completed successfully');
} catch (error) {
  console.error('Error running script:', error.message);
  // Exit with error code 1
  exit(1);
}
