/**
 * Shared Constants
 * Single source of truth for constants used across the extension.
 */

window.CanvasFlowConstants = window.CanvasFlowConstants || {};

// Canvas URL patterns for detection
window.CanvasFlowConstants.CANVAS_URL_PATTERNS = [
  /^https?:\/\/canvas\.[^\/]*\.edu/i,
  /^https?:\/\/[^\/]*\.edu\/.*canvas/i,
  /^https?:\/\/[^\/]*\.instructure\.com/i,
  /^https?:\/\/[^\/]*\.canvaslms\.com/i
];

// Storage keys
window.CanvasFlowConstants.STORAGE_KEYS = {
  CANVAS_DATA_CACHE: 'cachedCanvasData',
  CANVAS_URL: 'canvasUrl',
  DETECTED_URLS: 'detectedCanvasUrls',
  HIDDEN_COURSE_IDS: 'hiddenCourseIds',
  HIDE_ENDED_TERMS: 'hideEndedTerms',
  ASSIGNMENT_WEEKS_BEFORE: 'assignmentWeeksBefore',
  ASSIGNMENT_WEEKS_AFTER: 'assignmentWeeksAfter',
  AUTO_REFRESH_MINUTES: 'autoRefreshMinutes',
  NOTIFICATIONS_ENABLED: 'notificationsEnabled',
  NOTIFICATION_FREQUENCY: 'notificationFrequency',
  QUIET_HOURS_START: 'quietHoursStart',
  QUIET_HOURS_END: 'quietHoursEnd',
  SHOW_GRADES: 'showGrades',
  FOCUS_MODE_ENABLED: 'focusModeEnabled',
  SAVED_INSIGHTS: 'savedInsights',
  INSIGHTS_TIMESTAMP: 'insightsTimestamp',
  DASHBOARD_INSIGHTS: 'dashboardInsights',
  DASHBOARD_INSIGHTS_TIMESTAMP: 'dashboardInsightsTimestamp',
  AI_METADATA: 'ai_metadata',
  LOCAL_COMPLETED_IDS: 'localCompletedIds'
};

// Message types for chrome.runtime.sendMessage
window.CanvasFlowConstants.MESSAGE_TYPES = {
  GET_CANVAS_DATA: 'GET_CANVAS_DATA',
  REFRESH_DATA: 'REFRESH_DATA',
  CANVAS_DATA: 'CANVAS_DATA',
  FIND_CANVAS_TAB: 'FIND_CANVAS_TAB',
  OPEN_CANVAS_TAB: 'OPEN_CANVAS_TAB',
  OPEN_SIDEPANEL: 'OPEN_SIDEPANEL',
  UPDATE_NOTIFICATION_SETTINGS: 'UPDATE_NOTIFICATION_SETTINGS',
  TEST_NOTIFICATION: 'TEST_NOTIFICATION',
  FETCH_COURSES: 'FETCH_COURSES',
  FETCH_ASSIGNMENTS: 'FETCH_ASSIGNMENTS',
  FETCH_ALL_ASSIGNMENTS: 'FETCH_ALL_ASSIGNMENTS',
  FETCH_ASSIGNMENT_DETAILS: 'FETCH_ASSIGNMENT_DETAILS',
  FETCH_CALENDAR_EVENTS: 'FETCH_CALENDAR_EVENTS',
  FETCH_USER_SUBMISSIONS: 'FETCH_USER_SUBMISSIONS',
  FETCH_COURSE_MODULES: 'FETCH_COURSE_MODULES',
  FETCH_UPCOMING_EVENTS: 'FETCH_UPCOMING_EVENTS',
  FETCH_COURSE_ANALYTICS: 'FETCH_COURSE_ANALYTICS',
  FETCH_USER_PROFILE: 'FETCH_USER_PROFILE',
  FETCH_ALL_DATA: 'FETCH_ALL_DATA'
};

// Default settings
window.CanvasFlowConstants.DEFAULTS = {
  WEEKS_BEFORE: 0,
  WEEKS_AFTER: 2,
  AUTO_REFRESH_MINUTES: 30,
  NOTIFICATION_FREQUENCY: 'balanced',
  QUIET_HOURS_START: '22:00',
  QUIET_HOURS_END: '08:00'
};

// API base path for Canvas
window.CanvasFlowConstants.API_BASE = '/api/v1';
