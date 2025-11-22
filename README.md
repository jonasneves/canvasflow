# CanvasFlow

[![GitHub release](https://img.shields.io/badge/release-nightly-blue)](https://github.com/jonasneves/canvasflow/releases/tag/nightly)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub issues](https://img.shields.io/github/issues/jonasneves/canvasflow)](https://github.com/jonasneves/canvasflow/issues)
[![GitHub stars](https://img.shields.io/github/stars/jonasneves/canvasflow)](https://github.com/jonasneves/canvasflow/stargazers)

**Stay in the flow - master your deadlines!**

CanvasFlow is a Chrome extension that enhances your Canvas LMS experience with AI-powered insights and intelligent schedule planning.

## Features

- **Direct Canvas Integration**: View assignments instantly - no Canvas API key or authentication required
- **AI-Powered Insights**: AI analyzes your workload and provides strategic recommendations via GitHub Models
- **Structured Outputs**: Consistent, reliable AI responses using tool-based approach
- **Weekly Schedule Generation**: AI-generated 7-day study plans optimized for your deadlines and workload
- **Smart Filtering**: Filter assignments by time range, course, and completion status

## Project Structure

```
canvasflow/
├── extension/          Chrome extension files
├── scripts/            Build and release scripts
└── README.md           This file
```

## Installation

### Chrome Extension

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the `extension/` directory
5. The CanvasFlow icon will appear in your extensions toolbar

### Configuration

1. Click the CanvasFlow icon while on any Canvas LMS page
2. Open Settings (gear icon in the sidepanel)
3. Configure your Canvas instance URL if not auto-detected
4. Adjust assignment time range and auto-refresh settings as needed

## Usage

### Dashboard View

Click the CanvasFlow icon to open the sidepanel while browsing Canvas:

- **Assignment Overview**: Direct data extraction from Canvas (no API required)
- **Smart Filters**: Filter by time range, course, or completion status
- **One-Click Refresh**: Instantly sync with the current Canvas page

### AI Insights Tab

Generate intelligent analysis powered by GitHub Models AI:

- **Structured Outputs**: Guaranteed consistent JSON responses with priority rankings
- **Actionable Recommendations**: Strategic advice for tackling your workload
- **Priority Detection**: Automatic urgency scoring based on deadlines and workload
- **Tool-Based Approach**: Forced tool calling ensures reliable JSON structure

### Weekly Schedule

AI-generated 7-day study plan:

- **Time-Blocked Schedule**: Optimized daily task distribution
- **Strategic Recommendations**: Week-level planning and focus areas
- **Workload Balancing**: Even distribution based on assignment complexity

## Privacy

CanvasFlow processes your Canvas data locally in your browser and only sends assignment information to GitHub Models AI when you explicitly request AI insights or schedule generation. Your GitHub token is stored locally in Chrome's secure storage.

- No data is collected or sent to external servers (except GitHub Models AI when requested)
- Canvas data remains in your browser's local storage
- Token is stored securely using Chrome's storage API

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Built With

This project was built with assistance from [Claude Code](https://claude.ai/code) - an AI-powered development environment that helped with architecture design, implementation, testing, and documentation.

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or feature requests, please visit the GitHub repository.
