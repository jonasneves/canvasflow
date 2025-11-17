# Release Process

## Creating a New Release

### 1. Update Version Numbers

Update version in the following files:
- `extension/manifest.json`
- `native-host/package.json`

### 2. Create Git Tag

```bash
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### 3. Automated Release

The GitHub Actions workflow will automatically:
1. Package both the Claude Desktop MCP server (.dxt) and Chrome extension native messaging setup (.zip)
2. Create a GitHub release
3. Attach both packages as downloadable assets:
   - `canvasflow-native-host.dxt` - Claude Desktop drag-and-drop
   - `canvasflow-chrome-extension.zip` - Chrome extension native messaging

### 4. Release Assets

Each release includes:
- `canvasflow-native-host.dxt` - Claude Desktop MCP server (drag-and-drop installation)
  - `host.js` - MCP server
  - `manifest.json` - MCP server metadata
  - `package.json` - Node.js dependencies
  - `package-lock.json` - Locked dependencies

- `canvasflow-chrome-extension.zip` - Chrome extension native messaging setup
  - `host.js` - Native messaging server
  - `manifest.json` - Chrome native messaging configuration
  - `package.json` - Node.js dependencies
  - `package-lock.json` - Locked dependencies
  - `install.sh` - Automated installer for macOS/Linux
  - `install.bat` - Automated installer for Windows
  - `README.md` - Installation instructions

### 5. Extension Update

After creating a release:

1. Update extension's MCP Server instructions to reference the new release:
   - Link to: `https://github.com/jonasneves/canvasflow/releases/latest`
   - Or specific version: `https://github.com/jonasneves/canvasflow/releases/tag/v1.0.0`

2. Test the download and installation process

## Manual Workflow Trigger

To create a development build without a tag:

1. Go to GitHub Actions tab
2. Select "Release Native Host" workflow
3. Click "Run workflow"
4. Artifact will be available for 30 days

## Download Links

Use these links in documentation:

**Claude Desktop MCP Server (.dxt):**
```
https://github.com/jonasneves/canvasflow/releases/download/nightly/canvasflow-native-host.dxt
```

**Chrome Extension Configuration (.zip):**
```
https://github.com/jonasneves/canvasflow/releases/download/nightly/canvasflow-chrome-extension.zip
```

**Specific version examples:**
```
https://github.com/jonasneves/canvasflow/releases/download/v1.0.0/canvasflow-native-host.dxt
https://github.com/jonasneves/canvasflow/releases/download/v1.0.0/canvasflow-chrome-extension.zip
```

**Releases page:**
```
https://github.com/jonasneves/canvasflow/releases
```

## Extension MCP Server Instructions

Update the extension's MCP Server tab message to include:

```
Installation:
1. Download: https://github.com/jonasneves/canvasflow/releases/download/nightly/canvasflow-native-host.dxt
2. Open Claude Desktop → Extensions
3. Drag the .dxt file into the window

Test the Connection:
- Click "Refresh Canvas Data" in the extension
- Restart Chrome and Claude Desktop
- Ask Claude: "What are my Canvas courses?"

Note: Chrome extension configuration available at https://github.com/jonasneves/canvasflow/releases/download/nightly/canvasflow-chrome-extension.zip
```

## Versioning

Follow semantic versioning (semver):
- `v1.0.0` - Major release
- `v1.1.0` - Minor release (new features)
- `v1.0.1` - Patch release (bug fixes)

## Testing Before Release

1. Test package creation locally:
   ```bash
   cd native-host

   # Test Chrome extension package
   zip -r test-chrome.zip host.js manifest.json package.json package-lock.json install.sh install.bat README.md

   # Test Claude Desktop package
   zip -r test-claude.dxt host.js manifest.json package.json package-lock.json
   ```

2. Extract and test installation on each platform
   - Test .dxt drag-and-drop in Claude Desktop
   - Test install scripts for Chrome extension integration

3. Verify connections work
   - Claude Desktop MCP server can query Canvas data
   - Chrome extension native messaging works

4. Create tag and push when ready
