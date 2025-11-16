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
      const allAssignments = response.data.allAssignments || [];

      // Calculate summary counts
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

      const assignmentsWithDates = allAssignments.filter(a => a.due_at && !a.has_submitted_submissions);

      const overdueCount = assignmentsWithDates.filter(a => new Date(a.due_at) < now).length;
      const dueTodayCount = assignmentsWithDates.filter(a => {
        const dueDate = new Date(a.due_at);
        return dueDate >= todayStart && dueDate < todayEnd;
      }).length;
      const upcomingCount = assignmentsWithDates.filter(a => new Date(a.due_at) >= todayEnd).length;

      // Update summary cards
      document.getElementById('overdueCount').textContent = overdueCount;
      document.getElementById('dueTodayCount').textContent = dueTodayCount;
      document.getElementById('upcomingCount').textContent = upcomingCount;

      if (allAssignments.length === 0) {
        // Reset counts to 0
        document.getElementById('overdueCount').textContent = '0';
        document.getElementById('dueTodayCount').textContent = '0';
        document.getElementById('upcomingCount').textContent = '0';

        assignmentsList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📚</div>
            <div class="empty-state-text">No assignments found</div>
            <div style="font-size: 12px; margin-top: 8px;">Click "Refresh Canvas Data" in Settings</div>
          </div>
        `;
        return;
      }

      // Sort by due date (closest first)
      const sortedAssignments = allAssignments
        .filter(a => a.due_at)
        .sort((a, b) => new Date(a.due_at) - new Date(b.due_at));

      // Only show next 20 assignments
      const upcomingAssignments = sortedAssignments.slice(0, 20);

      if (upcomingAssignments.length === 0) {
        assignmentsList.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">✅</div>
            <div class="empty-state-text">No upcoming assignments with due dates</div>
          </div>
        `;
        return;
      }

      // Render assignments
      assignmentsList.innerHTML = upcomingAssignments.map(assignment => {
        const dueDate = new Date(assignment.due_at);
        const now = new Date();
        const isOverdue = dueDate < now;
        const isDueSoon = !isOverdue && (dueDate - now) < 24 * 60 * 60 * 1000; // Within 24 hours
        const isCompleted = assignment.has_submitted_submissions;

        let cardClass = 'assignment-card';
        if (isCompleted) cardClass += ' completed';
        else if (isOverdue) cardClass += ' overdue';

        let dueDateText = dueDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });

        let dueDateClass = 'assignment-due';
        if (isDueSoon) dueDateClass += ' soon';

        let statusText = '';
        if (isCompleted) statusText = '✓ Submitted';
        else if (isOverdue) statusText = '⚠ Overdue';
        else if (isDueSoon) statusText = '⏰ Due soon';

        return `
          <div class="${cardClass}">
            <div class="assignment-title">${escapeHtml(assignment.name || 'Untitled Assignment')}</div>
            <div class="assignment-meta">
              <span>${escapeHtml(assignment.course_name || 'Unknown Course')}</span>
              <span class="${dueDateClass}">Due: ${dueDateText}</span>
              ${statusText ? `<span>${statusText}</span>` : ''}
            </div>
          </div>
        `;
      }).join('');

    } else {
      assignmentsList.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-text">Failed to load assignments</div>
          <div style="font-size: 12px; margin-top: 8px;">Try refreshing Canvas data in Settings</div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading assignments:', error);
    assignmentsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
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

// Test Connection
document.getElementById('testListCourses').addEventListener('click', async () => {
  const button = document.getElementById('testListCourses');
  const originalText = button.textContent;
  button.textContent = 'Testing...';
  button.disabled = true;

  const response = await sendMCPRequest('tools/call', {
    name: 'list_courses',
    arguments: {}
  });

  try {
    const content = response?.result?.content || response?.content;

    if (content && content[0] && content[0].text) {
      const data = JSON.parse(content[0].text);
      showStatusMessage('canvasUrlStatus', `✓ Connected - Found ${data.count} courses`, 'success');
    } else {
      showStatusMessage('canvasUrlStatus', '✗ Connection failed', 'error');
    }
  } catch (error) {
    showStatusMessage('canvasUrlStatus', `✗ Error: ${error.message}`, 'error');
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
});

// Refresh Data
document.getElementById('refreshData').addEventListener('click', async () => {
  const button = document.getElementById('refreshData');
  const originalText = button.textContent;
  button.textContent = 'Syncing...';
  button.disabled = true;

  try {
    const response = await new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'REFRESH_DATA' }, resolve);
    });

    if (response && response.success) {
      const coursesCount = response.data.courses?.length || 0;
      const allAssignmentsCount = response.data.allAssignments?.length || 0;

      showStatusMessage(
        'canvasUrlStatus',
        `✓ Synced - ${coursesCount} courses, ${allAssignmentsCount} assignments`,
        'success'
      );
      updateStatus();
      loadAssignments(); // Reload assignments after refresh
    } else {
      showStatusMessage('canvasUrlStatus', `✗ Sync failed: ${response?.error || 'Unknown error'}`, 'error');
    }
  } catch (error) {
    showStatusMessage('canvasUrlStatus', `✗ Error: ${error.message}`, 'error');
  } finally {
    button.textContent = originalText;
    button.disabled = false;
  }
});

// Refresh assignments button
document.getElementById('refreshAssignments').addEventListener('click', () => {
  loadAssignments();
});

// Listen for storage changes to update Canvas URL
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.canvasUrl) {
    updateCanvasUrl();
  }
});

// Setup instructions toggle
const claudeConfigToggle = document.getElementById('claudeConfigToggle');
const claudeConfigContent = document.getElementById('claudeConfigContent');
const setupChevron = claudeConfigToggle.querySelector('.chevron');

claudeConfigToggle.addEventListener('click', () => {
  const isOpen = claudeConfigContent.classList.toggle('open');
  setupChevron.classList.toggle('open', isOpen);
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

  loadAssignments();
}

initialize();

// Periodic updates
setInterval(updateStatus, 5000);
