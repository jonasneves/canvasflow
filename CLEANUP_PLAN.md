# Project Cleanup and Restructuring Plan

## Current Structure Issues

1. Test files in production directory
2. Duplicate schema files (Node.js versions not used in browser extension)
3. Verbose directory names
4. Mixed file organization

## Proposed New Structure

```
canvasflow/
├── extension/              (renamed from canvas-mcp-extension)
│   ├── src/
│   │   ├── background.js
│   │   ├── content.js
│   │   ├── sidepanel.js
│   │   ├── sidepanel.html
│   │   ├── dashboard.js
│   │   ├── dashboard.html
│   │   ├── lib/
│   │   │   ├── claude-client.js
│   │   │   ├── ai-schemas-sidepanel.js
│   │   │   ├── ai-schemas-dashboard.js
│   │   │   ├── ai-mappers.js
│   │   │   ├── lucide.min.js
│   │   │   └── lucide-init.js
│   │   └── types/
│   │       └── ai-types.d.ts
│   ├── assets/
│   │   └── icon.png
│   ├── manifest.json
│   └── README.md
│
├── native-host/            (renamed from canvas-mcp-native)
│   ├── src/
│   │   └── host.js
│   ├── package.json
│   ├── package-lock.json
│   ├── manifest.json
│   └── README.md
│
├── .github/
│   └── workflows/
│       └── build-native.yml
│
├── README.md
└── LICENSE
```

## Files to Delete

### Test Files (not needed in production)
- canvas-mcp-extension/test-phase1.js
- canvas-mcp-extension/test-phase2-browser.html

### Duplicate/Unused Files
- canvas-mcp-extension/schemas/ai-schemas.js (Node.js version, browser uses window.*)
- canvas-mcp-extension/utils/ai-mappers.js (Node.js version, browser uses window.*)

## Files to Rename/Reorganize

### Extension Files
- ai-schemas-browser.js → lib/ai-schemas-sidepanel.js
- ai-schemas-dashboard-browser.js → lib/ai-schemas-dashboard.js
- ai-mappers-browser.js → lib/ai-mappers.js
- claude-client-browser.js → lib/claude-client.js
- lucide.min.js → lib/lucide.min.js
- lucide-init.js → lib/lucide-init.js

### Update References
- Update all HTML files to reference new lib/ paths
- Update manifest.json paths
- Update import statements

## Chrome Web Store Preparation

### Required Files
- manifest.json (version 3, properly configured)
- icon.png (128x128, 48x48, 16x16 versions)
- Privacy policy (if collecting data)
- Screenshots for store listing

### Manifest Updates Needed
- Set proper version number
- Add description and author
- Verify permissions are minimal
- Add store listing assets

## Native Host Packaging

### GitHub Actions Workflow
- Build cross-platform binaries (Windows, macOS, Linux)
- Package with proper manifest
- Create releases with download links
- Auto-update README with latest release

### Installation Instructions
- Update MCP Server tab in extension
- Include download links
- Add installation guide

## Benefits

1. Cleaner structure for Chrome Web Store review
2. Easier to maintain and update
3. Professional organization
4. Automated releases for native host
5. Clear separation of concerns
