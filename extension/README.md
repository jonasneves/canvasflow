# CanvasFlow Extension

Chrome extension component of CanvasFlow - provides the user interface and Canvas LMS integration.

## Architecture

This extension uses Chrome Manifest V3 and consists of:

- **Background Service Worker** (`background.js`): Manages data sync, alarms, and native messaging
- **Content Script** (`content.js`): Extracts assignment data from Canvas LMS pages
- **Sidepanel** (`sidepanel.html/js`): Compact view for quick assignment access
- **Schedule View** (`schedule.html/js`): Full-page AI-generated weekly schedule
- **Shared Libraries** (`lib/`): Claude API client, AI schemas, and utilities

## File Structure

```
extension/
├── background.js              Background service worker
├── content.js                 Canvas page data extraction
├── sidepanel.html/js          Sidepanel interface
├── schedule.html/js/css       Weekly schedule view
├── manifest.json              Extension configuration
├── icon.png                   Extension icon
├── lib/
│   ├── claude-client.js       Direct HTTP API client for Claude
│   ├── ai-schemas-sidepanel.js  JSON schema for insights
│   ├── ai-schemas-dashboard.js  JSON schema for schedule
│   ├── ai-mappers.js          Response mappers
│   ├── lucide.min.js          Icon library
│   └── lucide-init.js         Icon initialization
└── types/
    └── ai-types.d.ts          TypeScript definitions
```

## Development

### Prerequisites

- Chrome browser (version 88+)
- Text editor or IDE
- Claude API key for AI features

### Local Development

1. Clone the repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension/` directory
5. Make changes to files and click the refresh icon in Chrome extensions

### Testing

Test the extension on Canvas LMS sites:
- `*.instructure.com/*`
- `*.canvaslms.com/*`

Key test scenarios:
- Data extraction from assignment pages
- AI insights generation with valid API key
- Weekly schedule generation
- Assignment filtering and sorting
- Auto-refresh functionality
- Settings persistence

## API Integration

### Claude API

The extension uses Claude's structured outputs feature for consistent JSON responses:

- **Extended Thinking**: Enabled for better reasoning without affecting output tokens
- **Adaptive Token Budgets**:
  - Sidepanel: 1500 max tokens, 1024 thinking budget
  - Schedule: 3000 max tokens, 2000 thinking budget
- **Direct HTTP API**: Browser-compatible implementation (SDK not available in extensions)

### Canvas LMS

Data is extracted from Canvas pages using content scripts:
- Assignment titles, due dates, and course information
- Submission status and points possible
- Course colors and identifiers

No direct Canvas API calls are made - all data comes from the DOM.

## Configuration

User settings stored in `chrome.storage.local`:

- `claudeApiKey`: Anthropic API key
- `assignmentWeeksBefore`: Weeks before current date (default: 1)
- `assignmentWeeksAfter`: Weeks after current date (default: 1)
- `autoRefresh`: Auto-refresh interval in minutes (default: off)
- `assignments`: Cached assignment data
- `lastUpdated`: Last sync timestamp

## Content Security Policy

This extension is CSP-compliant:
- No inline event handlers
- No `eval()` or similar dynamic code execution
- All scripts properly referenced in manifest.json

## Permissions

Required permissions and their purpose:

- `storage`: Save settings and cached assignment data
- `activeTab`: Access current Canvas page
- `tabs`: Create new tabs for schedule view
- `alarms`: Schedule auto-refresh
- `scripting`: Inject content scripts dynamically
- `nativeMessaging`: Optional MCP server integration
- `sidePanel`: Display sidepanel interface
- `<all_urls>`: Access Canvas sites (various domains)

## Publishing

### Preparation Checklist

- [ ] Update version in manifest.json
- [ ] Create icon variants (16x16, 48x48, 128x128)
- [ ] Capture screenshots (1280x800 or 640x400)
- [ ] Test on multiple Canvas instances
- [ ] Verify all features work without console errors
- [ ] Review and minimize permissions if possible

### Chrome Web Store

1. Create ZIP file of extension directory (exclude README.md)
2. Upload to Chrome Web Store Developer Dashboard
3. Complete store listing with description and screenshots
4. Submit for review

## Known Limitations

- Requires manual API key entry (no OAuth flow)
- Canvas DOM changes may affect data extraction
- AI features require network connection and API quota
- Native messaging host must be installed separately for MCP features

## Support

For issues or questions, please refer to the main repository.
