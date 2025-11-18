# Chrome Web Store Publishing Guide for CanvasFlow

## ✅ Pre-Publishing Checklist

### Required Materials (All Ready!)

- [x] **Extension Package**: `extension/` folder
- [x] **Screenshots** (5): All resized to 1280x800px in `screenshots/`
- [x] **Icons**: 16x16, 48x48, 128x128 (in `extension/`)
- [x] **Manifest**: `manifest.json` (version 3)

## 📸 Screenshots (Upload in This Order)

### 1. Dashboard View
**File**: `screenshot-1-dashboard.png`
**Description for Store**:
```
Track all your Canvas assignments at a glance. View overdue, due today, and upcoming assignments with smart summary cards and organized lists.
```

### 2. AI Insights
**File**: `screenshot-2-ai-insights.png`
**Description for Store**:
```
Get AI-powered workload analysis and strategic study tips. CanvasFlow analyzes your assignments and provides personalized recommendations to help you succeed.
```

### 3. Weekly Schedule
**File**: `screenshot-3-weekly-schedule.png`
**Description for Store**:
```
Generate AI-powered weekly study schedules that break down your assignments into manageable time blocks with specific tasks and recommendations.
```

### 4. In-Context View
**File**: `screenshot-4-in-context.png`
**Description for Store**:
```
CanvasFlow works seamlessly alongside your Canvas dashboard, providing a powerful side panel that enhances your learning management experience.
```

### 5. Claude Desktop Integration
**File**: `screenshot-5-mcp-server.png`
**Description for Store**:
```
Connect to Claude Desktop to have natural conversations about your assignments, courses, and deadlines. Ask questions and get intelligent answers about your Canvas data.
```

## 📝 Store Listing Content

### Name
```
CanvasFlow
```

### Tagline (132 characters max)
```
Smart Canvas companion with AI insights, assignment tracking, and weekly schedule generation for better studying.
```

### Summary (400 characters max)
```
CanvasFlow supercharges your Canvas LMS experience with AI-powered insights and smart assignment management. Track all your assignments, get intelligent workload analysis, and generate personalized weekly study schedules. Optional integration with Claude Desktop lets you chat naturally with your Canvas data. Perfect for students who want to stay organized and study smarter.
```

### Detailed Description

```markdown
CanvasFlow is the ultimate productivity companion for Canvas LMS students. Stay on top of your coursework with intelligent assignment tracking, AI-powered insights, and automated schedule generation.

## ✨ Key Features

### 📊 Smart Assignment Dashboard
- View all assignments in one organized interface
- Color-coded priority indicators (Overdue, Due Today, Upcoming)
- Quick summary cards showing assignment counts
- Filter and sort by course, due date, or priority
- Auto-refresh when Canvas data changes

### 🤖 AI-Powered Insights
- Intelligent workload analysis across all your courses
- Personalized study recommendations
- Priority task identification
- Strategic study tips tailored to your schedule
- Critical deadline alerts

### 📅 AI-Generated Weekly Schedules
- Automatic study plan generation
- Time-blocked task assignments
- Workload intensity tracking
- Session recommendations with estimated durations
- Strategic scheduling to optimize your study time

### 💬 Claude Desktop Integration (Optional)
- Natural language conversations about your assignments
- Ask questions like "What should I focus on next?"
- Get intelligent answers about courses and deadlines
- Create custom study schedules through conversation
- Requires Claude Desktop app (free to install)

### ⚙️ Flexible Configuration
- Works with any Canvas instance (.edu, .instructure.com, .canvaslms.com)
- Optional Claude API integration for enhanced AI features
- Customizable time ranges for assignment viewing
- Auto-refresh settings for real-time updates

## 🎯 Perfect For

- College and university students using Canvas LMS
- Graduate students managing multiple courses
- Anyone who wants better organization and AI-powered study assistance
- Students looking to optimize their study schedules

## 🔒 Privacy & Security

- All data stays local in your browser
- Optional Claude API integration (your API key, your control)
- No data collection or tracking
- Open source - review the code yourself

## 🚀 Getting Started

1. Install the extension
2. Click the CanvasFlow icon while on any Canvas page
3. Configure your Canvas instance URL (usually auto-detected)
4. (Optional) Add Claude API key for AI insights
5. Start managing your assignments smarter!

## 🔗 Support & Source Code

- GitHub: https://github.com/jonasneves/canvasflow
- Report issues or request features on GitHub
- Open source under MIT license
- Contributions welcome!

## 📋 Requirements

- Chrome browser (or Chromium-based browser)
- Active Canvas LMS account
- (Optional) Claude API key for AI features
- (Optional) Claude Desktop for chat integration

---

Made with ❤️ for students who want to study smarter, not harder.
```

### Category
**Primary**: Education
**Secondary**: Productivity

### Language
English

## 🏷️ Promotional Content

### Promotional Tile (440x280px)
You'll need to create a promotional tile. Here's a simple design recommendation:
- Background: Use your red-to-blue gradient (matching the extension)
- Logo: CanvasFlow graduation cap icon (large, centered)
- Text: "CanvasFlow" title + "AI-Powered Canvas Companion" subtitle
- Keep it clean and professional

### Small Promotional Tile (220x140px)
Same design as above, but smaller and simpler.

## 🔐 Privacy & Permissions Justification

When publishing, you'll need to explain why each permission is needed:

### Storage
```
Required to save user settings, API keys, and cached assignment data locally in the browser.
```

### Active Tab & Tabs
```
Required to detect when the user is on a Canvas page and to open the side panel and weekly schedule views.
```

### Alarms
```
Required for auto-refresh functionality to periodically check for new assignments.
```

### Scripting
```
Required to inject content scripts into Canvas pages for enhanced functionality.
```

### Native Messaging
```
Required for optional Claude Desktop integration, allowing users to chat with their Canvas data through the desktop app.
```

### Side Panel
```
Required to display the CanvasFlow dashboard as a browser side panel for easy access.
```

### Host Permissions (*.instructure.com, *.canvaslms.com, *.edu/*)
```
Required to access Canvas LMS APIs and fetch assignment data from various Canvas instances. Different schools use different Canvas domains.
```

### Host Permission (api.anthropic.com)
```
Optional integration with Claude API for AI insights and weekly schedule generation. Users must provide their own API key.
```

## 💰 Pricing

**Free** (with optional user-provided Claude API key)

## 📦 Publishing Steps

### 1. Create Developer Account
- Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
- Pay one-time $5 registration fee
- Complete developer profile

### 2. Package Extension
```bash
cd extension
zip -r ../canvasflow-v1.0.0.zip * -x "*.DS_Store" -x "__MACOSX/*"
```

### 3. Upload to Dashboard
1. Click "New Item"
2. Upload `canvasflow-v1.0.0.zip`
3. Fill in all store listing fields (use content from this guide)
4. Upload screenshots in order (screenshot-1 through screenshot-5)
5. Upload promotional tiles
6. Set category to Education/Productivity
7. Set regions (Worldwide recommended)
8. Set mature content rating (No)

### 4. Privacy Practices
- Privacy policy URL: Link to GitHub repo or create dedicated page
- Data usage disclosure:
  - Not collecting user data
  - Not selling user data
  - Not using data for advertising
  - Optional API key storage (local only)

### 5. Verification
- Verify domain ownership (if using website)
- Complete single purpose declaration:
  ```
  CanvasFlow enhances the Canvas LMS experience by providing AI-powered
  assignment tracking, workload insights, and automated schedule generation
  to help students manage their coursework more effectively.
  ```

### 6. Submit for Review
- Review all fields carefully
- Submit for review
- Review typically takes 1-3 business days
- Monitor your email for any requests from Google

## 🎯 Post-Publishing Best Practices

### Version Updates
- Increment version in `manifest.json`
- Create detailed release notes
- Test thoroughly before uploading
- Upload new ZIP through dashboard

### User Support
- Monitor Chrome Web Store reviews
- Respond to user feedback
- Update GitHub issues
- Consider creating documentation website

### Marketing
- Share on Reddit (r/webdev, r/Chrome, r/CollegeLife)
- Post on Product Hunt
- Share in Canvas community forums
- Create demo video for YouTube

### Analytics (Optional)
- Add Google Analytics to track usage (be transparent)
- Monitor installation/uninstallation rates
- Track error reports

## 🚨 Common Rejection Reasons & How to Avoid

### 1. Permissions Justification
**Risk**: Using permissions you don't need
**Solution**: We've only requested necessary permissions and provided justifications

### 2. Single Purpose Policy
**Risk**: Extension does too many unrelated things
**Solution**: CanvasFlow has a clear single purpose: Canvas assignment management

### 3. Privacy Policy
**Risk**: Missing or inadequate privacy policy
**Solution**: Create clear privacy policy explaining data handling

### 4. Misleading Functionality
**Risk**: Screenshots or description don't match actual functionality
**Solution**: Our screenshots are real and descriptions are accurate

### 5. Prohibited Content
**Risk**: Copyrighted material or inappropriate content
**Solution**: All original content, proper Canvas trademark usage

## 📄 Required Additional Files

### Privacy Policy
Create a `PRIVACY.md` in your GitHub repo with:
```markdown
# CanvasFlow Privacy Policy

Last Updated: [Date]

## Data Collection
CanvasFlow does not collect, store, or transmit any personal data to external servers.

## Local Data Storage
- Assignment data is cached locally in your browser
- Settings and API keys are stored locally using Chrome's storage API
- No data leaves your device except for direct API calls you configure

## Third-Party Services
- **Canvas LMS**: Fetches assignment data from your Canvas instance
- **Claude API** (Optional): If you provide an API key, sends assignment data to Anthropic's Claude API for insights
- **Claude Desktop** (Optional): If enabled, shares data with locally-installed Claude Desktop app

## Your Controls
- You can clear all data by removing the extension
- API keys can be removed at any time through settings
- No tracking, analytics, or telemetry

## Contact
Questions? Open an issue on GitHub: https://github.com/jonasneves/canvasflow
```

## 🎉 You're Ready to Publish!

All your materials are prepared:
- ✅ Screenshots resized and named
- ✅ Descriptions written
- ✅ Manifest configured
- ✅ Permissions documented

### Final Checklist
- [ ] Create Chrome Web Store developer account
- [ ] Create privacy policy
- [ ] Create promotional tiles (440x280 and 220x140)
- [ ] Zip the extension folder
- [ ] Upload and fill out all fields
- [ ] Submit for review
- [ ] Celebrate! 🎊

**Good luck with your launch!** 🚀
