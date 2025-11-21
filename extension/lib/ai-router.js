/**
 * AI Router for CanvasFlow Extension
 *
 * Provides model selection and auto-fallback routing for GitHub Models API calls.
 * Supports multiple AI providers through GitHub's unified inference API.
 */

// Create global namespace
window.AIRouter = window.AIRouter || {};

/**
 * GitHub Models API configuration
 */
window.AIRouter.API_URL = 'https://models.github.ai/inference/chat/completions';

/**
 * Available models from GitHub Models
 * Priority: lower number = higher priority (tried first in auto mode)
 */
window.AIRouter.MODELS = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    publisher: 'OpenAI',
    description: 'Most capable OpenAI model',
    priority: 1,
    tier: 'high',
    maxOutputTokens: 4096
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    publisher: 'OpenAI',
    description: 'Fast and cost-effective',
    priority: 2,
    tier: 'low',
    maxOutputTokens: 4096
  },
  {
    id: 'Meta-Llama-3.1-405B-Instruct',
    name: 'Llama 3.1 405B',
    publisher: 'Meta',
    description: 'Largest open-source model',
    priority: 3,
    tier: 'high',
    maxOutputTokens: 4096
  },
  {
    id: 'Meta-Llama-3.1-70B-Instruct',
    name: 'Llama 3.1 70B',
    publisher: 'Meta',
    description: 'Strong open-source model',
    priority: 4,
    tier: 'high',
    maxOutputTokens: 4096
  },
  {
    id: 'Mistral-large-2407',
    name: 'Mistral Large',
    publisher: 'Mistral AI',
    description: 'Powerful Mistral model',
    priority: 5,
    tier: 'high',
    maxOutputTokens: 4096
  }
];

/**
 * Default router configuration
 */
window.AIRouter.DEFAULT_CONFIG = {
  selectionMode: 'auto', // 'auto' or 'manual'
  selectedModelId: 'gpt-4o',
  enableFallback: true
};

/**
 * Get current router configuration from storage
 * @returns {Promise<Object>} Router configuration
 */
window.AIRouter.getConfig = async function() {
  const result = await chrome.storage.local.get(['aiRouterConfig']);
  return { ...window.AIRouter.DEFAULT_CONFIG, ...result.aiRouterConfig };
};

/**
 * Save router configuration to storage
 * @param {Object} config - Router configuration to save
 */
window.AIRouter.saveConfig = async function(config) {
  await chrome.storage.local.set({ aiRouterConfig: config });
};

/**
 * Get model by ID
 * @param {string} modelId - Model ID to find
 * @returns {Object|undefined} Model object
 */
window.AIRouter.getModel = function(modelId) {
  return window.AIRouter.MODELS.find(m => m.id === modelId);
};

/**
 * Get models sorted by priority
 * @returns {Array} Models sorted by priority
 */
window.AIRouter.getModelsByPriority = function() {
  return [...window.AIRouter.MODELS].sort((a, b) => a.priority - b.priority);
};

/**
 * Execute API call with auto-fallback on failure
 * @param {Function} apiCall - Function that takes modelId and returns Promise
 * @param {Object} options - Options for the router
 * @returns {Promise<Object>} Result with data and metadata
 */
window.AIRouter.executeWithFallback = async function(apiCall, options = {}) {
  const config = await window.AIRouter.getConfig();
  const failures = [];

  let modelsToTry;

  if (config.selectionMode === 'manual' || !config.enableFallback) {
    // Manual mode: only try the selected model
    const selectedModel = window.AIRouter.getModel(config.selectedModelId);
    modelsToTry = selectedModel ? [selectedModel] : window.AIRouter.getModelsByPriority().slice(0, 1);
  } else {
    // Auto mode: try all models in priority order
    modelsToTry = window.AIRouter.getModelsByPriority();
  }

  for (const model of modelsToTry) {
    try {
      const startTime = performance.now();
      const result = await apiCall(model.id);
      const duration = ((performance.now() - startTime) / 1000).toFixed(1);

      return {
        success: true,
        data: result,
        model: model,
        duration: duration,
        failures: failures
      };
    } catch (error) {
      console.error(`Model ${model.name} failed:`, error);

      const errorInfo = {
        modelId: model.id,
        modelName: model.name,
        error: error.message,
        status: error.status || 'Error'
      };
      failures.push(errorInfo);

      // Determine if we should retry with next model
      const isRetryableError =
        error.status === 429 || // Rate limit
        error.status === 500 || // Server error
        error.status === 503 || // Service unavailable
        error.status === 529;   // Overloaded

      // In manual mode or if not a retryable error in auto mode, stop trying
      if (config.selectionMode === 'manual' || !config.enableFallback) {
        break;
      }

      // If not retryable and not in fallback mode, stop
      if (!isRetryableError && modelsToTry.length === 1) {
        break;
      }

      // Continue to next model
    }
  }

  // All models failed
  return {
    success: false,
    data: null,
    model: null,
    duration: null,
    failures: failures,
    error: failures.length > 0
      ? `All models failed. Last error: ${failures[failures.length - 1].error}`
      : 'No models available'
  };
};

/**
 * Format failure trace for display
 * @param {Array} failures - Array of failure objects
 * @returns {string} Formatted failure trace
 */
window.AIRouter.formatFailureTrace = function(failures) {
  if (!failures || failures.length === 0) return '';
  return failures.map(f => `${f.modelName} (${f.status})`).join(' → ');
};

