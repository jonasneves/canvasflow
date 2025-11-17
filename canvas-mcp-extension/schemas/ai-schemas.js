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
        description: "Top priority assignments for the week",
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
      weekly_plan: {
        type: "array",
        description: "7-day study schedule with daily breakdowns (provide exactly 7 days)",
        items: {
          type: "object",
          properties: {
            day: {
              type: "string",
              description: "Day of week with date (e.g., 'Monday, Nov 18')"
            },
            focus: {
              type: "string",
              description: "Main goal or theme for the day"
            },
            workload_score: {
              type: "integer",
              description: "Daily workload intensity from 0-3 where 0=light, 1=moderate, 2=heavy, 3=extreme"
            },
            tasks: {
              type: "array",
              description: "Scheduled study blocks for the day",
              items: {
                type: "object",
                properties: {
                  assignment: {
                    type: "string",
                    description: "Assignment or study activity name"
                  },
                  start_hour: {
                    type: "integer",
                    description: "Starting hour in 24-hour format from 0-23"
                  },
                  duration_hours: {
                    type: "number",
                    description: "Duration in hours from 0.5-8 (supports decimals like 1.5)"
                  },
                  notes: {
                    type: "string",
                    description: "Specific guidance for this study session"
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
        description: "General study tips for the week (provide 1-5 tips)",
        items: {
          type: "string"
        }
      }
    },
    required: ["priority_tasks", "workload_assessment", "weekly_plan", "study_tips"],
    additionalProperties: false
  }
};
