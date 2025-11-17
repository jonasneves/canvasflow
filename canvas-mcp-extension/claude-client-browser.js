/**
 * Shared Claude API Client (Browser Version)
 *
 * Provides shared utilities for calling Claude's API with structured outputs.
 * This consolidates duplicate code between sidepanel.js and dashboard.js.
 */

// Create global namespace
window.ClaudeClient = window.ClaudeClient || {};

/**
 * Call Claude API with structured outputs
 * @param {string} apiKey - Anthropic API key
 * @param {Object} assignmentsData - Prepared assignment data
 * @param {Object} schema - JSON schema for structured output
 * @param {string} promptType - Type of prompt ('sidepanel' or 'dashboard')
 * @returns {Promise<Object>} Parsed JSON response
 */
window.ClaudeClient.callClaude = async function(apiKey, assignmentsData, schema, promptType = 'sidepanel') {
  const prompt = buildPrompt(assignmentsData, promptType);

  // Adaptive max_tokens: sidepanel needs less, dashboard needs more
  const maxTokens = promptType === 'dashboard' ? 3000 : 1500;

  // Adaptive thinking budget: must be >= 1024 and < max_tokens
  const thinkingBudget = promptType === 'dashboard' ? 2000 : 1024;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'structured-outputs-2025-11-13',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      thinking: {
        type: "enabled",
        budget_tokens: thinkingBudget
      },
      messages: [{
        role: 'user',
        content: prompt
      }],
      output_format: schema
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || `API error: ${response.status}`);
  }

  const data = await response.json();

  // With Extended Thinking enabled, we need to find the text block (not thinking block)
  // Response structure: { content: [{ type: "thinking", thinking: "..." }, { type: "text", text: "{...}" }] }
  const textBlock = data.content.find(block => block.type === 'text');

  if (!textBlock || !textBlock.text) {
    throw new Error('No text content found in API response');
  }

  // Structured outputs guarantee valid JSON - no regex extraction needed!
  return JSON.parse(textBlock.text);
};

/**
 * Build prompt based on type
 * @param {Object} assignmentsData - Prepared assignment data
 * @param {string} promptType - Type of prompt ('sidepanel' or 'dashboard')
 * @returns {string} Formatted prompt
 */
function buildPrompt(assignmentsData, promptType) {
  // Get today's date in a clear format
  const today = new Date();
  const todayFormatted = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const basePrompt = `Analyze this student's Canvas assignments and create a ${promptType === 'dashboard' ? '7-day Weekly Battle Plan' : 'Weekly Battle Plan'}.

TODAY'S DATE: ${todayFormatted}

Current Status:
- Total Assignments: ${assignmentsData.totalAssignments}
- Courses: ${assignmentsData.courses.join(', ')}
- Due this week: ${assignmentsData.upcoming.length}
- Overdue: ${assignmentsData.overdue.length}
- Completed: ${assignmentsData.completed}

Upcoming Assignments (next 7 days):
${assignmentsData.upcoming.slice(0, 8).map(a => `- ${a.name} (${a.course}) - Due: ${new Date(a.dueDate).toLocaleDateString()}, ${a.points} points`).join('\n')}

Overdue Assignments:
${assignmentsData.overdue.slice(0, 5).map(a => `- ${a.name} (${a.course}) - Was due: ${new Date(a.dueDate).toLocaleDateString()}, ${a.points} points`).join('\n')}`;

  if (promptType === 'dashboard') {
    return basePrompt + `

Create a realistic 7-day plan starting from TODAY (${todayFormatted}).
The first day should be ${todayFormatted.split(',')[0]} (today).
Use 24-hour format for times (0-23). Be practical with time estimates and daily schedules.`;
  } else {
    return basePrompt + `

Provide practical, actionable advice. Be realistic with time estimates. Keep it concise for a sidepanel view.`;
  }
}

console.log('[Claude Client] Loaded successfully');
