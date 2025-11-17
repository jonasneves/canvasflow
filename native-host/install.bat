@echo off
REM CanvasFlow Native Host Installation Script for Windows

echo CanvasFlow Native Host Installer
echo =================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed
    echo Please install Node.js 14 or higher from https://nodejs.org/
    pause
    exit /b 1
)

node -v
echo.

REM Set installation directory
set "INSTALL_DIR=%APPDATA%\CanvasFlow\native-host"
echo Installation directory: %INSTALL_DIR%
echo.

REM Create installation directory
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

REM Copy files
echo Copying files...
copy /Y host.js "%INSTALL_DIR%\"
copy /Y manifest.json "%INSTALL_DIR%\"
copy /Y package.json "%INSTALL_DIR%\"
copy /Y package-lock.json "%INSTALL_DIR%\"
copy /Y README.md "%INSTALL_DIR%\"

REM Install dependencies
echo Installing dependencies...
cd /d "%INSTALL_DIR%"
call npm install --production

REM Configure native messaging
echo Configuring native messaging...
set "NATIVE_MANIFEST_DIR=%LOCALAPPDATA%\Google\Chrome\User Data\NativeMessagingHosts"
if not exist "%NATIVE_MANIFEST_DIR%" mkdir "%NATIVE_MANIFEST_DIR%"

REM Create manifest with absolute path (escape backslashes for JSON)
set "HOST_PATH=%INSTALL_DIR%\host.js"
set "HOST_PATH=%HOST_PATH:\=\\%"

(
echo {
echo   "name": "com.canvasflow.host",
echo   "description": "CanvasFlow Native Messaging Host",
echo   "path": "%HOST_PATH%",
echo   "type": "stdio",
echo   "allowed_origins": [
echo     "chrome-extension://EXTENSION_ID/"
echo   ]
echo }
) > "%NATIVE_MANIFEST_DIR%\com.canvasflow.host.json"

echo Installed to: %NATIVE_MANIFEST_DIR%\com.canvasflow.host.json
echo.
echo Installation complete!
echo.
echo Next steps:
echo 1. Note your CanvasFlow extension ID from chrome://extensions/
echo 2. Edit the manifest file and replace EXTENSION_ID with your actual extension ID
echo 3. Restart Chrome
echo.
echo Manifest location:
echo   %NATIVE_MANIFEST_DIR%\com.canvasflow.host.json
echo.
pause
