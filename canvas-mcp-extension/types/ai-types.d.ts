/**
 * TypeScript Type Definitions for AI Responses
 *
 * These types match the JSON schemas defined in schemas/ai-schemas.js
 * and provide type safety for AI-generated content.
 *
 * Usage:
 * - Import types in TypeScript/JSDoc comments for better IDE support
 * - Reference when migrating to TypeScript
 * - Use for documentation and code clarity
 */

/**
 * Urgency score range: 0=manageable, 1=moderate, 2=high, 3=critical
 */
export type UrgencyScore = 0 | 1 | 2 | 3;

/**
 * Intensity score range: 0=manageable, 1=moderate, 2=high, 3=extreme
 */
export type IntensityScore = 0 | 1 | 2 | 3;

/**
 * A prioritized task with AI reasoning
 */
export interface PriorityTask {
  /** Assignment name and recommended action */
  task: string;
  /** Why this task is prioritized */
  reason: string;
  /** Urgency level (0-3) */
  urgency_score: UrgencyScore;
  /** Estimated hours needed to complete */
  estimated_hours: number;
}

/**
 * Overall workload assessment
 */
export interface WorkloadAssessment {
  /** One sentence summary of the week's workload */
  overall: string;
  /** Total estimated hours needed for all tasks */
  total_hours_needed: number;
  /** Intensity level (0-3) */
  intensity_score: IntensityScore;
  /** Actionable recommendations for managing workload */
  recommendations: string[];
}

/**
 * Sidepanel AI insights response
 */
export interface SidepanelInsights {
  /** Top priority assignments */
  priority_tasks: PriorityTask[];
  /** Overall workload assessment */
  workload_assessment: WorkloadAssessment;
  /** General study tips */
  study_tips: string[];
}

/**
 * A scheduled study block with specific time allocation
 */
export interface ScheduledTask {
  /** Assignment or study activity name */
  assignment: string;
  /** Starting hour in 24-hour format (0-23) */
  start_hour: number;
  /** Duration in hours (supports decimals like 1.5) */
  duration_hours: number;
  /** Specific guidance for this study session */
  notes: string;
}

/**
 * A single day's study plan
 */
export interface DailyPlan {
  /** Day of week with date (e.g., "Monday, Nov 18") */
  day: string;
  /** Main goal or theme for the day */
  focus: string;
  /** Daily workload intensity (0-3) */
  workload_score: IntensityScore;
  /** Scheduled study blocks for the day */
  tasks: ScheduledTask[];
}

/**
 * Dashboard 7-day schedule response
 */
export interface DashboardSchedule {
  /** Top priority assignments for the week */
  priority_tasks: PriorityTask[];
  /** Overall workload assessment */
  workload_assessment: WorkloadAssessment;
  /** 7-day study schedule */
  weekly_plan: DailyPlan[];
  /** General study tips for the week */
  study_tips: string[];
}

/**
 * Assignment data prepared for AI analysis
 */
export interface PreparedAssignmentData {
  /** Total number of assignments */
  totalAssignments: number;
  /** Unique course names */
  courses: string[];
  /** Assignments due soon */
  upcoming: Assignment[];
  /** Overdue assignments */
  overdue: Assignment[];
  /** Count of completed assignments */
  completed: number;
}

/**
 * Individual assignment details
 */
export interface Assignment {
  /** Assignment name */
  name: string;
  /** Course name */
  course: string;
  /** Due date in ISO 8601 format */
  dueDate: string;
  /** Points worth */
  points: number;
}

/**
 * Urgency level string labels (legacy format)
 */
export type UrgencyLabel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Intensity level string labels (legacy format)
 */
export type IntensityLabel = 'manageable' | 'moderate' | 'high' | 'extreme';

/**
 * Workload level string labels (same as intensity)
 */
export type WorkloadLabel = IntensityLabel;
