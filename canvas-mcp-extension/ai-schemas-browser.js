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
        description: "Top priority assignments that need immediate attention",
        items: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Assignment name and recommended action"
            },
            reason: {
              type: "string",
              description: "Why this task is prioritized"
            },
            urgency_score: {
              type: "integer",
              description: "Urgency level from 0-3 where 0=manageable, 1=moderate, 2=high, 3=critical"
            },
            estimated_hours: {
              type: "number",
              description: "Estimated hours needed to complete (must be >= 0)"
            }
          },
          required: ["task", "reason", "urgency_score", "estimated_hours"],
          additionalProperties: false
        }
      },
      workload_assessment: {
        type: "object",
        description: "Overall assessment of the student's workload",
        properties: {
          overall: {
            type: "string",
            description: "One sentence summary of the week's workload"
          },
          total_hours_needed: {
            type: "number",
            description: "Total estimated hours needed for all tasks (must be >= 0)"
          },
          intensity_score: {
            type: "integer",
            description: "Intensity level from 0-3 where 0=manageable, 1=moderate, 2=high, 3=extreme"
          },
          recommendations: {
            type: "array",
            description: "Actionable recommendations for managing the workload (provide 1-5 recommendations)",
            items: {
              type: "string"
            }
          }
        },
        required: ["overall", "total_hours_needed", "intensity_score", "recommendations"],
        additionalProperties: false
      },
      study_tips: {
        type: "array",
        description: "General study tips relevant to current assignments (provide 1-5 tips)",
        items: {
          type: "string"
        }
      }
    },
    required: ["priority_tasks", "workload_assessment", "study_tips"],
    additionalProperties: false
  }
};

console.log('[AI Schemas] Loaded successfully');
