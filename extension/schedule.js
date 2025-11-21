// Global state
let canvasData = {
  courses: [],
  allAssignments: [],
  calendarEvents: [],
  upcomingEvents: []
};

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
  // Stale-while-revalidate: Load cached data first for instant display
  await loadCanvasData();
  renderDashboard();

  // Then trigger background refresh to get fresh data (don't await)
  refreshCanvasData();

  await updateInsightsButtonText();
  await loadSavedInsights();
}

// Update insights button text based on API key
async function updateInsightsButtonText() {
  const result = await chrome.storage.local.get(['claudeApiKey']);
  const btnText = document.getElementById('generateInsightsBtnText');

  if (result.claudeApiKey) {
    btnText.textContent = 'Generate Schedule';
  } else {
    btnText.textContent = 'Configure API Key';
  }
}

// Event Listeners
function setupEventListeners() {
  // Generate insights button
  document.getElementById('generateInsightsBtn').addEventListener('click', generateAIInsights);
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
    updateStatus({ error: error.message });
  }
}

// Update status indicator
function updateStatus(response) {
  // Status indicators have been removed for a cleaner header
  // This function is kept for compatibility but does nothing
  if (response?.error) {
  }
}

// Render dashboard
function renderDashboard() {
  // Dashboard now focuses only on Weekly Battle Plan - no summary cards or assignments list
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Load time range settings
async function loadTimeRangeSettings() {
  try {
    const result = await chrome.storage.local.get(['assignmentWeeksBefore', 'assignmentWeeksAfter']);
    assignmentTimeRange = {
      weeksBefore: result.assignmentWeeksBefore || 1,
      weeksAfter: result.assignmentWeeksAfter || 1
    };
  } catch (error) {
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
    if (namespace === 'local') {
      if (changes.assignmentWeeksBefore || changes.assignmentWeeksAfter) {
        // Reload time range settings and re-render
        loadTimeRangeSettings().then(() => {
          renderDashboard();
        });
      }

      if (changes.canvasUrl) {
        // Canvas URL changed - refresh data and re-render
        const oldUrl = changes.canvasUrl.oldValue;
        const newUrl = changes.canvasUrl.newValue;

        if (oldUrl !== newUrl && newUrl) {
          console.log('Canvas URL changed - refreshing dashboard data');

          // Show loading state
          const container = document.querySelector('.schedule-dashboard');
          if (container) {
            container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><div>Loading data from new Canvas instance...</div></div>';
          }

          // Wait for background script to refresh, then reload
          setTimeout(() => {
            loadAllData();
          }, 2000);
        }
      }
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
  const timestampEl = document.getElementById('dashboardInsightsTimestamp');
  if (!timestampEl) return;

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

    timestampEl.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.7;">
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
      </svg>
      <span>Updated ${timeAgo}</span>
    `;
    timestampEl.style.cssText = 'font-size: 11px; color: #9CA3AF; font-weight: 500; display: flex; align-items: center; gap: 4px; margin-top: 4px;';
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

      // Setup event listeners AFTER HTML is inserted into DOM
      setupDayToggleListeners();
      setupTaskCardClickListeners();

      // Update timestamp if available
      if (result.dashboardInsightsTimestamp) {
        updateInsightsTimestamp(result.dashboardInsightsTimestamp);
      }
    }
  } catch (error) {
  }
}

// AI Insights
async function generateAIInsights() {
  const btn = document.getElementById('generateInsightsBtn');
  const insightsContent = document.getElementById('insightsContent');

  // Check if API key is set first
  const result = await chrome.storage.local.get(['claudeApiKey']);

  if (!result.claudeApiKey) {
    // Show settings prompt if no API key (no need to refresh data)
    const settingsPrompt = `
      <div class="insights-loaded" style="text-align: center; padding: 60px 20px;">
        <h3 style="margin-bottom: 16px; color: #111827; font-size: 24px;">GitHub Token Required</h3>
        <p style="margin-bottom: 32px; color: #6B7280; font-size: 16px; max-width: 500px; margin-left: auto; margin-right: auto; line-height: 1.6;">
          To generate AI-powered weekly schedules and study insights, you need to configure your GitHub token.
        </p>
        <button id="openSettingsBtn" style="
          background: #1e3a5f;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        ">
          Open Settings
        </button>
        <p style="margin-top: 20px; font-size: 14px; color: #9CA3AF;">
          Don't have a token? <a href="https://github.com/settings/tokens" target="_blank" style="color: #1e3a5f; text-decoration: underline;">Get one from GitHub</a>
        </p>
      </div>
    `;
    insightsContent.innerHTML = settingsPrompt;

    // Add event listeners to the button
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    openSettingsBtn.addEventListener('click', async () => {
      // Store a flag to open settings modal when sidepanel opens
      await chrome.storage.local.set({ openSettingsOnLoad: true });
      // Get current window to open sidepanel
      const currentWindow = await chrome.windows.getCurrent();
      await chrome.sidePanel.open({ windowId: currentWindow.id });
    });
    openSettingsBtn.addEventListener('mouseover', () => {
      openSettingsBtn.style.background = '#004080';
    });
    openSettingsBtn.addEventListener('mouseout', () => {
      openSettingsBtn.style.background = '#1e3a5f';
    });

    return;
  }

  // Refresh Canvas data to ensure we have the latest assignments
  btn.disabled = true;
  btn.classList.add('loading');
  insightsContent.innerHTML = `
    <div class="insights-loading">
      <div class="spinner"></div>
      <p>Refreshing Canvas data...</p>
    </div>
  `;

  try {
    await refreshCanvasData();
  } catch (error) {
    // Continue anyway with cached data
  }

  // Generate insights with Claude API (data already refreshed above)
  insightsContent.innerHTML = `
    <div class="insights-loading">
      <div class="spinner"></div>
      <p>Analyzing your assignments with AI...</p>
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

    // Setup event listeners AFTER HTML is inserted into DOM
    setupDayToggleListeners();
    setupTaskCardClickListeners();

    // Save insights and timestamp to storage (dashboard-specific)
    const timestamp = Date.now();
    await chrome.storage.local.set({
      dashboardInsights: formattedInsights,
      dashboardInsightsTimestamp: timestamp
    });

    // Update timestamp display
    updateInsightsTimestamp(timestamp);

  } catch (error) {
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
    btn.classList.remove('loading');
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

// Phase 4: Use shared Claude client with AI Router for model selection and fallback
async function callClaudeWithStructuredOutput(apiKey, assignmentsData) {
  const result = await window.ClaudeClient.callClaudeWithRouter(
    apiKey,
    assignmentsData,
    window.AISchemas.DASHBOARD_SCHEDULE_SCHEMA,
    'dashboard'
  );

  // Store model info for display
  window.lastAIModelUsed = result.model;
  window.lastAIDuration = result.duration;
  window.lastAIFailures = result.failures;

  return result.data;
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

// Setup task card click listeners (must be called AFTER HTML is in DOM)
function setupTaskCardClickListeners() {
  document.querySelectorAll('.schedule-task-card.clickable').forEach(card => {
    card.addEventListener('click', function() {
      const url = this.dataset.url;
      if (url) {
        window.open(url, '_blank');
      }
    });
  });
}

// Setup day toggle event listeners (must be called AFTER HTML is in DOM)
function setupDayToggleListeners() {
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
}

// Helper function to find assignment URL by fuzzy matching name with scoring
function findAssignmentUrl(assignmentName) {
  if (!canvasData.allAssignments || canvasData.allAssignments.length === 0) {
    return null;
  }

  const cleanName = assignmentName.toLowerCase().trim();

  // Calculate match score for each assignment
  const scored = canvasData.allAssignments
    .filter(a => a.name && a.url)
    .map(assignment => {
      const aName = assignment.name.toLowerCase().trim();
      let score = 0;

      // Exact match = 100 points
      if (aName === cleanName) {
        score = 100;
      }
      // One contains the other = 80 points
      else if (aName.includes(cleanName) || cleanName.includes(aName)) {
        score = 80;
      }
      // Word-based matching with high threshold
      else {
        const aiWords = cleanName.split(/\s+/).filter(w => w.length > 3);
        const assignmentWords = aName.split(/\s+/).filter(w => w.length > 3);

        if (aiWords.length > 0 && assignmentWords.length > 0) {
          // Count how many AI words appear in the assignment name
          const matchingWords = aiWords.filter(word =>
            assignmentWords.some(aWord => aWord.includes(word) || word.includes(aWord))
          );

          // Require at least 70% of words to match for medium confidence
          const matchRatio = matchingWords.length / aiWords.length;
          if (matchRatio >= 0.7) {
            score = matchRatio * 60; // Max 60 points for word matching
          }
        }
      }

      return { assignment, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // Only return if we have a confident match (score >= 70)
  if (scored.length > 0 && scored[0].score >= 70) {
    return scored[0].assignment.url;
  }

  return null;
}

// Format structured insights for display (Dashboard focuses ONLY on weekly schedule)
function formatStructuredInsights(insights) {
  // Phase 3: Removed hardcoded color maps - using mappers instead

  // Generate Weekly Plan HTML
  const weeklyPlanHtml = insights.weekly_plan.map((day, dayIdx) => {
    const tasksHtml = day.tasks.map(task => {
      // Phase 3: Format time blocks from structured start_hour + duration_hours
      const timeBlock = window.AIMappers.formatTimeBlock(task.start_hour, task.duration_hours);

      // Find assignment URL for clickable link
      const assignmentUrl = findAssignmentUrl(task.assignment);
      const clickableClass = assignmentUrl ? ' clickable' : '';
      const dataUrlAttr = assignmentUrl ? ` data-url="${escapeHtml(assignmentUrl)}"` : '';

      return `
        <div class="schedule-task-card${clickableClass}"${dataUrlAttr}>
          <div class="task-header">
            <strong class="task-title">${escapeHtml(task.assignment)}</strong>
            <span class="task-time-badge">${timeBlock}</span>
          </div>
          <p class="task-notes">
            ${createLucideIcon('lightbulb', 14, '#6B7280')}
            <span>${escapeHtml(task.notes)}</span>
          </p>
        </div>
      `;
    }).join('');

    const tasksCount = day.tasks.length;
    const dayId = `day-${dayIdx}`;
    const defaultBg = dayIdx === 0 || dayIdx === 1 ? '#FAFAFA' : 'white';

    // Phase 3: Map workload_score (0-3) to label and color
    const workloadLabel = window.AIMappers.mapWorkloadToLabel(day.workload_score);
    const workloadColor = window.AIMappers.mapWorkloadToColor(day.workload_score);

    return `
      <div style="background: white; border-radius: 10px; border: 1px solid #E5E7EB; overflow: hidden; margin-bottom: 16px;">
        <button
          class="day-plan-toggle"
          data-day-id="${dayId}"
          data-default-bg="${defaultBg}"
          style="width: 100%; padding: 18px 24px; background: ${defaultBg}; border: none; cursor: pointer; display: flex; align-items: center; justify-content: space-between; transition: background 0.2s;"
        >
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 12px; height: 12px; border-radius: 50%; background: ${workloadColor}; flex-shrink: 0;"></div>
            <div style="text-align: left;">
              <div style="font-weight: 700; color: #111827; font-size: 18px;">${escapeHtml(day.day)}</div>
              <div style="font-size: 15px; color: #6B7280; margin-top: 4px;">${escapeHtml(day.focus)}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="text-align: right;">
              <div style="font-size: 14px; font-weight: 600; color: #374151;">${tasksCount} session${tasksCount !== 1 ? 's' : ''}</div>
              <div style="font-size: 13px; color: #9CA3AF; text-transform: capitalize; margin-top: 2px;">${workloadLabel} load</div>
            </div>
            <svg class="day-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" style="transition: transform 0.2s; transform: ${dayIdx < 2 ? 'rotate(180deg)' : 'rotate(0deg)'};">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
        </button>
        <div id="${dayId}" class="day-content" style="display: ${dayIdx < 2 ? 'block' : 'none'}; padding: 24px; border-top: 1px solid #E5E7EB; background: #FAFAFA;">
          ${tasksCount > 0 ? tasksHtml : '<p style="color: #9CA3AF; text-align: center; padding: 32px 0; font-size: 15px;">No sessions scheduled - rest day!</p>'}
        </div>
      </div>
    `;
  }).join('');

  // Dashboard only shows the daily schedule - other insights are in the sidepanel
  return `
    <div>
      ${weeklyPlanHtml}
    </div>
  `;
}

