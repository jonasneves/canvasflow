# CanvasFlow Documentation

This directory contains guidance and preparation documentation for the CanvasFlow project, plus the GitHub Pages landing page.

## What's in This Directory

**Published Website:**
- `index.html` - GitHub Pages landing page (keep this - it's your project website!)

**Guidance Documents (can delete after Chrome Web Store submission):**

### Chrome Web Store Preparation
- `READINESS.md` - Chrome Web Store compliance checklist
- `ASSETS_GUIDE.html` - Visual guide for creating promotional materials
- `CHECKLIST.md` - Step-by-step submission checklist
- `PRIVACY_POLICY_URL.md` - Privacy policy URL for submission
- `DONATION_GUIDE.md` - Chrome Web Store donation policy compliance

### Development & Automation
- `AUTOMATION_COMPLETE.md` - Summary of automated build processes
- `RELEASE_PROCESS.md` - Release automation guide
- `ATTRIBUTION_GUIDE.md` - Claude Code attribution guide

## Essential Published Documentation

The following files remain in the project root (do NOT delete):
- `README.md` - Main project documentation
- `PRIVACY.md` - Privacy policy (linked from Chrome Web Store)
- `TECHNICAL_INNOVATION.md` - Technical architecture and innovation details

## Quick Start

**For Chrome Web Store Submission:**
1. Review `READINESS.md` for compliance status
2. Use `ASSETS_GUIDE.html` to create required promotional materials
3. Follow `CHECKLIST.md` for submission steps

**For Contributors:**
1. Read the main `README.md` in the project root
2. Check `AUTOMATION_COMPLETE.md` for build automation
3. Review `RELEASE_PROCESS.md` for release workflow

## After Publishing

Once the extension is published to Chrome Web Store, you can delete the guidance documents:

```bash
# Keep index.html for GitHub Pages
cd docs
rm -f READINESS.md CHECKLIST.md ASSETS_GUIDE.html DONATION_GUIDE.md \
      PRIVACY_POLICY_URL.md ATTRIBUTION_GUIDE.md AUTOMATION_COMPLETE.md \
      RELEASE_PROCESS.md README.md
```

Or simply delete individual guidance files as needed. **Keep `index.html`** - it's your GitHub Pages website!
