/**
 * Chrome Messaging Wrapper
 * Typed wrapper for chrome.runtime.sendMessage operations.
 */

window.CanvasFlowMessaging = window.CanvasFlowMessaging || {};

/**
 * Send message and return promise
 * @param {Object} message - Message object with type property
 * @returns {Promise<any>} Response from background script
 */
window.CanvasFlowMessaging.send = function(message) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, resolve);
  });
};

/**
 * Get Canvas data from background script
 * @returns {Promise<Object>} Canvas data response
 */
window.CanvasFlowMessaging.getCanvasData = function() {
  return this.send({ type: 'GET_CANVAS_DATA' });
};

/**
 * Refresh Canvas data
 * @returns {Promise<Object>} Refresh response
 */
window.CanvasFlowMessaging.refreshData = function() {
  return this.send({ type: 'REFRESH_DATA' });
};

/**
 * Find existing Canvas tab
 * @returns {Promise<Object>} Tab info response
 */
window.CanvasFlowMessaging.findCanvasTab = function() {
  return this.send({ type: 'FIND_CANVAS_TAB' });
};

/**
 * Open Canvas tab and sync data
 * @returns {Promise<Object>} Open tab response
 */
window.CanvasFlowMessaging.openCanvasTab = function() {
  return this.send({ type: 'OPEN_CANVAS_TAB' });
};

/**
 * Open sidepanel
 * @returns {Promise<Object>} Response
 */
window.CanvasFlowMessaging.openSidepanel = function() {
  return this.send({ type: 'OPEN_SIDEPANEL' });
};

/**
 * Update notification settings
 * @param {boolean} enabled - Whether notifications are enabled
 * @returns {Promise<Object>} Response
 */
window.CanvasFlowMessaging.updateNotificationSettings = function(enabled) {
  return this.send({ type: 'UPDATE_NOTIFICATION_SETTINGS', enabled });
};

/**
 * Send test notification
 * @returns {Promise<Object>} Response
 */
window.CanvasFlowMessaging.testNotification = function() {
  return this.send({ type: 'TEST_NOTIFICATION' });
};

/**
 * Check if Canvas tab is available
 * @returns {Promise<boolean>} True if Canvas tab exists
 */
window.CanvasFlowMessaging.hasCanvasTab = async function() {
  const response = await this.findCanvasTab();
  return response?.success && response?.hasTab;
};
