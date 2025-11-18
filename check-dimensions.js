const fs = require('fs');
const path = require('path');

const screenshotsDir = path.join(__dirname, 'screenshots');
const files = fs.readdirSync(screenshotsDir).filter(f => f.endsWith('.png'));

console.log('Screenshot Dimensions Analysis:\n');

files.forEach(file => {
  const filePath = path.join(screenshotsDir, file);
  const buffer = fs.readFileSync(filePath);

  // PNG signature check and dimension extraction
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    // Width and height are in bytes 16-23 of PNG file
    const width = buffer.readUInt32BE(16);
    const height = buffer.readUInt32BE(20);
    const sizeKB = (buffer.length / 1024).toFixed(2);

    console.log(`${file}`);
    console.log(`  Dimensions: ${width} x ${height}`);
    console.log(`  Size: ${sizeKB} KB`);
    console.log(`  Chrome Web Store Compatible: ${width === 1280 && height === 800 ? '✅ YES' : '❌ NO (needs to be 1280x800)'}`);
    console.log('');
  }
});
