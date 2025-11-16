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
  chrome.storage.local.get(['claudeApiKey', 'canvasUrl', 'autoRefresh'], (result) => {
    document.getElementById('claudeApiKey').value = result.claudeApiKey || '';
    document.getElementById('canvasUrlDisplay').value = result.canvasUrl || 'Not configured';
    document.getElementById('autoRefresh').checked = result.autoRefresh || false;
  });
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('open');
}

async function saveSettings() {
  const claudeApiKey = document.getElementById('claudeApiKey').value.trim();
  const autoRefresh = document.getElementById('autoRefresh').checked;

  try {
    await chrome.storage.local.set({
      claudeApiKey: claudeApiKey,
      autoRefresh: autoRefresh
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
  const btn = document.getElementById('generateInsightsBtn');
  const insightsContent = document.getElementById('insightsContent');

  // Check if API key is set
  const result = await chrome.storage.local.get(['claudeApiKey']);
  if (!result.claudeApiKey) {
    insightsContent.innerHTML = `
      <div class="insights-error">
        Please configure your Claude API key in settings to generate AI insights.
      </div>
    `;
    return;
  }

  // Disable button and show loading
  btn.disabled = true;
  insightsContent.innerHTML = `
    <div class="insights-loading">
      <div class="spinner"></div>
      <p>Generating AI insights...</p>
    </div>
  `;

  try {
    // Prepare data for Claude
    const assignmentsData = prepareAssignmentsForAI();

    // Call Claude API
    const insights = await callClaudeAPI(result.claudeApiKey, assignmentsData);

    // Display insights
    insightsContent.innerHTML = `
      <div class="insights-loaded">
        ${formatInsights(insights)}
      </div>
    `;
  } catch (error) {
    console.error('Error generating insights:', error);
    insightsContent.innerHTML = `
      <div class="insights-error">
        Failed to generate insights: ${escapeHtml(error.message)}
      </div>
    `;
  } finally {
    btn.disabled = false;
  }
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

async function callClaudeAPI(apiKey, assignmentsData) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `You are an AI study assistant analyzing a student's Canvas assignments. Based on the following data, provide concise, actionable insights and recommendations.

Assignment Data:
- Total Assignments: ${assignmentsData.totalAssignments}
- Courses: ${assignmentsData.courses.join(', ')}
- Upcoming (due within 7 days): ${assignmentsData.upcoming.length}
- Overdue: ${assignmentsData.overdue.length}
- Completed: ${assignmentsData.completed}

Upcoming Assignments:
${assignmentsData.upcoming.map(a => `- ${a.name} (${a.course}) - Due: ${new Date(a.dueDate).toLocaleDateString()}, ${a.points || 0} pts`).join('\n')}

Overdue Assignments:
${assignmentsData.overdue.map(a => `- ${a.name} (${a.course}) - Due: ${new Date(a.dueDate).toLocaleDateString()}, ${a.points || 0} pts`).join('\n')}

Please provide:
1. Priority Recommendations: Which assignments should be tackled first and why
2. Workload Analysis: Assessment of the current workload balance
3. Study Tips: Specific recommendations based on the due dates and assignment distribution

Keep your response concise and formatted in markdown. Use headings (###) and bullet points.`
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to call Claude API');
  }

  const data = await response.json();
  return data.content[0].text;
}

function formatInsights(insights) {
  // Convert markdown to HTML (basic implementation)
  let html = insights
    // Headers
    .replace(/### (.*?)$/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Bullet points
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  // Wrap list items in ul
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');

  return html;
}
