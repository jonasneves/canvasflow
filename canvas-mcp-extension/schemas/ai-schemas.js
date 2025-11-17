/**
 * AI Schema Definitions for Claude Structured Outputs
 *
 * This file defines JSON schemas for Claude's structured outputs API.
 * These schemas guarantee type-safe, valid responses from the AI.
 */

// Numeric mappings for AI reasoning (used in prompts)
export const URGENCY_LEVELS = {
  MANAGEABLE: 0,  // Maps to "low" urgency
  MODERATE: 1,    // Maps to "medium" urgency
  HIGH: 2,        // Maps to "high" urgency
  CRITICAL: 3     // Maps to "critical" urgency
};

export const INTENSITY_LEVELS = {
  MANAGEABLE: 0,  // Maps to green (light workload)
  MODERATE: 1,    // Maps to yellow (normal workload)
  HIGH: 2,        // Maps to orange (heavy workload)
  EXTREME: 3      // Maps to red (overwhelming workload)
};

/**
 * Sidepanel Insights Schema
 * Used for quick AI-generated study insights in the extension sidepanel
 */
export const SIDEPANEL_INSIGHTS_SCHEMA = {
  type: "json_schema",
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
            description: "Recommendations (2-5 items, max 150 chars each)",
            minItems: 2,
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
        description: "Study tips (3-5 items, max 150 chars each)",
        minItems: 3,
        items: {
          type: "string"
        }
      }
    },
    required: ["priority_tasks", "workload_assessment", "study_tips"],
    additionalProperties: false
  }
};

/**
 * Dashboard Schedule Schema
 * Used for detailed 7-day study schedule generation
 */
export const DASHBOARD_SCHEDULE_SCHEMA = {
  type: "json_schema",
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
            description: "Recommendations (2-5 items, max 150 chars each)",
            minItems: 2,
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
        description: "7-day study schedule (exactly 7 days)",
        minItems: 7,
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
        description: "Study tips for the week (3-5 items, max 150 chars each)",
        minItems: 3,
        items: {
          type: "string"
        }
      }
    },
    required: ["priority_tasks", "workload_assessment", "weekly_plan", "study_tips"],
    additionalProperties: false
  }
};
