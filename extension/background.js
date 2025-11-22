// CanvasFlow - Background Service Worker

// Store Canvas data
let canvasData = {
  courses: [],
  assignments: {},
  allAssignments: [],
  calendarEvents: [],
  upcomingEvents: [],
  submissions: {},
  modules: {},
  analytics: {},
  userProfile: null,
  lastUpdate: null
};

// Storage key for cached Canvas data
const CANVAS_DATA_CACHE_KEY = 'cachedCanvasData';

// Save Canvas data to persistent storage
async function saveCanvasDataToStorage() {
  try {
    await chrome.storage.local.set({
      [CANVAS_DATA_CACHE_KEY]: {
        ...canvasData,
        cacheTimestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to save Canvas data to storage:', error);
  }
}

// Load Canvas data from persistent storage
async function loadCanvasDataFromStorage() {
  try {
    const result = await chrome.storage.local.get([CANVAS_DATA_CACHE_KEY]);
    if (result[CANVAS_DATA_CACHE_KEY]) {
      const cached = result[CANVAS_DATA_CACHE_KEY];
      // Restore all data from cache
      canvasData = {
        courses: cached.courses || [],
        assignments: cached.assignments || {},
        allAssignments: cached.allAssignments || [],
        calendarEvents: cached.calendarEvents || [],
        upcomingEvents: cached.upcomingEvents || [],
        submissions: cached.submissions || {},
        modules: cached.modules || {},
        analytics: cached.analytics || {},
        userProfile: cached.userProfile || null,
        lastUpdate: cached.lastUpdate || null
      };
      console.log('Canvas data restored from cache, last updated:', canvasData.lastUpdate);
      return true;
    }
  } catch (error) {
    console.error('Failed to load Canvas data from storage:', error);
  }
  return false;
}

// Get configured Canvas URL from storage
async function getConfiguredCanvasUrl() {
  try {
    const result = await chrome.storage.local.get(['canvasUrl']);
    return result.canvasUrl || 'https://canvas.university.edu'; // Default fallback
  } catch (error) {
    return 'https://canvas.university.edu';
  }
}

// Helper function to detect if a URL is a Canvas instance
function isCanvasUrl(url) {
  if (!url) return false;

  const canvasPatterns = [
    // Match canvas.*.edu (e.g., canvas.university.edu)
    /^https?:\/\/canvas\.[^\/]*\.edu/i,
    // Match *.edu/canvas (e.g., university.edu/canvas)
    /^https?:\/\/[^\/]*\.edu\/.*canvas/i,
  ];

  return canvasPatterns.some(pattern => pattern.test(url));
}

// Auto-detect and save Canvas URLs from visited tabs
async function detectAndSaveCanvasUrl(url) {
  if (!isCanvasUrl(url)) return;

  try {
    const parsedUrl = new URL(url);
    const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;

    // Get existing detected URLs
    const result = await chrome.storage.local.get(['detectedCanvasUrls']);
    const detectedUrls = result.detectedCanvasUrls || [];

    // Check if this URL already exists
    const existingIndex = detectedUrls.findIndex(item => item.url === baseUrl);

    if (existingIndex >= 0) {
      // Update timestamp
      detectedUrls[existingIndex].lastSeen = new Date().toISOString();
    } else {
      // Add new URL
      detectedUrls.unshift({
        url: baseUrl,
        lastSeen: new Date().toISOString()
      });
    }

    // Keep only 10 most recent
    const trimmedUrls = detectedUrls.slice(0, 10);

    await chrome.storage.local.set({ detectedCanvasUrls: trimmedUrls });
  } catch (error) {
    // Silent error handling
  }
}

// Helper function to get active Canvas tab
async function getCanvasTab() {
  return new Promise(async (resolve, reject) => {
    // Get configured Canvas URL
    const result = await chrome.storage.local.get(['canvasUrl']);
    const configuredUrl = result.canvasUrl;

    // If no URL is configured yet, don't create a tab with default value
    if (!configuredUrl) {
      reject(new Error('No Canvas URL configured'));
      return;
    }

    const configuredDomain = new URL(configuredUrl).hostname;

    // Build query patterns - include configured domain and common Canvas domains
    const queryPatterns = [
      `*://${configuredDomain}/*`,
      '*://*.instructure.com/*',
      '*://*.canvaslms.com/*'
    ];

    // First try to find any open Canvas tab
    chrome.tabs.query({ url: queryPatterns }, (tabs) => {
      if (tabs && tabs.length > 0) {
        // Prefer configured domain if available
        const preferredTab = tabs.find(tab => tab.url && tab.url.includes(configuredDomain));
        resolve(preferredTab || tabs[0]);
      } else {
        // No Canvas tab found, create one with configured URL
        chrome.tabs.create({ url: configuredUrl, active: false }, (tab) => {
          const listener = (tabId, changeInfo) => {
            if (tabId === tab.id && changeInfo.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve(tab);
            }
          };
          chrome.tabs.onUpdated.addListener(listener);
        });
      }
    });
  });
}

// Helper function to send message to content script
function sendMessageToContent(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve(response);
      }
    });
  });
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CANVAS_DATA') {
    if (request.data.courses) {
      canvasData.courses = request.data.courses;
      canvasData.lastUpdate = new Date().toISOString();
    }
    if (request.data.assignments) {
      if (request.data.courseId) {
        canvasData.assignments[request.data.courseId] = request.data.assignments;
      } else if (typeof request.data.assignments === 'object') {
        Object.assign(canvasData.assignments, request.data.assignments);
      }
    }
    if (request.data.allAssignments) {
      canvasData.allAssignments = request.data.allAssignments;
      canvasData.lastUpdate = new Date().toISOString();
    }
    if (request.data.calendarEvents) {
      canvasData.calendarEvents = request.data.calendarEvents;
      canvasData.lastUpdate = new Date().toISOString();
    }
    if (request.data.upcomingEvents) {
      canvasData.upcomingEvents = request.data.upcomingEvents;
      canvasData.lastUpdate = new Date().toISOString();
    }
    if (request.data.submissions) {
      if (request.data.courseId) {
        canvasData.submissions[request.data.courseId] = request.data.submissions;
      } else if (typeof request.data.submissions === 'object') {
        Object.assign(canvasData.submissions, request.data.submissions);
      }
    }
    if (request.data.modules) {
      if (request.data.courseId) {
        canvasData.modules[request.data.courseId] = request.data.modules;
      } else if (typeof request.data.modules === 'object') {
        Object.assign(canvasData.modules, request.data.modules);
      }
    }
    if (request.data.analytics) {
      if (request.data.courseId) {
        canvasData.analytics[request.data.courseId] = request.data.analytics;
      } else if (typeof request.data.analytics === 'object') {
        Object.assign(canvasData.analytics, request.data.analytics);
      }
    }
    if (request.data.userProfile) {
      canvasData.userProfile = request.data.userProfile;
      canvasData.lastUpdate = new Date().toISOString();
    }

    // Save to persistent storage
    saveCanvasDataToStorage();

    sendResponse({ status: 'stored' });
  }

  if (request.type === 'GET_CANVAS_DATA') {
    sendResponse({
      success: true,
      data: canvasData,
      dataLastUpdate: canvasData.lastUpdate
    });
    return true;
  }

  if (request.type === 'REFRESH_DATA') {
    getCanvasTab()
      .then(async (tab) => {
        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          await new Promise(resolve => setTimeout(resolve, 500));

          // Fetch all data types in parallel
          const [
            coursesResponse,
            allAssignmentsResponse,
            calendarEventsResponse,
            upcomingEventsResponse,
            userProfileResponse
          ] = await Promise.all([
            sendMessageToContent(tab.id, { type: 'FETCH_COURSES' }),
            sendMessageToContent(tab.id, { type: 'FETCH_ALL_ASSIGNMENTS' }),
            sendMessageToContent(tab.id, { type: 'FETCH_CALENDAR_EVENTS' }),
            sendMessageToContent(tab.id, { type: 'FETCH_UPCOMING_EVENTS' }),
            sendMessageToContent(tab.id, { type: 'FETCH_USER_PROFILE' })
          ]);

          // Build comprehensive response
          const data = {
            courses: coursesResponse?.success ? coursesResponse.data : [],
            allAssignments: allAssignmentsResponse?.success ? allAssignmentsResponse.data : [],
            calendarEvents: calendarEventsResponse?.success ? calendarEventsResponse.data : [],
            upcomingEvents: upcomingEventsResponse?.success ? upcomingEventsResponse.data : [],
            userProfile: userProfileResponse?.success ? userProfileResponse.data : null,
            assignments: {} // Legacy format for backwards compatibility
          };

          // Update in-memory cache
          if (data.courses.length > 0) {
            canvasData.courses = data.courses;
          }
          if (data.allAssignments.length > 0) {
            canvasData.allAssignments = data.allAssignments;
          }
          if (data.calendarEvents.length > 0) {
            canvasData.calendarEvents = data.calendarEvents;
          }
          if (data.upcomingEvents.length > 0) {
            canvasData.upcomingEvents = data.upcomingEvents;
          }
          if (data.userProfile) {
            canvasData.userProfile = data.userProfile;
          }
          canvasData.lastUpdate = new Date().toISOString();

          // Save to persistent storage
          saveCanvasDataToStorage();

          sendResponse({ success: true, data: data });
        } catch (error) {
          sendResponse({ success: false, error: error.message });
        }
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (request.type === 'OPEN_SIDEPANEL') {
    // Open the sidepanel for the requesting tab
    if (sender.tab && sender.tab.windowId) {
      chrome.sidePanel.open({ windowId: sender.tab.windowId })
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          console.error('Failed to open sidepanel:', error);
          sendResponse({ success: false, error: error.message });
        });
    } else {
      sendResponse({ success: false, error: 'No valid window ID' });
    }
    return true;
  }

  if (request.type === 'UPDATE_NOTIFICATION_SETTINGS') {
    setupNotificationAlarms();
    sendResponse({ success: true });
    return true;
  }

  if (request.type === 'TEST_NOTIFICATION') {
    // Send a test notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon-48.png',
      title: 'CanvasFlow Test Notification',
      message: 'Notifications are working! You will receive deadline reminders based on your settings.',
      priority: 1,
      requireInteraction: false
    }, (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error('Notification error:', chrome.runtime.lastError);
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('Test notification created:', notificationId);
        sendResponse({ success: true, notificationId });
      }
    });
    return true;
  }

});

// Keep service worker alive
if (chrome.alarms) {
  try {
    chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
    chrome.alarms.onAlarm.addListener((alarm) => {
      // Keep alive ping
    });
  } catch (error) {
    // Silent error handling
  }
}

// Listen for tab updates to auto-detect Canvas URLs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    detectAndSaveCanvasUrl(tab.url);
  }
});

// Listen for tab activation to detect Canvas URLs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      detectAndSaveCanvasUrl(tab.url);
    }
  } catch (error) {
    // Silent error handling
  }
});

// Load cached Canvas data on startup
loadCanvasDataFromStorage();

// Listen for Canvas URL changes and auto-refresh data
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.canvasUrl) {
    const oldUrl = changes.canvasUrl.oldValue;
    const newUrl = changes.canvasUrl.newValue;

    if (oldUrl !== newUrl && newUrl) {
      console.log(`Canvas URL changed from ${oldUrl} to ${newUrl} - refreshing data...`);

      // Clear existing data since we're switching Canvas instances
      canvasData = {
        courses: [],
        assignments: {},
        allAssignments: [],
        calendarEvents: [],
        upcomingEvents: [],
        submissions: {},
        modules: {},
        analytics: {},
        userProfile: null,
        lastUpdate: null
      };

      // Trigger automatic data refresh
      getCanvasTab()
        .then(async (tab) => {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ['content.js']
            });
            await new Promise(resolve => setTimeout(resolve, 500));

            // Fetch all data types in parallel
            const [
              coursesResponse,
              allAssignmentsResponse,
              calendarEventsResponse,
              upcomingEventsResponse,
              userProfileResponse
            ] = await Promise.all([
              sendMessageToContent(tab.id, { type: 'FETCH_COURSES' }),
              sendMessageToContent(tab.id, { type: 'FETCH_ALL_ASSIGNMENTS' }),
              sendMessageToContent(tab.id, { type: 'FETCH_CALENDAR_EVENTS' }),
              sendMessageToContent(tab.id, { type: 'FETCH_UPCOMING_EVENTS' }),
              sendMessageToContent(tab.id, { type: 'FETCH_USER_PROFILE' })
            ]);

            // Update in-memory cache
            if (coursesResponse?.success && coursesResponse.data.length > 0) {
              canvasData.courses = coursesResponse.data;
            }
            if (allAssignmentsResponse?.success && allAssignmentsResponse.data.length > 0) {
              canvasData.allAssignments = allAssignmentsResponse.data;
            }
            if (calendarEventsResponse?.success && calendarEventsResponse.data.length > 0) {
              canvasData.calendarEvents = calendarEventsResponse.data;
            }
            if (upcomingEventsResponse?.success && upcomingEventsResponse.data.length > 0) {
              canvasData.upcomingEvents = upcomingEventsResponse.data;
            }
            if (userProfileResponse?.success && userProfileResponse.data) {
              canvasData.userProfile = userProfileResponse.data;
            }
            canvasData.lastUpdate = new Date().toISOString();

            // Save to persistent storage
            saveCanvasDataToStorage();

            console.log(`Data refreshed successfully from new Canvas instance: ${newUrl}`);
          } catch (error) {
            console.error(`Failed to refresh data after Canvas URL change: ${error.message}`);
          }
        })
        .catch(error => {
          console.error(`Failed to get Canvas tab for auto-refresh: ${error.message}`);
        });
    }
  }
});

// Handle extension icon click to open side panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// ============================================
// NOTIFICATION SYSTEM
// ============================================

// Setup notification alarms based on user settings
async function setupNotificationAlarms() {
  try {
    const result = await chrome.storage.local.get(['notificationsEnabled']);
    const enabled = result.notificationsEnabled || false;

    // Clear existing alarms
    chrome.alarms.clear('checkDeadlines');
    chrome.alarms.clear('dailySummary');

    if (!enabled) {
      return;
    }

    // Check deadlines every hour
    chrome.alarms.create('checkDeadlines', { periodInMinutes: 60 });

    // Daily summary at 8 AM
    const now = new Date();
    const next8AM = new Date();
    next8AM.setHours(8, 0, 0, 0);
    if (next8AM <= now) {
      next8AM.setDate(next8AM.getDate() + 1);
    }
    const delayInMinutes = Math.floor((next8AM - now) / 60000);
    chrome.alarms.create('dailySummary', { delayInMinutes, periodInMinutes: 24 * 60 });
  } catch (error) {
    console.error('Failed to setup notification alarms:', error);
  }
}

// Check if current time is within quiet hours
async function isQuietHours() {
  try {
    const result = await chrome.storage.local.get(['quietHoursStart', 'quietHoursEnd']);
    const quietStart = result.quietHoursStart || '22:00';
    const quietEnd = result.quietHoursEnd || '08:00';

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = quietStart.split(':').map(Number);
    const [endHour, endMin] = quietEnd.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle case where quiet hours span midnight
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    }
  } catch (error) {
    return false;
  }
}

// Get notification frequency setting
async function getNotificationFrequency() {
  try {
    const result = await chrome.storage.local.get(['notificationFrequency']);
    return result.notificationFrequency || 'balanced';
  } catch (error) {
    return 'balanced';
  }
}

// Check assignments and send notifications
async function checkAssignmentsAndNotify() {
  // Check if notifications are enabled
  const result = await chrome.storage.local.get(['notificationsEnabled']);
  if (!result.notificationsEnabled) {
    return;
  }

  // Check quiet hours
  if (await isQuietHours()) {
    return;
  }

  const frequency = await getNotificationFrequency();
  const assignments = canvasData.allAssignments || [];
  const now = new Date();

  // Filter to unsubmitted assignments
  const unsubmitted = assignments.filter(a => !a.submission?.submitted && a.dueDate);

  // Categorize assignments
  const overdue = unsubmitted.filter(a => new Date(a.dueDate) < now);
  const dueToday = unsubmitted.filter(a => {
    const dueDate = new Date(a.dueDate);
    return dueDate.toDateString() === now.toDateString() && dueDate >= now;
  });
  const dueTomorrow = unsubmitted.filter(a => {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueDate = new Date(a.dueDate);
    return dueDate.toDateString() === tomorrow.toDateString();
  });
  const dueSoon = unsubmitted.filter(a => {
    const dueDate = new Date(a.dueDate);
    const hoursUntilDue = (dueDate - now) / (1000 * 60 * 60);
    return hoursUntilDue > 0 && hoursUntilDue <= 3;
  });

  // Send notifications based on frequency
  if (frequency === 'minimal') {
    // Only overdue
    if (overdue.length > 0) {
      showNotification('overdue', overdue);
    }
  } else if (frequency === 'balanced') {
    // Overdue and urgent (due soon)
    if (overdue.length > 0) {
      showNotification('overdue', overdue);
    } else if (dueSoon.length > 0) {
      showNotification('dueSoon', dueSoon);
    } else if (dueToday.length > 0 && now.getHours() >= 8 && now.getHours() < 20) {
      // Only remind about today's assignments during waking hours
      showNotification('dueToday', dueToday);
    }
  } else if (frequency === 'aggressive') {
    // All notifications
    if (overdue.length > 0) {
      showNotification('overdue', overdue);
    }
    if (dueSoon.length > 0) {
      showNotification('dueSoon', dueSoon);
    }
    if (dueToday.length > 0) {
      showNotification('dueToday', dueToday);
    }
    if (dueTomorrow.length > 0 && now.getHours() >= 18) {
      // Tomorrow's assignments only in evening
      showNotification('dueTomorrow', dueTomorrow);
    }
  }
}

// Show daily summary notification
async function showDailySummary() {
  // Check if notifications are enabled
  const result = await chrome.storage.local.get(['notificationsEnabled']);
  if (!result.notificationsEnabled) {
    return;
  }

  const assignments = canvasData.allAssignments || [];
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Filter to unsubmitted assignments
  const unsubmitted = assignments.filter(a => !a.submission?.submitted && a.dueDate);

  const dueToday = unsubmitted.filter(a => {
    const dueDate = new Date(a.dueDate);
    return dueDate.toDateString() === now.toDateString();
  });

  const dueTomorrow = unsubmitted.filter(a => {
    const dueDate = new Date(a.dueDate);
    return dueDate.toDateString() === tomorrow.toDateString();
  });

  const overdue = unsubmitted.filter(a => new Date(a.dueDate) < now);

  // Build summary message
  const parts = [];
  if (overdue.length > 0) {
    parts.push(`${overdue.length} overdue`);
  }
  if (dueToday.length > 0) {
    parts.push(`${dueToday.length} due today`);
  }
  if (dueTomorrow.length > 0) {
    parts.push(`${dueTomorrow.length} due tomorrow`);
  }

  if (parts.length === 0) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon-48.png',
      title: 'CanvasFlow Daily Summary',
      message: 'No urgent assignments. Great job staying on top of your work!',
      priority: 1
    });
  } else {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon-48.png',
      title: 'CanvasFlow Daily Summary',
      message: `You have: ${parts.join(', ')}`,
      priority: 2
    });
  }
}

// Show notification based on type
function showNotification(type, assignments) {
  let title, message, priority;

  switch (type) {
    case 'overdue':
      if (assignments.length === 1) {
        title = 'Assignment Overdue';
        message = `${assignments[0].name} is overdue`;
      } else {
        title = `${assignments.length} Assignments Overdue`;
        message = assignments.slice(0, 3).map(a => a.name).join(', ');
        if (assignments.length > 3) {
          message += ` and ${assignments.length - 3} more`;
        }
      }
      priority = 2;
      break;

    case 'dueSoon':
      if (assignments.length === 1) {
        const dueDate = new Date(assignments[0].dueDate);
        const hours = Math.ceil((dueDate - new Date()) / (1000 * 60 * 60));
        title = 'Assignment Due Soon';
        message = `${assignments[0].name} is due in ${hours} hour${hours !== 1 ? 's' : ''}`;
      } else {
        title = 'Assignments Due Soon';
        message = `${assignments.length} assignments due in the next 3 hours`;
      }
      priority = 2;
      break;

    case 'dueToday':
      if (assignments.length === 1) {
        title = 'Assignment Due Today';
        message = assignments[0].name;
      } else {
        title = `${assignments.length} Assignments Due Today`;
        message = assignments.slice(0, 2).map(a => a.name).join(', ');
        if (assignments.length > 2) {
          message += ` and ${assignments.length - 2} more`;
        }
      }
      priority = 1;
      break;

    case 'dueTomorrow':
      title = `${assignments.length} Assignment${assignments.length !== 1 ? 's' : ''} Due Tomorrow`;
      message = assignments.slice(0, 2).map(a => a.name).join(', ');
      if (assignments.length > 2) {
        message += ` and ${assignments.length - 2} more`;
      }
      priority = 1;
      break;

    default:
      return;
  }

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon-128.png',
    title,
    message,
    priority
  });
}

// Listen for alarm events
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Keep alive ping
    return;
  }

  if (alarm.name === 'checkDeadlines') {
    checkAssignmentsAndNotify();
  }

  if (alarm.name === 'dailySummary') {
    showDailySummary();
  }
});

// Setup notification alarms on startup
setupNotificationAlarms();
