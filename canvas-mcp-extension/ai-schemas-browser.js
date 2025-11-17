/**
 * AI Schema Definitions for Claude Structured Outputs (Browser Version)
 *
 * This file defines JSON schemas for Claude's structured outputs API.
 * These schemas guarantee type-safe, valid responses from the AI.
 *
 * Browser-compatible version - uses global window object instead of ES6 modules.
 */

// Create global namespace
window.AISchemas = window.AISchemas || {};

// Numeric mappings for AI reasoning (used in prompts)
window.AISchemas.URGENCY_LEVELS = {
  MANAGEABLE: 0,  // Maps to "low" urgency
  MODERATE: 1,    // Maps to "medium" urgency
  HIGH: 2,        // Maps to "high" urgency
  CRITICAL: 3     // Maps to "critical" urgency
};

window.AISchemas.INTENSITY_LEVELS = {
  MANAGEABLE: 0,  // Maps to green (light workload)
  MODERATE: 1,    // Maps to yellow (normal workload)
  HIGH: 2,        // Maps to orange (heavy workload)
  EXTREME: 3      // Maps to red (overwhelming workload)
};

/**
 * Sidepanel Insights Schema
 * Used for quick AI-generated study insights in the extension sidepanel
 */
window.AISchemas.SIDEPANEL_INSIGHTS_SCHEMA = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      priority_tasks: {
        type: "array",
        description: "Top priority assignments",
        minItems: 1,
        maxItems: 8,
        items: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Assignment name and recommended action",
              maxLength: 150
            },
            reason: {
              type: "string",
              description: "Why this task is prioritized",
              maxLength: 200
            },
            urgency_score: {
              type: "integer",
              description: "0=manageable, 1=moderate, 2=high, 3=critical",
              minimum: 0,
              maximum: 3
            },
            estimated_hours: {
              type: "number",
              description: "Estimated hours needed (0.5-8)",
              minimum: 0.5,
              maximum: 8
            }
          },
          required: ["task", "reason", "urgency_score", "estimated_hours"],
          additionalProperties: false
        }
      },
      workload_assessment: {
        type: "object",
        description: "Overall workload assessment",
        properties: {
          overall: {
            type: "string",
            description: "One sentence workload summary",
            maxLength: 200
          },
          total_hours_needed: {
            type: "number",
            description: "Total estimated hours",
            minimum: 0
          },
          intensity_score: {
            type: "integer",
            description: "0=manageable, 1=moderate, 2=high, 3=extreme",
            minimum: 0,
            maximum: 3
          },
          recommendations: {
            type: "array",
            description: "Workload management recommendations",
            minItems: 2,
            maxItems: 5,
            items: {
              type: "string",
              maxLength: 150
            }
          }
        },
        required: ["overall", "total_hours_needed", "intensity_score", "recommendations"],
        additionalProperties: false
      },
      study_tips: {
        type: "array",
        description: "Study tips for current assignments",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "string",
          maxLength: 150
        }
      }
    },
    required: ["priority_tasks", "workload_assessment", "study_tips"],
    additionalProperties: false
  }
};

console.log('[AI Schemas] Loaded successfully');
