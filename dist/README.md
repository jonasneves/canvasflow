# Yoink Distribution Files

This directory contains packaged versions of Yoink for distribution.

## 📦 For Chrome Web Store Submission

### Option 1: Use GitHub Release (Recommended)
When a GitHub Release is created, download the `canvasflow-extension-vX.X.X.zip` file directly from the release assets. This zip is correctly formatted and ready to upload to the Chrome Web Store.

### Option 2: Use GitHub Actions Artifact
If downloading from GitHub Actions artifacts:

1. Download the `canvasflow-extension-vX.X.X` artifact
2. Extract the downloaded zip file
3. You'll get a folder with the extension files
4. **Important:** Re-zip the folder contents, ensuring `manifest.json` is at the root of the zip
5. Upload the new zip to Chrome Web Store

**Why re-zip?** GitHub Actions automatically zips artifacts when you download them. This creates a double-zipped file that Chrome Web Store rejects.

### Verifying Your Zip File

Before uploading to Chrome Web Store, verify the structure:

```bash
unzip -l your-extension.zip | head -15
```

You should see `manifest.json` at the root level (no parent directories):
```
Archive:  your-extension.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
     1233  2025-11-18 02:32   manifest.json
    29695  2025-11-18 02:32   background.js
    ...
```

## 🚀 Quick Start for Local Development

To create a properly formatted zip locally:

```bash
cd extension
zip -r ../canvasflow-extension-custom.zip \
    manifest.json \
    background.js \
    content.js \
    sidepanel.html \
    sidepanel.js \
    schedule.html \
    schedule.js \
    schedule.css \
    icon-16.png \
    icon-48.png \
    icon-128.png \
    lib/ \
    types/ \
    -x "*.md" "*.DS_Store" "*node_modules*"
cd ..
```

Or use the release script:

```bash
./scripts/release.sh
```

## 📋 Files in This Directory

- `canvasflow-extension-vX.X.X.zip` - Chrome extension package (ready for Chrome Web Store)
- `canvasflow-native-host-vX.X.X.zip` - Native messaging host (optional, for MCP integration)
- `release-notes-vX.X.X.md` - Release notes for the version
- `submission-checklist-vX.X.X.md` - Checklist for Chrome Web Store submission

## ❓ Troubleshooting

### "No manifest found in package" error

This error occurs when manifest.json is not at the root of the zip. Common causes:

1. **Using GitHub Actions artifact directly** - The artifact is double-zipped. Extract and re-zip as described above.
2. **Incorrect zip creation** - Make sure you're inside the extension directory when creating the zip, or use relative paths correctly.
3. **Extra parent folder** - The zip should contain `manifest.json` at the root, not `extension/manifest.json` or `canvasflow/manifest.json`.

### How to fix it:

1. Extract your current zip file
2. Navigate into the folder until you see `manifest.json` directly
3. Select all files in that folder (including `manifest.json`)
4. Create a new zip file from the selected files
5. Verify with `unzip -l yourfile.zip` that manifest.json appears at the root

## 📞 Support

For more information, see:
- [Chrome Web Store Readiness](../docs/READINESS.md)
- [Release Process](../docs/RELEASE_PROCESS.md)
- [Submission Checklist](../docs/CHECKLIST.md)
