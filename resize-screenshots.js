const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Screenshots to process with their new names
const screenshots = [
  {
    input: 'Screenshot 2025-11-17 at 8.02.08 PM.png',
    output: 'screenshot-1-dashboard.png',
    description: 'Dashboard View - Assignment tracking with summary cards'
  },
  {
    input: 'Screenshot 2025-11-17 at 8.02.20 PM.png',
    output: 'screenshot-2-ai-insights.png',
    description: 'AI Insights - Workload analysis and study tips'
  },
  {
    input: 'Screenshot 2025-11-17 at 8.01.40 PM.png',
    output: 'screenshot-3-weekly-schedule.png',
    description: 'Weekly Schedule - AI-generated study plan'
  },
  {
    input: 'Screenshot 2025-11-17 at 8.10.03 PM.png',
    output: 'screenshot-4-in-context.png',
    description: 'In-Context View - CanvasFlow working alongside Canvas'
  },
  {
    input: 'Screenshot 2025-11-17 at 8.02.49 PM.png',
    output: 'screenshot-5-mcp-server.png',
    description: 'Claude Desktop Integration - Chat with your Canvas data'
  }
];

const TARGET_WIDTH = 1280;
const TARGET_HEIGHT = 800;

async function resizeScreenshot(input, output, description) {
  const inputPath = path.join('/home/user/canvasflow/screenshots', input);
  const outputPath = path.join('/home/user/canvasflow/screenshots', output);

  try {
    // Get original dimensions
    const metadata = await sharp(inputPath).metadata();
    console.log(`\n📸 ${input}`);
    console.log(`   Original: ${metadata.width}x${metadata.height}`);
    console.log(`   → ${output} (1280x800)`);
    console.log(`   Description: ${description}`);

    // Resize to 1280x800 with cover fit (fills the frame, crops if needed)
    await sharp(inputPath)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, {
        fit: 'cover',
        position: 'center'
      })
      .png({ quality: 90, compressionLevel: 9 })
      .toFile(outputPath);

    const stats = fs.statSync(outputPath);
    console.log(`   ✅ Saved: ${(stats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
}

async function main() {
  console.log('🎨 Resizing screenshots for Chrome Web Store...\n');
  console.log(`Target dimensions: ${TARGET_WIDTH}x${TARGET_HEIGHT}\n`);
  console.log('='.repeat(60));

  for (const screenshot of screenshots) {
    await resizeScreenshot(screenshot.input, screenshot.output, screenshot.description);
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n✨ All screenshots resized successfully!');
  console.log('\nNext steps:');
  console.log('1. Review the resized screenshots in the screenshots/ folder');
  console.log('2. Delete the original screenshots if satisfied');
  console.log('3. Upload to Chrome Web Store Developer Dashboard');
  console.log('4. Add screenshot descriptions in the store listing\n');
}

main();
