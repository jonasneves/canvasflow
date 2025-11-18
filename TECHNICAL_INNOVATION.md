# Technical Innovation: Browser-Based MCP Server

## 🚀 Industry First: MCP Server Embedded in Chrome Extension

CanvasFlow introduces a novel architecture: the **first Chrome extension with an embedded Model Context Protocol (MCP) server**.

## Traditional MCP Architecture

Most MCP implementations follow this pattern:

```
Claude Desktop ←→ MCP Server (separate process) ←→ Data Source
                  (Node.js/Python standalone)
```

**Limitations:**
- Requires separate server installation
- Server must fetch data via APIs or file system
- Additional configuration and setup steps
- Cannot access browser session data directly

## CanvasFlow's Innovation

CanvasFlow embeds the MCP server **inside the Chrome extension**:

```
Claude Desktop ←→ Native Host (bridge) ←→ Chrome Extension (MCP Server) ←→ Canvas Pages (DOM)
                  (thin connector)          (data extraction + protocol)
```

### Architecture Components

#### 1. **Chrome Extension = MCP Server** (`extension/background.js`)

The extension itself implements the full MCP protocol:

```javascript
// MCP tools defined in the extension
const MCP_TOOLS = {
  list_courses: { ... },
  get_course_assignments: { ... },
  list_all_assignments: { ... },
  // ... 9 total MCP tools
};

// MCP request handler in the browser
async function handleMCPRequest(payload) {
  const { method, params } = payload;

  switch(method) {
    case 'initialize': return { protocolVersion: "2024-11-05", ... };
    case 'tools/list': return { tools: Object.values(MCP_TOOLS) };
    case 'tools/call': return await handleToolCall(params);
  }
}
```

**Key Innovation**: The MCP server runs in the browser's background service worker, with direct access to:
- Canvas DOM (via content scripts)
- User's browsing session (no authentication needed)
- Real-time page data (assignments, courses, events)

#### 2. **Native Host = Lightweight Bridge** (`native-host/host.js`)

A minimal Node.js process that:
- Receives Canvas data from extension via HTTP (localhost:8765)
- Translates between extension and Claude Desktop
- Implements STDIO protocol for Claude Desktop
- Acts as a thin connector, **not** the data source

```javascript
// Native host receives data from extension
app.post('/canvas-data', (req, res) => {
  canvasData = req.body;  // Update cache
  res.json({ status: 'success' });
});

// Serves MCP requests to Claude Desktop
rl.on('line', async (line) => {
  const request = JSON.parse(line);
  const response = await handleMCPRequest(request);
  process.stdout.write(JSON.stringify(response) + '\n');
});
```

## Why This Matters

### 1. **No Canvas API Required**

Traditional approach:
```javascript
// Typical MCP server
async function getAssignments() {
  const response = await fetch('https://canvas.instructure.com/api/v1/courses', {
    headers: { 'Authorization': `Bearer ${API_KEY}` }  // Requires API key!
  });
  return response.json();
}
```

CanvasFlow approach:
```javascript
// Extract directly from DOM
chrome.scripting.executeScript({
  target: { tabId: tab.id },
  files: ['content.js']  // Reads data from page user is already viewing
});
```

**Benefits:**
- No API key setup required
- Works immediately after installation
- No rate limiting issues
- Access to data exactly as user sees it

### 2. **Real-Time Browser Context**

The MCP server has access to:
- Currently viewed Canvas pages
- User's active session
- Live assignment updates
- Browser storage and state

Example interaction with Claude Desktop:
```
User: "What assignments are due this week?"
Claude → MCP tool call → Chrome Extension → Content script extracts from DOM → Response
```

### 3. **Simplified Installation**

**Traditional MCP setup:**
1. Install Node.js/Python
2. Clone server repository
3. Install dependencies
4. Configure API keys
5. Set up Claude Desktop config
6. Run server separately

**CanvasFlow setup:**
1. Install Chrome extension
2. Optional: Install native host for Claude Desktop integration
3. Done!

The MCP server is already running as part of the extension.

## Technical Implementation Details

### Data Flow

1. **Content Script** extracts Canvas data from DOM:
```javascript
// content.js
const assignments = Array.from(document.querySelectorAll('.assignment')).map(el => ({
  name: el.querySelector('.title').textContent,
  dueDate: el.querySelector('.due-date').textContent,
  // ... extract from visible page
}));
```

2. **Background Script** caches and serves MCP requests:
```javascript
// background.js
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'CANVAS_DATA') {
    canvasData = request.data;  // Cache in memory
    sendDataToMCPServer();      // Forward to native host
  }
});
```

3. **Native Host** bridges to Claude Desktop:
```javascript
// host.js - receives from extension
httpServer.on('POST /canvas-data', (data) => {
  canvasData = data;  // Update cache from extension
});

// host.js - serves to Claude Desktop
async function handleToolCall(tool, args) {
  // Return cached data from extension
  return canvasData.assignments;
}
```

### MCP Protocol Compliance

CanvasFlow implements the full MCP specification:

- ✅ **Protocol Version**: 2024-11-05
- ✅ **Initialization**: Standard `initialize` method
- ✅ **Tool Discovery**: `tools/list` with 9 Canvas-specific tools
- ✅ **Tool Execution**: `tools/call` with structured responses
- ✅ **Error Handling**: Proper JSON-RPC error responses
- ✅ **Streaming**: Real-time data updates

### Security Considerations

**Browser Sandbox:**
- Extension runs in Chrome's secure sandbox
- No direct file system access
- Content scripts isolated from web pages
- CSP (Content Security Policy) compliant

**Local Communication:**
- Native host only listens on localhost
- No external network access
- Data never leaves the user's machine
- HTTP communication only for local bridge

**Privacy:**
- No data sent to external servers
- All Canvas data stays local
- MCP server only accessible via localhost
- User's browsing session never exposed

## Innovation Summary

### What Makes This Different

| Aspect | Traditional MCP | CanvasFlow MCP |
|--------|----------------|----------------|
| **Location** | Separate process | Inside Chrome extension |
| **Data Access** | API calls | Direct DOM extraction |
| **Installation** | Multi-step setup | Single extension install |
| **Authentication** | API keys required | Uses browser session |
| **Updates** | Manual server restart | Automatic with page loads |
| **Context** | Static data | Live browsing context |

### Use Cases Enabled

1. **Natural Language Queries**
   - "What's my workload for next week?"
   - "Which assignment should I prioritize?"
   - "When is my next exam?"

2. **Contextual Assistance**
   - Claude sees exactly what user sees in Canvas
   - Can reference specific assignments on current page
   - Real-time data without refresh delays

3. **Privacy-First Integration**
   - No API keys to manage
   - No credentials to store
   - Data extraction only from pages user visits
   - All processing local to user's machine

## Future Possibilities

This architecture opens doors for:

1. **Other LMS Platforms**: Extend to Blackboard, Moodle, etc.
2. **Browser-Based MCP Servers**: Any web app could embed MCP servers
3. **Live Data Integration**: MCP tools with access to active browser sessions
4. **Zero-Config AI Assistants**: AI that works with what you're already viewing

## Conclusion

CanvasFlow demonstrates that **MCP servers don't have to be standalone processes**. By embedding the MCP server directly in a Chrome extension, we achieve:

- ✅ Easier installation and setup
- ✅ Direct access to browser session data
- ✅ No API authentication required
- ✅ Real-time contextual awareness
- ✅ Privacy-first architecture

This represents a new paradigm for MCP server implementation and browser-based AI assistants.

---

**Technical Specifications:**
- MCP Protocol: 2024-11-05
- Chrome Extension: Manifest V3
- Native Messaging: Chrome Native Messaging API
- Communication: HTTP (localhost:8765) + STDIO
- Data Format: JSON-RPC 2.0

**Open Source:**
- Repository: https://github.com/jonasneves/canvasflow
- License: MIT
- Contributions welcome!
