/**
 * Dashboard Schedule Schema for Claude Structured Outputs (Browser Version)
 *
 * This file defines the dashboard-specific JSON schema with weekly_plan.
 * Browser-compatible version - uses global window object instead of ES6 modules.
 */

// Ensure global namespace exists
window.AISchemas = window.AISchemas || {};

/**
 * Dashboard Schedule Schema
 * Used for detailed 7-day study schedule generation
 */
window.AISchemas.DASHBOARD_SCHEDULE_SCHEMA = {
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
      weekly_plan: {
        type: "array",
        description: "7-day study schedule",
        minItems: 7,
        maxItems: 7,
        items: {
          type: "object",
          properties: {
            day: {
              type: "string",
              description: "Day with date (e.g., 'Monday, Nov 18')",
              maxLength: 50
            },
            focus: {
              type: "string",
              description: "Main goal for the day",
              maxLength: 100
            },
            workload_score: {
              type: "integer",
              description: "0=light, 1=moderate, 2=heavy, 3=extreme",
              minimum: 0,
              maximum: 3
            },
            tasks: {
              type: "array",
              description: "Scheduled study blocks",
              minItems: 0,
              maxItems: 6,
              items: {
                type: "object",
                properties: {
                  assignment: {
                    type: "string",
                    description: "Assignment or study activity",
                    maxLength: 100
                  },
                  start_hour: {
                    type: "integer",
                    description: "Starting hour (0-23)",
                    minimum: 0,
                    maximum: 23
                  },
                  duration_hours: {
                    type: "number",
                    description: "Duration in hours (0.5-8)",
                    minimum: 0.5,
                    maximum: 8
                  },
                  notes: {
                    type: "string",
                    description: "Session guidance",
                    maxLength: 150
                  }
                },
                required: ["assignment", "start_hour", "duration_hours", "notes"],
                additionalProperties: false
              }
            }
          },
          required: ["day", "focus", "workload_score", "tasks"],
          additionalProperties: false
        }
      },
      study_tips: {
        type: "array",
        description: "Study tips for the week",
        minItems: 3,
        maxItems: 5,
        items: {
          type: "string",
          maxLength: 150
        }
      }
    },
    required: ["priority_tasks", "workload_assessment", "weekly_plan", "study_tips"],
    additionalProperties: false
  }
};

console.log('[AI Schemas - Dashboard] Loaded successfully');
