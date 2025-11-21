// Global state
let allAssignments = [];
let currentFilter = 'all';
let autoRefreshInterval = null;
let assignmentTimeRange = { weeksBefore: 0, weeksAfter: 2 }; // Default: Show next 2 weeks
let showGrades = false; // Default to hidden
let localCompletedIds = []; // Track locally completed assignments
let focusModeEnabled = false; // Focus Mode: Show only top 3 priorities

// Tab switching
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const targetTab = button.getAttribute('data-tab');

    // Update buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');

    // Update content
    tabContents.forEach(content => content.classList.remove('active'));
    document.getElementById(targetTab).classList.add('active');

    // Auto-generate insights when AI Dashboard tab is opened
    if (targetTab === 'ai-dashboard') {
      await checkAndAutoGenerateInsights();
    }
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
        canvasUrlInput.placeholder = 'https://canvas.university.edu';
      }
    }
  } catch (error) {
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
      color: '#1e3a5f'
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
// Calculate Impact Score for priority-based sorting
function calculateImpactScore(assignment) {
  const now = new Date();
  const due = new Date(assignment.dueDate);
  const points = assignment.pointsPossible || 10; // Default to 10 if null

  // Hours until due (minimum 1 to avoid division by zero)
  const hoursUntilDue = Math.max(1, (due - now) / (1000 * 60 * 60));

  // Time urgency factor (exponential decay for closer deadlines)
  let timeMultiplier;
  if (hoursUntilDue <= 0) {
    timeMultiplier = 20; // Overdue = highest priority
  } else if (hoursUntilDue <= 24) {
    timeMultiplier = 10; // Due today
  } else if (hoursUntilDue <= 48) {
    timeMultiplier = 5;  // Due tomorrow
  } else if (hoursUntilDue <= 168) {
    timeMultiplier = 2;  // Due this week
  } else {
    timeMultiplier = 1;  // Due later
  }

  // Raw score: points weighted by urgency, divided by days remaining
  const rawScore = (points * timeMultiplier) / (hoursUntilDue / 24);

  // Normalize to 0-100 using logarithmic scaling
  return Math.min(100, Math.log10(rawScore + 1) * 30);
}

// Render Focus Mode: Show only top 3 priorities
function renderFocusMode(now, todayStart, todayEnd, timeRangeStart, timeRangeEnd) {
  const assignmentsList = document.getElementById('assignmentsList');

  // Filter to unsubmitted assignments within time range
  let focusAssignments = allAssignments.filter(a => {
    if (a.submission?.submitted) return false;
    if (!a.dueDate) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate >= timeRangeStart && dueDate <= timeRangeEnd;
  });

  // Sort by Impact Score
  focusAssignments.sort((a, b) => {
    const aScore = calculateImpactScore(a);
    const bScore = calculateImpactScore(b);
    return bScore - aScore;
  });

  // Take top 3
  focusAssignments = focusAssignments.slice(0, 3);

  if (focusAssignments.length === 0) {
    assignmentsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <div class="empty-state-text">No priority assignments</div>
        <p style="font-size: 13px; color: #6B7280; margin-top: 8px;">You're all caught up</p>
      </div>
    `;
    return;
  }

  // Render top 3 with consistent styling
  assignmentsList.innerHTML = `
    <div class="focus-mode-header">
      <div class="focus-mode-title">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
        </svg>
        <span>Focus Mode</span>
      </div>
      <div class="focus-mode-subtitle">Your top 3 priorities</div>
    </div>
    ${focusAssignments.map((assignment, index) => {
      const dueDate = new Date(assignment.dueDate);
      const isOverdue = dueDate < now;
      const isDueToday = !isOverdue && dueDate >= todayStart && dueDate < todayEnd;

      const dueDateText = dueDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

      const priorityConfig = [
        { label: 'PRIORITY 1', color: '#DC2626', bgColor: '#FEE2E2' },
        { label: 'PRIORITY 2', color: '#D97706', bgColor: '#FEF3C7' },
        { label: 'PRIORITY 3', color: '#1e3a5f', bgColor: '#DBEAFE' }
      ][index];

      const assignmentUrl = assignment.url || '#';
      const badges = getAssignmentBadges(assignment);
      const gradeDisplay = getGradeDisplay(assignment);

      // Get AI-generated tags for this assignment
      const aiTags = getTagsForAssignment(assignment.id);
      const aiChipsHtml = aiTags.length > 0 ? `
        <div class="ai-chips">
          ${aiTags.map(tag => `<span class="ai-chip">${escapeHtml(tag)}</span>`).join('')}
        </div>
      ` : '';

      return `
        <div class="focus-mode-card">
          <div class="focus-mode-badge" style="background: ${priorityConfig.bgColor}; color: ${priorityConfig.color};">
            ${priorityConfig.label}
          </div>
          <a href="${escapeHtml(assignmentUrl)}" target="_blank" class="assignment-card ${isOverdue ? 'overdue' : ''}">
            <div class="assignment-info">
              <div class="assignment-title">${escapeHtml(assignment.name || 'Untitled Assignment')}</div>
              <div class="assignment-meta">
                <span>${escapeHtml(assignment.courseName || 'Unknown Course')}</span>
                ${assignment.pointsPossible ? `<span>${assignment.pointsPossible} pts</span>` : ''}
              </div>
              ${aiChipsHtml}
              <div class="assignment-due-date ${isOverdue ? 'overdue' : isDueToday ? 'due-today' : 'upcoming'}">
                Due: ${dueDateText}
              </div>
            </div>
            ${badges || gradeDisplay ? `<div class="assignment-badges">${badges}${gradeDisplay}</div>` : ''}
          </a>
        </div>
      `;
    }).join('')}
    <div style="text-align: center; margin-top: 24px;">
      <button class="secondary small" id="exitFocusMode">
        Show All Assignments
      </button>
    </div>
  `;

  // Add exit button listener
  document.getElementById('exitFocusMode')?.addEventListener('click', () => {
    toggleFocusMode();
  });
}

function renderAssignments() {
  updateSectionHeader();
  const assignmentsList = document.getElementById('assignmentsList');
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Calculate time range boundaries
  const timeRangeStart = new Date(now.getTime() - assignmentTimeRange.weeksBefore * 7 * 24 * 60 * 60 * 1000);
  const timeRangeEnd = new Date(now.getTime() + assignmentTimeRange.weeksAfter * 7 * 24 * 60 * 60 * 1000);

  // Handle Focus Mode
  if (focusModeEnabled) {
    renderFocusMode(now, todayStart, todayEnd, timeRangeStart, timeRangeEnd);
    return;
  }


  if (allAssignments.length === 0) {
    assignmentsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="empty-state-text">Canvas URL Not Configured</div>
        <div style="font-size: 13px; margin-top: 12px; line-height: 1.6; color: #6B7280; max-width: 320px;">
          <p style="margin: 0 0 12px 0;">To load your assignments:</p>
          <ol style="margin: 0; padding-left: 20px; text-align: left;">
            <li style="margin-bottom: 8px;">Open Settings (gear icon above)</li>
            <li style="margin-bottom: 8px;"><strong>Go to a Canvas page</strong> and click "Auto-Detect"</li>
            <li style="margin-bottom: 0;">Or manually enter your Canvas URL</li>
          </ol>
        </div>
        <button class="primary open-settings-btn" style="margin-top: 16px; display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px;">
          <i data-lucide="settings" style="width: 16px; height: 16px;"></i>
          <span>Open Settings</span>
        </button>
      </div>
    `;
    // Initialize Lucide icons only in the assignmentsList container
    initializeLucide(assignmentsList);
    // Add event listener
    document.querySelector('.open-settings-btn')?.addEventListener('click', () => {
      document.getElementById('settingsBtn')?.click();
    });
    return;
  }

  // Apply time range filter first (to all assignments with due dates)
  let timeFilteredAssignments = allAssignments.filter(a => {
    if (!a.dueDate) return false; // Exclude assignments without due dates from time filter
    const dueDate = new Date(a.dueDate);
    return dueDate >= timeRangeStart && dueDate <= timeRangeEnd;
  });


  // Filter assignments based on currentFilter
  let filteredAssignments;

  if (currentFilter === 'all') {
    // Show all assignments within time range, plus those without due dates
    filteredAssignments = [...timeFilteredAssignments, ...allAssignments.filter(a => !a.dueDate)];
  } else {
    // For other filters, only use time-filtered assignments
    filteredAssignments = timeFilteredAssignments;

    if (currentFilter === 'overdue') {
      filteredAssignments = filteredAssignments.filter(a => {
        return new Date(a.dueDate) < now && !a.submission?.submitted;
      });
    } else if (currentFilter === 'due-today') {
      filteredAssignments = filteredAssignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= todayStart && dueDate < todayEnd && !a.submission?.submitted;
      });
    } else if (currentFilter === 'upcoming') {
      filteredAssignments = filteredAssignments.filter(a => {
        return new Date(a.dueDate) >= todayEnd && !a.submission?.submitted;
      });
    }
  }

  // Sort differently based on filter
  if (currentFilter === 'all') {
    // For 'all' view: Impact Score sorting (points × urgency / time)
    filteredAssignments.sort((a, b) => {
      const aSubmitted = a.submission?.submitted || false;
      const bSubmitted = b.submission?.submitted || false;

      // Submitted items go to bottom
      if (aSubmitted !== bSubmitted) return aSubmitted ? 1 : -1;

      // No due date items go to bottom (before submitted)
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      // Sort unsubmitted items by Impact Score (descending - higher score first)
      const aScore = calculateImpactScore(a);
      const bScore = calculateImpactScore(b);
      return bScore - aScore;
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

    // Get AI-generated tags for this assignment
    const aiTags = getTagsForAssignment(assignment.id);
    const aiChipsHtml = aiTags.length > 0 ? `
      <div class="ai-chips">
        ${aiTags.map(tag => `<span class="ai-chip">${escapeHtml(tag)}</span>`).join('')}
      </div>
    ` : '';

    // Check if locally completed
    const isLocallyCompleted = localCompletedIds.includes(assignment.id);
    const cardStyle = isLocallyCompleted ? 'opacity: 0.6;' : '';
    const infoStyle = isLocallyCompleted ? 'text-decoration: line-through;' : '';

    return `
      <div class="assignment-card-wrapper" data-assignment-id="${assignment.id}" style="${cardStyle}">
        <div class="checkbox-circle ${isLocallyCompleted ? 'checked' : ''}"
             data-action="toggle-done"
             role="checkbox"
             aria-checked="${isLocallyCompleted}"
             tabindex="0"
             title="${isLocallyCompleted ? 'Mark as not done' : 'Mark as done'}">
          ${isLocallyCompleted ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        </div>
        <a href="${escapeHtml(assignmentUrl)}" target="_blank" class="${cardClass}">
          <div class="assignment-info" style="${infoStyle}">
            <div class="assignment-title">${escapeHtml(assignment.name || 'Untitled Assignment')}</div>
            <div class="assignment-meta">
              <span>${escapeHtml(assignment.courseName || 'Unknown Course')}</span>
              ${assignment.pointsPossible ? `<span>${assignment.pointsPossible} pts</span>` : ''}
            </div>
            ${aiChipsHtml}
            <div class="${dueDateClass}">Due: ${dueDateText}</div>
          </div>
          ${badges || gradeDisplay ? `<div class="assignment-badges">${badges}${gradeDisplay}</div>` : ''}
        </a>
      </div>
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

      // Render Today's Priorities section (Phase 3.1)
      renderTodaySection();

    } else {
      assignmentsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="empty-state-text">Cannot Connect to Canvas</div>
          <div style="font-size: 13px; margin-top: 12px; line-height: 1.6; color: #6B7280; max-width: 320px;">
            <p style="margin: 0 0 8px 0;">Unable to load Canvas data. Please check:</p>
            <ul style="margin: 0; padding-left: 20px; text-align: left;">
              <li style="margin-bottom: 6px;">Canvas URL is configured correctly</li>
              <li style="margin-bottom: 6px;">You're logged into Canvas</li>
              <li style="margin-bottom: 0;">You're on a Canvas page</li>
            </ul>
          </div>
          <button class="primary open-settings-btn-2" style="margin-top: 16px; display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px;">
            <i data-lucide="settings" style="width: 16px; height: 16px;"></i>
            <span>Configure Canvas URL</span>
          </button>
        </div>
      `;
      // Initialize Lucide icons only in the assignmentsList container
      initializeLucide(assignmentsList);
      // Add event listener
      document.querySelector('.open-settings-btn-2')?.addEventListener('click', () => {
        document.getElementById('settingsBtn')?.click();
      });
    }
  } catch (error) {
    assignmentsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <div class="empty-state-text">Connection Error</div>
        <div style="font-size: 13px; margin-top: 12px; line-height: 1.6; color: #6B7280; max-width: 320px;">
          <p style="margin: 0 0 8px 0;">Cannot connect to Canvas. Please:</p>
          <ul style="margin: 0; padding-left: 20px; text-align: left;">
            <li style="margin-bottom: 6px;">Go to your Canvas page</li>
            <li style="margin-bottom: 6px;">Click Settings and use "Auto-Detect"</li>
            <li style="margin-bottom: 0;">Or manually enter Canvas URL</li>
          </ul>
        </div>
        <button class="primary open-settings-btn-3" style="margin-top: 16px; display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px;">
          <i data-lucide="settings" style="width: 16px; height: 16px;"></i>
          <span>Open Settings</span>
        </button>
      </div>
    `;
    // Initialize Lucide icons only in the assignmentsList container
    initializeLucide(assignmentsList);
    // Add event listener
    document.querySelector('.open-settings-btn-3')?.addEventListener('click', () => {
      document.getElementById('settingsBtn')?.click();
    });
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
  document.getElementById('assignmentWeeksBefore').value = result.assignmentWeeksBefore || 0;
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

// Refresh Data Button (in MCP Server tab)
document.getElementById('refreshDataBtn').addEventListener('click', async () => {
  const button = document.getElementById('refreshDataBtn');
  const icon = button.querySelector('i');
  const buttonText = button.querySelector('span');
  const originalText = buttonText.textContent;

  // Add spinning animation and update text
  if (icon) {
    icon.style.animation = 'spin 1s linear infinite';
  }
  buttonText.textContent = 'Refreshing...';
  button.disabled = true;

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'REFRESH_DATA' }, resolve);
    });

    if (response && response.success) {
      updateStatus();
      loadAssignments(); // Reload assignments after refresh
      buttonText.textContent = 'Refreshed!';
      setTimeout(() => {
        buttonText.textContent = originalText;
      }, 2000);
    }
  } catch (error) {
    buttonText.textContent = 'Failed to refresh';
    setTimeout(() => {
      buttonText.textContent = originalText;
    }, 2000);
  } finally {
    if (icon) {
      icon.style.animation = '';
    }
    button.disabled = false;
  }
});

// Summary card filters
document.querySelectorAll('.summary-card').forEach(card => {
  card.addEventListener('click', () => {
    const filter = card.getAttribute('data-filter');

    // Toggle filter - if clicking the same card, reset to 'all'
    if (currentFilter === filter) {
      currentFilter = 'all';
      document.querySelectorAll('.summary-card').forEach(c => c.classList.remove('active'));
    } else {
      currentFilter = filter;
      document.querySelectorAll('.summary-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    }

    // Re-render with new filter
    renderAssignments();
  });
});

// Listen for storage changes to update Canvas URL
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === 'local' && changes.canvasUrl) {
    updateCanvasUrl();

    // When Canvas URL changes, explicitly trigger a data refresh
    // This ensures we wait for the background script to complete fetching
    await refreshCanvasData();
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
    showStatusMessage('canvasUrlStatus', '✓ Saved - Refreshing data...', 'success');

    // Hide the configuration banner if it's visible
    const configBanner = document.getElementById('configBanner');
    if (configBanner) {
      configBanner.style.display = 'none';
    }

    // Wait a moment to allow background script to refresh
    setTimeout(() => {
      showStatusMessage('canvasUrlStatus', '✓ Data refresh initiated', 'success');
    }, 1000);
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
      // Match canvas.*.edu (e.g., canvas.university.edu)
      /^https?:\/\/canvas\.[^\/]*\.edu/i,
      // Match *.edu/canvas (e.g., university.edu/canvas)
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

    // Hide the configuration banner if it's visible
    const configBanner = document.getElementById('configBanner');
    if (configBanner) {
      configBanner.style.display = 'none';
    }

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
  }
}

function startAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }

  // Refresh every 30 minutes (1800000 ms)
  autoRefreshInterval = setInterval(() => {
    refreshCanvasData();
  }, 1800000);
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

  // Remove processed attribute so icon can be re-initialized
  icon.removeAttribute('data-lucide-processed');

  // Re-initialize this specific icon
  if (typeof initializeLucide === 'function') {
    initializeLucide();
  }
}

// Notification settings
document.getElementById('notificationsEnabled').addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  const settingsDiv = document.getElementById('notificationSettings');

  if (enabled) {
    settingsDiv.style.display = 'block';
  } else {
    settingsDiv.style.display = 'none';
  }

  // Save to storage
  await chrome.storage.local.set({ notificationsEnabled: enabled });

  // Notify background script to setup/cancel alarms
  chrome.runtime.sendMessage({ type: 'UPDATE_NOTIFICATION_SETTINGS', enabled });
});

// Test notification button
document.getElementById('testNotification').addEventListener('click', async () => {
  // Request notification permission first
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    chrome.runtime.sendMessage({ type: 'TEST_NOTIFICATION' });
    showToast('Test notification sent! Check your system notifications.');
  } else {
    showToast('Notification permission denied. Please enable notifications in your browser settings.');
  }
});

document.getElementById('notificationFrequency').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ notificationFrequency: e.target.value });
  chrome.runtime.sendMessage({ type: 'UPDATE_NOTIFICATION_SETTINGS' });
});

document.getElementById('quietHoursStart').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ quietHoursStart: e.target.value });
});

document.getElementById('quietHoursEnd').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ quietHoursEnd: e.target.value });
});

// Load notification settings
async function loadNotificationSettings() {
  try {
    const result = await chrome.storage.local.get([
      'notificationsEnabled',
      'notificationFrequency',
      'quietHoursStart',
      'quietHoursEnd'
    ]);

    const enabled = result.notificationsEnabled || false;
    const frequency = result.notificationFrequency || 'balanced';
    const quietStart = result.quietHoursStart || '22:00';
    const quietEnd = result.quietHoursEnd || '08:00';

    document.getElementById('notificationsEnabled').checked = enabled;
    document.getElementById('notificationFrequency').value = frequency;
    document.getElementById('quietHoursStart').value = quietStart;
    document.getElementById('quietHoursEnd').value = quietEnd;

    if (enabled) {
      document.getElementById('notificationSettings').style.display = 'block';
    }
  } catch (error) {
  }
}

// Auto-refresh toggle event listener
document.getElementById('autoRefreshToggle').addEventListener('change', (e) => {
  saveAutoRefreshSetting(e.target.checked);
});

// Focus Mode toggle
function toggleFocusMode() {
  focusModeEnabled = !focusModeEnabled;

  // Update button visual state
  const focusModeBtn = document.getElementById('focusModeBtn');
  if (focusModeEnabled) {
    focusModeBtn.classList.add('active');
    // Hide summary cards in focus mode
    document.querySelector('.summary-cards').style.display = 'none';
  } else {
    focusModeBtn.classList.remove('active');
    // Show summary cards in normal mode
    document.querySelector('.summary-cards').style.display = 'grid';
  }

  // Save state to localStorage
  chrome.storage.local.set({ focusModeEnabled });

  // Re-render
  renderAssignments();
}

// Focus Mode button click handler
document.getElementById('focusModeBtn').addEventListener('click', toggleFocusMode);

// Save time range settings
document.getElementById('saveTimeRange').addEventListener('click', async () => {
  const weeksBefore = parseInt(document.getElementById('assignmentWeeksBefore').value);
  const weeksAfter = parseInt(document.getElementById('assignmentWeeksAfter').value);

  if (isNaN(weeksBefore) || weeksBefore < 0 || weeksBefore > 52) {
    showStatusMessage('timeRangeStatus', 'Weeks before must be between 0 and 52', 'error');
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

// Reset time range to defaults
document.getElementById('resetTimeRange').addEventListener('click', async () => {
  const defaultWeeksBefore = 0;
  const defaultWeeksAfter = 2;

  try {
    await chrome.storage.local.set({
      assignmentWeeksBefore: defaultWeeksBefore,
      assignmentWeeksAfter: defaultWeeksAfter
    });

    // Update UI inputs
    document.getElementById('assignmentWeeksBefore').value = defaultWeeksBefore;
    document.getElementById('assignmentWeeksAfter').value = defaultWeeksAfter;

    // Update global state
    assignmentTimeRange = { weeksBefore: defaultWeeksBefore, weeksAfter: defaultWeeksAfter };

    showStatusMessage('timeRangeStatus', '✓ Reset to defaults', 'success');

    // Re-render assignments with new time range
    renderAssignments();
  } catch (error) {
    showStatusMessage('timeRangeStatus', '✗ Reset failed', 'error');
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
    // Update button text to reflect API key is now configured
    await updateInsightsButtonText();
  } catch (error) {
  }
});

// Load time range settings
async function loadTimeRangeSettings() {
  try {
    const result = await chrome.storage.local.get(['assignmentWeeksBefore', 'assignmentWeeksAfter']);
    assignmentTimeRange = {
      weeksBefore: result.assignmentWeeksBefore !== undefined ? result.assignmentWeeksBefore : 0,
      weeksAfter: result.assignmentWeeksAfter !== undefined ? result.assignmentWeeksAfter : 2
    };
  } catch (error) {
  }
}

// Update insights timestamp display
function updateInsightsTimestamp(timestamp) {
  if (!timestamp) return '';

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

  return `<div style="text-align: center; padding: 16px 0 0 0; border-top: 1px solid #E5E7EB;">
    <div style="font-size: 11px; color: #9CA3AF; margin-bottom: 10px;">Last generated ${timeAgo}</div>
    <div style="display: flex; gap: 8px; justify-content: center;">
      <button class="btn-primary" id="regenerateInsightsBtn" style="padding: 8px 16px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px;">
        <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
        <span>Regenerate</span>
      </button>
      <button class="btn-secondary" id="viewScheduleBtn" style="padding: 8px 16px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #E5E7EB;">
        <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
        <span>View Schedule</span>
      </button>
    </div>
  </div>`;
}

// Load saved insights from storage
async function loadSavedInsights() {
  try {
    const result = await chrome.storage.local.get(['savedInsights', 'insightsTimestamp']);
    if (result.savedInsights) {
      const timestampHtml = updateInsightsTimestamp(result.insightsTimestamp);
      const insightsContent = document.getElementById('insightsContent');
      insightsContent.innerHTML = `
        <div class="insights-loaded">
          ${result.savedInsights}
          ${timestampHtml}
        </div>
      `;

      // Attach event listeners to buttons if they exist
      const regenerateBtn = document.getElementById('regenerateInsightsBtn');
      if (regenerateBtn) {
        regenerateBtn.addEventListener('click', generateAIInsights);
      }

      const viewScheduleBtn = document.getElementById('viewScheduleBtn') || document.getElementById('viewScheduleFromInsights');
      if (viewScheduleBtn) {
        viewScheduleBtn.addEventListener('click', () => {
          // Switch to calendar view tab (Phase 3.1)
          document.querySelector('.ai-view-tab[data-view="calendar"]')?.click();
        });
      }

      // Initialize Lucide icons for the buttons
      if (typeof initializeLucide === 'function') {
        initializeLucide();
      }
    }
  } catch (error) {
  }
}

// Local task completion functions
async function loadLocalCompletionState() {
  const result = await chrome.storage.sync.get(['localCompletedIds']);
  localCompletedIds = result.localCompletedIds || [];
}

async function toggleAssignmentDone(assignmentId, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const wrapper = document.querySelector(`[data-assignment-id="${assignmentId}"]`);
  if (!wrapper) return;

  const isDone = localCompletedIds.includes(assignmentId);

  // Optimistic UI update
  if (!isDone) {
    localCompletedIds.push(assignmentId);
    wrapper.style.opacity = '0.6';
    const info = wrapper.querySelector('.assignment-info');
    if (info) info.style.textDecoration = 'line-through';
    const checkbox = wrapper.querySelector('.checkbox-circle');
    if (checkbox) {
      checkbox.classList.add('checked');
      checkbox.setAttribute('aria-checked', 'true');
      checkbox.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    }
    showToast('Marked as done', 'Undo', () => toggleAssignmentDone(assignmentId, null));
  } else {
    localCompletedIds = localCompletedIds.filter(id => id !== assignmentId);
    wrapper.style.opacity = '1';
    const info = wrapper.querySelector('.assignment-info');
    if (info) info.style.textDecoration = 'none';
    const checkbox = wrapper.querySelector('.checkbox-circle');
    if (checkbox) {
      checkbox.classList.remove('checked');
      checkbox.setAttribute('aria-checked', 'false');
      checkbox.innerHTML = '';
    }
    showToast('Marked as not done');
  }

  // Save to storage
  await chrome.storage.sync.set({ localCompletedIds });
}

function showToast(message, actionText = null, actionCallback = null) {
  // Remove existing toast if any
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
}

// Check and auto-generate insights if needed
async function checkAndAutoGenerateInsights() {
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

  try {
    const result = await chrome.storage.local.get(['savedInsights', 'insightsTimestamp', 'claudeApiKey']);
    const now = Date.now();
    const timestamp = result.insightsTimestamp || 0;
    const age = now - timestamp;

    // Check if insights are stale (>6 hours old) or don't exist
    const needsRegeneration = !result.savedInsights || age > SIX_HOURS_MS;

    if (needsRegeneration && result.claudeApiKey) {
      // Auto-generate insights
      const insightsContent = document.getElementById('insightsContent');
      insightsContent.innerHTML = `
        <div class="insights-loading">
          <div class="spinner"></div>
          <p>Refreshing your insights...</p>
        </div>
      `;

      // Trigger generation without waiting for user click
      await generateAIInsights();
    } else if (!result.claudeApiKey) {
      // If no API key, the generateAIInsights function will show the appropriate prompt
      // Just ensure the button text is updated
      await updateInsightsButtonText();
    }
  } catch (error) {
    console.error('Error checking insights:', error);
  }
}

// Initial load
async function initialize() {
  await updateCanvasUrl();
  updateStatus();

  // Check and show configuration banner if needed
  await checkAndShowConfigBanner();

  // Auto-detect Canvas URL if not already configured
  const result = await chrome.storage.local.get(['canvasUrl']);
  if (!result.canvasUrl) {
    const detected = await autoDetectCanvasUrl(false);
    if (detected) {
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

  // Load notification settings
  await loadNotificationSettings();

  // Load focus mode state
  const focusModeResult = await chrome.storage.local.get(['focusModeEnabled']);
  focusModeEnabled = focusModeResult.focusModeEnabled || false;
  if (focusModeEnabled) {
    document.getElementById('focusModeBtn').classList.add('active');
    document.querySelector('.summary-cards').style.display = 'none';
  }

  // Initialize grade visibility icon (always starts hidden)
  updateGradesIcon();

  // Update AI insights button text
  await updateInsightsButtonText();

  // Update schedule button text (Phase 3.1)
  await updateScheduleButtonText();

  // Load AI metadata (tags) from storage
  const metadataResult = await chrome.storage.local.get(['ai_metadata']);
  window.currentAIMetadata = metadataResult.ai_metadata || {};

  // Load local completion state
  await loadLocalCompletionState();

  // Set up event delegation for checkboxes
  const assignmentsList = document.getElementById('assignmentsList');
  if (assignmentsList) {
    assignmentsList.addEventListener('click', (e) => {
      const checkbox = e.target.closest('[data-action="toggle-done"]');
      if (checkbox) {
        e.preventDefault();
        e.stopPropagation();
        const wrapper = checkbox.closest('[data-assignment-id]');
        if (wrapper) {
          const assignmentId = wrapper.getAttribute('data-assignment-id');
          toggleAssignmentDone(assignmentId, e);
        }
      }
    });
  }

  // Load saved insights
  await loadSavedInsights();

  // Check if we need to open settings (from dashboard)
  const settingsFlag = await chrome.storage.local.get(['openSettingsOnLoad']);
  if (settingsFlag.openSettingsOnLoad) {
    // Clear the flag
    await chrome.storage.local.remove('openSettingsOnLoad');
    // Open settings modal
    const settingsModal = document.getElementById('settingsModal');
    if (settingsModal) {
      settingsModal.classList.add('show');
    }
  }

  // Stale-while-revalidate: Load cached data first for instant display
  await loadAssignments();

  // Then trigger background refresh to get fresh data
  refreshCanvasData();
}

// AI Insights functionality
async function updateInsightsButtonText() {
  const result = await chrome.storage.local.get(['claudeApiKey']);
  const btnText = document.getElementById('generateInsightsBtnText');

  if (result.claudeApiKey) {
    btnText.textContent = 'Generate AI Insights';
  } else {
    btnText.textContent = 'Configure API Key';
  }
}

async function generateAIInsights() {
  // Try to find either button (could be generateInsightsBtn or regenerateInsightsBtn)
  const btn = document.getElementById('generateInsightsBtn') || document.getElementById('regenerateInsightsBtn');
  const insightsContent = document.getElementById('insightsContent');

  // Check if API key is set first
  const result = await chrome.storage.local.get(['claudeApiKey']);

  if (!result.claudeApiKey) {
    // Show settings prompt if no API key (no need to refresh data)
    const settingsPrompt = `
      <div class="insights-loaded" style="text-align: center; padding: 40px 20px;">
        <h3 style="margin-bottom: 12px; color: #111827;">Claude API Key Required</h3>
        <p style="margin-bottom: 24px; color: #6B7280; font-size: 14px; max-width: 400px; margin-left: auto; margin-right: auto;">
          To generate AI-powered insights and study schedules, you need to configure your Claude API key.
        </p>
        <button id="openSettingsBtn" style="
          background: #1e3a5f;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        ">
          Open Settings
        </button>
        <p style="margin-top: 16px; font-size: 12px; color: #9CA3AF;">
          Don't have an API key? <a href="https://console.anthropic.com/" target="_blank" style="color: #1e3a5f; text-decoration: underline;">Get one from Anthropic</a>
        </p>
      </div>
    `;
    insightsContent.innerHTML = settingsPrompt;

    // Add event listeners to the button
    const openSettingsBtn = document.getElementById('openSettingsBtn');
    openSettingsBtn.addEventListener('click', () => {
      const settingsModal = document.getElementById('settingsModal');
      settingsModal.classList.add('show');
    });
    openSettingsBtn.addEventListener('mouseover', () => {
      openSettingsBtn.style.background = '#004080';
    });
    openSettingsBtn.addEventListener('mouseout', () => {
      openSettingsBtn.style.background = '#1e3a5f';
    });

    const timestampEl = document.getElementById('insightsTimestamp');
    if (timestampEl) {
      timestampEl.style.display = 'none';
    }

    return;
  }

  // Refresh Canvas data to ensure we have the latest assignments
  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
  }
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
      <p>Analyzing your assignments with Claude AI...</p>
    </div>
  `;

  try {
    const assignmentsData = prepareAssignmentsForAI();
    const insights = await callClaudeWithStructuredOutput(result.claudeApiKey, assignmentsData);

    const formattedInsights = formatStructuredInsights(insights);
    const timestamp = Date.now();
    const timestampHtml = updateInsightsTimestamp(timestamp);

    insightsContent.innerHTML = `
      <div class="insights-loaded fade-in">
        ${formattedInsights}
        ${timestampHtml}
      </div>
    `;

    // Attach event listeners to buttons
    const regenerateBtn = document.getElementById('regenerateInsightsBtn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', generateAIInsights);
    }

    const viewScheduleBtn = document.getElementById('viewScheduleBtn');
    if (viewScheduleBtn) {
      viewScheduleBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('schedule.html') });
      });
    }

    // Initialize Lucide icons for the buttons
    if (typeof initializeLucide === 'function') {
      initializeLucide();
    }

    // Save insights, timestamp, and AI metadata to storage
    const aiMetadata = saveAIMetadata(insights);
    await chrome.storage.local.set({
      savedInsights: formattedInsights,
      insightsTimestamp: timestamp,
      ai_metadata: aiMetadata
    });

    // Store in global state for immediate access
    window.currentAIMetadata = aiMetadata;

  } catch (error) {
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
  } finally {
    if (btn) {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
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


  return {
    totalAssignments: assignments.length,
    courses: [...new Set(assignments.map(a => a.courseName))],
    upcoming: assignments.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate >= now && dueDate <= weekFromNow && !a.submission?.submitted;
    }).map(a => ({
      id: a.id,
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
      id: a.id,
      name: a.name,
      course: a.courseName,
      dueDate: a.dueDate,
      points: a.pointsPossible
    })),
    completed: assignments.filter(a => a.submission?.submitted || a.submission?.workflowState === 'graded').length
  };
}

// Save AI-generated metadata (tags) for each assignment
function saveAIMetadata(insights) {
  const metadata = {};
  if (insights && insights.priority_tasks) {
    insights.priority_tasks.forEach(task => {
      if (task.assignment_id && task.ui_tags) {
        metadata[task.assignment_id] = {
          tags: task.ui_tags,
          urgency: task.urgency_score,
          estimatedHours: task.estimated_hours
        };
      }
    });
  }
  return metadata;
}

// Get AI-generated tags for a specific assignment
function getTagsForAssignment(assignmentId) {
  return window.currentAIMetadata?.[assignmentId]?.tags || [];
}

// Phase 4: Use shared Claude client to reduce code duplication
async function callClaudeWithStructuredOutput(apiKey, assignmentsData) {
  return await window.ClaudeClient.callClaude(
    apiKey,
    assignmentsData,
    window.AISchemas.SIDEPANEL_INSIGHTS_SCHEMA,
    'sidepanel'
  );
}

// Helper function to create Lucide icon SVG
function createLucideIcon(iconName, size = 16, color = 'currentColor') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
    ${getLucideIconPaths(iconName)}
  </svg>`;
}

function getLucideIconPaths(iconName) {
  const icons = {
    'activity': '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    'target': '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    'lightbulb': '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
    'chevron-right': '<polyline points="9 18 15 12 9 6"/>',
    'layers': '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'
  };
  return icons[iconName] || '';
}

function formatStructuredInsights(insights) {
  // Phase 2: Use AI mappers for numeric scores
  const recommendationsHtml = insights.workload_assessment.recommendations.map(rec => {
    return `
      <div style="margin: 8px 0; font-size: 14px; display: flex; align-items: start; gap: 8px;">
        ${createLucideIcon('chevron-right', 14, 'rgba(255,255,255,0.8)')}
        <span>${escapeHtml(rec)}</span>
      </div>
    `;
  }).join('');

  const priorityTasksHtml = insights.priority_tasks.map(task => {
    // Phase 2: Map urgency_score (0-3) to colors and labels
    const urgencyColor = window.AIMappers.mapUrgencyToColor(task.urgency_score);
    const urgencyLabel = window.AIMappers.mapUrgencyToDisplayLabel(task.urgency_score);

    return `
      <div style="padding: 16px; background: white; border: 1px solid #E5E7EB; border-left: 4px solid ${urgencyColor}; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
          <strong style="color: #111827; font-size: 14px; flex: 1;">${escapeHtml(task.task)}</strong>
          <div style="display: flex; align-items: center; gap: 8px; margin-left: 12px; flex-shrink: 0;">
            <span style="background: ${urgencyColor}15; color: ${urgencyColor}; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; display: flex; align-items: center; gap: 6px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: ${urgencyColor}; flex-shrink: 0;"></span>
              ${urgencyLabel}
            </span>
            <span style="background: #F3F4F6; color: #374151; padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 600;">${task.estimated_hours}h</span>
          </div>
        </div>
        <p style="margin: 0; color: #6B7280; font-size: 13px; line-height: 1.5;">${escapeHtml(task.reason)}</p>
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

  // Phase 2: Map intensity_score (0-3) to colors and labels
  const intensityColor = window.AIMappers.mapIntensityToColor(insights.workload_assessment.intensity_score);
  const intensityLabel = window.AIMappers.mapIntensityToLabel(insights.workload_assessment.intensity_score);
  const criticalTaskCount = insights.priority_tasks.filter(t => t.urgency_score === 3).length;

  return `
    <h3 style="margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
      ${createLucideIcon('layers', 24, '#1e3a5f')}
      Weekly Battle Plan
    </h3>

    <!-- Workload Stats -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px;">
      <div style="background: white; border-radius: 8px; padding: 14px; border: 1px solid #E5E7EB;">
        <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.5px;">Total Hours</div>
        <div style="font-size: 26px; font-weight: 700; color: #1e3a5f;">${insights.workload_assessment.total_hours_needed}h</div>
      </div>
      <div style="background: white; border-radius: 8px; padding: 14px; border: 1px solid #E5E7EB;">
        <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.5px;">Intensity</div>
        <div style="font-size: 26px; font-weight: 700; color: ${intensityColor}; text-transform: capitalize;">${intensityLabel}</div>
      </div>
      <div style="background: white; border-radius: 8px; padding: 14px; border: 1px solid #E5E7EB;">
        <div style="font-size: 11px; color: #6B7280; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; letter-spacing: 0.5px;">Critical Tasks</div>
        <div style="font-size: 26px; font-weight: 700; color: #E63946;">${criticalTaskCount}</div>
      </div>
    </div>

    <!-- Workload Assessment -->
    <div style="background: linear-gradient(135deg, #1e3a5f 0%, #2c4f7c 100%); padding: 20px; border-radius: 12px; color: white; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0, 83, 155, 0.2);">
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
    <h4 style="margin: 24px 0 12px 0; color: #E63946; font-size: 16px; display: flex; align-items: center; gap: 8px; font-weight: 700;">
      ${createLucideIcon('target', 18, '#E63946')}
      Priority Tasks
    </h4>
    <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
      ${priorityTasksHtml}
    </div>

    <!-- Study Tips -->
    <h4 style="margin: 24px 0 12px 0; color: #1e3a5f; font-size: 16px; display: flex; align-items: center; gap: 8px; font-weight: 700;">
      ${createLucideIcon('lightbulb', 18, '#1e3a5f')}
      Strategic Study Tips
    </h4>
    <div style="background: #F9FAFB; padding: 16px; border-radius: 8px; border: 1px solid #E5E7EB;">
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

// ==================== Phase 3.1: Unified AI View ====================

// View Tab Switching
document.querySelectorAll('.ai-view-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    const view = this.dataset.view;

    // Update tab styling
    document.querySelectorAll('.ai-view-tab').forEach(t => {
      if (t === this) {
        t.style.background = 'white';
        t.style.color = '#111827';
        t.classList.add('active');
      } else {
        t.style.background = 'transparent';
        t.style.color = '#6B7280';
        t.classList.remove('active');
      }
    });

    // Show/hide content
    if (view === 'list') {
      document.getElementById('listViewContent').style.display = 'block';
      document.getElementById('calendarViewContent').style.display = 'none';
    } else {
      document.getElementById('listViewContent').style.display = 'none';
      document.getElementById('calendarViewContent').style.display = 'block';
      // Load schedule if not loaded
      loadSavedSchedule();
    }
  });
});

// Update schedule button text based on API key
async function updateScheduleButtonText() {
  const result = await chrome.storage.local.get(['claudeApiKey']);
  const btnText = document.getElementById('generateScheduleBtnText');

  if (btnText) {
    if (result.claudeApiKey) {
      btnText.textContent = 'Generate Schedule';
    } else {
      btnText.textContent = 'Configure API Key';
    }
  }
}

// Generate Schedule Button
document.getElementById('generateScheduleBtn').addEventListener('click', generateAISchedule);

// Render Today's Priorities
function renderTodaySection() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  // Get assignments due today or overdue
  const todayAssignments = assignmentsData.filter(a => {
    if (!a.dueDate || a.submission?.submitted) return false;
    const dueDate = new Date(a.dueDate);
    return dueDate <= todayEnd; // Include overdue and due today
  });

  // Calculate impact scores and sort
  const scored = todayAssignments.map(a => ({
    ...a,
    impactScore: calculateImpactScore(a, now)
  })).sort((a, b) => b.impactScore - a.impactScore);

  // Take top 3
  const topPriorities = scored.slice(0, 3);

  const todaySection = document.getElementById('todaySection');
  const todayContent = document.getElementById('todayContent');

  if (topPriorities.length === 0) {
    todaySection.style.display = 'none';
    return;
  }

  todaySection.style.display = 'block';

  todayContent.innerHTML = topPriorities.map((a, idx) => {
    const dueDate = new Date(a.dueDate);
    const isOverdue = dueDate < now;
    const priorityColors = ['#EF4444', '#F59E0B', '#10B981'];
    const priorityLabels = ['URGENT', 'HIGH', 'MEDIUM'];

    return `
      <div style="background: rgba(255, 255, 255, 0.95); padding: 12px; border-radius: 8px; border-left: 4px solid ${priorityColors[idx]}; cursor: pointer; transition: all 0.2s;"
           onclick="window.open('${escapeHtml(a.url)}', '_blank')"
           onmouseover="this.style.transform='translateX(4px)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'"
           onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
        <div style="display: flex; align-items: start; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
          <span style="font-weight: 600; font-size: 13px; color: #111827; flex: 1;">${escapeHtml(a.name)}</span>
          <span style="background: ${priorityColors[idx]}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 700; white-space: nowrap;">${priorityLabels[idx]}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; font-size: 11px; color: #6B7280;">
          <span>${escapeHtml(a.courseName)}</span>
          <span>•</span>
          <span style="color: ${isOverdue ? '#EF4444' : '#374151'}; font-weight: 500;">
            ${isOverdue ? 'Overdue' : formatDueDate(dueDate)}
          </span>
        </div>
      </div>
    `;
  }).join('');

  // Re-initialize lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Load saved schedule from storage
async function loadSavedSchedule() {
  try {
    const result = await chrome.storage.local.get(['dashboardSchedule', 'dashboardScheduleTimestamp']);
    const scheduleContent = document.getElementById('scheduleContent');

    if (result.dashboardSchedule) {
      scheduleContent.innerHTML = `
        <div class="insights-loaded">
          ${result.dashboardSchedule}
        </div>
      `;

      // Setup event listeners
      setupDayToggleListeners();
      setupTaskCardClickListeners();

      // Add regenerate button
      if (result.dashboardScheduleTimestamp) {
        const footerHtml = createInsightsFooter(result.dashboardScheduleTimestamp, 'schedule');
        scheduleContent.innerHTML += footerHtml;

        // Re-attach listeners for regenerate button
        const regenerateBtn = document.getElementById('regenerateScheduleBtn');
        if (regenerateBtn) {
          regenerateBtn.addEventListener('click', generateAISchedule);
        }
      }
    }
  } catch (error) {
    console.error('Error loading saved schedule:', error);
  }
}

// Generate AI Schedule
async function generateAISchedule() {
  const btn = document.getElementById('generateScheduleBtn') || document.getElementById('regenerateScheduleBtn');
  const scheduleContent = document.getElementById('scheduleContent');

  // Check if API key is set first
  const result = await chrome.storage.local.get(['claudeApiKey']);

  if (!result.claudeApiKey) {
    // Show settings prompt if no API key
    const settingsPrompt = `
      <div class="insights-loaded" style="text-align: center; padding: 40px 20px;">
        <h3 style="margin-bottom: 12px; color: #111827;">Claude API Key Required</h3>
        <p style="margin-bottom: 24px; color: #6B7280; font-size: 14px;">
          To generate AI-powered schedules, configure your Claude API key in Settings.
        </p>
        <button class="btn-primary" id="openSettingsFromSchedule" style="padding: 10px 20px; font-size: 14px;">
          Open Settings
        </button>
      </div>
    `;
    scheduleContent.innerHTML = settingsPrompt;

    document.getElementById('openSettingsFromSchedule').addEventListener('click', () => {
      document.getElementById('settingsModal').classList.add('show');
    });

    return;
  }

  // Show loading state
  if (btn) {
    btn.disabled = true;
    btn.classList.add('loading');
  }

  scheduleContent.innerHTML = `
    <div class="insights-loading">
      <div class="spinner"></div>
      <p>Analyzing your assignments...</p>
    </div>
  `;

  try {
    // Refresh Canvas data first
    await refreshData();

    scheduleContent.innerHTML = `
      <div class="insights-loading">
        <div class="spinner"></div>
        <p>Creating your weekly schedule with Claude AI...</p>
      </div>
    `;

    // Prepare assignments data
    const assignmentsForAI = prepareAssignmentsForAI();

    // Call Claude API with DASHBOARD_SCHEDULE_SCHEMA
    const schedule = await window.ClaudeClient.callClaude(
      result.claudeApiKey,
      assignmentsForAI,
      window.AISchemas.DASHBOARD_SCHEDULE_SCHEMA,
      'dashboard'
    );

    // Format schedule for display (reuse formatStructuredInsights from schedule.js)
    const formattedSchedule = formatScheduleForDisplay(schedule);

    scheduleContent.innerHTML = `
      <div class="insights-loaded fade-in">
        ${formattedSchedule}
      </div>
    `;

    // Setup event listeners
    setupDayToggleListeners();
    setupTaskCardClickListeners();

    // Save schedule to storage
    const timestamp = Date.now();
    await chrome.storage.local.set({
      dashboardSchedule: formattedSchedule,
      dashboardScheduleTimestamp: timestamp
    });

    // Add footer with regenerate button
    const footerHtml = createInsightsFooter(timestamp, 'schedule');
    scheduleContent.innerHTML += footerHtml;

    // Re-attach listener
    const regenerateBtn = document.getElementById('regenerateScheduleBtn');
    if (regenerateBtn) {
      regenerateBtn.addEventListener('click', generateAISchedule);
    }

  } catch (error) {
    scheduleContent.innerHTML = `
      <div class="insights-error">
        <strong>Failed to generate schedule:</strong> ${escapeHtml(error.message)}
        <p style="margin-top: 8px; font-size: 12px;">Check your API key in settings or try again.</p>
      </div>
    `;
  } finally {
    if (btn) {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  }
}

// Format schedule for display (similar to schedule.js formatStructuredInsights)
function formatScheduleForDisplay(schedule) {
  const weeklyPlanHtml = schedule.weekly_plan.map((day, dayIdx) => {
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
            <i data-lucide="lightbulb" style="width: 14px; height: 14px; color: #6B7280; flex-shrink: 0;"></i>
            <span>${escapeHtml(task.notes)}</span>
          </p>
        </div>
      `;
    }).join('');

    const tasksCount = day.tasks.length;
    const dayId = `schedule-day-${dayIdx}`;
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
            <i data-lucide="chevron-down" class="day-icon" style="width: 24px; height: 24px; color: #9CA3AF; transition: transform 0.2s; transform: ${dayIdx < 2 ? 'rotate(180deg)' : 'rotate(0deg)'}; flex-shrink: 0;"></i>
          </div>
        </button>
        <div id="${dayId}" class="day-content" style="display: ${dayIdx < 2 ? 'block' : 'none'}; padding: 24px; border-top: 1px solid #E5E7EB; background: #FAFAFA;">
          ${tasksCount > 0 ? tasksHtml : '<p style="color: #9CA3AF; text-align: center; padding: 32px 0; font-size: 15px;">No sessions scheduled - rest day!</p>'}
        </div>
      </div>
    `;
  }).join('');

  return `<div>${weeklyPlanHtml}</div>`;
}

// Helper function to create insights footer (updated to support schedule)
function createInsightsFooter(timestamp, type = 'insights') {
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

  const btnId = type === 'schedule' ? 'regenerateScheduleBtn' : 'regenerateInsightsBtn';
  const viewBtnHtml = type === 'insights' ? `
    <button class="btn-secondary" id="viewScheduleFromInsights" style="padding: 8px 16px; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #E5E7EB;">
      <i data-lucide="calendar" style="width: 14px; height: 14px;"></i>
      <span>View Schedule</span>
    </button>
  ` : '';

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
}

// Setup day toggle listeners
function setupDayToggleListeners() {
  document.querySelectorAll('.day-plan-toggle').forEach(btn => {
    // Remove existing listeners
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

    // Hover effects
    newBtn.addEventListener('mouseenter', function() {
      this.style.background = '#F9FAFB';
    });
    newBtn.addEventListener('mouseleave', function() {
      this.style.background = this.dataset.defaultBg;
    });
  });
}

// Setup task card click listeners
function setupTaskCardClickListeners() {
  document.querySelectorAll('.schedule-task-card.clickable').forEach(card => {
    // Remove existing listeners
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);

    newCard.addEventListener('click', function() {
      const url = this.dataset.url;
      if (url) {
        window.open(url, '_blank');
      }
    });
  });
}

// Helper function to find assignment URL by fuzzy matching name with scoring
function findAssignmentUrl(assignmentName) {
  if (!assignmentsData || assignmentsData.length === 0) {
    return null;
  }

  const cleanName = assignmentName.toLowerCase().trim();

  // Calculate match score for each assignment
  const scored = assignmentsData
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

// ==================== End Phase 3.1 ====================

// Open Dashboard Button (now in header)
document.getElementById('openDashboardBtn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('schedule.html') });
});

// Setup instructions toggle
const setupToggle = document.getElementById('setupToggle');
const setupContent = document.getElementById('setupContent');
const setupChevron = setupToggle.querySelector('.chevron');

setupToggle.addEventListener('click', () => {
  const isOpen = setupContent.classList.toggle('open');
  setupChevron.classList.toggle('open', isOpen);
});

// Configuration banner handlers
document.getElementById('openConfigSettings').addEventListener('click', () => {
  // Open settings modal
  const settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.classList.add('show');
  }
});

document.getElementById('closeConfigBanner').addEventListener('click', async () => {
  // Hide the banner and remember the dismissal
  const configBanner = document.getElementById('configBanner');
  if (configBanner) {
    configBanner.style.display = 'none';
  }
  // Store dismissal state
  await chrome.storage.local.set({ configBannerDismissed: true });
});

// Function to check and show configuration banner
async function checkAndShowConfigBanner() {
  const result = await chrome.storage.local.get(['canvasUrl', 'configBannerDismissed']);
  const configBanner = document.getElementById('configBanner');

  // Show banner if Canvas URL is not configured and banner hasn't been dismissed
  if (!result.canvasUrl && !result.configBannerDismissed && configBanner) {
    configBanner.style.display = 'block';
    // Initialize Lucide icons only within the banner element (scoped to avoid re-processing all icons)
    if (typeof initializeLucide === 'function') {
      initializeLucide(configBanner);
    }
  }
}

initialize();

// Periodic updates
setInterval(updateStatus, 5000);
