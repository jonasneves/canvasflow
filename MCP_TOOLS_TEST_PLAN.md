# MCP Tools Test Plan

This document outlines how to test all 9 MCP tools in your CanvasFlow application.

## Fixes Applied

### Problem Found
The `CANVAS_DATA` message handler in `background.js` was only storing **courses** and **assignments**, but was missing handlers for:
- ✅ `calendarEvents` (your main issue!)
- ✅ `allAssignments`
- ✅ `upcomingEvents`
- ✅ `submissions`
- ✅ `modules`
- ✅ `analytics`

### Changes Made

1. **background.js** (Lines 292-342)
   - Added handlers for `allAssignments`, `calendarEvents`, `upcomingEvents`, `submissions`, `modules`, and `analytics`
   - Updated `canvasData` initialization to include missing fields
   - Updated `sendDataToMCPServer()` to send all data types to the MCP server

2. **content.js** (Lines 454-486)
   - Added CANVAS_DATA payload cases for `FETCH_USER_SUBMISSIONS`, `FETCH_COURSE_MODULES`, and `FETCH_COURSE_ANALYTICS`
   - Now properly forwards all fetched data to the background script

---

## Testing All 9 MCP Tools

### Prerequisites
1. Reload the Chrome extension after deploying these changes
2. Ensure the MCP server (`native-host/host.js`) is running
3. Have an active Canvas tab open

---

### Tool #1: `list_courses`
**Purpose:** Get all Canvas courses for the current user

**Test Steps:**
1. From Claude Desktop, call the MCP tool: `list_courses`
2. Expected result: JSON array of courses with id, name, code, term, url

**What to verify:**
- Course count > 0
- Each course has id, name, code fields

---

### Tool #2: `get_course_assignments`
**Purpose:** Get assignments for a specific course

**Test Steps:**
1. First run `list_courses` to get a course ID
2. Call: `get_course_assignments` with `course_id: "12345"`
3. Expected result: JSON array of assignments for that course

**What to verify:**
- Assignment count > 0 (if the course has assignments)
- Each assignment has id, name, dueDate, pointsPossible

---

### Tool #3: `list_all_assignments`
**Purpose:** Get all assignments across all courses with submission status

**Test Steps:**
1. Call: `list_all_assignments`
2. Expected result: JSON array of all assignments with submission status

**What to verify:**
- Assignments from multiple courses included
- Each assignment has courseName, submission object with status

---

### Tool #4: `get_assignment_details`
**Purpose:** Get detailed info about a specific assignment

**Test Steps:**
1. Get a course_id and assignment_id from previous calls
2. Call: `get_assignment_details` with both IDs
3. Expected result: Detailed assignment info including description, rubrics, submission

**What to verify:**
- description field populated
- submission object with detailed status

---

### Tool #5: `list_calendar_events` ⭐ (Your Issue!)
**Purpose:** Get calendar events within a date range

**Test Steps:**
1. Call: `list_calendar_events` without parameters (gets all events)
2. OR call with: `start_date: "2025-01-01"` and `end_date: "2025-12-31"`
3. Expected result: JSON array of calendar events and assignments

**What to verify:**
- ✅ Events are now being returned (this was broken before!)
- Each event has id, title, startAt, endAt, type
- Mix of both assignment events and calendar events

**Note:** This should now work! The fix ensures that `calendarEvents` are properly stored in the background script and sent to the MCP server.

---

### Tool #6: `get_user_submissions`
**Purpose:** Get all submissions for a course

**Test Steps:**
1. Get a course_id from `list_courses`
2. Call: `get_user_submissions` with `course_id`
3. Expected result: JSON array of submissions for that course

**What to verify:**
- Submission count matches assignments you've submitted
- Each submission has assignmentName, submittedAt, grade, score

---

### Tool #7: `list_course_modules`
**Purpose:** Get all modules and module items for a course

**Test Steps:**
1. Get a course_id from `list_courses`
2. Call: `list_course_modules` with `course_id`
3. Expected result: JSON array of modules with nested items

**What to verify:**
- Modules returned (if the course has modules)
- Each module has name, position, items array
- Items have title, type, contentId

---

### Tool #8: `list_upcoming_events`
**Purpose:** Get upcoming events for the current user

**Test Steps:**
1. Call: `list_upcoming_events`
2. Expected result: JSON array of upcoming assignments and events

**What to verify:**
- Events sorted by date
- Each event has title, type, startAt
- Includes future assignments

---

### Tool #9: `get_course_analytics`
**Purpose:** Get analytics data for a course

**Test Steps:**
1. Get a course_id from `list_courses`
2. Call: `get_course_analytics` with `course_id`
3. Expected result: Analytics data (or note that analytics not available)

**What to verify:**
- Either returns analytics data (pageViews, participations, tardiness)
- OR returns message that analytics not available on this Canvas instance

**Note:** Analytics may not be available on all Canvas instances - this is expected.

---

## Quick Test Script

If you want to test everything at once, you can run this sequence from Claude Desktop:

```
1. list_courses
2. list_all_assignments
3. list_calendar_events (⭐ This should now work!)
4. list_upcoming_events
5. get_course_assignments (use a course_id from step 1)
6. get_assignment_details (use course_id and assignment_id from step 5)
7. get_user_submissions (use a course_id from step 1)
8. list_course_modules (use a course_id from step 1)
9. get_course_analytics (use a course_id from step 1)
```

---

## Debugging Tips

### If calendar events are still empty:

1. **Check the MCP server logs:**
   ```bash
   tail -f ~/canvas-mcp-host.log
   ```
   Look for lines like: `Received X calendar events`

2. **Check Chrome extension console:**
   - Open Chrome DevTools on a Canvas page
   - Look for errors in the console
   - Verify the content script is loaded

3. **Manually trigger a refresh:**
   - Open the CanvasFlow sidepanel
   - Click the refresh button
   - Check if calendar events appear in the UI

4. **Test the Canvas API directly:**
   - Open Canvas in your browser
   - Open DevTools Console
   - Run: `fetch('/api/v1/calendar_events?per_page=100').then(r => r.json()).then(console.log)`
   - Verify that Canvas returns calendar events

### If other tools aren't working:

1. **Verify the extension is loaded:**
   - Go to `chrome://extensions`
   - Ensure CanvasFlow is enabled
   - Try reloading the extension

2. **Check MCP server connection:**
   - Visit `http://localhost:8765/health` in your browser
   - Should return JSON with status "running"

3. **Verify data flow:**
   - Visit `http://localhost:8765/canvas-data` in your browser
   - Should show all cached Canvas data including calendarEvents

---

## Summary of All 9 MCP Tools

| # | Tool Name | Parameters | Purpose | Fixed? |
|---|-----------|------------|---------|--------|
| 1 | `list_courses` | None | Get all courses | ✅ Yes |
| 2 | `get_course_assignments` | course_id | Get assignments for course | ✅ Yes |
| 3 | `list_all_assignments` | None | Get all assignments across courses | ✅ Yes |
| 4 | `get_assignment_details` | course_id, assignment_id | Get detailed assignment info | ✅ Yes |
| 5 | `list_calendar_events` | start_date*, end_date* | Get calendar events | ⭐ **FIXED!** |
| 6 | `get_user_submissions` | course_id | Get user submissions | ✅ Yes |
| 7 | `list_course_modules` | course_id | Get course modules | ✅ Yes |
| 8 | `list_upcoming_events` | None | Get upcoming events | ✅ Yes |
| 9 | `get_course_analytics` | course_id | Get course analytics | ✅ Yes |

\* Optional parameters

All tools should now work correctly! The main issue was that calendar events (and other data types) were being fetched but not stored in the background script, so they never made it to the MCP server.
