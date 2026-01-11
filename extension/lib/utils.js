/**
 * Shared Utility Functions
 * Common helpers used across multiple files in the extension.
 */

window.CanvasFlowUtils = window.CanvasFlowUtils || {};

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped HTML
 */
window.CanvasFlowUtils.escapeHtml = function(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Format timestamp as relative time string
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} Formatted time ago string
 */
window.CanvasFlowUtils.formatTimeAgo = function(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
};

/**
 * Create inline SVG icon (Lucide-style)
 * @param {string} iconName - Name of the icon
 * @param {number} size - Icon size in pixels
 * @param {string} color - Icon color
 * @returns {string} SVG HTML string
 */
window.CanvasFlowUtils.createLucideIcon = function(iconName, size = 16, color = 'currentColor') {
  const icons = {
    'activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
    'chevron-down': '<polyline points="6 9 12 15 18 9"/>',
    'layers': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'
  };
  const paths = icons[iconName] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">${paths}</svg>`;
};

/**
 * Check if a URL is a valid Canvas instance
 * @param {string} url - URL to check
 * @returns {boolean} True if valid Canvas URL
 */
window.CanvasFlowUtils.isCanvasUrl = function(url) {
  if (!url) return false;
  const patterns = window.CanvasFlowConstants?.CANVAS_URL_PATTERNS || [
    /^https?:\/\/canvas\.[^\/]*\.edu/i,
    /^https?:\/\/[^\/]*\.edu\/.*canvas/i,
    /^https?:\/\/[^\/]*\.instructure\.com/i,
    /^https?:\/\/[^\/]*\.canvaslms\.com/i
  ];
  return patterns.some(pattern => pattern.test(url));
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL format
 */
window.CanvasFlowUtils.isValidCanvasUrl = function(url) {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return false;
    }
    return !!parsed.hostname;
  } catch (e) {
    return false;
  }
};

/**
 * Check if timestamp is from today
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {boolean} True if timestamp is from today
 */
window.CanvasFlowUtils.isFromToday = function(timestamp) {
  if (!timestamp) return false;
  const today = new Date();
  const date = new Date(timestamp);
  return date.toDateString() === today.toDateString();
};

/**
 * Get time range boundaries for filtering assignments
 * @param {Object} timeRange - Object with weeksBefore and weeksAfter
 * @returns {Object} Boundaries object
 */
window.CanvasFlowUtils.getTimeRangeBounds = function(timeRange) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const weeksBefore = timeRange?.weeksBefore ?? 0;
  const weeksAfter = timeRange?.weeksAfter ?? 2;
  const timeRangeStart = new Date(now.getTime() - weeksBefore * 7 * 24 * 60 * 60 * 1000);
  const timeRangeEnd = new Date(now.getTime() + weeksAfter * 7 * 24 * 60 * 60 * 1000);
  return { now, todayStart, todayEnd, timeRangeStart, timeRangeEnd };
};
