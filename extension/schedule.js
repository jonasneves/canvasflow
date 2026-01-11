// Global state
let canvasData = {
  courses: [],
  allAssignments: [],
  calendarEvents: [],
  upcomingEvents: []
};

let autoRefreshInterval = null;
let assignmentTimeRange = { weeksBefore: 0, weeksAfter: 2 };

// Aliases for shared modules
const escapeHtml = window.CanvasFlowUtils.escapeHtml;
const formatTimeAgo = window.CanvasFlowUtils.formatTimeAgo;
const createLucideIcon = window.CanvasFlowUtils.createLucideIcon;
const setupDayToggleListeners = window.CanvasFlowUI.setupDayToggleListeners;
const setupTaskCardClickListeners = window.CanvasFlowUI.setupTaskCardClickListeners;
const findAssignmentUrl = (name) => window.CanvasFlowAssignments.findAssignmentUrl(name, canvasData.allAssignments);
const prepareAssignmentsForAI = () => window.CanvasFlowAssignments.prepareAssignmentsForAI(canvasData.allAssignments, assignmentTimeRange);

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  await loadTimeRangeSettings();
  initializeDashboard();
  loadSettings();
});

async function initializeDashboard() {
  await loadCanvasData();
  refreshCanvasData();
  await loadSavedInsights();
}

// Load Canvas data from background script
async function loadCanvasData() {
  try {
    const response = await window.CanvasFlowMessaging.getCanvasData();

    if (response && response.data) {
      canvasData = {
        courses: response.data.courses || [],
        allAssignments: response.data.allAssignments || [],
        calendarEvents: response.data.calendarEvents || [],
        upcomingEvents: response.data.upcomingEvents || []
      };
    }
  } catch (error) {
    console.error('Failed to load Canvas data:', error.message);
  }
}

// Refresh Canvas data
async function refreshCanvasData() {
  try {
    const response = await window.CanvasFlowMessaging.refreshData();

    if (response && response.success) {
      canvasData = {
        courses: response.data.courses || [],
        allAssignments: response.data.allAssignments || [],
        calendarEvents: response.data.calendarEvents || [],
        upcomingEvents: response.data.upcomingEvents || []
      };
    }
  } catch (error) {
    console.error('Failed to refresh Canvas data:', error.message);
  }
}

// Load time range settings
async function loadTimeRangeSettings() {
  assignmentTimeRange = await window.CanvasFlowStorage.getTimeRange();
}

function loadSettings() {
  chrome.storage.local.get(['autoRefresh'], (result) => {
    if (result.autoRefresh) {
      setupAutoRefresh(true);
    }
  });

  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      if (changes.assignmentWeeksBefore || changes.assignmentWeeksAfter) {
        loadTimeRangeSettings();
      }

      if (changes.canvasUrl) {
        const newUrl = changes.canvasUrl.newValue;
        if (newUrl) {
          loadSavedInsights();
          setTimeout(() => refreshCanvasData(), 2000);
        }
      }
    }
  });
}

function setupAutoRefresh(enabled) {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }

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
    const timeAgo = formatTimeAgo(timestamp);
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
  const insightsContent = document.getElementById('insightsContent');

  // Check if Canvas URL is configured
  const canvasUrl = await window.CanvasFlowStorage.getCanvasUrl();
  if (!canvasUrl) {
    insightsContent.innerHTML = `
      <div class="insights-placeholder">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p style="font-weight: 600; color: #111827;">Canvas URL Not Configured</p>
        <p class="insights-placeholder-note">Open the CanvasFlow sidepanel and configure your Canvas URL in Settings to get started</p>
      </div>
    `;
    return;
  }

  const { schedule, timestamp } = await window.CanvasFlowStorage.getDashboardSchedule();
  if (schedule) {
    insightsContent.innerHTML = `
      <div class="insights-loaded">
        ${schedule}
      </div>
    `;

    setupDayToggleListeners();
    setupTaskCardClickListeners();

    if (timestamp) {
      updateInsightsTimestamp(timestamp);
    }
  }
}

// Format structured insights for display (Dashboard focuses ONLY on weekly schedule)
function formatStructuredInsights(insights) {
  const weeklyPlanHtml = insights.weekly_plan.map((day, dayIdx) => {
    const tasksHtml = day.tasks.map(task => {
      const timeBlock = window.AIMappers.formatTimeBlock(task.start_hour, task.duration_hours);
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

  return `
    <div>
      ${weeklyPlanHtml}
    </div>
  `;
}
