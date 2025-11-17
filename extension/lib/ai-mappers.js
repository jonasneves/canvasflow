/**
 * AI Response Mappers (Browser Version)
 *
 * These utilities map numeric AI reasoning outputs to UI attributes.
 * AI provides structured numeric scores (0-3), and we translate them
 * to colors, labels, and formatted strings for display.
 *
 * Browser-compatible version - uses global window object instead of ES6 modules.
 */

// Create global namespace
window.AIMappers = window.AIMappers || {};

/**
 * Maps urgency score to color
 * @param {number} urgencyScore - 0=manageable, 1=moderate, 2=high, 3=critical
 * @returns {string} Hex color code
 */
window.AIMappers.mapUrgencyToColor = function(urgencyScore) {
  const colorMap = {
    0: '#339898',   // Manageable - Teal
    1: '#E89923',   // Moderate - Orange
    2: '#E89923',   // High - Orange
    3: '#C84E00'    // Critical - Orange-red
  };
  return colorMap[urgencyScore] ?? colorMap[1]; // Default to moderate
};

/**
 * Maps urgency score to human-readable label
 * @param {number} urgencyScore - 0=manageable, 1=moderate, 2=high, 3=critical
 * @returns {string} Label (e.g., "low", "medium", "high", "critical")
 */
window.AIMappers.mapUrgencyToLabel = function(urgencyScore) {
  const labelMap = {
    0: 'low',
    1: 'medium',
    2: 'high',
    3: 'critical'
  };
  return labelMap[urgencyScore] ?? 'medium'; // Default to medium
};

/**
 * Maps urgency score to display label (capitalized)
 * @param {number} urgencyScore - 0=manageable, 1=moderate, 2=high, 3=critical
 * @returns {string} Display label (e.g., "Low", "Medium", "High", "Critical")
 */
window.AIMappers.mapUrgencyToDisplayLabel = function(urgencyScore) {
  const labelMap = {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Critical'
  };
  return labelMap[urgencyScore] ?? 'Medium'; // Default to Medium
};

/**
 * Maps intensity score to color
 * @param {number} intensityScore - 0=manageable, 1=moderate, 2=high, 3=extreme
 * @returns {string} Hex color code
 */
window.AIMappers.mapIntensityToColor = function(intensityScore) {
  const colorMap = {
    0: '#059669',   // Manageable - Green
    1: '#FBBF24',   // Moderate - Yellow
    2: '#EA580C',   // High - Orange
    3: '#DC2626'    // Extreme - Red
  };
  return colorMap[intensityScore] ?? colorMap[1]; // Default to moderate
};

/**
 * Maps intensity score to human-readable label
 * @param {number} intensityScore - 0=manageable, 1=moderate, 2=high, 3=extreme
 * @returns {string} Label (e.g., "manageable", "moderate", "high", "extreme")
 */
window.AIMappers.mapIntensityToLabel = function(intensityScore) {
  const labelMap = {
    0: 'manageable',
    1: 'moderate',
    2: 'high',
    3: 'extreme'
  };
  return labelMap[intensityScore] ?? 'moderate'; // Default to moderate
};

/**
 * Maps workload score to label (alias for intensity)
 * @param {number} workloadScore - 0=manageable, 1=moderate, 2=high, 3=extreme
 * @returns {string} Label
 */
window.AIMappers.mapWorkloadToLabel = function(workloadScore) {
  return window.AIMappers.mapIntensityToLabel(workloadScore);
};

/**
 * Maps workload score to color (alias for intensity)
 * @param {number} workloadScore - 0=manageable, 1=moderate, 2=high, 3=extreme
 * @returns {string} Hex color code
 */
window.AIMappers.mapWorkloadToColor = function(workloadScore) {
  return window.AIMappers.mapIntensityToColor(workloadScore);
};

/**
 * Validates that a score is within valid range
 * @param {number} score - Score to validate
 * @param {number} min - Minimum value (default 0)
 * @param {number} max - Maximum value (default 3)
 * @returns {boolean} True if valid
 */
window.AIMappers.isValidScore = function(score, min = 0, max = 3) {
  return typeof score === 'number' && score >= min && score <= max && Number.isInteger(score);
};

/**
 * Validates urgency score specifically
 * @param {number} urgencyScore - Score to validate
 * @returns {boolean} True if valid (0-3)
 */
window.AIMappers.isValidUrgencyScore = function(urgencyScore) {
  return window.AIMappers.isValidScore(urgencyScore, 0, 3);
};

/**
 * Validates intensity score specifically
 * @param {number} intensityScore - Score to validate
 * @returns {boolean} True if valid (0-3)
 */
window.AIMappers.isValidIntensityScore = function(intensityScore) {
  return window.AIMappers.isValidScore(intensityScore, 0, 3);
};

/**
 * Formats a time block from structured start hour and duration
 * @param {number} startHour - Starting hour in 24-hour format (0-23)
 * @param {number} durationHours - Duration in hours (supports decimals like 1.5)
 * @returns {string} Formatted time range (e.g., "9:00 AM - 12:30 PM")
 */
window.AIMappers.formatTimeBlock = function(startHour, durationHours) {
  const endHour = startHour + Math.floor(durationHours);
  const endMinutes = Math.round((durationHours % 1) * 60);

  /**
   * Formats a single time
   * @param {number} hour - Hour in 24-hour format
   * @param {number} minutes - Minutes (0-59)
   * @returns {string} Formatted time (e.g., "2:30 PM")
   */
  const formatTime = function(hour, minutes = 0) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinutes = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : ':00';
    return `${displayHour}${displayMinutes} ${period}`;
  };

  return `${formatTime(startHour)} - ${formatTime(endHour, endMinutes)}`;
};

