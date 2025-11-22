# CanvasFlow Changelog

## Store Listing Updates

### Current Description

```
CanvasFlow helps Canvas LMS students stay organized with intelligent assignment tracking, AI-powered insights, and automated schedule generation.

KEY FEATURES

Smart Assignment Dashboard
• View all assignments in one organized interface
• Color-coded priority indicators (Overdue, Due Today, Upcoming)
• Impact Score sorting - prioritizes by points and urgency
• Configurable time range filtering
• Focus Mode - shows only top 3 priorities

AI-Powered Study Planner
• Intelligent workload analysis across courses
• Personalized study recommendations
• Priority task identification with time estimates
• Auto-refreshes daily with fresh insights

Weekly Schedule Generation
• AI-generated 7-day study plans
• Time-blocked task assignments
• Workload intensity tracking per day
• Clickable tasks link directly to Canvas assignments

SETUP

1. Install the extension
2. Click CanvasFlow icon on any Canvas page
3. Configure your Canvas URL (auto-detected)
4. AI features work automatically - no configuration needed

PRIVACY & SECURITY

• All Canvas data stays local in your browser
• No tracking or analytics collection
• AI processing via GitHub Models API
• Open source on GitHub

REQUIREMENTS

• Chrome or Chromium-based browser
• Active Canvas LMS account

SUPPORT

https://github.com/jonasneves/canvasflow

Report issues or request features on GitHub
MIT License
```

---

## Privacy Form Content

### Single Purpose Description
```
CanvasFlow enhances the Canvas LMS experience by providing AI-powered assignment tracking, workload insights, and smart schedule generation to help students manage their coursework more effectively.
```

### Permission Justifications

**storage**
```
Required to save user preferences (time range, notification settings) and cache assignment data locally for faster loading. No personal data is stored externally.
```

**activeTab**
```
Required to detect when the user is viewing a Canvas page and enable the side panel functionality on that tab.
```

**tabs**
```
Required to auto-detect Canvas URL from open tabs during initial setup and to open the full-page schedule view.
```

**alarms**
```
Required for periodic auto-refresh of assignment data (every 30 minutes when enabled) and deadline notification scheduling.
```

**scripting**
```
Required to inject the content script that extracts assignment data from Canvas pages.
```

**sidePanel**
```
Required to display the CanvasFlow dashboard as a browser side panel for convenient access while browsing Canvas.
```

**notifications**
```
Required to send deadline reminder notifications for upcoming assignments. Users can enable/disable and configure quiet hours in settings.
```

### Host Permission Justification
```
*.edu/*
Required to access Canvas LMS pages and extract assignment data. Canvas is hosted on various .edu domains across different institutions.

models.github.ai
Required for AI-powered features (insights and schedule generation) using GitHub Models API. No user data is sent - only anonymized assignment metadata (titles, due dates, points).
```

### Data Usage
- No personally identifiable information collected
- No health, financial, or authentication information collected
- No personal communications or location data collected
- No web history tracking
- Website content: Assignment data (titles, due dates, points) is read from Canvas pages and processed locally

---

## Version History

### v1.2.0 (2025-01-XX)

**Features**
- Renamed "AI Insights" tab to "Study Planner"
- Auto-refresh AI content daily on first load
- Compact refresh buttons for insights and schedule views
- Impact Score sorting for assignment prioritization

**Improvements**
- AI features now work out of the box (no API key configuration needed)
- Canvas data must load before AI generation (prevents empty results)
- Unified schedule data between sidepanel and full page view

**Removed**
- MCP server and native host support
- Manual API key configuration

**Fixes**
- Fixed assignment links not working in collapsed schedule days
- Fixed refresh button styling (white on white background)
- Fixed updateStatus reference error
- Properly await loadAssignments for URL matching

### v1.0.0 (Initial Release)

- Smart assignment dashboard with filtering
- AI-powered insights generation
- Weekly schedule generation
- Focus Mode for top priorities
- Notification support for deadlines
