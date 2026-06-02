// download-icons.js
// Offline asset loader for PT. Farika Riau Perkasa - Lisa Batch Plant HMI
import fs from 'fs';
import path from 'path';

const buildDir = path.join(process.cwd(), 'build');

// Create build directory if it doesn't exist
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// 16x16 standard valid transparent PNG in Base64
const SYNTHETIC_PNG_BASE64 = 
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVQ4T2PV0tL6z8DAwMhAHmAat' +
  'ECgBoYGBgYW9HAGSgFTU1PzP7UcjBpA9QA9g6gZAEitFRt7k6RMAAAAAElFTkSuQmCC';

// 16x16 standard valid Microsoft .ico in Base64
const SYNTHETIC_ICO_BASE64 = 
  'AAABAAEAEBAAAAEAIABoQgAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAA' +
  'AIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAA' +
  'gAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACA' +
  'AAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAA' +
  'AACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAA' +
  'AIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIAAAACAAAAAgAAAAIA=';

try {
  // Write the Windows launcher & installer .ico target
  fs.writeFileSync(path.join(buildDir, 'icon.ico'), Buffer.from(SYNTHETIC_ICO_BASE64, 'base64'));
  console.log('✓ Prepared Windows .ico launcher & installer icon');

  // Write the generic application .png fallback target
  fs.writeFileSync(path.join(buildDir, 'icon.png'), Buffer.from(SYNTHETIC_PNG_BASE64, 'base64'));
  console.log('✓ Prepared generic fallback .png icon asset');

  console.log('✓ Local HMI packaging icon files successfully initialized!');
} catch (err) {
  console.error('⚠ Failed to configure packaging assets:', err.message);
}
