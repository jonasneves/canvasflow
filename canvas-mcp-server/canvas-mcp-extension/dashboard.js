// Global state
let canvasData = {
  courses: [],
  allAssignments: [],
  calendarEvents: [],
  upcomingEvents: []
};

let currentFilter = 'all';
let autoRefreshInterval = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  initializeDashboard();
  setupEventListeners();
  loadSettings();
});

async function initializeDashboard() {
  await loadCanvasData();
  renderDashboard();
}

// Event Listeners
function setupEventListeners() {
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('loading');
    await refreshCanvasData();
    btn.classList.remove('loading');
  });

  // Settings button
  document.getElementById('settingsBtn').addEventListener('click', () => {
    openSettingsModal();
  });

  // Settings modal
  document.getElementById('closeSettingsBtn').addEventListener('click', closeSettingsModal);
  document.getElementById('cancelSettingsBtn').addEventListener('click', closeSettingsModal);
  document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

  // Click outside modal to close
  document.querySelector('.modal-overlay').addEventListener('click', closeSettingsModal);

  // Toggle API key visibility
  document.getElementById('toggleApiKeyBtn').addEventListener('click', toggleApiKeyVisibility);

  // Generate insights button
  document.getElementById('generateInsightsBtn').addEventListener('click', generateAIInsights);

  // Assignment filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const filter = e.target.dataset.filter;
      setFilter(filter);
    });
  });
}

// Load Canvas data from background script
async function loadCanvasData() {
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_CANVAS_DATA' }, resolve);
    });

    if (response && response.data) {
      canvasData = {
        courses: response.data.courses || [],
        allAssignments: response.data.allAssignments || [],
        calendarEvents: response.data.calendarEvents || [],
        upcomingEvents: response.data.upcomingEvents || []
      };
    }

    updateStatus(response);
  } catch (error) {
    console.error('Error loading Canvas data:', error);
    updateStatus({ error: error.message });
  }
}

// Refresh Canvas data
async function refreshCanvasData() {
  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'REFRESH_DATA' }, resolve);
    });

    if (response && response.success) {
      canvasData = {
        courses: response.data.courses || [],
        allAssignments: response.data.allAssignments || [],
        calendarEvents: response.data.calendarEvents || [],
        upcomingEvents: response.data.upcomingEvents || []
      };
      renderDashboard();
      updateStatus({ success: true, lastUpdate: new Date() });
    } else {
      updateStatus({ error: response?.error || 'Failed to refresh data' });
    }
  } catch (error) {
    console.error('Error refreshing Canvas data:', error);
    updateStatus({ error: error.message });
  }
}

// Update status indicator
function updateStatus(response) {
  const statusIndicator = document.getElementById('statusIndicator');
  const statusDot = statusIndicator.querySelector('.status-dot');
  const statusText = statusIndicator.querySelector('.status-text');
  const lastSync = document.getElementById('lastSync');

  if (response?.error) {
    statusDot.classList.add('disconnected');
    statusText.textContent = 'Error loading data';
  } else if (canvasData.allAssignments.length === 0) {
    statusDot.classList.add('disconnected');
    statusText.textContent = 'No data available';
  } else {
    statusDot.classList.remove('disconnected');
    statusText.textContent = 'Connected';
  }

  const lastUpdate = response?.lastUpdate || response?.dataLastUpdate;
  if (lastUpdate) {
    const time = new Date(lastUpdate).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
    lastSync.textContent = `Last synced: ${time}`;
  }
}

// Render dashboard
function renderDashboard() {
  renderSummaryCards();
  renderAssignments();
}

// Render summary cards
function renderSummaryCards() {
  const assignments = canvasData.allAssignments || [];
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Calculate stats
  const total = assignments.length;

  const upcoming = assignments.filter(a => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate >= now && dueDate <= weekFromNow && !a.submission?.submitted;
  }).length;

  const overdue = assignments.filter(a => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate < now && !a.submission?.submitted;
  }).length;

  const completed = assignments.filter(a =>
    a.submission?.submitted || a.submission?.workflowState === 'graded'
  ).length;

  // Update DOM
  document.getElementById('totalAssignments').textContent = total;
  document.getElementById('upcomingAssignments').textContent = upcoming;
  document.getElementById('overdueAssignments').textContent = overdue;
  document.getElementById('completedAssignments').textContent = completed;
}

// Render assignments
function renderAssignments() {
  const assignmentsList = document.getElementById('assignmentsList');
  const assignments = filterAssignments(canvasData.allAssignments || []);

  if (assignments.length === 0) {
    assignmentsList.innerHTML = `
      <div class="assignments-empty">
        <p>No assignments found</p>
      </div>
    `;
    return;
  }

  // Sort assignments by due date (earliest first, null dates last)
  const sorted = assignments.sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  assignmentsList.innerHTML = sorted.map(assignment => {
    const status = getAssignmentStatus(assignment);
    const dueText = formatDueDate(assignment.dueDate);
    const badges = getAssignmentBadges(assignment);

    return `
      <div class="assignment-item">
        <div class="assignment-status ${status}"></div>
        <div class="assignment-info">
          <div class="assignment-course">${escapeHtml(assignment.courseName || 'Unknown Course')}</div>
          <div class="assignment-name">${escapeHtml(assignment.name)}</div>
          <div class="assignment-meta">
            ${dueText ? `<div class="assignment-due ${status === 'overdue' ? 'overdue' : status === 'upcoming' ? 'soon' : ''}">${dueText}</div>` : '<div class="assignment-due">No due date</div>'}
            ${assignment.pointsPossible ? `<div class="assignment-meta-item">${assignment.pointsPossible} pts</div>` : ''}
          </div>
        </div>
        ${badges}
      </div>
    `;
  }).join('');
}

// Filter assignments based on current filter
function filterAssignments(assignments) {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  switch (currentFilter) {
    case 'upcoming':
      return assignments.filter(a => {
        if (!a.dueDate) return false;
        const dueDate = new Date(a.dueDate);
        return dueDate >= now && dueDate <= weekFromNow && !a.submission?.submitted;
      });

    case 'overdue':
      return assignments.filter(a => {
        if (!a.dueDate) return false;
        const dueDate = new Date(a.dueDate);
        return dueDate < now && !a.submission?.submitted;
      });

    case 'completed':
      return assignments.filter(a =>
        a.submission?.submitted || a.submission?.workflowState === 'graded'
      );

    case 'all':
    default:
      return assignments;
  }
}

// Set filter
function setFilter(filter) {
  currentFilter = filter;

  // Update active button
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.filter === filter);
  });

  renderAssignments();
}

// Get assignment status
function getAssignmentStatus(assignment) {
  if (!assignment.dueDate) return 'none';

  const now = new Date();
  const dueDate = new Date(assignment.dueDate);
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (assignment.submission?.submitted || assignment.submission?.workflowState === 'graded') {
    return 'completed';
  }

  if (dueDate < now) {
    return 'overdue';
  }

  if (dueDate >= now && dueDate <= weekFromNow) {
    return 'upcoming';
  }

  return 'none';
}

// Format due date
function formatDueDate(dueDate) {
  if (!dueDate) return null;

  const date = new Date(dueDate);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
  } else if (diffDays === 0) {
    return `Due today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays === 1) {
    return `Due tomorrow at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`;
  } else {
    return `Due ${date.toLocaleDateString()}`;
  }
}

// Get assignment badges
function getAssignmentBadges(assignment) {
  const badges = [];

  if (assignment.submission?.submitted) {
    if (assignment.submission.late) {
      badges.push('<span class="assignment-badge late">Submitted Late</span>');
    } else {
      badges.push('<span class="assignment-badge submitted">Submitted</span>');
    }
  }

  if (assignment.submission?.workflowState === 'graded') {
    badges.push('<span class="assignment-badge completed">Graded</span>');
  }

  if (assignment.submission?.missing) {
    badges.push('<span class="assignment-badge missing">Missing</span>');
  }

  return badges.join('');
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Settings Modal
function openSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.add('open');

  // Load current settings
  chrome.storage.local.get(['canvasUrl', 'autoRefresh', 'claudeApiKey'], (result) => {
    document.getElementById('canvasUrlDisplay').value = result.canvasUrl || 'Not configured';
    document.getElementById('autoRefresh').checked = result.autoRefresh || false;
    document.getElementById('claudeApiKey').value = result.claudeApiKey || '';
  });
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('open');
}

function toggleApiKeyVisibility() {
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
}

async function saveSettings() {
  const autoRefresh = document.getElementById('autoRefresh').checked;
  const claudeApiKey = document.getElementById('claudeApiKey').value.trim();

  try {
    await chrome.storage.local.set({
      autoRefresh: autoRefresh,
      claudeApiKey: claudeApiKey
    });

    closeSettingsModal();

    // Update auto-refresh
    setupAutoRefresh(autoRefresh);
  } catch (error) {
    console.error('Error saving settings:', error);
    alert('Failed to save settings');
  }
}

function loadSettings() {
  chrome.storage.local.get(['autoRefresh'], (result) => {
    if (result.autoRefresh) {
      setupAutoRefresh(true);
    }
  });
}

function setupAutoRefresh(enabled) {
  // Clear existing interval
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }

  // Set up new interval if enabled
  if (enabled) {
    autoRefreshInterval = setInterval(() => {
      refreshCanvasData();
    }, 5 * 60 * 1000); // 5 minutes
  }
}

// AI Insights
async function generateAIInsights() {
  const insightsContent = document.getElementById('insightsContent');

  // Prepare summary data
  const assignmentsData = prepareAssignmentsForAI();

  // Show insights guidance
  insightsContent.innerHTML = `
    <div class="insights-loaded">
      <h3>Ask Claude for AI-Powered Insights</h3>
      <p style="margin-bottom: 16px; color: #6B7280;">Claude Desktop already has access to all your Canvas data via MCP. Open Claude and try asking:</p>

      <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #00539B; margin-bottom: 12px;">
        <strong style="color: #00539B;">💡 Priority Recommendations</strong>
        <p style="margin: 8px 0 4px 0; font-size: 14px; color: #374151;">"What assignments should I focus on first based on due dates and importance?"</p>
      </div>

      <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #00539B; margin-bottom: 12px;">
        <strong style="color: #00539B;">📊 Workload Analysis</strong>
        <p style="margin: 8px 0 4px 0; font-size: 14px; color: #374151;">"Analyze my current workload and help me create a study schedule"</p>
      </div>

      <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border-left: 4px solid #00539B; margin-bottom: 16px;">
        <strong style="color: #00539B;">🎯 Study Strategy</strong>
        <p style="margin: 8px 0 4px 0; font-size: 14px; color: #374151;">"What's the best strategy to catch up on my ${assignmentsData.overdue.length} overdue assignments?"</p>
      </div>

      <p style="font-size: 13px; color: #9CA3AF;">
        <strong>Tip:</strong> Claude can see all ${assignmentsData.totalAssignments} assignments across your ${assignmentsData.courses.length} courses, including submission status, due dates, and points. Ask follow-up questions for personalized advice!
      </p>
    </div>
  `;
}

function prepareAssignmentsForAI() {
  const now = new Date();
  const assignments = canvasData.allAssignments || [];

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
    completed: assignments.filter(a =>
      a.submission?.submitted || a.submission?.workflowState === 'graded'
    ).length
  };
}

