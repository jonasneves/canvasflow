# Chrome Web Store Publication Checklist

## Completed

- [x] Reorganized project structure
  - Renamed canvas-mcp-extension to extension/
  - Renamed canvas-mcp-native to native-host/
  - Created lib/ directory for library files
  - Removed test files and duplicates
  - Renamed dashboard to schedule for clarity
- [x] Claude API optimizations
  - Implemented Extended Thinking
  - Optimized JSON schemas for direct HTTP API
  - Adaptive token budgets (1500/1024 for sidepanel, 3000/2000 for schedule)
  - Streamlined prompts
- [x] Updated all file references in HTML
- [x] Removed inline event handlers (CSP compliance)
- [x] Manifest.json improvements
  - Updated description (132 chars, all features covered)
  - Restricted host_permissions to specific domains
  - Version set to 1.0.0
- [x] Documentation created
  - Root README.md with overview and installation
  - extension/README.md with technical details
  - native-host/README.md with MCP integration guide
  - PRIVACY_POLICY.md comprehensive privacy documentation
  - CHROME_WEB_STORE_READINESS.md detailed compliance verification
- [x] Code quality verified
  - No external code execution
  - No eval() or dynamic code loading
  - All JavaScript bundled within extension
  - CSP fully compliant

## Required Before Publishing

### 1. Manifest Updates
- [x] Verify manifest.json version 3 compliance
- [x] Set proper version number (1.0.0)
- [x] Add detailed description (132 chars)
- [x] Minimize permissions (restricted to Canvas and Claude API domains)
- [ ] Add homepage_url (GitHub repository URL)
- [x] Content security policy (compliant, no explicit policy needed)

### 2. Store Listing Assets (CRITICAL)
- [ ] Create multiple icon sizes:
  - [ ] 16x16px (from existing 360x360 icon.png)
  - [ ] 48x48px (from existing 360x360 icon.png)
  - [ ] 128x128px (from existing 360x360 icon.png)
- [ ] Create promotional images:
  - [ ] Small promo tile: 440x280px (REQUIRED)
  - [ ] Marquee promo tile: 1400x560px (optional, recommended)
- [ ] Capture screenshots (1280x800 or 640x400):
  - [ ] Sidepanel showing assignments with filters
  - [ ] AI Insights panel with analysis
  - [ ] Weekly Schedule full-page view
  - [ ] Settings panel configuration
  - [ ] Extension in action on Canvas page (optional 5th screenshot)

### 3. Documentation
- [x] Create extension/README.md
- [x] Create PRIVACY_POLICY.md
- [x] Create root README.md
- [x] Create native-host/README.md
- [x] Create Chrome Web Store readiness report
- [ ] Host PRIVACY_POLICY.md publicly (GitHub Pages or extension website)
- [ ] Add privacy policy URL to manifest.json

### 4. Testing (HIGH PRIORITY)
- [ ] Test extension loading in Chrome (basic functionality verified)
- [ ] Test all features work after restructure
- [ ] Test on multiple Canvas instances (recommended: 3+)
- [ ] Verify API key configuration workflow
- [ ] Test AI insights generation end-to-end
- [ ] Test weekly schedule generation end-to-end
- [ ] Test assignment filtering and sorting
- [ ] Test auto-refresh functionality
- [ ] Check for console errors during normal use
- [x] Verify CSP compliance

### 5. Legal/Compliance
- [x] Privacy policy created
- [ ] Review Anthropic API usage terms compliance
- [ ] Review Canvas LMS terms (data extraction from public pages)
- [ ] Optional: Terms of service

### 6. Store Listing Preparation
- [ ] Prepare detailed description for store listing (no length limit)
- [ ] Document permission justifications for each permission
- [ ] Prepare support contact information
- [ ] Set category: Productivity
- [ ] Set language: English
- [ ] Developer account setup ($5 fee + 2FA enabled)

## Publication Steps

1. **Asset Creation** (2-4 hours)
   - Generate icon sizes using image editing tool
   - Design promotional tile (440x280)
   - Capture and edit screenshots

2. **Final Testing** (2-3 hours)
   - Comprehensive feature testing
   - Multi-instance Canvas testing
   - Error checking

3. **Store Listing** (1 hour)
   - Create Chrome Web Store developer account
   - Prepare ZIP file of extension/ directory
   - Upload extension package
   - Fill in store listing with descriptions and assets
   - Enter permission justifications
   - Add privacy policy URL

4. **Submit for Review**
   - Review typically takes 1-3 days
   - Monitor review status
   - Respond to any reviewer feedback

## Post-Publication

- [ ] Add Chrome Web Store link to README
- [ ] Create GitHub release v1.0.0
- [ ] Create release notes
- [ ] Set up GitHub issue templates
- [ ] Monitor initial user reviews
- [ ] Plan version 1.1 improvements

## Current File Structure

```
canvasflow/
├── extension/
│   ├── background.js
│   ├── content.js
│   ├── schedule.html          (renamed from dashboard.html)
│   ├── schedule.js            (renamed from dashboard.js)
│   ├── schedule.css           (renamed from dashboard.css)
│   ├── sidepanel.html
│   ├── sidepanel.js
│   ├── manifest.json
│   ├── icon.png               (360x360 - needs resizing)
│   ├── README.md
│   ├── lib/
│   │   ├── ai-schemas-sidepanel.js
│   │   ├── ai-schemas-dashboard.js
│   │   ├── ai-mappers.js
│   │   ├── claude-client.js
│   │   ├── lucide.min.js
│   │   └── lucide-init.js
│   └── types/
│       └── ai-types.d.ts
│
├── native-host/
│   ├── host.js
│   ├── package.json
│   ├── package-lock.json
│   ├── manifest.json
│   └── README.md
│
├── README.md
├── PRIVACY_POLICY.md
├── CHROME_WEB_STORE_READINESS.md
├── CHROME_WEB_STORE_CHECKLIST.md
└── CLEANUP_PLAN.md
```

## Critical Blockers for Publication

1. **Icon Sizes** - Must create 16x16, 48x48, 128x128 versions
2. **Screenshots** - Must capture 3-5 screenshots showing features
3. **Promotional Tile** - Must create 440x280 small promo tile
4. **Privacy Policy URL** - Must host PRIVACY_POLICY.md publicly
5. **Comprehensive Testing** - Should test on multiple Canvas instances

## Ready for Publication After:

1. Asset creation (icons, screenshots, promo tile) - 2-4 hours
2. Comprehensive testing - 2-3 hours
3. Privacy policy hosting - 15 minutes
4. Store listing setup - 1 hour

**Estimated Time to Submission**: 5-8 hours of focused work

## Permissions Justifications

For Chrome Web Store submission, use these justifications:

| Permission | Justification |
|------------|---------------|
| `storage` | Store user settings, API key, and cached Canvas assignments locally for quick access |
| `activeTab` | Read assignment data from the current Canvas LMS page being viewed |
| `tabs` | Open weekly schedule view in new tab when user requests it |
| `alarms` | Schedule automatic Canvas data refresh at user-configured intervals |
| `scripting` | Inject content script to extract assignment data from Canvas pages |
| `nativeMessaging` | Enable optional integration with native MCP server for Claude Desktop |
| `sidePanel` | Display Canvas assignments and AI insights in Chrome sidepanel interface |
| `*.instructure.com` | Access Canvas LMS sites on Instructure domain (primary Canvas provider) |
| `*.canvaslms.com` | Access Canvas LMS sites on alternative Canvas domain |
| `*.edu` | Access university-hosted Canvas instances (Duke, Stanford, etc. host Canvas on .edu domains) |
| `api.anthropic.com` | Send assignment data to Claude API for AI insights when user requests |

## Notes

- Extension is production-ready from code quality perspective
- Main work remaining is asset creation and testing
- All documentation complete and privacy policy drafted
- Permissions minimized to only necessary domains
- CSP compliant with no security concerns
- Manifest V3 fully compliant
- No external code execution or eval()
- Ready for Chrome Web Store review once assets are created
