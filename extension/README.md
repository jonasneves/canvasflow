# Yoink Extension

Chrome extension component of Yoink - provides the user interface and Canvas LMS integration.

## Architecture

This extension uses Chrome Manifest V3 and leverages modern AI capabilities:

- **Background Service Worker** (`background.js`): Manages data sync, alarms, and native messaging
- **Content Script** (`content.js`): Direct DOM extraction from Canvas (no Canvas API required)
- **Sidepanel** (`sidepanel.html/js`): Dashboard with assignment overview and AI insights tab
- **Schedule View** (`schedule.html/js`): Full-page AI-generated weekly schedule
- **Shared Libraries** (`lib/`): Claude API client with structured outputs, AI schemas, and utilities

### Key Technical Features

- **No Canvas API Dependency**: Extracts data directly from DOM, no authentication flow required
- **Structured Outputs**: Tool-based approach ensures consistent JSON responses
- **Adaptive Token Budgets**: Different limits for sidepanel (1500) vs schedule (3000)

## File Structure

```
extension/
├── background.js              Background service worker
├── content.js                 Canvas page data extraction
├── sidepanel.html/js          Sidepanel interface
├── schedule.html/js/css       Weekly schedule view
├── manifest.json              Extension configuration
├── icon-16.png                Extension icon (16x16)
├── icon-48.png                Extension icon (48x48)
├── icon-128.png               Extension icon (128x128)
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

The extension leverages Claude's latest capabilities for reliable AI responses:

- **Structured Outputs**: Tool-based approach ensures consistent response format
  - Sidepanel schema: Priority rankings, urgency scores, actionable recommendations
  - Schedule schema: 7-day time-blocked plan with strategic advice
  - No parsing errors - guaranteed valid JSON from the API

- **Adaptive Token Budgets**: Different limits based on output complexity
  - Sidepanel: 1500 max tokens (quick insights)
  - Schedule: 3000 max tokens (detailed weekly plan)
  - Optimized for cost and quality

- **Direct HTTP API**: Browser-compatible implementation (SDK not available in extensions)
  - Custom fetch-based client in `lib/claude-client.js`
  - Uses forced tool calling to guarantee JSON structure
  - Supports both prompt types with adaptive budgets

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
- `sidePanel`: Display sidepanel interface
- `<all_urls>`: Access Canvas sites (various domains)

Note: MCP server integration uses HTTP to localhost (no special permissions required)

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
