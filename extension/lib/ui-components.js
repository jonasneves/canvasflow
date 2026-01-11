/**
 * Shared UI Components
 * Reusable UI helpers and event handlers.
 */

window.CanvasFlowUI = window.CanvasFlowUI || {};

/**
 * Setup day toggle listeners for schedule cards
 */
window.CanvasFlowUI.setupDayToggleListeners = function() {
  document.querySelectorAll('.day-plan-toggle').forEach(btn => {
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    newBtn.addEventListener('click', function() {
      const dayId = this.dataset.dayId;
      const dayContent = document.getElementById(dayId);
      const icon = this.querySelector('.day-icon');
      if (dayContent.style.display === 'none') {
        dayContent.style.display = 'block';
        if (icon) icon.style.transform = 'rotate(180deg)';
      } else {
        dayContent.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(0deg)';
      }
    });
    newBtn.addEventListener('mouseenter', function() { this.style.background = '#F9FAFB'; });
    newBtn.addEventListener('mouseleave', function() { this.style.background = this.dataset.defaultBg; });
  });
};

/**
 * Setup task card click listeners
 */
window.CanvasFlowUI.setupTaskCardClickListeners = function() {
  document.querySelectorAll('.schedule-task-card.clickable').forEach(card => {
    card.addEventListener('click', function() {
      const url = this.dataset.url;
      if (url) window.open(url, '_blank');
    });
  });
};

/**
 * Show status message
 * @param {string} elementId - ID of the status element
 * @param {string} message - Message to display
 * @param {string} type - Message type ('success' or 'error')
 */
window.CanvasFlowUI.showStatusMessage = function(elementId, message, type) {
  const statusEl = document.getElementById(elementId);
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `status-message show ${type}`;

  if (type === 'success') {
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);
  }
};

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} actionText - Optional action button text
 * @param {Function} actionCallback - Optional action callback
 */
window.CanvasFlowUI.showToast = function(message, actionText = null, actionCallback = null) {
  const escapeHtml = window.CanvasFlowUtils?.escapeHtml || ((t) => t);

  // Remove existing toast
  const existingToast = document.querySelector('.toast-notification');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  toast.innerHTML = `
    <span class="toast-message">${escapeHtml(message)}</span>
    ${actionText ? `<button class="toast-action">${escapeHtml(actionText)}</button>` : ''}
  `;

  document.body.appendChild(toast);

  if (actionText && actionCallback) {
    const actionBtn = toast.querySelector('.toast-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        actionCallback();
        toast.remove();
      });
    }
  }

  // Auto-remove after 4 seconds
  setTimeout(() => {
    if (toast.parentElement) toast.remove();
  }, 4000);
};

/**
 * Update insights timestamp display
 * @param {number} timestamp - Unix timestamp in milliseconds
 * @returns {string} HTML string for timestamp display
 */
window.CanvasFlowUI.createInsightsTimestampHtml = function(timestamp) {
  const formatTimeAgo = window.CanvasFlowUtils?.formatTimeAgo || (() => '');
  if (!timestamp) return '';
  const timeAgo = formatTimeAgo(timestamp);
  return `<div style="font-size: 11px; color: #9CA3AF; margin-bottom: 10px;">Last generated ${timeAgo}</div>`;
};

/**
 * Create footer HTML for insights/schedule sections
 * @param {number} timestamp - Unix timestamp
 * @param {string} type - 'insights' or 'schedule'
 * @returns {string} Footer HTML string
 */
window.CanvasFlowUI.createInsightsFooter = function(timestamp, type = 'insights') {
  const formatTimeAgo = window.CanvasFlowUtils?.formatTimeAgo || (() => '');
  const timeAgo = formatTimeAgo(timestamp);
  const btnId = type === 'schedule' ? 'regenerateScheduleBtn' : 'regenerateInsightsBtn';
  const viewBtnHtml = type === 'insights' ? `
    <button class="btn-secondary" id="viewScheduleFromInsights" style="padding: 8px 16px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #E5E7EB;">
      <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
      <span>View Schedule</span>
    </button>
  ` : `
    <button class="btn-secondary" id="openFullPageSchedule" style="padding: 8px 16px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #E5E7EB;">
      <i data-lucide="external-link" style="width: 14px; height: 14px;"></i>
      <span>Full Page</span>
    </button>
  `;

  return `<div style="text-align: center; padding: 16px 0 0 0; border-top: 1px solid #E5E7EB;">
    <div style="font-size: 11px; color: #9CA3AF; margin-bottom: 10px;">Last generated ${timeAgo}</div>
    <div style="display: flex; gap: 8px; justify-content: center;">
      <button class="btn-primary" id="${btnId}" style="padding: 8px 16px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
        <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
        <span>Regenerate</span>
      </button>
      ${viewBtnHtml}
    </div>
  </div>`;
};
