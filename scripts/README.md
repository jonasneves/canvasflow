# CanvasFlow Automation Scripts

This directory contains automation scripts for building, packaging, and releasing the CanvasFlow extension to the Chrome Web Store.

## Available Scripts

### Release Script

**`release.sh`** - Complete release automation

Creates production-ready packages for Chrome Web Store submission.

```bash
# Run with current version
./scripts/release.sh

# Run with new version
./scripts/release.sh 1.0.1
```

**What it does:**
- Validates extension structure and files
- Checks CSP compliance (no inline event handlers)
- Checks for eval() usage
- Updates version in manifest.json
- Creates Chrome Web Store ZIP package
- Generates release notes
- Creates submission checklist

**Output:**
All files are created in the `dist/` directory:
- `canvasflow-extension-vX.X.X.zip` - Ready for Chrome Web Store
- `release-notes-vX.X.X.md` - Release documentation
- `submission-checklist-vX.X.X.md` - Pre-submission checklist

## GitHub Actions Workflow

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
- Release notes (auto-generated)
- Build summary

## Complete Release Process

### Step 1: Prepare Release

```bash
# Run release script
./scripts/release.sh 1.0.0
```

This creates all packages and checklists in `dist/`

### Step 2: Review Checklist

```bash
# Open submission checklist
cat dist/submission-checklist-v1.0.0.md
```

Check off all items before submission.

### Step 3: Submit to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click "New Item"
3. Upload `dist/canvasflow-extension-v1.0.0.zip`
4. Upload promotional assets and screenshots
5. Fill in store listing details
6. Submit for review

## Development Tools

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

## Automation Summary

| Task | Tool | Automated? | Output |
|------|------|------------|--------|
| Version bumping | `release.sh` | Yes | manifest.json |
| ZIP packaging | `release.sh` | Yes | dist/*.zip |
| Release notes | `release.sh` | Yes | dist/*.md |
| Submission checklist | `release.sh` | Yes | dist/*.md |
| GitHub releases | `.github/workflows/` | Yes | GitHub Releases |
| Chrome Web Store upload | Manual | No | - |

## Quality Checks

All automated scripts include these quality checks:

- Manifest V3 compliance
- CSP compliance (no inline event handlers)
- No eval() or dangerous code patterns
- Required files present
- Icons properly sized
- Privacy policy accessible
- Permissions minimized
- File size limits

## Notes

- **Privacy Policy URL:** https://github.com/jonasneves/canvasflow/blob/main/PRIVACY.md
- **Homepage URL:** https://github.com/jonasneves/canvasflow
- **Developer Dashboard:** https://chrome.google.com/webstore/devconsole
- **Review Time:** Typically 1-3 days

## Troubleshooting

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

### Workflow Not Running

Check GitHub Actions is enabled:
- Repository Settings → Actions → Allow all actions

### ZIP File Too Large

Check for node_modules or unnecessary files:

```bash
unzip -l dist/canvasflow-extension-*.zip | grep node_modules
```

## Additional Resources

- [Chrome Web Store Documentation](https://developer.chrome.com/docs/webstore/)
- [Manifest V3 Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Extension Publishing Guide](https://developer.chrome.com/docs/webstore/publish/)
- [Image Requirements](https://developer.chrome.com/docs/webstore/images/)

---

**Last Updated:** November 2024
**Version:** 1.0.0
