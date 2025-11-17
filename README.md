# Canvas MCP Server

A Chrome extension that bridges Canvas LMS with Claude Desktop using the Model Context Protocol (MCP).

## Features

- Access Canvas courses and assignments directly from Claude Desktop
- Simple one-time extension installation
- Automatic Canvas URL detection
- Support for custom Canvas instances

## Quick Setup

### 1. Install Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select: `canvas-mcp-extension` folder
5. Configure Canvas URL in extension settings

### 2. Install Claude Desktop Extension

1. Open Claude Desktop → Settings → Extensions
2. Click "Install Unpacked Extension"
3. Select: `canvas-mcp-native` folder
4. Extension will start automatically ✅

### 3. Use It!

1. Click the Chrome extension icon
2. Click "Refresh Canvas Data"
3. In Claude Desktop, ask:
   - "What courses do I have in Canvas?"
   - "List my Canvas courses"
   - "Show me assignments for [course name]"

That's it! No config files, no scripts, just two simple installs.

## Project Structure

```
canvas-mcp-server/
├── canvas-mcp-extension/    # Chrome extension
│   ├── manifest.json
│   ├── background.js         # Fetches Canvas data via API
│   ├── content.js           # Canvas API integration
│   ├── popup.html/js        # Extension popup UI
│   └── options.html/js      # Settings page
└── canvas-mcp-native/       # Claude Desktop extension
    ├── manifest.json         # DXT manifest
    ├── host.js              # MCP server (stdio + HTTP)
    └── package.json
```

## How It Works

1. **Chrome Extension** fetches Canvas data using Canvas API
2. **HTTP Server** (port 8765) receives Canvas data from Chrome extension
3. **Claude Desktop** launches the MCP server via STDIO
4. **Claude** queries Canvas data through MCP protocol
5. All communication is local (no external servers)

## Troubleshooting

### MCP Server shows "Disconnected"

1. Check Chrome extension status:
   - Open `chrome://extensions/`
   - Reload Canvas MCP Server extension

2. Check Claude Desktop extension:
   - Settings → Extensions
   - Verify "Canvas LMS MCP Server" is listed
   - Check logs: `tail -f ~/canvas-mcp-host.log`

3. Restart both:
   - Reload Chrome extension
   - Restart Claude Desktop

### Canvas URL not detected

1. Open your Canvas site in a browser tab
2. Click extension icon → Settings
3. Click "Auto-Detect from Open Tabs"
4. Or manually enter your Canvas URL (e.g., `https://canvas.duke.edu`)

### Claude says "No courses data available"

1. In Chrome extension popup, click "Refresh Canvas Data"
2. Check extension shows "MCP Server: Connected" (green)
3. Verify courses appear in "Test: List Courses"

## Development

### View Logs

```bash
tail -f ~/canvas-mcp-host.log
```

### Debug Extension

- Right-click Chrome extension icon → Inspect (popup console)
- Or `chrome://extensions/` → Click "service worker" (background console)

## Available MCP Tools

### Course Information
- **`list_courses`** - Get all Canvas courses for the current user
  - No parameters required
  - Returns: List of courses with ID, name, code, term, and URL

### Assignments
- **`get_course_assignments`** - Get assignments for a specific course
  - Parameters: `course_id` (required)
  - Returns: List of assignments with basic information

- **`list_all_assignments`** - Get all assignments across all courses with submission status
  - No parameters required
  - Returns: Comprehensive list of all assignments with:
    - Course information
    - Due dates and lock dates
    - Submission status (submitted, late, missing, grade)
    - Points possible and grading type
  - **Ideal for dashboard views and AI-powered insights**

- **`get_assignment_details`** - Get detailed information about a specific assignment
  - Parameters: `course_id` (required), `assignment_id` (required)
  - Returns: Full assignment details including:
    - Description and instructions
    - Rubrics and grading criteria
    - Submission information
    - Allowed attempts
    - All dates (due, lock, unlock)

### Calendar & Events
- **`list_calendar_events`** - Get calendar events and assignments within a date range
  - Parameters: `start_date` (optional, ISO 8601), `end_date` (optional, ISO 8601)
  - Returns: Calendar events and assignment due dates
  - Use for timeline views and deadline tracking

- **`list_upcoming_events`** - Get upcoming events and assignments for the current user
  - No parameters required
  - Returns: Upcoming assignments and events sorted by date
  - **Perfect for "What's due soon?" queries**

### Submissions & Progress
- **`get_user_submissions`** - Get all submissions for the current user in a specific course
  - Parameters: `course_id` (required)
  - Returns: Detailed submission information including:
    - Submission status and timestamps
    - Grades and scores
    - Late/missing/excused status
    - Attempt numbers

### Course Structure
- **`list_course_modules`** - Get all modules and module items for a course
  - Parameters: `course_id` (required)
  - Returns: Course modules with:
    - Module names and positions
    - Module items (assignments, pages, quizzes, etc.)
    - Sequential progress requirements
    - Published status

### Analytics (Optional)
- **`get_course_analytics`** - Get analytics data for a course
  - Parameters: `course_id` (required)
  - Returns: Student analytics including:
    - Page views
    - Participations
    - Tardiness breakdown
  - **Note:** May not be available on all Canvas instances

## Use Cases for AI-Powered Dashboard

These new endpoints enable powerful AI-driven features:

1. **Smart Assignment Prioritization**
   - Use `list_all_assignments` to get all assignments with submission status
   - AI can analyze due dates, workload, and submission status to suggest priorities

2. **Workload Analysis**
   - Combine `list_all_assignments` with `list_calendar_events` to identify busy periods
   - AI can warn about multiple assignments due in the same week

3. **Progress Tracking**
   - Use `get_user_submissions` to track completion and grades
   - Calculate completion rates per course

4. **Time Estimation**
   - `get_assignment_details` provides full context for complexity estimation
   - AI can suggest time needed based on description and rubrics

5. **Course Health Overview**
   - Combine multiple endpoints to create comprehensive course dashboards
   - Track missing assignments, upcoming deadlines, and overall progress

## Example Queries for Claude

With these new endpoints, you can now ask Claude:

- "Show me all my upcoming assignments across all courses"
- "Which assignments are due this week?"
- "What assignments am I missing?"
- "Give me details about assignment [ID] in course [ID]"
- "What's my workload looking like for the next two weeks?"
- "Show me my submission status for [course name]"
- "What modules are in my [course name] course?"
- "Help me prioritize my assignments based on due dates and complexity"
- "Create a study schedule based on my Canvas assignments"

## License

MIT
