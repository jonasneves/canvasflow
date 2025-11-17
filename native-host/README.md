# CanvasFlow Native Host

Native messaging host for CanvasFlow that enables MCP (Model Context Protocol) integration with Claude Desktop.

## Overview

This optional component allows Claude Desktop to access your Canvas assignment data through the CanvasFlow Chrome extension. When installed, you can ask Claude about your courses, assignments, and deadlines directly from Claude Desktop.

## Features

- Bidirectional communication between Chrome extension and Claude Desktop
- MCP server implementation for Canvas data access
- Secure native messaging protocol
- Real-time data synchronization

## Architecture

The native host acts as a bridge:

```
Claude Desktop <-> Native Host <-> Chrome Extension <-> Canvas LMS
     (MCP)          (Node.js)      (Native Messaging)
```

## Installation

### Prerequisites

- Node.js 14 or higher
- CanvasFlow Chrome extension installed
- Claude Desktop application

### Setup Steps

1. Install dependencies:
   ```bash
   cd native-host
   npm install
   ```

2. Install the native messaging host manifest:

   **Windows:**
   ```bash
   # Run as Administrator
   reg add "HKCU\Software\Google\Chrome\NativeMessagingHosts\canvas-mcp-server" /ve /t REG_SZ /d "%CD%\manifest.json" /f
   ```

   **macOS/Linux:**
   ```bash
   mkdir -p ~/.config/google-chrome/NativeMessagingHosts
   cp manifest.json ~/.config/google-chrome/NativeMessagingHosts/canvas-mcp-server.json

   # Update the path in the manifest to point to host.js
   # Edit the manifest.json to use absolute paths
   ```

3. Configure Claude Desktop to use the MCP server (see Claude Desktop MCP documentation)

## File Structure

```
native-host/
├── host.js              Native messaging host implementation
├── manifest.json        Native host configuration
├── package.json         Node.js dependencies
└── README.md           This file
```

## Configuration

### manifest.json

Defines the native messaging host configuration:
- Host name: `canvas-mcp-server`
- Entry point: `host.js`
- Allowed origins: CanvasFlow extension ID

### MCP Server

The host implements the Model Context Protocol to expose Canvas data:
- `list_courses`: Get all Canvas courses
- `list_assignments`: Get assignments with filters
- `get_course`: Get detailed course information
- `get_assignment`: Get assignment details

## Development

### Running Locally

```bash
node host.js
```

The host communicates via stdin/stdout using Chrome's native messaging protocol.

### Message Format

Messages are sent as length-prefixed JSON:
1. 4 bytes: message length (uint32, native byte order)
2. N bytes: JSON message

Example:
```json
{
  "action": "getAssignments",
  "timeRange": {
    "weeksBefore": 1,
    "weeksAfter": 1
  }
}
```

### Testing

You can test the native host independently:
```bash
echo '{"action":"ping"}' | node host.js
```

## Security

- Host only accepts connections from the CanvasFlow extension
- All communication is local (no network exposure)
- Canvas data is never stored by the native host
- MCP server runs in isolated process

## Troubleshooting

### Host Not Connecting

1. Verify manifest.json path is absolute
2. Check Chrome's native messaging permissions
3. Ensure Node.js is in system PATH
4. Check Chrome DevTools console for errors

### MCP Server Issues

1. Verify Claude Desktop configuration
2. Check native host logs
3. Ensure extension is running and has Canvas data
4. Test native messaging independently

## Distribution

### GitHub Releases

Automated builds are created via GitHub Actions:
- Windows: Executable with Node.js bundled
- macOS: Universal binary
- Linux: AppImage or tarball

Users can download platform-specific packages from the releases page.

### Manual Installation

For manual installation, users need:
1. Node.js runtime installed
2. Clone or download this directory
3. Run `npm install`
4. Configure native messaging manifest with absolute paths
5. Configure Claude Desktop MCP settings

## Known Limitations

- Requires Chrome extension to be running
- Data synchronization depends on extension refresh
- Native host must be installed separately (not bundled with extension)
- Platform-specific installation steps

## Future Enhancements

- Auto-installer script for all platforms
- Standalone executable (no Node.js required)
- Background sync service
- Multiple browser support (Firefox, Edge)

## Support

For issues or questions, please refer to the main repository.
