#!/bin/bash
# CanvasFlow Native Host Installation Script
# Supports macOS and Linux

set -e

echo "CanvasFlow Native Host Installer"
echo "================================="
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=linux;;
    Darwin*)    PLATFORM=macos;;
    *)          echo "Unsupported OS: ${OS}"; exit 1;;
esac

echo "Detected platform: ${PLATFORM}"
echo ""

# Get installation directory
INSTALL_DIR="${HOME}/.canvasflow/native-host"
echo "Installation directory: ${INSTALL_DIR}"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js 14 or higher from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v)
echo "Node.js version: ${NODE_VERSION}"
echo ""

# Create installation directory
mkdir -p "${INSTALL_DIR}"

# Copy files
echo "Copying files..."
cp host.js "${INSTALL_DIR}/"
cp manifest.json "${INSTALL_DIR}/"
cp package.json "${INSTALL_DIR}/"
cp package-lock.json "${INSTALL_DIR}/"
cp README.md "${INSTALL_DIR}/"

# Install dependencies
echo "Installing dependencies..."
cd "${INSTALL_DIR}"
npm install --production

# Update manifest with absolute path
echo "Configuring native messaging..."
MANIFEST_FILE="${INSTALL_DIR}/manifest.json"

# Platform-specific manifest installation
if [ "${PLATFORM}" = "macos" ]; then
    NATIVE_MANIFEST_DIR="${HOME}/Library/Application Support/Google/Chrome/NativeMessagingHosts"
    mkdir -p "${NATIVE_MANIFEST_DIR}"

    # Create manifest with absolute path
    cat > "${NATIVE_MANIFEST_DIR}/com.canvasflow.host.json" <<EOF
{
  "name": "com.canvasflow.host",
  "description": "CanvasFlow Native Messaging Host",
  "path": "${INSTALL_DIR}/host.js",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://EXTENSION_ID/"
  ]
}
EOF

    echo "Installed to: ${NATIVE_MANIFEST_DIR}/com.canvasflow.host.json"
elif [ "${PLATFORM}" = "linux" ]; then
    NATIVE_MANIFEST_DIR="${HOME}/.config/google-chrome/NativeMessagingHosts"
    mkdir -p "${NATIVE_MANIFEST_DIR}"

    # Create manifest with absolute path
    cat > "${NATIVE_MANIFEST_DIR}/com.canvasflow.host.json" <<EOF
{
  "name": "com.canvasflow.host",
  "description": "CanvasFlow Native Messaging Host",
  "path": "${INSTALL_DIR}/host.js",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://EXTENSION_ID/"
  ]
}
EOF

    echo "Installed to: ${NATIVE_MANIFEST_DIR}/com.canvasflow.host.json"
fi

echo ""
echo "Installation complete!"
echo ""
echo "Next steps:"
echo "1. Note your CanvasFlow extension ID from chrome://extensions/"
echo "2. Edit the manifest file and replace EXTENSION_ID with your actual extension ID"
echo "3. Restart Chrome"
echo ""
echo "Manifest location:"
if [ "${PLATFORM}" = "macos" ]; then
    echo "  ${HOME}/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.canvasflow.host.json"
else
    echo "  ${HOME}/.config/google-chrome/NativeMessagingHosts/com.canvasflow.host.json"
fi
