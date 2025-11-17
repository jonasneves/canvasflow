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
      max_tokens: 3000,
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

  // Structured outputs guarantee valid JSON - no regex extraction needed!
  const textContent = data.content[0].text;
  return JSON.parse(textContent);
};

/**
 * Build prompt based on type
 * @param {Object} assignmentsData - Prepared assignment data
 * @param {string} promptType - Type of prompt ('sidepanel' or 'dashboard')
 * @returns {string} Formatted prompt
 */
function buildPrompt(assignmentsData, promptType) {
  const basePrompt = `Analyze this student's Canvas assignments and create a ${promptType === 'dashboard' ? '7-day Weekly Battle Plan' : 'Weekly Battle Plan'}.

Current Status:
- Total Assignments: ${assignmentsData.totalAssignments}
- Courses: ${assignmentsData.courses.join(', ')}
- Due this week: ${assignmentsData.upcoming.length}
- Overdue: ${assignmentsData.overdue.length}
- Completed: ${assignmentsData.completed}

Upcoming Assignments (next 7 days):
${assignmentsData.upcoming.slice(0, 8).map(a => `- ${a.name} (${a.course}) - Due: ${new Date(a.dueDate).toLocaleDateString()}, ${a.points} points`).join('\n')}

Overdue Assignments:
${assignmentsData.overdue.slice(0, 5).map(a => `- ${a.name} (${a.course}) - Was due: ${new Date(a.dueDate).toLocaleDateString()}, ${a.points} points`).join('\n')}

SCORING GUIDANCE:
- urgency_score: 0=can wait, 1=should do soon, 2=high priority, 3=critical/immediate
- intensity_score: 0=light week, 1=normal load, 2=heavy week, 3=overwhelming`;

  if (promptType === 'dashboard') {
    return basePrompt + `
- workload_score: 0=light day, 1=moderate day, 2=heavy day, 3=extreme day
- start_hour: Use 24-hour format (0-23), e.g., 9 for 9 AM, 14 for 2 PM
- duration_hours: Decimal hours, e.g., 1.5 for 90 minutes, 2.5 for 2 hours 30 minutes

Create a realistic 7-day plan starting from today. Be practical with time estimates and daily schedules.`;
  } else {
    return basePrompt + `

Provide practical, actionable advice. Be realistic with time estimates. Keep it concise for a sidepanel view.`;
  }
}

console.log('[Claude Client] Loaded successfully');
