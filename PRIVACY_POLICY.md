# Privacy Policy for CanvasFlow

Last Updated: November 2025

## Introduction

CanvasFlow is a Chrome extension designed to enhance your Canvas LMS experience with AI-powered insights and intelligent schedule planning. This privacy policy explains how CanvasFlow collects, uses, and protects your data.

## Data Collection

### What Data We Collect

CanvasFlow collects and processes the following information locally in your browser:

1. **Canvas Assignment Data**
   - Assignment titles and descriptions
   - Due dates and submission deadlines
   - Course names and identifiers
   - Point values and submission status
   - Course colors and visual identifiers

2. **User Preferences**
   - Claude API key (if provided by user)
   - Assignment time range settings (weeks before/after)
   - Auto-refresh preferences
   - Display and filter preferences

### How Data is Collected

- **Content Scripts**: Extract assignment information from Canvas LMS pages you visit
- **User Input**: Settings and preferences you configure
- **API Responses**: AI-generated insights when you request them

## Data Usage

### How We Use Your Data

1. **Display Assignments**: Show your Canvas assignments in an organized sidepanel view
2. **Generate AI Insights**: Send assignment data to Claude API when you explicitly click "Generate AI Insights"
3. **Create Weekly Schedules**: Generate optimized study plans when you request them
4. **Save Preferences**: Remember your settings for future sessions
5. **Auto-Refresh**: Update Canvas data automatically based on your preferences

### When Data is Sent Externally

CanvasFlow only sends data to external services in these specific circumstances:

- **Claude API (Anthropic)**: Assignment data is sent to Claude's API **only when you explicitly request AI insights or weekly schedule generation**. This data includes assignment titles, due dates, courses, and descriptions to enable AI analysis.
- **No Other Third Parties**: No data is sent to any other external services, analytics platforms, or advertising networks.

## Data Storage

### Where Your Data is Stored

All data is stored **locally in your browser** using Chrome's secure storage API:

- **Local Storage**: Assignment data, preferences, and settings
- **Secure Storage**: API keys are encrypted by Chrome's built-in security mechanisms
- **No Remote Database**: CanvasFlow does not maintain any remote servers or databases

### How Long Data is Stored

- Assignment data is cached locally until manually refreshed or auto-refresh occurs
- User preferences persist until you uninstall the extension or clear browser data
- Clearing Chrome extension data will remove all stored information

## Third-Party Services

### Claude API (Anthropic)

When you use AI features, assignment data is sent to Anthropic's Claude API:

- **Purpose**: Generate intelligent insights and weekly schedules
- **Data Sent**: Assignment titles, due dates, course names, point values
- **User Control**: Only sent when you explicitly click AI feature buttons
- **Anthropic's Privacy**: Subject to Anthropic's privacy policy at https://www.anthropic.com/privacy

### Canvas LMS

CanvasFlow reads data from Canvas LMS pages:

- **Read-Only Access**: Extension only reads visible assignment data
- **No API Calls**: Does not make direct API calls to Canvas servers
- **DOM Extraction**: Extracts information from the Canvas web pages you visit

## Data Security

### Security Measures

1. **HTTPS Only**: All external API calls use encrypted HTTPS connections
2. **Local Encryption**: Chrome's storage API provides built-in encryption for sensitive data
3. **No Analytics**: No tracking pixels, analytics, or telemetry
4. **Limited Permissions**: Extension only requests necessary permissions for functionality
5. **Restricted Domains**: Host permissions limited to Canvas and Claude API domains

### API Key Security

If you provide a Claude API key:
- Stored locally using Chrome's secure storage API
- Never transmitted except in authenticated API requests to Claude
- Encrypted at rest by Chrome's built-in security
- Can be removed at any time from extension settings

## User Rights and Control

### Your Rights

You have complete control over your data:

1. **Access**: View all stored data in extension settings and Chrome DevTools
2. **Deletion**: Clear all data by clicking "Clear Data" in settings or uninstalling extension
3. **Opt-Out**: Choose not to use AI features to avoid sending data to Claude API
4. **API Key Removal**: Delete your API key at any time to disable AI features

### How to Delete Your Data

- **Clear Cached Assignments**: Click "Refresh Data" in the sidepanel
- **Remove API Key**: Go to Settings and clear the API key field
- **Complete Removal**: Uninstall the extension from Chrome extensions page

## No Data Selling or Sharing

CanvasFlow **does not**:
- Sell your data to third parties
- Share your data with advertisers
- Use your data for marketing purposes
- Track your browsing activity outside Canvas pages
- Collect personally identifiable information beyond what's necessary for functionality

## Children's Privacy

CanvasFlow does not knowingly collect data from children under 13. The extension is designed for students and educators using Canvas LMS, typically in educational institutions. If you are under 13, please obtain parental consent before using this extension.

## Changes to This Policy

We may update this privacy policy to reflect changes in our practices or legal requirements. Significant changes will be communicated through:
- Extension update notes in Chrome Web Store
- Notification in extension interface
- Updated "Last Updated" date at the top of this policy

Continued use of CanvasFlow after policy changes constitutes acceptance of the updated policy.

## Open Source and Transparency

CanvasFlow is open source software. You can:
- Review the complete source code on GitHub
- Verify our privacy claims by inspecting the code
- Contribute improvements or report issues
- Fork and modify for personal use

## Contact Information

For questions, concerns, or requests regarding your data and privacy:

- **GitHub Issues**: [Repository URL]
- **Email**: [Contact email]

## Legal Compliance

CanvasFlow complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR) principles
- California Consumer Privacy Act (CCPA) guidelines
- Family Educational Rights and Privacy Act (FERPA) for educational data

## Consent

By installing and using CanvasFlow, you consent to:
- Local collection and storage of Canvas assignment data
- Sending assignment data to Claude API when you use AI features
- Storage of preferences and settings in Chrome's local storage

You can withdraw consent at any time by uninstalling the extension.

## Data Processing Summary

| Data Type | Collection Method | Storage Location | External Sharing | User Control |
|-----------|-------------------|------------------|------------------|--------------|
| Canvas Assignments | Content script extraction | Local browser storage | Only to Claude API when requested | Full (delete anytime) |
| API Key | User input | Secure local storage | Only in API requests | Full (remove anytime) |
| User Preferences | User input | Local browser storage | Never | Full (modify anytime) |
| AI Insights | Generated by Claude API | Temporary display only | N/A | Full (not stored) |

## Commitment to Privacy

Your privacy is our priority. CanvasFlow is designed with privacy-first principles:
- Minimal data collection
- Local-first architecture
- User consent for external data sharing
- Transparency through open source code
- No hidden tracking or analytics

Thank you for trusting CanvasFlow to enhance your Canvas LMS experience.
