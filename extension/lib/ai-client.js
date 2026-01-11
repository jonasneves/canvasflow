/**
 * AI Client for CanvasFlow
 *
 * Provides utilities for calling AI API with structured outputs.
 * Uses GitHub AI Models API (GPT-4o, Llama, Mistral, etc.)
 */

window.AIClient = window.AIClient || {};

/**
 * Call AI API with structured outputs (direct call with specific model)
 * @param {string} apiKey - API token
 * @param {Object} assignmentsData - Prepared assignment data
 * @param {Object} schema - JSON schema for structured output
 * @param {string} promptType - Type of prompt ('sidepanel' or 'dashboard')
 * @param {string} modelId - Model ID to use (defaults to gpt-4o)
 * @returns {Promise<Object>} Parsed JSON response
 */
window.AIClient.call = async function(apiKey, assignmentsData, schema, promptType = 'sidepanel', modelId = 'gpt-4o') {
  const prompt = buildPrompt(assignmentsData, promptType);
  const maxTokens = promptType === 'dashboard' ? 3000 : 1500;
  const schemaInstruction = buildSchemaInstruction(schema);

  const response = await fetch(window.AIRouter.API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: maxTokens,
      messages: [{
        role: 'system',
        content: 'You are a helpful academic advisor that analyzes student assignments and creates actionable study plans. Always respond with valid JSON only, no markdown formatting or explanations outside the JSON structure.'
      }, {
        role: 'user',
        content: prompt + '\n\n' + schemaInstruction
      }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error?.message || errorMessage;
    } catch (e) {
      // Couldn't parse error response
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content found in API response');
  }

  // Parse JSON from response, handling potential markdown wrapping
  let jsonStr = content.trim();
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  return JSON.parse(jsonStr.trim());
};

/**
 * Call AI API with router (auto-fallback and model selection)
 * @param {string} apiKey - API token
 * @param {Object} assignmentsData - Prepared assignment data
 * @param {Object} schema - JSON schema for structured output
 * @param {string} promptType - Type of prompt ('sidepanel' or 'dashboard')
 * @returns {Promise<Object>} Result object with data, model info, and metadata
 */
window.AIClient.callWithRouter = async function(apiKey, assignmentsData, schema, promptType = 'sidepanel') {
  const result = await window.AIRouter.executeWithFallback(async (modelId) => {
    return await window.AIClient.call(apiKey, assignmentsData, schema, promptType, modelId);
  });

  if (!result.success) {
    const error = new Error(result.error || 'AI Router: All models failed');
    error.failures = result.failures;
    throw error;
  }

  return result;
};

function buildSchemaInstruction(schema) {
  const schemaObj = schema.json_schema.schema;
  return `You must respond with valid JSON matching this exact schema:

${JSON.stringify(schemaObj, null, 2)}

Important:
- Return ONLY the JSON object, no other text
- Do not wrap in markdown code blocks
- Ensure all required fields are present
- Use the exact field names specified`;
}

function buildPrompt(assignmentsData, promptType) {
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
  }

  return basePrompt + `

Provide practical, actionable advice. Be realistic with time estimates. Keep it concise for a sidepanel view.`;
}