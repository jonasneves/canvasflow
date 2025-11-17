// Global state
let allAssignments = [];
let currentFilter = 'all';
let autoRefreshInterval = null;
let assignmentTimeRange = { weeksBefore: 2, weeksAfter: 2 }; // Default 2 weeks before and after
let showGrades = false; // Default to hidden

// Tab switching
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', () => {
    const targetTab = button.getAttribute('data-tab');

    // Update buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Update content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(targetTab).classList.add('active');
  });
});

// Helper function to send MCP requests
async function sendMCPRequest(method, params = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      type: 'MCP_REQUEST',
      payload: { method, params }
    }, resolve);
  });
}

// Load and display the current Canvas URL
async function updateCanvasUrl() {
  try {
    const result = await chrome.storage.local.get(['canvasUrl']);
    const canvasUrl = result.canvasUrl || '';
    const canvasUrlInput = document.getElementById('canvasUrlInput');
    if (canvasUrlInput) {
      canvasUrlInput.value = canvasUrl;
      if (!canvasUrl) {
        canvasUrlInput.placeholder = 'https://canvas.instructure.com';
      }
    }
  } catch (error) {
    console.error('Error loading Canvas URL:', error);
  }
}

// Update status indicators
async function updateStatus() {
  chrome.runtime.sendMessage({ type: 'GET_MCP_STATUS' }, (response) => {
    if (response) {
      document.getElementById('courseCount').textContent = response.courseCount || '0';

      const lastUpdate = response.dataLastUpdate
        ? new Date(response.dataLastUpdate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Never';
      document.getElementById('lastUpdate').textContent = lastUpdate;

      const nativeStatus = document.getElementById('nativeStatus');
      if (response.nativeHostConnected) {
        nativeStatus.textContent = 'Connected';
        nativeStatus.className = 'status-value connected';
      } else {
        nativeStatus.textContent = 'Disconnected';
        nativeStatus.className = 'status-value disconnected';
      }
    }
  });
}

// Update section header based on current filter
function updateSectionHeader() {
  const iconEl = document.getElementById('assignmentsSectionIcon');
  const textEl = document.getElementById('assignmentsSectionText');

  const filterConfig = {
    'all': {
      text: 'All Assignments',
      icon: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>`,
      color: '#6B7280'
    },
    'overdue': {
      text: 'Overdue',
      icon: `<circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>`,
      color: '#DC2626'
    },
    'due-today': {
      text: 'Due Today',
      icon: `<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>`,
      color: '#D97706'
    },
    'upcoming': {
      text: 'Upcoming',
      icon: `<rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>`,
      color: '#00539B'
    }
  };

  const config = filterConfig[currentFilter] || filterConfig['all'];

  if (iconEl && textEl) {
    // Build complete SVG element with proper attributes
    iconEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${config.icon}</svg>`;
    iconEl.style.color = config.color;
    textEl.textContent = config.text;
  }
}

// Render assignments based on current filter
function renderAssignments() {
  updateSectionHeader();
  const assignmentsList = document.getElementById('assignmentsList');
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Calculate time range boundaries
  const timeRangeStart = new Date(now.getTime() - assignmentTimeRange.weeksBefore * 7 * 24 * 60 * 60 * 1000);
  const timeRangeEnd = new Date(now.getTime() + assignmentTimeRange.weeksAfter * 7 * 24 * 60 * 60 * 1000);

  console.log('[renderAssignments] Current filter:', currentFilter);
  console.log('[renderAssignments] Total assignments:', allAssignments.length);
  console.log('[renderAssignments] Time range:', timeRangeStart, 'to', timeRangeEnd);

  if (allAssignments.length === 0) {
    assignmentsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
          </svg>
        </div>
        <div class="empty-state-text">No assignments found</div>
        <div style="font-size: 12px; margin-top: 8px;">Click "Refresh Canvas Data" in MCP Server tab</div>
      </div>
    `;
    return;
  }

  // Apply time range filter first (to all assignments with due dates)
  let timeFilteredAssignments = allAssignments.filter(a => {
    if (!a.dueDate) return false; // Exclude assignments without due dates from time filter
    const dueDate = new Date(a.dueDate);
    return dueDate >= timeRangeStart && dueDate <= timeRangeEnd;
  });

  console.log('[renderAssignments] After time filter:', timeFilteredAssignments.length);

  // Filter assignments based on currentFilter
  let filteredAssignments;

  if (currentFilter === 'all') {
    // Show all assignments within time range, plus those without due dates
    filteredAssignments = [...timeFilteredAssignments, ...allAssignments.filter(a => !a.dueDate)];
    console.log('[renderAssignments] Showing ALL assignments (in range + no due date):', filteredAssignments.length);
  } else {
    // For other filters, only use time-filtered assignments
    filteredAssignments = timeFilteredAssignments;
    console.log('[renderAssignments] Assignments with due dates in range:', filteredAssignments.length);

    if (currentFilter === 'overdue') {
      filteredAssignments = filteredAssignments.filter(a => {
        return new Date(a.dueDate) < now && !a.submission?.submitted;
      });
      console.log('[renderAssignments] Overdue assignments:', filteredAssignments.length);
    } else if (currentFilter === 'due-today') {
      filteredAssignments = filteredAssignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= todayStart && dueDate < todayEnd && !a.submission?.submitted;
      });
      console.log('[renderAssignments] Due today assignments:', filteredAssignments.length);
    } else if (currentFilter === 'upcoming') {
      filteredAssignments = filteredAssignments.filter(a => {
        return new Date(a.dueDate) >= todayEnd && !a.submission?.submitted;
      });
      console.log('[renderAssignments] Upcoming assignments:', filteredAssignments.length);
    }
  }

  // Sort differently based on filter
  if (currentFilter === 'all') {
    // For 'all' view: Urgency-based sorting by priority
    // Priority: 1) Overdue (not submitted), 2) Due today, 3) Upcoming, 4) Submitted/completed, 5) No due date
    filteredAssignments.sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate) : null;
      const bDate = b.dueDate ? new Date(b.dueDate) : null;

      // Helper to categorize assignments by urgency
      const getPriority = (assignment, date) => {
        if (!date) return 5; // No due date = lowest priority
        if (assignment.submission?.submitted) return 4; // Submitted/completed

        // Unsubmitted assignments sorted by urgency
        if (date < now) return 1; // Overdue = MOST URGENT
        if (date >= todayStart && date < todayEnd) return 2; // Due today
        return 3; // Upcoming (future)
      };

      const aPriority = getPriority(a, aDate);
      const bPriority = getPriority(b, bDate);

      // Sort by priority first
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Within same priority, sort by due date
      if (!aDate && !bDate) return 0;
      if (!aDate) return 1;
      if (!bDate) return -1;
      return aDate - bDate;
    });

    // Show more items in 'all' mode (50 instead of 20)
    filteredAssignments = filteredAssignments.slice(0, 50);
  } else {
    // For filtered views: Sort by due date (closest first)
    filteredAssignments.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    // Limit to 20 assignments for filtered views
    filteredAssignments = filteredAssignments.slice(0, 20);
  }

  console.log('[renderAssignments] Displaying', filteredAssignments.length, 'assignments');

  if (filteredAssignments.length === 0) {
    const filterText = currentFilter === 'all' ? 'with due dates' :
                      currentFilter === 'overdue' ? 'overdue' :
                      currentFilter === 'due-today' ? 'due today' : 'upcoming';
    assignmentsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="empty-state-text">No ${filterText} assignments</div>
      </div>
    `;
    return;
  }

  // Render assignments
  assignmentsList.innerHTML = filteredAssignments.map(assignment => {
    const isCompleted = assignment.submission?.submitted;
    const hasDueDate = !!assignment.dueDate;

    let isOverdue = false;
    let isDueToday = false;
    let isUpcoming = false;
    let dueDateText = 'No due date';

    if (hasDueDate) {
      const dueDate = new Date(assignment.dueDate);
      isOverdue = dueDate < now;
      isDueToday = !isOverdue && dueDate >= todayStart && dueDate < todayEnd;
      isUpcoming = dueDate >= todayEnd;

      dueDateText = dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
    }

    let cardClass = 'assignment-card';
    if (isCompleted) cardClass += ' completed';
    else if (isOverdue) cardClass += ' overdue';

    // Color-code due date based on category
    let dueDateClass = 'assignment-due-date';
    if (isOverdue) dueDateClass += ' overdue';
    else if (isDueToday) dueDateClass += ' due-today';
    else if (isUpcoming) dueDateClass += ' upcoming';

    const assignmentUrl = assignment.url || '#';
    const badges = getAssignmentBadges(assignment);
    const gradeDisplay = getGradeDisplay(assignment);

    return `
      <a href="${escapeHtml(assignmentUrl)}" target="_blank" class="${cardClass}">
        <div class="assignment-info">
          <div class="assignment-title">${escapeHtml(assignment.name || 'Untitled Assignment')}</div>
          <div class="assignment-meta">
            <span>${escapeHtml(assignment.courseName || 'Unknown Course')}</span>
            ${assignment.pointsPossible ? `<span>${assignment.pointsPossible} pts</span>` : ''}
          </div>
          <div class="${dueDateClass}">Due: ${dueDateText}</div>
        </div>
        ${badges || gradeDisplay ? `<div class="assignment-badges">${badges}${gradeDisplay}</div>` : ''}
      </a>
    `;
  }).join('');
}

// Get assignment badges similar to dashboard
function getAssignmentBadges(assignment) {
  const badges = [];

  if (assignment.submission?.submitted) {
    // Show submitted badge first
    badges.push('<span class="assignment-badge submitted">Submitted</span>');

    // Add late badge if submission was late
    if (assignment.submission.late) {
      badges.push('<span class="assignment-badge late">Late</span>');
    }
  }

  if (assignment.submission?.workflowState === 'graded') {
    badges.push('<span class="assignment-badge completed">Graded</span>');
  }

  if (assignment.submission?.missing && !assignment.submission?.submitted) {
    badges.push('<span class="assignment-badge missing">Missing</span>');
  }

  return badges.join('');
}

// Get grade display if enabled
function getGradeDisplay(assignment) {
  if (!showGrades) return '';

  const submission = assignment.submission;
  if (!submission || submission.workflowState !== 'graded') return '';

  const score = submission.score;
  const pointsPossible = assignment.pointsPossible;

  if (score !== undefined && score !== null && pointsPossible) {
    const percentage = ((score / pointsPossible) * 100).toFixed(1);
    return `<span class="assignment-grade">${score}/${pointsPossible} (${percentage}%)</span>`;
  } else if (score !== undefined && score !== null) {
    return `<span class="assignment-grade">${score} pts</span>`;
  }

  return '';
}

// Load and display assignments
async function loadAssignments() {
  const assignmentsList = document.getElementById('assignmentsList');
  assignmentsList.innerHTML = '<div class="loading"><span class="spinner"></span> Loading assignments...</div>';

  try {
    // Get Canvas data from background
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_CANVAS_DATA' }, resolve);
    });

    if (response && response.success) {
      allAssignments = response.data.allAssignments || [];

      // Calculate summary counts
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      // Calculate time range boundaries
      const timeRangeStart = new Date(now.getTime() - assignmentTimeRange.weeksBefore * 7 * 24 * 60 * 60 * 1000);
      const timeRangeEnd = new Date(now.getTime() + assignmentTimeRange.weeksAfter * 7 * 24 * 60 * 60 * 1000);

      // Filter to assignments within time range
      const assignmentsWithDates = allAssignments.filter(a => {
        if (!a.dueDate || a.submission?.submitted) return false;
        const dueDate = new Date(a.dueDate);
        return dueDate >= timeRangeStart && dueDate <= timeRangeEnd;
      });

      const overdueCount = assignmentsWithDates.filter(a => new Date(a.dueDate) < now && !a.submission?.submitted).length;
      const dueTodayCount = assignmentsWithDates.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= todayStart && dueDate < todayEnd && !a.submission?.submitted;
      }).length;
      const upcomingCount = assignmentsWithDates.filter(a => new Date(a.dueDate) >= todayEnd && !a.submission?.submitted).length;

      // Update summary cards
      document.getElementById('overdueCount').textContent = overdueCount;
      document.getElementById('dueTodayCount').textContent = dueTodayCount;
      document.getElementById('upcomingCount').textContent = upcomingCount;

      // Set initial active state on due-today card
      document.querySelectorAll('.summary-card').forEach(card => {
        if (card.getAttribute('data-filter') === currentFilter) {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });

      // Render assignments with current filter
      renderAssignments();

    } else {
      assignmentsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="empty-state-text">Failed to load assignments</div>
          <div style="font-size: 12px; margin-top: 8px;">Try refreshing Canvas data in MCP Server tab</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading assignments:', error);
    assignmentsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="empty-state-text">Error loading assignments</div>
        <div style="font-size: 12px; margin-top: 8px;">${escapeHtml(error.message)}</div>
      </div>
    `;
  }
}

// Helper to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Show status message
function showStatusMessage(elementId, message, type) {
  const statusEl = document.getElementById(elementId);
  if (!statusEl) return;

  statusEl.textContent = message;
  statusEl.className = `status-message show ${type}`;

  if (type === 'success') {
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 3000);
  }
}

// Settings Modal
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsModal = document.getElementById('closeSettingsModal');

settingsBtn.addEventListener('click', async () => {
  settingsModal.classList.add('show');

  // Load current settings
  const result = await chrome.storage.local.get(['claudeApiKey', 'assignmentWeeksBefore', 'assignmentWeeksAfter']);
  if (result.claudeApiKey) {
    document.getElementById('claudeApiKey').value = result.claudeApiKey;
  }

  // Load time range settings
  document.getElementById('assignmentWeeksBefore').value = result.assignmentWeeksBefore || 2;
  document.getElementById('assignmentWeeksAfter').value = result.assignmentWeeksAfter || 2;
});

closeSettingsModal.addEventListener('click', () => {
  settingsModal.classList.remove('show');
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('show');
  }
});

// Header Refresh Button
document.getElementById('headerRefreshBtn').addEventListener('click', async () => {
  const button = document.getElementById('headerRefreshBtn');
  const svg = button.querySelector('svg');

  // Add spinning animation
  if (svg) {
    svg.style.animation = 'spin 1s linear infinite';
  }
  button.disabled = true;

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'REFRESH_DATA' }, resolve);
    });

    if (response && response.success) {
      updateStatus();
      loadAssignments(); // Reload assignments after refresh
    }
  } catch (error) {
    console.error('Error refreshing data:', error);
  } finally {
    if (svg) {
      svg.style.animation = '';
    }
    button.disabled = false;
  }
});

// Summary card filters
document.querySelectorAll('.summary-card').forEach(card => {
  card.addEventListener('click', () => {
    const filter = card.getAttribute('data-filter');
    console.log('[Card Click] Clicked filter:', filter, 'Current filter:', currentFilter);

    // Toggle filter - if clicking the same card, reset to 'all'
    if (currentFilter === filter) {
      currentFilter = 'all';
      document.querySelectorAll('.summary-card').forEach(c => c.classList.remove('active'));
      console.log('[Card Click] Toggled off, now showing: all');
    } else {
      currentFilter = filter;
      document.querySelectorAll('.summary-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      console.log('[Card Click] Switched to filter:', currentFilter);
    }

    // Re-render with new filter
    renderAssignments();
  });
});

// Listen for storage changes to update Canvas URL
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.canvasUrl) {
    updateCanvasUrl();
  }
});

// Canvas URL validation
function isValidCanvasUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return false;
    }
    if (!parsed.hostname) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

// Save Canvas URL
document.getElementById('saveCanvasUrl').addEventListener('click', async () => {
  const canvasUrlInput = document.getElementById('canvasUrlInput');
  const url = canvasUrlInput.value.trim();

  if (!url) {
    showStatusMessage('canvasUrlStatus', 'Please enter a Canvas URL', 'error');
    return;
  }

  if (!isValidCanvasUrl(url)) {
    showStatusMessage('canvasUrlStatus', 'Please enter a valid HTTPS URL', 'error');
    return;
  }

  try {
    await chrome.storage.local.set({ canvasUrl: url });
    showStatusMessage('canvasUrlStatus', '✓ Saved', 'success');
  } catch (error) {
    showStatusMessage('canvasUrlStatus', '✗ Save failed', 'error');
  }
});

// Auto-detect Canvas URL from open tabs
async function autoDetectCanvasUrl(showMessages = true) {
  if (showMessages) {
    showStatusMessage('canvasUrlStatus', 'Detecting...', 'success');
  }

  try {
    const tabs = await chrome.tabs.query({});
    const canvasPatterns = [
      /^https?:\/\/[^\/]*instructure\.com/,
      /^https?:\/\/[^\/]*canvaslms\.com/,
      /^https?:\/\/canvas\.[^\/]+/,
      /^https?:\/\/[^\/]*\.edu\/.*canvas/i,
    ];

    const detectedUrls = [];

    for (const tab of tabs) {
      if (tab.url && canvasPatterns.some(pattern => pattern.test(tab.url))) {
        try {
          const url = new URL(tab.url);
          const baseUrl = `${url.protocol}//${url.host}`;
          if (!detectedUrls.includes(baseUrl)) {
            detectedUrls.push(baseUrl);
          }
        } catch (e) {
          console.error('Error parsing URL:', e);
        }
      }
    }

    if (detectedUrls.length === 0) {
      if (showMessages) {
        showStatusMessage('canvasUrlStatus', '✗ No Canvas URLs found in open tabs', 'error');
      }
      return null;
    }

    const canvasUrlInput = document.getElementById('canvasUrlInput');
    if (canvasUrlInput) {
      canvasUrlInput.value = detectedUrls[0];
    }
    await chrome.storage.local.set({ canvasUrl: detectedUrls[0] });

    if (showMessages) {
      showStatusMessage('canvasUrlStatus', `✓ Detected: ${detectedUrls[0]}`, 'success');
    }

    return detectedUrls[0];
  } catch (error) {
    if (showMessages) {
      showStatusMessage('canvasUrlStatus', '✗ Detection failed', 'error');
    }
    return null;
  }
}

// Auto-detect button click handler
document.getElementById('autoDetectUrl').addEventListener('click', async () => {
  await autoDetectCanvasUrl(true);
});

// Auto-refresh functionality
async function refreshCanvasData() {
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'REFRESH_DATA' }, resolve);
    });

    if (response && response.success) {
      updateStatus();
      loadAssignments();
    }
  } catch (error) {
    console.error('Error during auto-refresh:', error);
  }
}

function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  // Refresh every 5 minutes (300000 ms)
  autoRefreshInterval = setInterval(() => {
    refreshCanvasData();
  }, 300000);
}

function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
}

// Load auto-refresh setting
async function loadAutoRefreshSetting() {
  try {
    const result = await chrome.storage.local.get(['autoRefreshEnabled']);
    const enabled = result.autoRefreshEnabled !== false; // Default to true

    const toggle = document.getElementById('autoRefreshToggle');
    if (toggle) {
      toggle.checked = enabled;

      if (enabled) {
        startAutoRefresh();
      }
    }
  } catch (error) {
    console.error('Error loading auto-refresh setting:', error);
  }
}

// Save auto-refresh setting
async function saveAutoRefreshSetting(enabled) {
  try {
    await chrome.storage.local.set({ autoRefreshEnabled: enabled });

    if (enabled) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }
  } catch (error) {
    console.error('Error saving auto-refresh setting:', error);
  }
}

// Toggle grades button event listener
document.getElementById('toggleGradesBtn').addEventListener('click', () => {
  showGrades = !showGrades;
  updateGradesIcon();
  renderAssignments(); // Re-render to show/hide grades
});

// Update grades icon based on state
function updateGradesIcon() {
  const icon = document.getElementById('gradesEyeIcon');
  if (!icon) return;

  const iconName = showGrades ? 'eye' : 'eye-off';
  icon.setAttribute('data-lucide', iconName);

  // Re-initialize this specific icon
  if (typeof initializeLucide === 'function') {
    initializeLucide();
  }
}

// Auto-refresh toggle event listener
document.getElementById('autoRefreshToggle').addEventListener('change', (e) => {
  saveAutoRefreshSetting(e.target.checked);
});

// Save time range settings
document.getElementById('saveTimeRange').addEventListener('click', async () => {
  const weeksBefore = parseInt(document.getElementById('assignmentWeeksBefore').value);
  const weeksAfter = parseInt(document.getElementById('assignmentWeeksAfter').value);

  if (isNaN(weeksBefore) || weeksBefore < 1 || weeksBefore > 52) {
    showStatusMessage('timeRangeStatus', 'Weeks before must be between 1 and 52', 'error');
    return;
  }

  if (isNaN(weeksAfter) || weeksAfter < 1 || weeksAfter > 52) {
    showStatusMessage('timeRangeStatus', 'Weeks after must be between 1 and 52', 'error');
    return;
  }

  try {
    await chrome.storage.local.set({
      assignmentWeeksBefore: weeksBefore,
      assignmentWeeksAfter: weeksAfter
    });

    // Update global state
    assignmentTimeRange = { weeksBefore, weeksAfter };

    showStatusMessage('timeRangeStatus', '✓ Saved', 'success');

    // Re-render assignments with new time range
    renderAssignments();
  } catch (error) {
    showStatusMessage('timeRangeStatus', '✗ Save failed', 'error');
  }
});

// API Key toggle visibility
document.getElementById('toggleApiKeyBtn').addEventListener('click', () => {
  const input = document.getElementById('claudeApiKey');
  const eyeIcon = document.getElementById('eyeIcon');
  const eyeOffIcon = document.getElementById('eyeOffIcon');

  if (input.type === 'password') {
    input.type = 'text';
    eyeIcon.style.display = 'none';
    eyeOffIcon.style.display = 'block';
  } else {
    input.type = 'password';
    eyeIcon.style.display = 'block';
    eyeOffIcon.style.display = 'none';
  }
});

// Save API key
document.getElementById('claudeApiKey').addEventListener('change', async (e) => {
  const apiKey = e.target.value.trim();
  try {
    await chrome.storage.local.set({ claudeApiKey: apiKey });
    console.log('API key saved');
  } catch (error) {
    console.error('Error saving API key:', error);
  }
});

// Load time range settings
async function loadTimeRangeSettings() {
  try {
    const result = await chrome.storage.local.get(['assignmentWeeksBefore', 'assignmentWeeksAfter']);
    assignmentTimeRange = {
      weeksBefore: result.assignmentWeeksBefore || 2,
      weeksAfter: result.assignmentWeeksAfter || 2
    };
    console.log('Loaded time range settings:', assignmentTimeRange);
  } catch (error) {
    console.error('Error loading time range settings:', error);
  }
}

// Update insights timestamp display
function updateInsightsTimestamp(timestamp) {
  const timestampEl = document.getElementById('insightsTimestamp');
  const timestampText = document.getElementById('insightsTimestampText');

  if (timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let timeAgo;
    if (days > 0) {
      timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = 'just now';
    }

    timestampText.textContent = timeAgo;
    timestampEl.style.display = 'block';
  } else {
    timestampEl.style.display = 'none';
  }
}

// Load saved insights from storage
async function loadSavedInsights() {
  try {
    const result = await chrome.storage.local.get(['savedInsights', 'insightsTimestamp']);
    if (result.savedInsights) {
      const insightsContent = document.getElementById('insightsContent');
      insightsContent.innerHTML = `
        <div class="insights-loaded">
          ${result.savedInsights}
        </div>
      `;

      // Update timestamp if available
      if (result.insightsTimestamp) {
        updateInsightsTimestamp(result.insightsTimestamp);
      }
    }
  } catch (error) {
    console.error('Error loading saved insights:', error);
  }
}

// Initial load
async function initialize() {
  await updateCanvasUrl();
  updateStatus();

  // Auto-detect Canvas URL if not already configured
  const result = await chrome.storage.local.get(['canvasUrl']);
  if (!result.canvasUrl) {
    console.log('No Canvas URL configured, attempting auto-detect...');
    const detected = await autoDetectCanvasUrl(false);
    if (detected) {
      console.log('Auto-detected Canvas URL:', detected);
      // Update the input field with detected URL
      const canvasUrlInput = document.getElementById('canvasUrlInput');
      if (canvasUrlInput) {
        canvasUrlInput.value = detected;
      }
    }
  }

  // Load time range settings
  await loadTimeRangeSettings();

  // Load auto-refresh setting
  await loadAutoRefreshSetting();

  // Initialize grade visibility icon (always starts hidden)
  updateGradesIcon();

  // Update AI insights button text
  await updateInsightsButtonText();

  // Load saved insights
  await loadSavedInsights();

  // Trigger initial refresh on extension open
  await refreshCanvasData();
}

// AI Insights functionality
async function updateInsightsButtonText() {
  const result = await chrome.storage.local.get(['claudeApiKey']);
  const btnText = document.getElementById('generateInsightsBtnText');

  if (result.claudeApiKey) {
    btnText.textContent = 'Generate AI Insights';
  } else {
    btnText.textContent = 'Show Question Suggestions';
  }
}

async function generateAIInsights() {
  const btn = document.getElementById('generateInsightsBtn');
  const insightsContent = document.getElementById('insightsContent');

  // Check if API key is set
  const result = await chrome.storage.local.get(['claudeApiKey']);

  if (!result.claudeApiKey) {
    // Show MCP guidance if no API key
    const assignmentsData = prepareAssignmentsForAI();
    const mcpGuidance = `
      <div class="insights-loaded">
        <h3 style="margin-bottom: 12px;">Ask Claude for AI-Powered Insights</h3>
        <p style="margin-bottom: 16px; color: #6B7280; font-size: 14px;">Claude Desktop already has access to all your Canvas data via MCP. Open Claude and try asking:</p>

        <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #00539B; margin-bottom: 12px;">
          <strong style="color: #00539B;">💡 Priority Recommendations</strong>
          <p style="margin: 8px 0 4px 0; font-size: 13px; color: #374151;">"What assignments should I focus on first based on due dates and importance?"</p>
        </div>

        <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #00539B; margin-bottom: 12px;">
          <strong style="color: #00539B;">📊 Workload Analysis</strong>
          <p style="margin: 8px 0 4px 0; font-size: 13px; color: #374151;">"Analyze my current workload and help me create a study schedule"</p>
        </div>

        <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #00539B; margin-bottom: 16px;">
          <strong style="color: #00539B;">🎯 Study Strategy</strong>
          <p style="margin: 8px 0 4px 0; font-size: 13px; color: #374151;">"What's the best strategy to catch up on my ${assignmentsData.overdue.length} overdue assignments?"</p>
        </div>

        <p style="font-size: 12px; color: #9CA3AF;">
          <strong>Tip:</strong> Claude can see all ${assignmentsData.totalAssignments} assignments across your ${assignmentsData.courses.length} courses, including submission status, due dates, and points.
        </p>

        <div style="margin-top: 16px; padding: 12px; background: #FCF7E5; border-radius: 8px; border-left: 4px solid #E89923;">
          <p style="margin: 0; font-size: 12px; color: #374151;">💡 <strong>Want insights here?</strong> Add your Claude API key in settings!</p>
        </div>
      </div>
    `;
    insightsContent.innerHTML = mcpGuidance;

    // Save MCP guidance (so it persists)
    await chrome.storage.local.set({
      savedInsights: mcpGuidance,
      insightsTimestamp: Date.now()
    });
    document.getElementById('insightsTimestamp').style.display = 'none';

    return;
  }

  // Generate insights with Claude API
  btn.disabled = true;
  insightsContent.innerHTML = `
    <div class="insights-loading">
      <div class="spinner"></div>
      <p>Analyzing your assignments with Claude AI...</p>
    </div>
  `;

  try {
    const assignmentsData = prepareAssignmentsForAI();
    const insights = await callClaudeWithStructuredOutput(result.claudeApiKey, assignmentsData);

    const formattedInsights = formatStructuredInsights(insights);
    insightsContent.innerHTML = `
      <div class="insights-loaded fade-in">
        ${formattedInsights}
      </div>
    `;

    // Save insights and timestamp to storage
    const timestamp = Date.now();
    await chrome.storage.local.set({
      savedInsights: formattedInsights,
      insightsTimestamp: timestamp
    });

    // Update timestamp display
    updateInsightsTimestamp(timestamp);

  } catch (error) {
    console.error('Error generating insights:', error);
    const errorHtml = `
      <div class="insights-error">
        <strong>Failed to generate insights:</strong> ${escapeHtml(error.message)}
        <p style="margin-top: 8px; font-size: 12px;">Check your API key in settings or use Claude Desktop via MCP instead.</p>
      </div>
    `;
    insightsContent.innerHTML = errorHtml;

    // Save error state
    await chrome.storage.local.set({
      savedInsights: errorHtml,
      insightsTimestamp: Date.now()
    });
    document.getElementById('insightsTimestamp').style.display = 'none';
  } finally {
    btn.disabled = false;
  }
}

function prepareAssignmentsForAI() {
  const now = new Date();

  // Apply the SAME time range filter as Dashboard tab
  const timeRangeStart = new Date(now.getTime() - assignmentTimeRange.weeksBefore * 7 * 24 * 60 * 60 * 1000);
  const timeRangeEnd = new Date(now.getTime() + assignmentTimeRange.weeksAfter * 7 * 24 * 60 * 60 * 1000);

  // Filter assignments to only those within the configured time range
  const assignments = (allAssignments || []).filter(a => {
    if (!a.dueDate) return true; // Include assignments without due dates
    const dueDate = new Date(a.dueDate);
    return dueDate >= timeRangeStart && dueDate <= timeRangeEnd;
  });

  console.log('[prepareAssignmentsForAI] Time range:', timeRangeStart.toLocaleDateString(), 'to', timeRangeEnd.toLocaleDateString());
  console.log('[prepareAssignmentsForAI] Filtered assignments:', assignments.length, 'of', allAssignments.length, 'total');

  return {
    totalAssignments: assignments.length,
    courses: [...new Set(assignments.map(a => a.courseName))],
    upcoming: assignments.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate >= now && dueDate <= weekFromNow && !a.submission?.submitted;
    }).map(a => ({
      name: a.name,
      course: a.courseName,
      dueDate: a.dueDate,
      points: a.pointsPossible
    })),
    overdue: assignments.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      return dueDate < now && !a.submission?.submitted;
    }).map(a => ({
      name: a.name,
      course: a.courseName,
      dueDate: a.dueDate,
      points: a.pointsPossible
    })),
    completed: assignments.filter(a => a.submission?.submitted || a.submission?.workflowState === 'graded').length
  };
}

async function callClaudeWithStructuredOutput(apiKey, assignmentsData) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: `Analyze this student's Canvas assignments and create a Weekly Battle Plan.

Current Status:
- Total Assignments: ${assignmentsData.totalAssignments}
- Courses: ${assignmentsData.courses.join(', ')}
- Due this week: ${assignmentsData.upcoming.length}
- Overdue: ${assignmentsData.overdue.length}
- Completed: ${assignmentsData.completed}

Upcoming Assignments (next 7 days):
${assignmentsData.upcoming.slice(0, 8).map(a => `- ${a.name} (${a.course}) - Due: ${new Date(a.dueDate).toLocaleDateString()}, ${a.points} points`).join('\n')}

Overdue Assignments:
${assignmentsData.overdue.slice(0, 5).map(a => `- ${a.name} (${a.course}) - Was due: ${new Date(a.dueDate).toLocaleDateString()}, ${a.points} points`).join('\n')}

Create a weekly battle plan as a JSON object with this EXACT structure:
{
  "priority_tasks": [
    {
      "task": "assignment name and action",
      "reason": "why this is a priority",
      "urgency": "critical|high|medium|low",
      "estimated_hours": 2.5
    }
  ],
  "workload_assessment": {
    "overall": "one sentence summary of the week's workload",
    "total_hours_needed": 25,
    "intensity_level": "extreme|high|moderate|manageable",
    "recommendations": ["tip 1", "tip 2", "tip 3"]
  },
  "study_tips": ["tip 1", "tip 2", "tip 3", "tip 4"]
}

Return ONLY the JSON object, no other text. Be realistic with time estimates. Keep it concise for a sidepanel view.`
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.content[0].text;

  // Extract JSON from the response
  const jsonMatch = textContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }

  return JSON.parse(jsonMatch[0]);
}

function formatStructuredInsights(insights) {
  const urgencyColors = {
    critical: '#DC2626',
    high: '#EA580C',
    medium: '#FBBF24',
    low: '#059669'
  };

  const urgencyLabels = {
    critical: '🔴 Critical',
    high: '🟠 High',
    medium: '🟡 Medium',
    low: '🟢 Low'
  };

  const intensityColors = {
    extreme: '#DC2626',
    high: '#EA580C',
    moderate: '#FBBF24',
    manageable: '#059669'
  };

  const recommendationsHtml = insights.workload_assessment.recommendations.map(rec => {
    return `<div style="margin: 6px 0; font-size: 13px; display: flex; gap: 8px;"><span>•</span><span>${escapeHtml(rec)}</span></div>`;
  }).join('');

  const priorityTasksHtml = insights.priority_tasks.slice(0, 5).map(task => {
    return `
      <div style="padding: 12px; background: white; border: 1px solid #E5E7EB; border-left: 3px solid ${urgencyColors[task.urgency]}; border-radius: 6px; margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
          <strong style="color: #111827; font-size: 13px; flex: 1;">${escapeHtml(task.task)}</strong>
          <div style="display: flex; gap: 6px; margin-left: 8px;">
            <span style="background: ${urgencyColors[task.urgency]}15; color: ${urgencyColors[task.urgency]}; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 600; white-space: nowrap;">${urgencyLabels[task.urgency]}</span>
            <span style="background: #F3F4F6; color: #374151; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">${task.estimated_hours}h</span>
          </div>
        </div>
        <p style="margin: 0; color: #6B7280; font-size: 12px; line-height: 1.4;">${escapeHtml(task.reason)}</p>
      </div>
    `;
  }).join('');

  const studyTipsHtml = insights.study_tips.map(tip => {
    return `<div style="margin: 6px 0; font-size: 13px; display: flex; gap: 8px;"><span>💡</span><span>${escapeHtml(tip)}</span></div>`;
  }).join('');

  return `
    <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, ${intensityColors[insights.workload_assessment.intensity_level]}15, ${intensityColors[insights.workload_assessment.intensity_level]}05); border: 1px solid ${intensityColors[insights.workload_assessment.intensity_level]}30; border-radius: 8px;">
      <h3 style="margin: 0 0 8px 0; color: #111827; font-size: 15px;">📊 Workload Assessment</h3>
      <p style="margin: 0 0 12px 0; color: #374151; font-size: 13px;">${escapeHtml(insights.workload_assessment.overall)}</p>
      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        <div style="flex: 1; padding: 8px; background: white; border-radius: 6px; text-align: center;">
          <div style="font-size: 20px; font-weight: 700; color: ${intensityColors[insights.workload_assessment.intensity_level]};">${insights.workload_assessment.total_hours_needed}h</div>
          <div style="font-size: 11px; color: #6B7280; text-transform: uppercase;">Total Hours</div>
        </div>
        <div style="flex: 1; padding: 8px; background: white; border-radius: 6px; text-align: center;">
          <div style="font-size: 14px; font-weight: 600; color: ${intensityColors[insights.workload_assessment.intensity_level]}; text-transform: capitalize;">${insights.workload_assessment.intensity_level}</div>
          <div style="font-size: 11px; color: #6B7280; text-transform: uppercase;">Intensity</div>
        </div>
      </div>
      <div style="background: white; padding: 12px; border-radius: 6px;">
        <strong style="font-size: 13px; color: #111827;">Key Recommendations:</strong>
        ${recommendationsHtml}
      </div>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 15px;">🎯 Priority Tasks</h3>
      ${priorityTasksHtml}
    </div>

    <div style="padding: 16px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px;">
      <h3 style="margin: 0 0 12px 0; color: #111827; font-size: 15px;">💡 Study Tips</h3>
      ${studyTipsHtml}
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Generate Insights Button
document.getElementById('generateInsightsBtn').addEventListener('click', generateAIInsights);

// Open Dashboard Button
document.getElementById('openDashboardBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});

// Setup instructions toggle
const setupToggle = document.getElementById('setupToggle');
const setupContent = document.getElementById('setupContent');
const setupChevron = setupToggle.querySelector('.chevron');

setupToggle.addEventListener('click', () => {
  const isOpen = setupContent.classList.toggle('open');
  setupChevron.classList.toggle('open', isOpen);
});

initialize();

// Periodic updates
setInterval(updateStatus, 5000);
