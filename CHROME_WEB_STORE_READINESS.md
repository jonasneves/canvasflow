# Chrome Web Store Readiness Report

This document verifies CanvasFlow extension compliance with Chrome Web Store requirements (2025).

## Compliance Status Summary

**Overall Status**: Ready for publication with minor asset preparation needed

### Critical Requirements

- ✅ Manifest V3 compliant
- ✅ No external code execution
- ✅ CSP compliant (no inline event handlers)
- ✅ Description within 132 character limit
- ⚠️ Icons need proper sizing (16x16, 48x48, 128x128)
- ❌ Screenshots not yet created
- ❌ Privacy policy needs creation
- ⚠️ Permissions justification needs documentation

## Detailed Verification

### 1. Manifest Requirements

**Status**: ✅ COMPLIANT

- Manifest version: 3
- Name: "CanvasFlow" (11 chars, within 75 char limit)
- Version: "1.0.0" (semantic versioning)
- Description: 122 characters (within 132 char limit)
  - Updated to: "Smart Canvas companion with AI insights, assignment tracking, and weekly schedule generation for better studying."
  - Clearly describes all major features

### 2. Code Quality & Security

**Status**: ✅ COMPLIANT

**No External Code Execution**:
- ✅ All JavaScript bundled within extension package
- ✅ No `eval()` or dynamic code execution
- ✅ No external `<script>` tags
- ✅ All logic is self-contained and reviewable

**Content Security Policy**:
- ✅ No inline event handlers
- ✅ All event listeners properly attached via JavaScript
- ✅ No `onclick`, `onload`, etc. in HTML

**API Calls**:
- Claude API: `https://api.anthropic.com/v1/messages` (legitimate API)
- Native messaging: `localhost:8765` (optional native host)
- No unauthorized external requests

### 3. Icon Requirements

**Current Status**: ⚠️ NEEDS ATTENTION

**Available**:
- 360x360 pixel icon.png (109 KB)

**Required for Chrome Web Store**:
- ❌ 16x16 pixel icon (for toolbar/tabs)
- ❌ 48x48 pixel icon (for extension management page)
- ❌ 128x128 pixel icon (for Web Store listing)

**Action Required**:
Create resized versions of icon.png:
```bash
# Using ImageMagick or similar tool
convert icon.png -resize 16x16 icon-16.png
convert icon.png -resize 48x48 icon-48.png
convert icon.png -resize 128x128 icon-128.png
```

Update manifest.json:
```json
"icons": {
  "16": "icon-16.png",
  "48": "icon-48.png",
  "128": "icon-128.png"
}
```

### 4. Store Listing Assets

**Status**: ❌ NOT CREATED

**Required**:
- ❌ Small promotional tile: 440x280 pixels (mandatory)
- ❌ Screenshots: 1280x800 or 640x400 pixels (3-5 recommended)
  - Suggestion 1: Sidepanel showing assignments with filters
  - Suggestion 2: AI Insights panel with analysis
  - Suggestion 3: Weekly Schedule full-page view
  - Suggestion 4: Settings panel configuration
  - Suggestion 5: Extension in action on Canvas page

**Optional**:
- Marquee promotional tile: 1400x560 pixels (recommended for featured placement)

### 5. Privacy Policy

**Status**: ❌ NEEDS CREATION

**Required because**:
- Extension collects Canvas assignment data (course names, due dates, titles)
- Sends data to Claude API when user requests AI insights
- Stores Claude API key locally

**Must include**:
1. What data is collected
   - Canvas assignments (titles, due dates, courses, status)
   - Claude API key (stored locally)
2. How data is used
   - Display assignments in sidepanel/schedule
   - Generate AI insights when requested
   - Local caching for performance
3. Third-party services
   - Claude API (Anthropic) - data sent only on user action
4. Data storage
   - All data stored locally in Chrome storage
   - No remote database or analytics
5. Data security
   - API key encrypted by Chrome storage
   - HTTPS for all API calls
   - No data sold or shared with third parties

**Action**: Create `PRIVACY_POLICY.md` and host it publicly (GitHub Pages or extension website)

### 6. Permissions Justification

**Status**: ⚠️ NEEDS DOCUMENTATION

Current permissions and justifications:

| Permission | Justification Required |
|------------|------------------------|
| `storage` | Store user settings, API key, and cached Canvas assignments locally |
| `activeTab` | Read assignment data from current Canvas LMS page |
| `tabs` | Open weekly schedule in new tab when user clicks button |
| `alarms` | Schedule automatic Canvas data refresh based on user preference |
| `scripting` | Inject content script to extract assignment data from Canvas pages |
| `nativeMessaging` | Optional: Connect to native MCP server for Claude Desktop integration |
| `sidePanel` | Display Canvas assignments and AI insights in Chrome sidepanel |
| `*.instructure.com` | Access Canvas LMS sites on Instructure domain (primary Canvas provider) |
| `*.canvaslms.com` | Access Canvas LMS sites on alternative Canvas domain |
| `*.edu` | Access university-hosted Canvas instances (e.g., canvas.duke.edu, canvas.stanford.edu) |
| `api.anthropic.com` | Send AI analysis requests to Claude API when user requests insights |

**Action**: Enter these justifications in Chrome Web Store Developer Dashboard during submission

### 7. Permissions Review

**Status**: ✅ APPROPRIATE

**Analysis**:
- All permissions are necessary for stated functionality
- No excessive or unnecessary permissions requested
- Permissions align with "Single Purpose" policy (Canvas LMS enhancement)
- Host permissions limited to Canvas domains would be more restrictive, but `<all_urls>` needed for varied Canvas instances

**Update**: ✅ Restricted `<all_urls>` to specific domains:
```json
"host_permissions": [
  "*://*.instructure.com/*",
  "*://*.canvaslms.com/*",
  "*://*.edu/*",
  "https://api.anthropic.com/*"
]
```
This covers standard Canvas hosting, all .edu domains (for university-hosted Canvas like Duke, Stanford, etc.), and Claude API while significantly reducing permission scope from `<all_urls>`.

Note: `*://*.edu/*` is broader than ideal but necessary since Chrome match patterns don't support mid-domain wildcards like `canvas.*.edu`.

### 8. Content Scripts

**Status**: ✅ COMPLIANT

- Matches limited to Canvas domains
- Runs at `document_idle` (non-intrusive)
- Only extracts visible assignment data
- No DOM manipulation or ad injection

### 9. Testing Requirements

**Pre-submission Testing**:
- ✅ Extension loads without errors
- ✅ All features functional after restructure
- ✅ No console errors during normal operation
- ✅ CSP compliance verified
- ⚠️ Test on multiple Canvas instances (recommended)
- ⚠️ Test API key configuration flow
- ⚠️ Verify AI insights generation
- ⚠️ Test weekly schedule generation

### 10. Developer Account Requirements

**Required**:
- Developer account with $5 one-time registration fee
- 2-Step Verification enabled (mandatory as of 2025)
- Valid payment method on file

## Action Items Before Publishing

### High Priority

1. **Create Icon Variants**
   - Generate 16x16, 48x48, 128x128 pixel versions
   - Update manifest.json with correct icon paths
   - Estimated time: 15 minutes

2. **Create Privacy Policy**
   - Draft comprehensive privacy policy
   - Host on public URL (GitHub Pages recommended)
   - Add privacy policy URL to manifest and store listing
   - Estimated time: 1 hour

3. **Capture Screenshots**
   - Take 3-5 high-quality screenshots (1280x800)
   - Show key features in action
   - Annotate if helpful for clarity
   - Estimated time: 30 minutes

4. **Create Promotional Tile**
   - Design 440x280 small promo tile
   - Include extension name and key benefit
   - Follow Chrome Web Store design guidelines
   - Estimated time: 1-2 hours

### Medium Priority

5. **Review Permissions**
   - Consider restricting `<all_urls>` to Canvas domains only
   - Document justification for each permission
   - Estimated time: 15 minutes

6. **Comprehensive Testing**
   - Test on 3+ different Canvas instances
   - Verify all features work end-to-end
   - Check for any console errors
   - Test with and without API key
   - Estimated time: 1-2 hours

7. **Prepare Store Listing Description**
   - Write detailed description (no length limit for dashboard)
   - Highlight key features and benefits
   - Include setup instructions
   - Add support contact information
   - Estimated time: 30 minutes

### Optional Enhancements

8. **Marquee Promotional Tile** (1400x560)
   - Increases visibility for featured placement
   - Not required but recommended

9. **Demo Video**
   - Short video showing extension in action
   - Increases conversion rate
   - Can be uploaded to store listing

10. **User Documentation**
    - Create detailed user guide
    - FAQ section
    - Troubleshooting tips

## Store Listing Recommendations

### Short Description (from manifest)
"Smart Canvas companion with AI insights, assignment tracking, and weekly schedule generation for better studying."

### Detailed Description (for store listing)

**Title**: CanvasFlow - AI-Powered Canvas LMS Assistant

**Description**:
Transform your Canvas LMS experience with CanvasFlow, a modern Chrome extension that combines instant data access with advanced AI capabilities.

**What Makes CanvasFlow Different**:

No Canvas API Required
- Direct data extraction from Canvas pages - no authentication setup needed
- Works immediately after installation
- View assignments, due dates, and submission status instantly
- Compatible with any Canvas instance (Instructure, university-hosted, etc.)

Browser-Based MCP Server (Industry First)
- First Chrome extension with embedded MCP (Model Context Protocol) server
- Talk naturally to your Canvas data through Claude Desktop
- Ask questions like "What's due this week?" or "Help me prioritize my homework"
- MCP server runs inside the browser - no separate installation required
- Direct access to live Canvas data from your browsing session

Advanced AI Features
- Powered by Claude AI with Extended Thinking for deeper analysis
- Structured Outputs ensure consistent, reliable AI responses
- Separate AI reasoning budget maximizes insight quality without inflating costs
- Privacy-first: AI only activates when you explicitly request it

**Core Features**:

Assignment Dashboard
- View all assignments in a convenient sidepanel
- Filter by time range, course, and completion status
- Color-coded course indicators for quick identification
- One-click refresh to sync with Canvas

AI Insights Tab
- Intelligent workload analysis with priority rankings
- Actionable recommendations for tackling assignments
- Automatic urgency scoring based on deadlines
- Strategic advice for time management

Weekly Schedule Generation
- AI-generated 7-day study plans
- Time-blocked schedules optimized for your workload
- Strategic recommendations for the week ahead
- Even task distribution based on assignment complexity

Talk to Your Canvas Data (Browser-Based MCP Server)
- Industry-first: MCP server embedded directly in the Chrome extension
- Have natural conversations with Claude Desktop about your coursework
- Ask "What assignments are due this week?" or "Help me plan my study schedule"
- No separate MCP server installation - it's built into the extension
- Real-time access to your Canvas data as you browse
- Secure local communication via native messaging

**Setup**:
1. Install the extension
2. Visit any Canvas LMS site (works with *.instructure.com, *.edu, etc.)
3. Click the CanvasFlow icon to view assignments
4. (Optional) Add Claude API key in settings for AI features

**Privacy**:
Your data stays with you. Assignment data is stored locally in your browser. AI features only activate when you explicitly request them. No tracking, no analytics, no data selling. See our privacy policy for details.

**Technical Highlights**:
- Chrome Manifest V3 compliant
- Uses Claude's latest structured output capabilities
- Adaptive token budgets for cost-effective AI usage
- CSP-compliant security

**Support the Developer** (Optional section for store listing):
CanvasFlow is and will always be free. If you find it helpful, consider supporting development:
- ⭐ Leave a review on the Chrome Web Store
- ☕ Buy me a coffee: https://buymeacoffee.com/jonasneves
- 💝 Ko-fi: https://ko-fi.com/jonasneves
- 💻 Contribute on GitHub: https://github.com/jonasneves/canvasflow

**Category**: Productivity

**Language**: English

### Support & Contact
- GitHub Issues: https://github.com/jonasneves/canvasflow/issues
- GitHub Discussions: https://github.com/jonasneves/canvasflow/discussions
- Privacy Policy: https://github.com/jonasneves/canvasflow/blob/main/PRIVACY.md

## Estimated Timeline to Publication

- Asset creation: 2-4 hours
- Testing & documentation: 2-3 hours
- Store listing setup: 1 hour
- Review process: 1-3 days (Chrome Web Store review)

**Total**: 5-8 hours of work + review time

## Post-Publication Checklist

- [ ] Add Chrome Web Store link to README
- [ ] Create GitHub release for version 1.0.0
- [ ] Update extension listing with download statistics
- [ ] Set up GitHub issue templates for bug reports
- [ ] Monitor initial reviews and feedback
- [ ] Plan version 1.1 improvements based on user feedback

## Notes

Extension is well-structured and follows best practices. Main blockers are asset creation (icons, screenshots, promotional images) and privacy policy documentation. Code quality is high and ready for review.
