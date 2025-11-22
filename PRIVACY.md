# Privacy Policy

**Last Updated:** November 17, 2024

## Overview

CanvasFlow is a Chrome extension that enhances your Canvas LMS experience with AI-powered insights. This privacy policy explains how we handle your data.

## Data Collection and Storage

### Local Data Storage

All Canvas data accessed by CanvasFlow is stored locally in your browser using Chrome's storage API. This includes:

- Course information (names, codes, term data)
- Assignment details (titles, due dates, submission status, grades)
- Calendar events
- User preferences and settings

**This data never leaves your device except as described below.**

### Canvas LMS Access

CanvasFlow accesses your Canvas LMS data through the Canvas API using your existing browser session. We do not collect, store, or transmit your Canvas credentials. All Canvas API requests are made directly from your browser to your institution's Canvas instance.

## Third-Party Services

### GitHub Models API (Optional)

When you explicitly request AI-powered insights or schedule generation:

- Assignment data (titles, due dates, courses, points) is sent to GitHub Models API
- Your GitHub token is stored locally in Chrome's secure storage
- We do not collect, store, or have access to your token or the data sent to GitHub Models
- GitHub Models API usage is subject to [GitHub's Privacy Policy](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement)

**AI features are entirely optional.** You can use CanvasFlow without providing a token or generating AI insights.

## Data We Do NOT Collect

CanvasFlow does not:

- Collect personal information
- Track your browsing activity
- Send data to analytics services
- Share data with third parties (except GitHub Models API when you request AI features)
- Use cookies or tracking technologies
- Sell or monetize your data

## Data Security

- All Canvas data is stored locally using Chrome's secure storage API
- Tokens are stored using Chrome's encrypted storage
- Communication between components uses secure local protocols
- No data is transmitted over the internet except direct Canvas API calls and optional GitHub Models API requests

## User Control

You have full control over your data:

- All data is stored locally and can be cleared by removing the extension
- AI features are opt-in and require explicit user action
- You can disconnect GitHub Models API access at any time by removing your token
- No data persists on external servers after the extension is removed

## Data Retention

- Canvas data is cached locally until you refresh or remove the extension
- Generated AI insights are stored locally until manually cleared or the extension is removed
- No data is retained on external servers

## Open Source

CanvasFlow is open source. You can review the complete source code at:
https://github.com/jonasneves/canvasflow

## Changes to This Policy

We may update this privacy policy to reflect changes in the extension or applicable regulations. Significant changes will be communicated through:

- Updates to this document with revision date
- Release notes on the GitHub repository

## Contact

For privacy-related questions or concerns:

- Open an issue on GitHub: https://github.com/jonasneves/canvasflow/issues
- Contact: Jonas Neves via the GitHub repository

## Compliance

This extension is designed to respect your privacy and comply with applicable data protection regulations. If you have concerns about how your institution's Canvas data is handled, please consult your institution's privacy policies and Canvas terms of service.

---

By using CanvasFlow, you acknowledge that you have read and understood this privacy policy.
