/**
 * Chrome Storage Manager
 * Typed wrapper for chrome.storage.local operations.
 */

window.CanvasFlowStorage = window.CanvasFlowStorage || {};

const KEYS = {
  CANVAS_DATA_CACHE: 'cachedCanvasData',
  CANVAS_URL: 'canvasUrl',
  DETECTED_URLS: 'detectedCanvasUrls',
  HIDDEN_COURSE_IDS: 'hiddenCourseIds',
  HIDE_ENDED_TERMS: 'hideEndedTerms',
  WEEKS_BEFORE: 'assignmentWeeksBefore',
  WEEKS_AFTER: 'assignmentWeeksAfter',
  AUTO_REFRESH: 'autoRefreshMinutes',
  NOTIFICATIONS_ENABLED: 'notificationsEnabled',
  NOTIFICATION_FREQUENCY: 'notificationFrequency',
  QUIET_HOURS_START: 'quietHoursStart',
  QUIET_HOURS_END: 'quietHoursEnd',
  SHOW_GRADES: 'showGrades',
  FOCUS_MODE: 'focusModeEnabled',
  SAVED_INSIGHTS: 'savedInsights',
  INSIGHTS_TIMESTAMP: 'insightsTimestamp',
  DASHBOARD_INSIGHTS: 'dashboardInsights',
  DASHBOARD_TIMESTAMP: 'dashboardInsightsTimestamp',
  AI_METADATA: 'ai_metadata',
  LOCAL_COMPLETED: 'localCompletedIds'
};

/**
 * Get value from storage
 * @param {string|Array} keys - Key(s) to retrieve
 * @returns {Promise<Object>} Storage result
 */
window.CanvasFlowStorage.get = function(keys) {
  return chrome.storage.local.get(keys);
};

/**
 * Set value in storage
 * @param {Object} data - Data to store
 * @returns {Promise<void>}
 */
window.CanvasFlowStorage.set = function(data) {
  return chrome.storage.local.set(data);
};

/**
 * Get Canvas URL
 * @returns {Promise<string|null>}
 */
window.CanvasFlowStorage.getCanvasUrl = async function() {
  const result = await this.get([KEYS.CANVAS_URL]);
  return result[KEYS.CANVAS_URL] || null;
};

/**
 * Set Canvas URL
 * @param {string} url
 * @returns {Promise<void>}
 */
window.CanvasFlowStorage.setCanvasUrl = function(url) {
  return this.set({ [KEYS.CANVAS_URL]: url });
};

/**
 * Get time range settings
 * @returns {Promise<Object>}
 */
window.CanvasFlowStorage.getTimeRange = async function() {
  const result = await this.get([KEYS.WEEKS_BEFORE, KEYS.WEEKS_AFTER]);
  return {
    weeksBefore: result[KEYS.WEEKS_BEFORE] ?? 0,
    weeksAfter: result[KEYS.WEEKS_AFTER] ?? 2
  };
};

/**
 * Set time range settings
 * @param {number} weeksBefore
 * @param {number} weeksAfter
 * @returns {Promise<void>}
 */
window.CanvasFlowStorage.setTimeRange = function(weeksBefore, weeksAfter) {
  return this.set({
    [KEYS.WEEKS_BEFORE]: weeksBefore,
    [KEYS.WEEKS_AFTER]: weeksAfter
  });
};

/**
 * Get hidden course IDs
 * @returns {Promise<Array>}
 */
window.CanvasFlowStorage.getHiddenCourseIds = async function() {
  const result = await this.get([KEYS.HIDDEN_COURSE_IDS]);
  return result[KEYS.HIDDEN_COURSE_IDS] || [];
};

/**
 * Set hidden course IDs
 * @param {Array} ids
 * @returns {Promise<void>}
 */
window.CanvasFlowStorage.setHiddenCourseIds = function(ids) {
  return this.set({ [KEYS.HIDDEN_COURSE_IDS]: ids });
};

/**
 * Get notification settings
 * @returns {Promise<Object>}
 */
window.CanvasFlowStorage.getNotificationSettings = async function() {
  const result = await this.get([
    KEYS.NOTIFICATIONS_ENABLED,
    KEYS.NOTIFICATION_FREQUENCY,
    KEYS.QUIET_HOURS_START,
    KEYS.QUIET_HOURS_END
  ]);
  return {
    enabled: result[KEYS.NOTIFICATIONS_ENABLED] || false,
    frequency: result[KEYS.NOTIFICATION_FREQUENCY] || 'balanced',
    quietHoursStart: result[KEYS.QUIET_HOURS_START] || '22:00',
    quietHoursEnd: result[KEYS.QUIET_HOURS_END] || '08:00'
  };
};

/**
 * Get saved insights
 * @returns {Promise<Object>}
 */
window.CanvasFlowStorage.getSavedInsights = async function() {
  const result = await this.get([KEYS.SAVED_INSIGHTS, KEYS.INSIGHTS_TIMESTAMP]);
  return {
    insights: result[KEYS.SAVED_INSIGHTS] || null,
    timestamp: result[KEYS.INSIGHTS_TIMESTAMP] || null
  };
};

/**
 * Save insights
 * @param {string} insights - HTML content
 * @param {number} timestamp
 * @returns {Promise<void>}
 */
window.CanvasFlowStorage.saveInsights = function(insights, timestamp) {
  return this.set({
    [KEYS.SAVED_INSIGHTS]: insights,
    [KEYS.INSIGHTS_TIMESTAMP]: timestamp
  });
};

/**
 * Get dashboard schedule
 * @returns {Promise<Object>}
 */
window.CanvasFlowStorage.getDashboardSchedule = async function() {
  const result = await this.get([KEYS.DASHBOARD_INSIGHTS, KEYS.DASHBOARD_TIMESTAMP]);
  return {
    schedule: result[KEYS.DASHBOARD_INSIGHTS] || null,
    timestamp: result[KEYS.DASHBOARD_TIMESTAMP] || null
  };
};

/**
 * Save dashboard schedule
 * @param {string} schedule - HTML content
 * @param {number} timestamp
 * @returns {Promise<void>}
 */
window.CanvasFlowStorage.saveDashboardSchedule = function(schedule, timestamp) {
  return this.set({
    [KEYS.DASHBOARD_INSIGHTS]: schedule,
    [KEYS.DASHBOARD_TIMESTAMP]: timestamp
  });
};

/**
 * Get AI metadata
 * @returns {Promise<Object>}
 */
window.CanvasFlowStorage.getAIMetadata = async function() {
  const result = await this.get([KEYS.AI_METADATA]);
  return result[KEYS.AI_METADATA] || {};
};

/**
 * Save AI metadata
 * @param {Object} metadata
 * @returns {Promise<void>}
 */
window.CanvasFlowStorage.saveAIMetadata = function(metadata) {
  return this.set({ [KEYS.AI_METADATA]: metadata });
};

/**
 * Get cached Canvas data
 * @returns {Promise<Object|null>}
 */
window.CanvasFlowStorage.getCachedCanvasData = async function() {
  const result = await this.get([KEYS.CANVAS_DATA_CACHE]);
  return result[KEYS.CANVAS_DATA_CACHE] || null;
};

/**
 * Save cached Canvas data
 * @param {Object} data
 * @returns {Promise<void>}
 */
window.CanvasFlowStorage.saveCachedCanvasData = function(data) {
  return this.set({
    [KEYS.CANVAS_DATA_CACHE]: {
      ...data,
      cacheTimestamp: new Date().toISOString()
    }
  });
};

/**
 * Get local completed assignment IDs (uses sync storage)
 * @returns {Promise<Array>}
 */
window.CanvasFlowStorage.getLocalCompletedIds = async function() {
  const result = await chrome.storage.sync.get([KEYS.LOCAL_COMPLETED]);
  return result[KEYS.LOCAL_COMPLETED] || [];
};

/**
 * Save local completed assignment IDs (uses sync storage)
 * @param {Array} ids
 * @returns {Promise<void>}
 */
window.CanvasFlowStorage.saveLocalCompletedIds = function(ids) {
  return chrome.storage.sync.set({ [KEYS.LOCAL_COMPLETED]: ids });
};

/**
 * Get all settings for initialization
 * @returns {Promise<Object>}
 */
window.CanvasFlowStorage.getAllSettings = function() {
  return this.get([
    KEYS.CANVAS_URL,
    KEYS.WEEKS_BEFORE,
    KEYS.WEEKS_AFTER,
    KEYS.AUTO_REFRESH,
    KEYS.NOTIFICATIONS_ENABLED,
    KEYS.NOTIFICATION_FREQUENCY,
    KEYS.QUIET_HOURS_START,
    KEYS.QUIET_HOURS_END,
    KEYS.HIDDEN_COURSE_IDS,
    KEYS.HIDE_ENDED_TERMS,
    KEYS.FOCUS_MODE,
    KEYS.SHOW_GRADES,
    KEYS.AI_METADATA,
    'openSettingsOnLoad'
  ]);
};
