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
1. Package the native host with install scripts
2. Create a GitHub release
3. Attach `canvasflow-native-host.zip` as a downloadable asset

### 4. Release Assets

Each release includes:
- `canvasflow-native-host.zip` - Native messaging host package
  - `host.js` - Native messaging server
  - `manifest.json` - Chrome native messaging configuration
  - `package.json` - Node.js dependencies
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

**Nightly build (latest from main):**
```
https://github.com/jonasneves/canvasflow/releases/download/nightly/canvasflow-native-host.zip
```

**Specific version:**
```
https://github.com/jonasneves/canvasflow/releases/download/v1.0.0/canvasflow-native-host.zip
```

**Latest stable release (when versioned releases exist):**
```
https://github.com/jonasneves/canvasflow/releases/latest/download/canvasflow-native-host.zip
```

**Releases page:**
```
https://github.com/jonasneves/canvasflow/releases
```

## Extension MCP Server Instructions

Update the extension's MCP Server tab message to include:

```
To connect Claude Desktop to your Canvas data:

1. Download the native host:
   https://github.com/jonasneves/canvasflow/releases/download/nightly/canvasflow-native-host.zip

2. Extract and run the installer:
   - macOS/Linux: ./install.sh
   - Windows: install.bat

3. Note your extension ID and update the manifest
4. Restart Chrome

Full instructions: https://github.com/jonasneves/canvasflow/blob/main/native-host/README.md
```

## Versioning

Follow semantic versioning (semver):
- `v1.0.0` - Major release
- `v1.1.0` - Minor release (new features)
- `v1.0.1` - Patch release (bug fixes)

## Testing Before Release

1. Test native host package creation locally:
   ```bash
   cd native-host
   zip -r test-package.zip host.js manifest.json package.json package-lock.json install.sh install.bat README.md
   ```

2. Extract and test installation on each platform

3. Verify native messaging connection works

4. Create tag and push when ready
