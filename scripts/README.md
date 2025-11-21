# Yoink Automation Scripts

This directory contains automation scripts for building, packaging, and releasing the Yoink extension to the Chrome Web Store.

## 📋 Available Scripts

### 🚀 Release Script

**`release.sh`** - Complete release automation

Creates production-ready packages for Chrome Web Store submission.

```bash
# Run with current version
./scripts/release.sh

# Run with new version
./scripts/release.sh 1.0.1
```

**What it does:**
- ✅ Validates extension structure and files
- ✅ Checks CSP compliance (no inline event handlers)
- ✅ Checks for eval() usage
- ✅ Updates version in manifest.json
- ✅ Creates Chrome Web Store ZIP package
- ✅ Creates native host ZIP package
- ✅ Generates release notes
- ✅ Creates submission checklist

**Output:**
All files are created in the `dist/` directory:
- `canvasflow-extension-vX.X.X.zip` - Ready for Chrome Web Store
- `canvasflow-native-host-vX.X.X.zip` - Optional MCP integration
- `release-notes-vX.X.X.md` - Release documentation
- `submission-checklist-vX.X.X.md` - Pre-submission checklist

### 📸 Screenshot Generator

**`generate-screenshots.js`** - Screenshot capture automation

Generates guides and helpers for capturing Chrome Web Store screenshots.

```bash
node scripts/generate-screenshots.js
```

**What it creates:**
- `screenshots/SCREENSHOT_GUIDE.md` - Detailed capture instructions
- `screenshots/README.md` - Screenshots directory documentation
- `screenshots/checklist.html` - Interactive checklist

**Screenshot Requirements:**
- Resolution: 1280 × 800 pixels (or 640 × 400)
- Format: PNG or JPEG
- Quantity: Minimum 1, recommended 3-5
- File size: Under 5MB each

**Required Screenshots:**
1. Assignment Dashboard (sidepanel view)
2. AI Insights Panel (with generated insights)
3. Weekly Schedule (full-page view)
4. Settings Configuration (modal view)
5. In-Context View (Canvas + Yoink together)

### 🎨 Promotional Tile Generator

**`promo-tile-generator.html`** - Visual asset creator

Browser-based tool for creating promotional tiles.

```bash
# Open in browser
open scripts/promo-tile-generator.html
# or
firefox scripts/promo-tile-generator.html
```

**Features:**
- Generate small promo tile (440×280 pixels)
- Generate marquee promo tile (1400×560 pixels)
- Customizable headline and tagline
- Editable features list
- Real-time preview
- One-click PNG download

**Tips:**
- Use Yoink brand colors (#00539B, #DC2626)
- Keep text minimal and readable
- Consider adding mockups in external editor
- Verify file size (under 1MB for small, 2MB for marquee)

## 🔄 GitHub Actions Workflow

**`.github/workflows/build-extension.yml`** - Automated builds

Automatically builds and packages the extension on:
- Git tags (e.g., `v1.0.0`)
- Manual workflow dispatch

**Trigger manually:**
```bash
# Via GitHub web interface:
Actions → Build Chrome Extension → Run workflow

# Or create a tag:
git tag v1.0.0
git push origin v1.0.0
```

**Outputs:**
- Extension ZIP package (artifact + release)
- Native host ZIP package (artifact + release)
- Release notes (auto-generated)
- Build summary

## 📦 Complete Release Process

### Step 1: Prepare Release

```bash
# Run release script
./scripts/release.sh 1.0.0
```

This creates all packages and checklists in `dist/`

### Step 2: Create Promotional Assets

```bash
# Open tile generator
open scripts/promo-tile-generator.html

# Generate screenshot guide
node scripts/generate-screenshots.js
```

### Step 3: Capture Screenshots

1. Load extension in Chrome (`chrome://extensions/`)
2. Set viewport to 1280×800 (DevTools → Responsive mode)
3. Follow guide in `screenshots/SCREENSHOT_GUIDE.md`
4. Save screenshots in `screenshots/` directory

### Step 4: Review Checklist

```bash
# Open submission checklist
cat dist/submission-checklist-v1.0.0.md
```

Check off all items before submission.

### Step 5: Submit to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `dist/canvasflow-extension-v1.0.0.zip`
4. Upload promotional assets and screenshots
5. Fill in store listing details
6. Submit for review

## 🛠️ Development Tools

### Verify Extension Structure

```bash
# Check manifest
cat extension/manifest.json | jq .

# Verify icons exist
ls -lh extension/icon-*.png

# Check for CSP violations
grep -r "onclick\|onload\|onerror" extension/*.html
```

### Test Package Locally

```bash
# Extract and verify
unzip -l dist/canvasflow-extension-v1.0.0.zip

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select extracted directory
```

### Check File Sizes

```bash
# Extension package
ls -lh dist/canvasflow-extension-*.zip

# Individual assets
du -sh screenshots/*.png
du -sh scripts/*.png
```

## 📊 Automation Summary

| Task | Tool | Automated? | Output |
|------|------|------------|--------|
| Version bumping | `release.sh` | ✅ Yes | manifest.json |
| ZIP packaging | `release.sh` | ✅ Yes | dist/*.zip |
| Release notes | `release.sh` | ✅ Yes | dist/*.md |
| Submission checklist | `release.sh` | ✅ Yes | dist/*.md |
| Promotional tiles | `promo-tile-generator.html` | 🟡 Semi | PNG files |
| Screenshots | `generate-screenshots.js` | 🟡 Guide | screenshots/*.png |
| GitHub releases | `.github/workflows/` | ✅ Yes | GitHub Releases |
| Chrome Web Store upload | Manual | ❌ No | - |

**Legend:**
- ✅ Fully automated
- 🟡 Semi-automated (tools provided)
- ❌ Manual process required

## 🔍 Quality Checks

All automated scripts include these quality checks:

- ✅ Manifest V3 compliance
- ✅ CSP compliance (no inline event handlers)
- ✅ No eval() or dangerous code patterns
- ✅ Required files present
- ✅ Icons properly sized
- ✅ Privacy policy accessible
- ✅ Permissions minimized
- ✅ File size limits

## 📝 Notes

- **Privacy Policy URL:** https://github.com/jonasneves/canvasflow/blob/main/PRIVACY.md
- **Homepage URL:** https://github.com/jonasneves/canvasflow
- **Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Review Time:** Typically 1-3 days

## 🆘 Troubleshooting

### Script Fails: "jq: command not found"

Install jq (JSON processor):

```bash
# macOS
brew install jq

# Ubuntu/Debian
sudo apt-get install jq

# Windows (Git Bash)
# Download from: https://stedolan.github.io/jq/
```

### Screenshot Generator Errors

Ensure Node.js is installed:

```bash
node --version  # Should be v14 or higher
npm --version
```

### Workflow Not Running

Check GitHub Actions is enabled:
- Repository Settings → Actions → Allow all actions

### ZIP File Too Large

Check for node_modules or unnecessary files:

```bash
unzip -l dist/canvasflow-extension-*.zip | grep node_modules
```

## 📚 Additional Resources

- [Chrome Web Store Documentation](https://developer.chrome.com/docs/webstore/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Extension Publishing Guide](https://developer.chrome.com/docs/webstore/publish/)
- [Image Requirements](https://developer.chrome.com/docs/webstore/images/)

---

**Last Updated:** November 2024
**Version:** 1.0.0
