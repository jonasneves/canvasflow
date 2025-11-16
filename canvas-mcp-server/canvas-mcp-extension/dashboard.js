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
  await updateInsightsButtonText();
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

  const completed = assignments.filter(a => {
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
  const btn = document.getElementById('generateInsightsBtn');
  const insightsContent = document.getElementById('insightsContent');

  // Check if API key is set
  const result = await chrome.storage.local.get(['claudeApiKey']);

  if (!result.claudeApiKey) {
    // Show MCP guidance if no API key
    const assignmentsData = prepareAssignmentsForAI();
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

        <div style="margin-top: 16px; padding: 12px; background: #FCF7E5; border-radius: 8px; border-left: 4px solid #E89923;">
          <p style="margin: 0; font-size: 13px; color: #374151;">💡 <strong>Want dashboard insights?</strong> Add your Claude API key in settings to get AI-powered insights right here!</p>
        </div>
      </div>
    `;
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

    insightsContent.innerHTML = `
      <div class="insights-loaded fade-in">
        ${formatStructuredInsights(insights)}
      </div>
    `;
  } catch (error) {
    console.error('Error generating insights:', error);
    insightsContent.innerHTML = `
      <div class="insights-error">
        <strong>Failed to generate insights:</strong> ${escapeHtml(error.message)}
        <p style="margin-top: 8px; font-size: 12px;">Check your API key in settings or use Claude Desktop via MCP instead.</p>
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
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: `Analyze this student's Canvas assignments and create a Weekly Battle Plan with specific scheduling recommendations.

Data:
- Total: ${assignmentsData.totalAssignments} assignments
- Courses: ${assignmentsData.courses.join(', ')}
- Due this week: ${assignmentsData.upcoming.length}
- Overdue: ${assignmentsData.overdue.length}
- Completed: ${assignmentsData.completed}

Upcoming (next 7 days):
${assignmentsData.upcoming.slice(0, 5).map(a => `- ${a.name} (${a.course}) - ${new Date(a.dueDate).toLocaleDateString()}, ${a.points}pts`).join('\n')}

Overdue:
${assignmentsData.overdue.slice(0, 5).map(a => `- ${a.name} (${a.course}) - was due ${new Date(a.dueDate).toLocaleDateString()}, ${a.points}pts`).join('\n')}

Create a weekly battle plan with:
- Priority tasks with estimated hours and urgency levels (critical/high/medium/low)
- Workload assessment with total hours needed and intensity level
- Day-by-day schedule for the next 7 days with specific time blocks
- Each day should have: focus area, workload level, and scheduled tasks with time blocks
- Strategic study tips

Be realistic with time estimates. Consider assignment complexity and point values.`
      }],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'assignment_insights',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              priority_tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    task: { type: 'string' },
                    reason: { type: 'string' },
                    urgency: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
                    estimated_hours: { type: 'number' }
                  },
                  required: ['task', 'reason', 'urgency', 'estimated_hours'],
                  additionalProperties: false
                }
              },
              workload_assessment: {
                type: 'object',
                properties: {
                  overall: { type: 'string' },
                  total_hours_needed: { type: 'number' },
                  intensity_level: { type: 'string', enum: ['extreme', 'high', 'moderate', 'manageable'] },
                  recommendations: {
                    type: 'array',
                    items: { type: 'string' }
                  }
                },
                required: ['overall', 'total_hours_needed', 'intensity_level', 'recommendations'],
                additionalProperties: false
              },
              weekly_plan: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    day: { type: 'string' },
                    focus: { type: 'string' },
                    workload: { type: 'string', enum: ['extreme', 'high', 'medium', 'low'] },
                    tasks: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          assignment: { type: 'string' },
                          time_block: { type: 'string' },
                          notes: { type: 'string' }
                        },
                        required: ['assignment', 'time_block', 'notes'],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ['day', 'focus', 'workload', 'tasks'],
                  additionalProperties: false
                }
              },
              study_tips: {
                type: 'array',
                items: { type: 'string' }
              }
            },
            required: ['priority_tasks', 'workload_assessment', 'weekly_plan', 'study_tips'],
            additionalProperties: false
          }
        }
      }
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();
  return JSON.parse(data.content[0].text);
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
    critical: '🔴 Critical',
    high: '🟠 High',
    medium: '🟡 Medium',
    low: '🟢 Low'
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
        <span style="margin-top: 2px;">•</span>
        <span>${escapeHtml(rec)}</span>
      </div>
    `;
  }).join('');

  const priorityTasksHtml = insights.priority_tasks.map(task => {
    return `
      <div style="padding: 16px; background: white; border: 1px solid #E5E7EB; border-left: 4px solid ${urgencyColors[task.urgency]}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <strong style="color: #111827; font-size: 14px; flex: 1;">${escapeHtml(task.task)}</strong>
          <div style="display: flex; align-items: center; gap: 8px; margin-left: 12px;">
            <span style="background: ${urgencyColors[task.urgency]}15; color: ${urgencyColors[task.urgency]}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap;">${urgencyLabels[task.urgency]}</span>
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
          <p style="margin: 0; color: #6B7280; font-size: 12px; font-style: italic;">💡 ${escapeHtml(task.notes)}</p>
        </div>
      `;
    }).join('');

    const tasksCount = day.tasks.length;
    const dayId = `day-${dayIdx}`;

    return `
      <div style="background: white; border-radius: 8px; border: 1px solid #E5E7EB; overflow: hidden; margin-bottom: 12px;">
        <button
          onclick="toggleDayPlan('${dayId}')"
          style="width: 100%; padding: 14px 16px; background: ${dayIdx === 0 || dayIdx === 1 ? '#FAFAFA' : 'white'}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: background 0.2s;"
          onmouseover="this.style.background='#F9FAFB'"
          onmouseout="this.style.background='${dayIdx === 0 || dayIdx === 1 ? '#FAFAFA' : 'white'}'"
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
            <svg id="${dayId}-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" style="transition: transform 0.2s; transform: ${dayIdx < 2 ? 'rotate(180deg)' : 'rotate(0deg)'};">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </button>
        <div id="${dayId}" style="display: ${dayIdx < 2 ? 'block' : 'none'}; padding: 16px; border-top: 1px solid #E5E7EB; background: #FAFAFA;">
          ${tasksCount > 0 ? tasksHtml : '<p style="color: #9CA3AF; text-align: center; padding: 20px 0; font-size: 13px;">No sessions scheduled - rest day!</p>'}
        </div>
      </div>
    `;
  }).join('');

  const studyTipsHtml = insights.study_tips.map(tip => {
    return `
      <div style="margin: 10px 0; font-size: 14px; color: #374151; display: flex; align-items: start; gap: 10px;">
        <span style="color: #00539B; font-size: 18px; margin-top: -2px;">✓</span>
        <span style="flex: 1;">${escapeHtml(tip)}</span>
      </div>
    `;
  }).join('');

  return `
    <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00539B" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
        Workload Overview
      </h4>
      <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.6; opacity: 0.95;">${escapeHtml(insights.workload_assessment.overall)}</p>
      <div style="background: rgba(255, 255, 255, 0.15); padding: 12px; border-radius: 8px; backdrop-filter: blur(10px);">
        ${recommendationsHtml}
      </div>
    </div>

    <!-- Priority Tasks -->
    <h4 style="margin: 24px 0 12px 0; font-size: 16px; color: #111827;">🎯 Priority Tasks</h4>
    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
      ${priorityTasksHtml}
    </div>

    <!-- Daily Schedule -->
    <h4 style="margin: 24px 0 12px 0; font-size: 16px; color: #111827;">📅 This Week's Schedule</h4>
    <div style="margin-bottom: 24px;">
      ${weeklyPlanHtml}
    </div>

    <!-- Study Tips -->
    <h4 style="margin: 24px 0 12px 0; font-size: 16px; color: #111827;">💡 Strategic Study Tips</h4>
    <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border: 1px solid #E5E7EB;">
      ${studyTipsHtml}
    </div>

    <script>
      function toggleDayPlan(dayId) {
        const dayContent = document.getElementById(dayId);
        const icon = document.getElementById(dayId + '-icon');
        if (dayContent.style.display === 'none') {
          dayContent.style.display = 'block';
          icon.style.transform = 'rotate(180deg)';
        } else {
          dayContent.style.display = 'none';
          icon.style.transform = 'rotate(0deg)';
        }
      }
    </script>
  `;
}

