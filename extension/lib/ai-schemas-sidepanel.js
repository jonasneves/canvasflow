/**
 * AI Schema Definitions for Structured Outputs (Browser Version)
 *
 * This file defines JSON schemas for the AI structured outputs.
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
  json_schema: {
    name: "sidepanel_insights",
    strict: true,
    schema: {
      type: "object",
      properties: {
      priority_tasks: {
        type: "array",
        description: "Top priority assignments (provide 1-8 items)",
        items: {
          type: "object",
          properties: {
            assignment_id: {
              type: "string",
              description: "Canvas assignment ID to map this insight to the actual assignment"
            },
            task: {
              type: "string",
              description: "Assignment name and action (max 150 chars)"
            },
            reason: {
              type: "string",
              description: "Why prioritized (max 200 chars)"
            },
            ui_tags: {
              type: "array",
              items: { type: "string" },
              description: "Provide exactly 2 short action tags. First tag: assignment type (Reading, Essay, Quiz, Exam, Project, Lab, Discussion). Second tag: key insight (Est: 30m, High Impact, Group Work, 50 pts, Multiple Choice). Keep each tag under 15 chars."
            },
            urgency_score: {
              type: "integer",
              description: "0=manageable, 1=moderate, 2=high, 3=critical"
            },
            estimated_hours: {
              type: "number",
              description: "Estimated hours (0.5 to 8)"
            }
          },
          required: ["assignment_id", "task", "reason", "ui_tags", "urgency_score", "estimated_hours"],
          additionalProperties: false
        }
      },
      workload_assessment: {
        type: "object",
        description: "Overall workload assessment",
        properties: {
          overall: {
            type: "string",
            description: "One sentence summary (max 200 chars)"
          },
          total_hours_needed: {
            type: "number",
            description: "Total estimated hours"
          },
          intensity_score: {
            type: "integer",
            description: "0=manageable, 1=moderate, 2=high, 3=extreme"
          },
          recommendations: {
            type: "array",
            description: "Recommendations (provide 2-5 items, max 150 chars each)",
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
        description: "Study tips (provide 3-5 items, max 150 chars each)",
        items: {
          type: "string"
        }
      }
    },
    required: ["priority_tasks", "workload_assessment", "study_tips"],
    additionalProperties: false
    }
  }
};

