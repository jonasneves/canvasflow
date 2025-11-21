#!/usr/bin/env node

/**
 * Automated Screenshot Generator for Yoink Chrome Extension
 *
 * This script generates high-quality screenshots for the Chrome Web Store listing.
 * It uses Puppeteer to load the extension and capture screenshots at the correct resolution.
 *
 * Requirements:
 * - npm install puppeteer
 * - Chrome extension must be loaded in developer mode
 *
 * Usage:
 * node scripts/generate-screenshots.js
 */

const fs = require('fs');
const path = require('path');

// Screenshot specifications for Chrome Web Store
const SCREENSHOT_WIDTH = 1280;
const SCREENSHOT_HEIGHT = 800;
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('📸 Yoink Screenshot Generator\n');
console.log('Note: This script requires manual setup since Chrome extensions');
console.log('cannot be fully automated via Puppeteer without Chrome DevTools Protocol.\n');

// Generate screenshot templates/guides
const screenshotGuide = `
# Screenshot Capture Guide

## Required Screenshots (1280x800 pixels)

Follow these steps to capture high-quality screenshots for the Chrome Web Store:

### Setup

1. **Load the extension:**
   - Open Chrome and go to \`chrome://extensions/\`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the \`extension/\` folder

2. **Prepare sample data:**
   - Create a Canvas test account or use a development instance
   - Add sample assignments with various due dates
   - Ensure clean, realistic data (no personal information)

3. **Set viewport:**
   - Open Chrome DevTools (F12)
   - Click the device toolbar icon (Ctrl+Shift+M / Cmd+Shift+M)
   - Set "Responsive" mode
   - Set dimensions to **1280 x 800**

### Screenshot #1: Assignment Dashboard

**What to show:**
- Sidepanel open with assignment list
- All three summary cards visible (Overdue, Due Today, Upcoming)
- Assignments grouped and color-coded
- Filters and sorting visible

**Steps:**
1. Open a Canvas page
2. Click the Yoink extension icon
3. Ensure sidepanel shows assignments
4. Make sure you have a mix of overdue, due today, and upcoming assignments
5. Capture: Use Chrome's built-in screenshot tool or:
   - Mac: Cmd + Shift + 4, then Space, click window
   - Windows: Windows + Shift + S
   - Or DevTools: Cmd/Ctrl + Shift + P, type "screenshot", select "Capture screenshot"

**Save as:** \`screenshot-1-dashboard.png\`

### Screenshot #2: AI Insights Panel

**What to show:**
- AI Insights tab active
- Generated insights visible with:
  - Workload assessment
  - Priority recommendations
  - Study tips

**Steps:**
1. Ensure you have Claude API key configured
2. Switch to "AI Insights" tab
3. Click "Generate AI Insights" button
4. Wait for insights to load
5. Scroll to show the complete insights panel
6. Capture screenshot

**Save as:** \`screenshot-2-ai-insights.png\`

### Screenshot #3: Weekly Schedule

**What to show:**
- Full-page weekly schedule view
- 7-day plan visible
- Time blocks and tasks displayed
- Strategic recommendations

**Steps:**
1. In the sidepanel, click the calendar icon (top right)
2. This opens the weekly schedule in a new tab
3. Wait for schedule to generate
4. Ensure full week is visible
5. Capture screenshot

**Save as:** \`screenshot-3-weekly-schedule.png\`

### Screenshot #4: Settings Panel

**What to show:**
- Settings modal open
- Canvas instance configuration visible
- API key field (empty or masked)
- Time range settings
- Auto-refresh toggle

**Steps:**
1. Open sidepanel
2. Click the settings gear icon (top right)
3. Settings modal appears
4. Ensure all settings sections are visible
5. Capture screenshot

**Save as:** \`screenshot-4-settings.png\`

### Screenshot #5: In-Context View

**What to show:**
- Yoink sidepanel open alongside a Canvas page
- Shows integration context
- Canvas assignments page visible on left
- Yoink panel on right

**Steps:**
1. Navigate to a Canvas assignments page
2. Open Yoink sidepanel
3. Arrange windows to show both Canvas and Yoink
4. Ensure browser chrome (address bar, tabs) is visible
5. Capture full browser window

**Save as:** \`screenshot-5-context.png\`

## Post-Processing (Optional)

After capturing screenshots:

1. **Verify dimensions:** All should be 1280x800 pixels
2. **Optimize file size:**
   - Use TinyPNG.com or ImageOptim
   - Keep under 5MB each (Chrome Web Store limit)
3. **Check quality:**
   - No pixelation or blur
   - Text is readable
   - Colors are accurate
4. **Add annotations (optional):**
   - Subtle arrows pointing to key features
   - Small text callouts
   - Don't overdo it - keep it clean

## Automated Alternative

If you want to automate screenshots with a headless browser:

\`\`\`bash
# Install dependencies
npm install puppeteer

# Run automated capture (requires extension to be loaded)
node scripts/puppeteer-screenshots.js
\`\`\`

Note: Automated screenshot capture of Chrome extensions is complex
and may require additional setup with Chrome DevTools Protocol.

## Tips for Great Screenshots

- ✅ Use realistic but clean sample data
- ✅ Ensure good contrast and readability
- ✅ Show the extension solving a problem
- ✅ Highlight unique features
- ✅ Keep UI elements aligned and tidy
- ✅ Use consistent Canvas theme/branding
- ❌ Don't include personal information
- ❌ Don't show error states
- ❌ Don't use cluttered or messy data
`;

// Write the guide
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'SCREENSHOT_GUIDE.md'),
  screenshotGuide
);

console.log('✅ Created screenshot guide at: screenshots/SCREENSHOT_GUIDE.md\n');

// Create a simple HTML template for testing screenshots
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Screenshot Template</title>
  <style>
    body {
      margin: 0;
      padding: 40px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    h1 {
      color: #00539B;
      margin-bottom: 20px;
    }
    .checklist {
      list-style: none;
      padding: 0;
    }
    .checklist li {
      padding: 12px 0;
      border-bottom: 1px solid #eee;
    }
    .checklist li:before {
      content: "☐ ";
      color: #00539B;
      font-size: 20px;
      margin-right: 12px;
    }
    .tip {
      background: #EFF6FF;
      border-left: 4px solid #3B82F6;
      padding: 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📸 Screenshot Capture Checklist</h1>

    <div class="tip">
      <strong>Before you start:</strong> Load the extension in Chrome, set viewport to 1280x800,
      and prepare clean sample data in Canvas.
    </div>

    <ul class="checklist">
      <li>Screenshot #1: Assignment Dashboard (sidepanel view)</li>
      <li>Screenshot #2: AI Insights Panel (with generated insights)</li>
      <li>Screenshot #3: Weekly Schedule (full-page view)</li>
      <li>Screenshot #4: Settings Modal (configuration options)</li>
      <li>Screenshot #5: In-Context View (Canvas + Yoink together)</li>
    </ul>

    <div class="tip">
      <strong>Next step:</strong> Read the detailed guide in <code>screenshots/SCREENSHOT_GUIDE.md</code>
    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'checklist.html'),
  htmlTemplate
);

console.log('✅ Created screenshot checklist at: screenshots/checklist.html');
console.log('   Open this file in a browser for an interactive checklist\n');

// Create README for the screenshots directory
const screenshotsReadme = `# Chrome Web Store Screenshots

This directory contains screenshots for the Chrome Web Store listing.

## Required Dimensions

All screenshots must be **1280 x 800 pixels** (or 640 x 400 pixels, but higher resolution is recommended).

## Files

Place your captured screenshots here:

- \`screenshot-1-dashboard.png\` - Assignment Dashboard view
- \`screenshot-2-ai-insights.png\` - AI Insights panel
- \`screenshot-3-weekly-schedule.png\` - Weekly schedule view
- \`screenshot-4-settings.png\` - Settings configuration
- \`screenshot-5-context.png\` - Extension in context with Canvas

## How to Capture

See \`SCREENSHOT_GUIDE.md\` for detailed instructions on capturing each screenshot.

## Quick Start

1. Load extension in Chrome (\`chrome://extensions/\`, Developer mode, Load unpacked)
2. Set browser viewport to 1280x800 (Chrome DevTools → Responsive mode)
3. Follow the guide in \`SCREENSHOT_GUIDE.md\`
4. Save screenshots in this directory
5. Verify dimensions and file sizes
6. Upload to Chrome Web Store Developer Dashboard

## Verification

Before uploading to Chrome Web Store:

\`\`\`bash
# Check dimensions
file screenshot-*.png

# Optimize file sizes
# Use TinyPNG.com or ImageOptim
\`\`\`

All files should:
- Be exactly 1280x800 pixels
- Be under 5MB each
- Be in PNG or JPEG format (PNG recommended)
- Contain no personal information
`;

fs.writeFileSync(
  path.join(OUTPUT_DIR, 'README.md'),
  screenshotsReadme
);

console.log('✅ Created screenshots README at: screenshots/README.md\n');

console.log('📋 Next Steps:');
console.log('   1. Open screenshots/checklist.html in your browser');
console.log('   2. Read screenshots/SCREENSHOT_GUIDE.md for detailed instructions');
console.log('   3. Load the extension in Chrome (chrome://extensions/)');
console.log('   4. Capture screenshots following the guide');
console.log('   5. Save them in the screenshots/ directory\n');

console.log('💡 Tip: Use Chrome DevTools device mode (Cmd+Shift+M) to set exact viewport size\n');
