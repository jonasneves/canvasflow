// Global state
let allAssignments = [];
let currentFilter = 'all';
let autoRefreshInterval = null;

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
    iconEl.innerHTML = config.icon;
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

  console.log('[renderAssignments] Current filter:', currentFilter);
  console.log('[renderAssignments] Total assignments:', allAssignments.length);

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

  // Filter assignments based on currentFilter
  let filteredAssignments;

  if (currentFilter === 'all') {
    // Show all assignments, including those without due dates
    filteredAssignments = [...allAssignments];
    console.log('[renderAssignments] Showing ALL assignments:', filteredAssignments.length);
  } else {
    // For other filters, only show assignments with due dates
    filteredAssignments = allAssignments.filter(a => a.dueDate);
    console.log('[renderAssignments] Assignments with due dates:', filteredAssignments.length);

    if (currentFilter === 'overdue') {
      filteredAssignments = filteredAssignments.filter(a => {
        return new Date(a.dueDate) < now && !a.submitted;
      });
      console.log('[renderAssignments] Overdue assignments:', filteredAssignments.length);
    } else if (currentFilter === 'due-today') {
      filteredAssignments = filteredAssignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= todayStart && dueDate < todayEnd && !a.submitted;
      });
      console.log('[renderAssignments] Due today assignments:', filteredAssignments.length);
    } else if (currentFilter === 'upcoming') {
      filteredAssignments = filteredAssignments.filter(a => {
        return new Date(a.dueDate) >= todayEnd && !a.submitted;
      });
      console.log('[renderAssignments] Upcoming assignments:', filteredAssignments.length);
    }
  }

  // Sort differently based on filter
  if (currentFilter === 'all') {
    // For 'all' view: Smart sorting by priority
    // Priority: 1) Due today (not submitted), 2) Upcoming this week, 3) Overdue, 4) Future, 5) Completed, 6) No due date
    filteredAssignments.sort((a, b) => {
      const aDate = a.dueDate ? new Date(a.dueDate) : null;
      const bDate = b.dueDate ? new Date(b.dueDate) : null;

      // Helper to categorize assignments
      const getPriority = (assignment, date) => {
        if (!date) return 6; // No due date = lowest priority
        if (assignment.submitted) return 5; // Completed

        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        if (date >= todayStart && date < todayEnd) return 1; // Due today
        if (date >= todayEnd && date <= weekFromNow) return 2; // Upcoming this week
        if (date < now) return 3; // Overdue
        return 4; // Future
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
    const isCompleted = assignment.submitted;
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

    let statusText = '';
    if (isCompleted) statusText = '✓ Submitted';
    // Due today and overdue status indicated by color, no label needed

    const assignmentUrl = assignment.url || '#';

    return `
      <a href="${escapeHtml(assignmentUrl)}" target="_blank" class="${cardClass}">
        <div class="assignment-title">${escapeHtml(assignment.name || 'Untitled Assignment')}</div>
        <div class="assignment-meta">
          <span>${escapeHtml(assignment.courseName || 'Unknown Course')}</span>
          ${statusText ? `<span>${statusText}</span>` : ''}
        </div>
        <div class="${dueDateClass}">Due: ${dueDateText}</div>
      </a>
    `;
  }).join('');
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

      const assignmentsWithDates = allAssignments.filter(a => a.dueDate && !a.submitted);

      const overdueCount = assignmentsWithDates.filter(a => new Date(a.dueDate) < now).length;
      const dueTodayCount = assignmentsWithDates.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= todayStart && dueDate < todayEnd;
      }).length;
      const upcomingCount = assignmentsWithDates.filter(a => new Date(a.dueDate) >= todayEnd).length;

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

// Open Dashboard
document.getElementById('openDashboard').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
});

// Settings Modal
const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsModal = document.getElementById('closeSettingsModal');

settingsBtn.addEventListener('click', async () => {
  settingsModal.classList.add('show');

  // Reinitialize Feather icons in modal
  if (typeof feather !== 'undefined') {
    feather.replace();
  }

  // Load current API key
  const result = await chrome.storage.local.get(['claudeApiKey']);
  if (result.claudeApiKey) {
    document.getElementById('claudeApiKey').value = result.claudeApiKey;
  }
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
  const icon = button.querySelector('svg') || button.querySelector('i');

  // Add spinning animation
  if (icon) {
    icon.style.animation = 'spin 1s linear infinite';
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
    if (icon) {
      icon.style.animation = '';
    }
    button.disabled = false;
  }
});

// Refresh assignments button
document.getElementById('refreshAssignments').addEventListener('click', () => {
  loadAssignments();
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

// Auto-refresh toggle event listener
document.getElementById('autoRefreshToggle').addEventListener('change', (e) => {
  saveAutoRefreshSetting(e.target.checked);
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

  // Load auto-refresh setting
  await loadAutoRefreshSetting();

  // Trigger initial refresh on extension open
  await refreshCanvasData();
}

initialize();

// Periodic updates
setInterval(updateStatus, 5000);
