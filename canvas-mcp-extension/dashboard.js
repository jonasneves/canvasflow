// Global state
let canvasData = {
  courses: [],
  allAssignments: [],
  calendarEvents: [],
  upcomingEvents: []
};

let currentFilter = 'all';
let autoRefreshInterval = null;
let assignmentTimeRange = { weeksBefore: 2, weeksAfter: 2 }; // Default 2 weeks before and after

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await loadTimeRangeSettings();
  initializeDashboard();
  setupEventListeners();
  loadSettings();
});

async function initializeDashboard() {
  await loadCanvasData();

  // Auto-refresh if no data is loaded
  if (canvasData.allAssignments.length === 0) {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('loading');
    await refreshCanvasData();
    btn.classList.remove('loading');
  }

  renderDashboard();
  await updateInsightsButtonText();
  await loadSavedInsights();
}

// Update insights button text based on API key
async function updateInsightsButtonText() {
  const result = await chrome.storage.local.get(['claudeApiKey']);
  const btnText = document.getElementById('generateInsightsBtnText');

  if (result.claudeApiKey) {
    btnText.textContent = 'Generate AI Insights';
  } else {
    btnText.textContent = 'Show Question Suggestions';
  }
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

  // Settings modal close handlers
  document.getElementById('closeSettingsBtn').addEventListener('click', closeSettingsModal);
  document.getElementById('cancelSettingsBtn').addEventListener('click', closeSettingsModal);
  document.getElementById('saveSettingsBtn').addEventListener('click', closeSettingsModal);

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

  // Calculate time range boundaries
  const timeRangeStart = new Date(now.getTime() - assignmentTimeRange.weeksBefore * 7 * 24 * 60 * 60 * 1000);
  const timeRangeEnd = new Date(now.getTime() + assignmentTimeRange.weeksAfter * 7 * 24 * 60 * 60 * 1000);

  // Filter to assignments within time range
  const timeFilteredAssignments = assignments.filter(a => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate >= timeRangeStart && dueDate <= timeRangeEnd;
  });

  // Calculate stats
  const total = timeFilteredAssignments.length;

  const upcoming = timeFilteredAssignments.filter(a => {
    const dueDate = new Date(a.dueDate);
    return dueDate >= now && dueDate <= weekFromNow && !a.submission?.submitted;
  }).length;

  const overdue = timeFilteredAssignments.filter(a => {
    const dueDate = new Date(a.dueDate);
    return dueDate < now && !a.submission?.submitted;
  }).length;

  const completed = timeFilteredAssignments.filter(a => {
    return a.submission?.submitted || a.submission?.workflowState === 'graded';
  }).length;

  // Update DOM with animation
  animateValue('totalAssignments', 0, total, 800);
  animateValue('upcomingAssignments', 0, upcoming, 800);
  animateValue('overdueAssignments', 0, overdue, 800);
  animateValue('completedAssignments', 0, completed, 800);

  // Make cards clickable
  setupSummaryCardClicks();
}

// Animate number counting
function animateValue(id, start, end, duration) {
  const element = document.getElementById(id);
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.round(current);
  }, 16);
}

// Setup click handlers for summary cards
function setupSummaryCardClicks() {
  const summaryCards = document.querySelectorAll('.summary-card');

  summaryCards[0].onclick = () => setFilter('all'); // Total
  summaryCards[1].onclick = () => setFilter('upcoming'); // Upcoming
  summaryCards[2].onclick = () => setFilter('overdue'); // Overdue
  summaryCards[3].onclick = () => setFilter('completed'); // Completed

  // Add cursor pointer style
  summaryCards.forEach(card => {
    card.style.cursor = 'pointer';
  });
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
    const canvasUrl = assignment.htmlUrl || assignment.html_url || '';

    return `
      <div class="assignment-item">
        <div class="assignment-status ${status}"></div>
        <div class="assignment-info">
          <div class="assignment-course">${escapeHtml(assignment.courseName || 'Unknown Course')}</div>
          <div class="assignment-name-row">
            <div class="assignment-name">${escapeHtml(assignment.name)}</div>
            ${canvasUrl ? `<a href="${escapeHtml(canvasUrl)}" target="_blank" rel="noopener noreferrer" class="canvas-link" title="Open in Canvas">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>` : ''}
          </div>
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

  // Calculate time range boundaries
  const timeRangeStart = new Date(now.getTime() - assignmentTimeRange.weeksBefore * 7 * 24 * 60 * 60 * 1000);
  const timeRangeEnd = new Date(now.getTime() + assignmentTimeRange.weeksAfter * 7 * 24 * 60 * 60 * 1000);

  // Apply time range filter first
  const timeFilteredAssignments = assignments.filter(a => {
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate >= timeRangeStart && dueDate <= timeRangeEnd;
  });

  switch (currentFilter) {
    case 'upcoming':
      return timeFilteredAssignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= now && dueDate <= weekFromNow && !a.submission?.submitted;
      });

    case 'overdue':
      return timeFilteredAssignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate < now && !a.submission?.submitted;
      });

    case 'completed':
      return timeFilteredAssignments.filter(a =>
        a.submission?.submitted || a.submission?.workflowState === 'graded'
      );

    case 'all':
    default:
      return [...timeFilteredAssignments, ...assignments.filter(a => !a.dueDate)];
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
    return `Due ${date.toLocaleDateString()}`;
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
}

function closeSettingsModal() {
  const modal = document.getElementById('settingsModal');
  modal.classList.remove('open');
}

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

function loadSettings() {
  chrome.storage.local.get(['autoRefresh'], (result) => {
    if (result.autoRefresh) {
      setupAutoRefresh(true);
    }
  });

  // Listen for time range setting changes
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && (changes.assignmentWeeksBefore || changes.assignmentWeeksAfter)) {
      // Reload time range settings and re-render
      loadTimeRangeSettings().then(() => {
        renderDashboard();
      });
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

// Update insights timestamp display
function updateInsightsTimestamp(timestamp) {
  // Find or create timestamp element
  let timestampEl = document.getElementById('dashboardInsightsTimestamp');
  if (!timestampEl) {
    timestampEl = document.createElement('div');
    timestampEl.id = 'dashboardInsightsTimestamp';
    timestampEl.style.cssText = 'text-align: center; font-size: 12px; color: #6B7280; margin-top: 12px;';
    const insightsSection = document.getElementById('insightsSection');
    const insightsContent = document.getElementById('insightsContent');
    insightsSection.insertBefore(timestampEl, insightsContent);
  }

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

    timestampEl.innerHTML = `Last generated: ${timeAgo}`;
    timestampEl.style.display = 'block';
  } else {
    timestampEl.style.display = 'none';
  }
}

// Load saved insights from storage (dashboard-specific)
async function loadSavedInsights() {
  try {
    const result = await chrome.storage.local.get(['dashboardInsights', 'dashboardInsightsTimestamp']);
    if (result.dashboardInsights) {
      const insightsContent = document.getElementById('insightsContent');
      insightsContent.innerHTML = `
        <div class="insights-loaded">
          ${result.dashboardInsights}
        </div>
      `;

      // Update timestamp if available
      if (result.dashboardInsightsTimestamp) {
        updateInsightsTimestamp(result.dashboardInsightsTimestamp);
      }
    }
  } catch (error) {
    console.error('Error loading saved insights:', error);
  }
}

// AI Insights
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

        <div style="margin-top: 16px; padding: 12px; background: #FCF7E5; border-radius: 8px; border-left: 4px solid #E89923;">
          <p style="margin: 0; font-size: 13px; color: #374151;">💡 <strong>Want dashboard insights?</strong> Add your Claude API key in settings to get AI-powered insights right here!</p>
        </div>
      </div>
    `;
    insightsContent.innerHTML = mcpGuidance;

    // Don't save MCP guidance to storage - it's just a placeholder
    // updateInsightsTimestamp(null); // Hide timestamp for MCP guidance

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

    // Save insights and timestamp to storage (dashboard-specific)
    const timestamp = Date.now();
    await chrome.storage.local.set({
      dashboardInsights: formattedInsights,
      dashboardInsightsTimestamp: timestamp
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

    // Don't save error state to storage - let user retry
    // updateInsightsTimestamp(null); // Hide timestamp for errors
  } finally {
    btn.disabled = false;
  }
}

function prepareAssignmentsForAI() {
  const now = new Date();

  // Apply the SAME time range filter as Dashboard display
  const timeRangeStart = new Date(now.getTime() - assignmentTimeRange.weeksBefore * 7 * 24 * 60 * 60 * 1000);
  const timeRangeEnd = new Date(now.getTime() + assignmentTimeRange.weeksAfter * 7 * 24 * 60 * 60 * 1000);

  // Filter assignments to only those within the configured time range
  const assignments = (canvasData.allAssignments || []).filter(a => {
    if (!a.dueDate) return true; // Include assignments without due dates
    const dueDate = new Date(a.dueDate);
    return dueDate >= timeRangeStart && dueDate <= timeRangeEnd;
  });

  console.log('[prepareAssignmentsForAI] Time range:', timeRangeStart.toLocaleDateString(), 'to', timeRangeEnd.toLocaleDateString());
  console.log('[prepareAssignmentsForAI] Filtered assignments:', assignments.length, 'of', (canvasData.allAssignments || []).length, 'total');

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

// Call Claude API with structured outputs
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
  "weekly_plan": [
    {
      "day": "Monday, Nov 18",
      "focus": "main goal for the day",
      "workload": "extreme|high|medium|low",
      "tasks": [
        {
          "assignment": "assignment name",
          "time_block": "9:00 AM - 12:00 PM",
          "notes": "specific guidance for this work session"
        }
      ]
    }
  ],
  "study_tips": ["tip 1", "tip 2", "tip 3", "tip 4"]
}

Return ONLY the JSON object, no other text. Be realistic with time estimates. Create a 7-day plan starting from today.`
      }]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  const textContent = data.content[0].text;

  // Extract JSON from the response (Claude might wrap it in markdown code blocks)
  let jsonText = textContent;

  // Remove markdown code blocks if present
  const codeBlockMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1];
  }

  // Find the outermost JSON object
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found in response');
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Attempted to parse:', jsonMatch[0].substring(0, 500));
    throw new Error(`Failed to parse AI response: ${parseError.message}`);
  }
}

// Helper function to create Lucide icon SVG
function createLucideIcon(iconName, size = 16, color = 'currentColor') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; flex-shrink: 0;">
    ${getLucideIconPaths(iconName)}
  </svg>`;
}

function getLucideIconPaths(iconName) {
  const icons = {
    'activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    'layers': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'
  };
  return icons[iconName] || '';
}

// Format structured insights for display
function formatStructuredInsights(insights) {
  const urgencyColors = {
    critical: '#C84E00',
    high: '#E89923',
    medium: '#E89923',
    low: '#339898'
  };

  const urgencyLabels = {
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  };

  const workloadColors = {
    extreme: '#EF4444',
    high: '#F97316',
    medium: '#FBBF24',
    low: '#10B981'
  };

  const intensityColors = {
    extreme: '#DC2626',
    high: '#EA580C',
    moderate: '#FBBF24',
    manageable: '#059669'
  };

  const recommendationsHtml = insights.workload_assessment.recommendations.map(rec => {
    return `
      <div style="margin: 8px 0; font-size: 14px; display: flex; align-items: start; gap: 8px;">
        ${createLucideIcon('chevron-right', 14, 'rgba(255,255,255,0.8)')}
        <span>${escapeHtml(rec)}</span>
      </div>
    `;
  }).join('');

  const priorityTasksHtml = insights.priority_tasks.map(task => {
    return `
      <div style="padding: 16px; background: white; border: 1px solid #E5E7EB; border-left: 4px solid ${urgencyColors[task.urgency]}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <strong style="color: #111827; font-size: 14px; flex: 1;">${escapeHtml(task.task)}</strong>
          <div style="display: flex; align-items: center; gap: 8px; margin-left: 12px; flex-shrink: 0;">
            <span style="background: ${urgencyColors[task.urgency]}15; color: ${urgencyColors[task.urgency]}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: ${urgencyColors[task.urgency]}; flex-shrink: 0;"></span>
              ${urgencyLabels[task.urgency]}
            </span>
            <span style="background: #F3F4F6; color: #374151; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${task.estimated_hours}h</span>
          </div>
        </div>
        <p style="margin: 0; color: #6B7280; font-size: 13px; line-height: 1.5;">${escapeHtml(task.reason)}</p>
      </div>
    `;
  }).join('');

  // Generate Weekly Plan HTML
  const weeklyPlanHtml = insights.weekly_plan.map((day, dayIdx) => {
    const tasksHtml = day.tasks.map(task => {
      return `
        <div style="padding: 12px; background: white; border-left: 3px solid #00539B; border-radius: 4px; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 6px;">
            <strong style="color: #111827; font-size: 13px; flex: 1;">${escapeHtml(task.assignment)}</strong>
            <span style="background: #E2E6ED; color: #00539B; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; white-space: nowrap; margin-left: 8px;">${escapeHtml(task.time_block)}</span>
          </div>
          <p style="margin: 0; color: #6B7280; font-size: 12px; font-style: italic; display: flex; align-items: start; gap: 6px;">
            ${createLucideIcon('lightbulb', 12, '#6B7280')}
            <span>${escapeHtml(task.notes)}</span>
          </p>
        </div>
      `;
    }).join('');

    const tasksCount = day.tasks.length;
    const dayId = `day-${dayIdx}`;
    const defaultBg = dayIdx === 0 || dayIdx === 1 ? '#FAFAFA' : 'white';

    return `
      <div style="background: white; border-radius: 8px; border: 1px solid #E5E7EB; overflow: hidden; margin-bottom: 12px;">
        <button
          class="day-plan-toggle"
          data-day-id="${dayId}"
          data-default-bg="${defaultBg}"
          style="width: 100%; padding: 14px 16px; background: ${defaultBg}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: background 0.2s;"
        >
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 10px; height: 10px; border-radius: 50%; background: ${workloadColors[day.workload]}; flex-shrink: 0;"></div>
            <div style="text-align: left;">
              <div style="font-weight: 700; color: #111827; font-size: 15px;">${escapeHtml(day.day)}</div>
              <div style="font-size: 13px; color: #6B7280; margin-top: 2px;">${escapeHtml(day.focus)}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="text-align: right;">
              <div style="font-size: 12px; font-weight: 600; color: #374151;">${tasksCount} session${tasksCount !== 1 ? 's' : ''}</div>
              <div style="font-size: 11px; color: #9CA3AF; text-transform: capitalize;">${day.workload} load</div>
            </div>
            <svg class="day-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" style="transition: transform 0.2s; transform: ${dayIdx < 2 ? 'rotate(180deg)' : 'rotate(0deg)'};">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </button>
        <div id="${dayId}" class="day-content" style="display: ${dayIdx < 2 ? 'block' : 'none'}; padding: 16px; border-top: 1px solid #E5E7EB; background: #FAFAFA;">
          ${tasksCount > 0 ? tasksHtml : '<p style="color: #9CA3AF; text-align: center; padding: 20px 0; font-size: 13px;">No sessions scheduled - rest day!</p>'}
        </div>
      </div>
    `;
  }).join('');

  const studyTipsHtml = insights.study_tips.map(tip => {
    return `
      <div style="margin: 10px 0; font-size: 14px; color: #374151; display: flex; align-items: start; gap: 10px;">
        <span style="margin-top: 2px;">•</span>
        <span style="flex: 1;">${escapeHtml(tip)}</span>
      </div>
    `;
  }).join('');

  // Setup event listeners after content is rendered
  setTimeout(() => {
    document.querySelectorAll('.day-plan-toggle').forEach(btn => {
      btn.addEventListener('click', function() {
        const dayId = this.dataset.dayId;
        const defaultBg = this.dataset.defaultBg;
        const dayContent = document.getElementById(dayId);
        const icon = this.querySelector('.day-icon');

        if (dayContent.style.display === 'none') {
          dayContent.style.display = 'block';
          icon.style.transform = 'rotate(180deg)';
        } else {
          dayContent.style.display = 'none';
          icon.style.transform = 'rotate(0deg)';
        }
      });

      // Hover effects
      btn.addEventListener('mouseenter', function() {
        this.style.background = '#F9FAFB';
      });
      btn.addEventListener('mouseleave', function() {
        this.style.background = this.dataset.defaultBg;
      });
    });
  }, 0);

  return `
    <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
      ${createLucideIcon('layers', 24, '#00539B')}
      Weekly Battle Plan
    </h3>

    <!-- Workload Stats -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
      <div style="background: white; border-radius: 8px; padding: 14px; border: 1px solid #E5E7EB;">
        <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.5px;">Total Hours</div>
        <div style="font-size: 26px; font-weight: 700; color: #00539B;">${insights.workload_assessment.total_hours_needed}h</div>
      </div>
      <div style="background: white; border-radius: 8px; padding: 14px; border: 1px solid #E5E7EB;">
        <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.5px;">Intensity</div>
        <div style="font-size: 18px; font-weight: 700; color: ${intensityColors[insights.workload_assessment.intensity_level]}; text-transform: capitalize;">${insights.workload_assessment.intensity_level}</div>
      </div>
      <div style="background: white; border-radius: 8px; padding: 14px; border: 1px solid #E5E7EB;">
        <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.5px;">Critical Tasks</div>
        <div style="font-size: 26px; font-weight: 700; color: #C84E00;">${insights.priority_tasks.filter(t => t.urgency === 'critical').length}</div>
      </div>
    </div>

    <!-- Workload Assessment -->
    <div style="background: linear-gradient(135deg, #00539B 0%, #005587 100%); padding: 20px; border-radius: 12px; color: white; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 83, 155, 0.2);">
      <h4 style="margin: 0 0 8px 0; font-size: 16px; display: flex; align-items: center; gap: 8px;">
        ${createLucideIcon('activity', 20, 'currentColor')}
        Workload Overview
      </h4>
      <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; opacity: 0.95;">${escapeHtml(insights.workload_assessment.overall)}</p>
      <div style="background: rgba(255, 255, 255, 0.15); padding: 12px; border-radius: 8px; backdrop-filter: blur(10px);">
        ${recommendationsHtml}
      </div>
    </div>

    <!-- Priority Tasks -->
    <h4 style="margin: 24px 0 12px 0; font-size: 16px; color: #111827; display: flex; align-items: center; gap: 8px;">
      ${createLucideIcon('target', 18, '#111827')}
      Priority Tasks
    </h4>
    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
      ${priorityTasksHtml}
    </div>

    <!-- Daily Schedule -->
    <h4 style="margin: 24px 0 12px 0; font-size: 16px; color: #111827; display: flex; align-items: center; gap: 8px;">
      ${createLucideIcon('calendar', 18, '#111827')}
      This Week's Schedule
    </h4>
    <div style="margin-bottom: 24px;">
      ${weeklyPlanHtml}
    </div>

    <!-- Study Tips -->
    <h4 style="margin: 24px 0 12px 0; font-size: 16px; color: #111827; display: flex; align-items: center; gap: 8px;">
      ${createLucideIcon('lightbulb', 18, '#111827')}
      Strategic Study Tips
    </h4>
    <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border: 1px solid #E5E7EB;">
      ${studyTipsHtml}
    </div>
  `;
}

