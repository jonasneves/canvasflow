/**
 * Dashboard Schedule Schema for Structured Outputs (Browser Version)
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
  json_schema: {
    name: "dashboard_schedule",
    strict: true,
    schema: {
      type: "object",
      properties: {
      priority_tasks: {
        type: "array",
        description: "Top priority assignments (1-8 items)",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            task: {
              type: "string",
              description: "Assignment name and action (max 150 chars)"
            },
            reason: {
              type: "string",
              description: "Why prioritized (max 200 chars)"
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
            minItems: 1,
            items: {
              type: "string"
            }
          }
        },
        required: ["overall", "total_hours_needed", "intensity_score", "recommendations"],
        additionalProperties: false
      },
      weekly_plan: {
        type: "array",
        description: "7-day study schedule (provide exactly 7 days)",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            day: {
              type: "string",
              description: "Day with date, e.g. 'Monday, Nov 18' (max 50 chars)"
            },
            focus: {
              type: "string",
              description: "Main goal for the day (max 100 chars)"
            },
            workload_score: {
              type: "integer",
              description: "0=light, 1=moderate, 2=heavy, 3=extreme"
            },
            tasks: {
              type: "array",
              description: "Scheduled study blocks (0-6 items)",
              items: {
                type: "object",
                properties: {
                  assignment: {
                    type: "string",
                    description: "Assignment or activity (max 100 chars)"
                  },
                  start_hour: {
                    type: "integer",
                    description: "Starting hour (0-23)"
                  },
                  duration_hours: {
                    type: "number",
                    description: "Duration in hours (0.5-8)"
                  },
                  notes: {
                    type: "string",
                    description: "Session guidance (max 150 chars)"
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
        description: "Study tips for the week (provide 3-5 items, max 150 chars each)",
        minItems: 1,
        items: {
          type: "string"
        }
      }
    },
    required: ["priority_tasks", "workload_assessment", "weekly_plan", "study_tips"],
    additionalProperties: false
    }
  }
};

