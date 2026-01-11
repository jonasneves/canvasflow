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
  } catch (error) {
    console.error('Failed to load Canvas data:', error.message);
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
    }
  } catch (error) {
    console.error('Failed to refresh Canvas data:', error.message);
  }
}

// Helper to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Helper to create Lucide icon SVG
function createLucideIcon(iconName, size = 16, color = 'currentColor') {
  const icons = {
    'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>'
  };
  const paths = icons[iconName] || '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">${paths}</svg>`;
}

// Format relative time ago
function formatTimeAgo(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

// Setup day toggle listeners for schedule cards
function setupDayToggleListeners() {
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
}

// Setup task card click listeners
function setupTaskCardClickListeners() {
  document.querySelectorAll('.schedule-task-card.clickable').forEach(card => {
    card.addEventListener('click', function() {
      const url = this.dataset.url;
      if (url) window.open(url, '_blank');
    });
  });
}

// Load time range settings
async function loadTimeRangeSettings() {
  const result = await chrome.storage.local.get(['assignmentWeeksBefore', 'assignmentWeeksAfter']);
  assignmentTimeRange = {
    weeksBefore: result.assignmentWeeksBefore || 1,
    weeksAfter: result.assignmentWeeksAfter || 1
  };
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
        const oldUrl = changes.canvasUrl.oldValue;
        const newUrl = changes.canvasUrl.newValue;
        if (oldUrl !== newUrl && newUrl) {
          setTimeout(() => refreshCanvasData(), 2000);
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

    if (result.dashboardInsightsTimestamp) {
      updateInsightsTimestamp(result.dashboardInsightsTimestamp);
    }
  }
}

function prepareAssignmentsForAI() {
  const now = new Date();

  // Apply the SAME time range filter as Dashboard display
  const timeRangeStart = new Date(now.getTime() - assignmentTimeRange.weeksBefore * 7 * 24 * 60 * 60 * 1000);
  const timeRangeEnd = new Date(now.getTime() + assignmentTimeRange.weeksAfter * 7 * 24 * 60 * 60 * 1000);

  const assignments = (canvasData.allAssignments || []).filter(a => {
    if (!a.dueDate) return true;
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

