// Configuration
const CONFIG = {
  GITHUB_TOKEN: 'YOUR_GITHUB_TOKEN_HERE',
  API_URL: 'https://models.github.ai/inference/chat/completions',
  CATALOG_URL: 'https://models.github.ai/catalog/models'
};

// State
let STATE = {
  models: [], // Loaded from API or fallback
  selectionMode: 'auto', // 'auto' or 'manual'
  selectedModels: new Set(), // Set of model IDs
  pageContext: null,
  rateLimits: {}, // Map of model ID -> rate limit info
  theme: 'system' // 'light', 'dark', or 'system'
};

// DOM Elements
const DOM = {
  chatView: document.getElementById('chatView'),
  settingsView: document.getElementById('settingsView'),
  chatHistory: document.getElementById('chatHistory'),
  chatInput: document.getElementById('chatInput'),
  sendBtn: document.getElementById('sendBtn'),
  themeToggle: document.getElementById('themeToggle'),
  settingsToggle: document.getElementById('settingsToggle'),
  backToChat: document.getElementById('backToChat'),
  modelTrigger: document.getElementById('modelTrigger'),
  modelsList: document.getElementById('modelsList'),
  manualSelectionArea: document.getElementById('manualSelectionArea'),
  pageContextIndicator: document.getElementById('pageContextIndicator'),
  pageContextTitle: document.getElementById('pageContextTitle'),
  selectionRadios: document.querySelectorAll('input[name="selectionMode"]')
};

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  setupEventListeners();
  configureMarked();
  await loadModelCatalog();
loadCurrentPageInfo();
});

// --- Theme Management ---
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'system';
  setTheme(savedTheme);
}

function setTheme(theme) {
  STATE.theme = theme;
  localStorage.setItem('theme', theme);
  
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  // Theme icon is SVG, no need to update text
}

// --- Event Listeners ---
function setupEventListeners() {
  // Theme Toggle
  DOM.themeToggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // View Navigation
  DOM.settingsToggle.addEventListener('click', () => switchView('settings'));
  DOM.backToChat.addEventListener('click', () => switchView('chat'));
  DOM.modelTrigger.addEventListener('click', () => switchView('settings'));

  // Chat Input
  DOM.chatInput.addEventListener('input', () => {
    DOM.chatInput.style.height = 'auto';
    DOM.chatInput.style.height = Math.min(DOM.chatInput.scrollHeight, 150) + 'px';
    DOM.sendBtn.disabled = !DOM.chatInput.value.trim();
  });

  DOM.chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleChatSend();
    }
  });

  DOM.sendBtn.addEventListener('click', handleChatSend);

  // Selection Mode
  DOM.selectionRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      STATE.selectionMode = e.target.value;
      updateSelectionUI();
    });
  });
  
  // Listen for tab changes
  chrome.tabs.onActivated.addListener(loadCurrentPageInfo);
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete') loadCurrentPageInfo();
  });
  
  // Clear cache button
  const clearCacheBtn = document.getElementById('clearCache');
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
      STATE.rateLimits = {};
      chrome.storage.local.clear(() => {
        alert('Cache cleared successfully');
      });
    });
  }
}

function switchView(viewName) {
  if (viewName === 'chat') {
    DOM.chatView.classList.remove('hidden');
    DOM.settingsView.classList.add('hidden');
  } else {
    DOM.chatView.classList.add('hidden');
    DOM.settingsView.classList.remove('hidden');
  }
}

function updateSelectionUI() {
  const triggerText = document.getElementById('modelTriggerText');
  if (STATE.selectionMode === 'manual') {
    DOM.manualSelectionArea.classList.remove('hidden');
    triggerText.textContent = `Manual (${STATE.selectedModels.size})`;
  } else {
    DOM.manualSelectionArea.classList.add('hidden');
    triggerText.textContent = 'Auto';
  }
  
  // Update rate limit section visibility
  updateRateLimitDisplay();
}

// --- Model Management ---
async function loadModelCatalog() {
  try {
    // Try API first
    const response = await fetch(CONFIG.CATALOG_URL, {
      headers: {
        'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      // Enhance data with tiers based on max tokens or known IDs
      const rawModels = data.models || data || [];
      STATE.models = rawModels.map(m => {
        // Heuristic for tiers
        let tier = 'low';
        if (m.max_input_tokens > 100000 || m.id.includes('gpt-4') || m.id.includes('llama-3.1-405b') || m.id.includes('deepseek-v3')) {
            tier = 'high';
        }
        
        // Heuristic for priority
        let priority = 999;
        if (m.id.includes('gpt-4o')) priority = 1;
        else if (m.id.includes('llama-3.3-70b')) priority = 2;
        else if (m.id.includes('mistral-large')) priority = 3;
        else if (tier === 'high') priority = 10;
        else priority = 50;

        return { ...m, priority, tier };
      });
    }
  } catch (e) {
    console.warn('Failed to fetch models, using fallback.');
  }

  // Fallback if empty
  if (!STATE.models || STATE.models.length === 0) {
    STATE.models = [
      { id: "openai/gpt-4o", name: "GPT-4o", publisher: "OpenAI", priority: 1, tier: 'high', max_output_tokens: 4096 },
      { id: "meta/llama-3.3-70b-instruct", name: "Llama 3.3 70B", publisher: "Meta", priority: 2, tier: 'high', max_output_tokens: 4096 },
      { id: "mistral-ai/mistral-large-2407", name: "Mistral Large", publisher: "Mistral AI", priority: 3, tier: 'high', max_output_tokens: 4096 },
      { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", publisher: "OpenAI", priority: 10, tier: 'low', max_output_tokens: 4096 }
    ];
  }

  renderModelList();
}

function renderModelList() {
  DOM.modelsList.innerHTML = '';
  
  // Group by tier
  const sortedModels = STATE.models.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier === 'high' ? -1 : 1; // High first
      return (a.priority || 999) - (b.priority || 999);
  });
  
  sortedModels.forEach(model => {
    const item = document.createElement('label');
    item.className = 'model-item';
    const isSelected = STATE.selectedModels.has(model.id);
    const tierClass = model.tier === 'high' ? 'tier-high' : 'tier-low';
    
    item.innerHTML = `
      <div class="checkbox-wrapper">
        <input type="checkbox" value="${model.id}" ${isSelected ? 'checked' : ''}>
        <div class="model-info">
          <div class="model-name">
            ${model.name}
            <span class="tier-badge ${tierClass}">${model.tier}</span>
      </div>
          <div class="model-meta">${model.publisher} • ${(model.max_output_tokens/1000).toFixed(0)}k out</div>
            </div>
            </div>
    `;
    
    const checkbox = item.querySelector('input');
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) STATE.selectedModels.add(model.id);
      else STATE.selectedModels.delete(model.id);
      updateSelectionUI();
    });

    DOM.modelsList.appendChild(item);
  });
}

// --- Chat Logic ---
async function handleChatSend() {
  const text = DOM.chatInput.value.trim();
  if (!text) return;

  // Add User Message
  addMessageToUI('user', text);
  DOM.chatInput.value = '';
  DOM.chatInput.style.height = 'auto';
  DOM.sendBtn.disabled = true;

  // Prepare Context
  if (!STATE.pageContext) await loadCurrentPageInfo();
  const prompt = buildPrompt(text);

  // Determine Models
  let modelsToRun = [];
  if (STATE.selectionMode === 'auto') {
    // Sort by priority/capability, pick first healthy one
    // For now, simple priority list
    modelsToRun = STATE.models.sort((a, b) => (a.priority || 999) - (b.priority || 999)).slice(0, 1);
      } else {
    modelsToRun = STATE.models.filter(m => STATE.selectedModels.has(m.id));
    if (modelsToRun.length === 0) {
        addMessageToUI('assistant', 'Please select at least one model in settings.', 'System');
        DOM.sendBtn.disabled = false;
        return;
    }
  }

  // Run Models
  // Create placeholder messages
  const messageIds = modelsToRun.map(m => {
    return addMessageToUI('assistant', null, m.name, true);
  });

  // Execute
  if (STATE.selectionMode === 'auto') {
      await executeAutoMode(prompt, messageIds[0]);
  } else {
      // Parallel execution
      await Promise.all(modelsToRun.map((m, i) => executeModel(m, prompt, messageIds[i])));
  }

  DOM.sendBtn.disabled = false;
}

async function executeAutoMode(prompt, messageId) {
    const sortedModels = STATE.models.sort((a, b) => (a.priority || 999) - (b.priority || 999));
    const failures = [];
    
    for (const model of sortedModels) {
        try {
            // Update UI to show which model we are trying
            const msgEl = document.getElementById(messageId);
            if(msgEl) {
                msgEl.querySelector('.model-header span').textContent = `🤖 ${model.name} (Auto)`;
            }
            
            await executeModel(model, prompt, messageId, failures);
            return; // Success
        } catch (e) {
            console.error(`Model ${model.name} failed:`, e);
            failures.push({ name: model.name, error: e.status || 'Error' });
            // If 429, try next. Else, maybe stop? For now, we just try next.
            if (e.status !== 429 && e.status !== 500 && e.status !== 503) {
                 // Stop on non-retryable errors? No, safer to try next.
            }
        }
    }
    
    // If we get here, all failed
    const msgEl = document.getElementById(messageId);
    if(msgEl) {
        msgEl.querySelector('.message-content').innerHTML = `<span style="color:var(--danger-color)">All models failed to respond.</span>`;
        msgEl.querySelector('.typing-indicator')?.remove();
    }
}

async function executeModel(model, prompt, messageId, priorFailures = []) {
    const msgEl = document.getElementById(messageId);
    const contentEl = msgEl.querySelector('.message-content');
    const loadingEl = contentEl.querySelector('.typing-indicator');
    
    let accumulatedText = '';
      const startTime = performance.now();
    let totalTokens = 0;

    try {
        // Show prior failures if any (mini trace)
        if (priorFailures.length > 0 && loadingEl) {
             const traceHtml = `<div style="font-size:0.7rem; color:var(--text-tertiary); margin-bottom:0.5rem;">Retry trace: ${priorFailures.map(f => `${f.name} (${f.error})`).join(' → ')}</div>`;
             // We insert this at the top of accumulated text later or just keep it in mind
             // Actually, let's just prepend it to the final content if we want, or update the header
        }

        await streamResponse(prompt, model.id, (chunk, usage) => {
            if (loadingEl) loadingEl.remove();
            accumulatedText += chunk;
            // Simply re-render markdown on every chunk (expensive but fine for small context)
            // Or just append text node? Markdown is better.
            contentEl.innerHTML = marked.parse(accumulatedText);
            // Scroll to bottom
            DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
            
            if (usage) totalTokens = usage;
        });
        
        // Add stats footer
        const endTime = performance.now();
        const duration = ((endTime - startTime) / 1000).toFixed(1);
        const tps = totalTokens > 0 ? (totalTokens / duration).toFixed(1) : '?';
        
        addStatsFooter(msgEl, {
            time: `${duration}s`,
            tokens: `${totalTokens} tok`,
            speed: `${tps} t/s`,
            model: model.name
        });

    } catch (e) {
        if (accumulatedText.length === 0) {
             throw e; 
        }
    }
}

function addStatsFooter(messageElement, stats) {
    const footer = document.createElement('div');
    footer.className = 'message-footer';
    footer.innerHTML = `
        <div class="stat-item">
            <div class="stat-label">Latency</div>
            <div class="stat-value">${stats.time}</div>
    </div>
        <div class="stat-item">
            <div class="stat-label">Tokens</div>
            <div class="stat-value">${stats.tokens}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Speed</div>
            <div class="stat-value">${stats.speed}</div>
        </div>
        <div class="stat-item">
            <div class="stat-label">Model</div>
            <div class="stat-value" style="font-size: 0.7rem;">${stats.model}</div>
        </div>
    `;
    messageElement.appendChild(footer);
}

// --- API Interaction ---
async function streamResponse(prompt, modelId, onChunk) {
  const response = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${CONFIG.GITHUB_TOKEN}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify({
            model: modelId,
      messages: [{ role: 'user', content: prompt }],
      stream: true,
            max_tokens: 1024,
            stream_options: { include_usage: true } // Request usage stats
    })
  });

  if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        err.status = response.status;
        throw err;
    }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
    let usage = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
                if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    
                    // Check for usage info in the stream (usually in the last chunk)
          if (parsed.usage) {
                        usage = parsed.usage.total_tokens;
                    }
                    
                    if (content) onChunk(content, usage);
                    else if (usage > 0) onChunk('', usage); // Send final usage update
                } catch (e) {}
            }
        }
    }
}

// --- UI Helpers ---
function addMessageToUI(role, content, modelName = 'Assistant', isLoading = false) {
    const div = document.createElement('div');
    div.className = `message ${role}`;
    const id = `msg-${Date.now()}-${Math.random()}`;
    div.id = id;

    if (role === 'user') {
        div.innerHTML = `<div class="message-content">${escapeHtml(content)}</div>`;
    } else {
        const loadingHtml = isLoading ? 
            `<div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>` : 
            (content ? marked.parse(content) : '');
        
        const statusIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--text-secondary);">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>`;
            
        div.innerHTML = `
            <div class="model-header">${statusIcon}<span>${modelName}</span></div>
            <div class="message-content">${loadingHtml}</div>
        `;
    }

    DOM.chatHistory.appendChild(div);
    DOM.chatHistory.scrollTop = DOM.chatHistory.scrollHeight;
    return id;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function configureMarked() {
    if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true });
    }
}

// --- Page Context ---
async function loadCurrentPageInfo() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || tab.url.startsWith('chrome')) {
            STATE.pageContext = null;
            DOM.pageContextIndicator.classList.add('hidden');
            return;
        }

        const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => ({
                title: document.title,
                url: window.location.href,
                content: document.body.innerText.slice(0, 2000) // Limit context size
            })
        });

        STATE.pageContext = result[0].result;
        DOM.pageContextTitle.textContent = STATE.pageContext.title;
        DOM.pageContextIndicator.classList.remove('hidden');
    } catch (e) {
        console.log('Context load failed:', e);
        STATE.pageContext = null;
        DOM.pageContextIndicator.classList.add('hidden');
    }
}

function buildPrompt(userMessage) {
    if (!STATE.pageContext) return userMessage;
    return `Context: ${STATE.pageContext.title}\n${STATE.pageContext.url}\n\nPage Content Snippet:\n${STATE.pageContext.content}\n\nUser Query: ${userMessage}`;
}

// Update rate limit display in settings
function updateRateLimitDisplay() {
    const section = document.getElementById('rateLimitSection');
    const container = document.getElementById('rateLimitCards');
    
    if (!container) return;
    
    const hasLimits = Object.keys(STATE.rateLimits).length > 0;
    
    if (!hasLimits) {
        section.classList.add('hidden');
        return;
    }
    
    section.classList.remove('hidden');
    container.innerHTML = '';
    
    Object.entries(STATE.rateLimits).forEach(([modelId, limit]) => {
        const model = STATE.models.find(m => m.id === modelId);
        if (!model) return;
        
        const percentage = limit.remaining && limit.limit ? Math.round((limit.remaining / limit.limit) * 100) : 100;
        const quotaClass = percentage < 20 ? 'critical' : percentage < 50 ? 'low' : '';
        
        const card = document.createElement('div');
        card.className = 'info-card';
        card.innerHTML = `
            <div class="info-card-title">${model.name}</div>
            <div class="info-card-content">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span>Requests: ${limit.remaining || '?'} / ${limit.limit || '?'}</span>
                    <span>${percentage}%</span>
                </div>
                <div class="quota-bar">
                    <div class="quota-fill ${quotaClass}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}
