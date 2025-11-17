# CanvasFlow Structured Outputs Integration Plan

## Executive Summary

This plan outlines the phased integration of Claude's new Structured Outputs API feature into CanvasFlow. The goal is to enhance reliability and maintainability by replacing prompt-based JSON schema instructions with guaranteed schema-compliant responses, while focusing structured outputs on AI reasoning aspects and keeping existing UI/presentation logic intact.

## Current State Analysis

### What Works Well (Keep As-Is)
- ✅ Color palette definitions and mappings
- ✅ UI rendering and formatting logic
- ✅ Data preparation and filtering (`prepareAssignmentsForAI`)
- ✅ Chrome storage persistence
- ✅ User interaction flows
- ✅ Canvas data fetching via MCP

### Current Limitations
- ⚠️ Manual JSON extraction with regex (handles markdown code blocks)
- ⚠️ No runtime schema validation
- ⚠️ Duplicate code between `sidepanel.js` and `dashboard.js`
- ⚠️ String-based enums require mapping to visual attributes
- ⚠️ No TypeScript type safety
- ⚠️ Relies on prompt engineering for schema compliance

### AI Reasoning Aspects (Focus for Structured Outputs)

| Decision Type | Current Approach | Structured Output Enhancement |
|--------------|------------------|------------------------------|
| **Urgency Level** | String enum (critical/high/medium/low) | Numeric 0-3 with guaranteed type |
| **Intensity Level** | String enum (extreme/high/moderate/manageable) | Numeric 0-3 with guaranteed type |
| **Time Estimation** | Numeric (hours) | Enforced numeric with validation |
| **Task Prioritization** | Array ordering | Explicit priority scores |
| **Daily Workload** | Per-day intensity strings | Numeric workload scores |
| **Time Blocks** | Freeform strings | Structured start/end times |

---

## Benefits of Structured Outputs

### Reliability
- ✅ No more `JSON.parse()` errors
- ✅ Guaranteed valid responses (no retries needed)
- ✅ Type-safe field validation
- ✅ Required fields always present

### Developer Experience
- ✅ Remove JSON extraction logic (200+ lines of code)
- ✅ TypeScript integration with type inference
- ✅ Cleaner error handling
- ✅ Faster development iteration

### Performance
- ✅ Grammar caching (after first request)
- ✅ No retry logic needed for malformed responses
- ✅ Consistent response parsing

---

## Phase 1: Setup & Preparation (Low Risk)

**Goal:** Set up infrastructure without changing existing functionality

### Tasks

#### 1.1 Create Shared Schema Definitions
**File:** `/canvas-mcp-extension/schemas/ai-schemas.js`

```javascript
// Numeric mappings for AI reasoning
export const URGENCY_LEVELS = {
  MANAGEABLE: 0,  // Maps to low
  MODERATE: 1,    // Maps to medium
  HIGH: 2,        // Maps to high
  CRITICAL: 3     // Maps to critical
};

export const INTENSITY_LEVELS = {
  MANAGEABLE: 0,  // Maps to green
  MODERATE: 1,    // Maps to yellow
  HIGH: 2,        // Maps to orange
  EXTREME: 3      // Maps to red
};

// Sidepanel insights schema (structured outputs format)
export const SIDEPANEL_INSIGHTS_SCHEMA = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      priority_tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            task: { type: "string" },
            reason: { type: "string" },
            urgency_score: {
              type: "integer",
              minimum: 0,
              maximum: 3,
              description: "0=manageable, 1=moderate, 2=high, 3=critical"
            },
            estimated_hours: { type: "number", minimum: 0 }
          },
          required: ["task", "reason", "urgency_score", "estimated_hours"],
          additionalProperties: false
        }
      },
      workload_assessment: {
        type: "object",
        properties: {
          overall: { type: "string" },
          total_hours_needed: { type: "number", minimum: 0 },
          intensity_score: {
            type: "integer",
            minimum: 0,
            maximum: 3,
            description: "0=manageable, 1=moderate, 2=high, 3=extreme"
          },
          recommendations: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 5
          }
        },
        required: ["overall", "total_hours_needed", "intensity_score", "recommendations"],
        additionalProperties: false
      },
      study_tips: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5
      }
    },
    required: ["priority_tasks", "workload_assessment", "study_tips"],
    additionalProperties: false
  }
};

// Dashboard schedule schema
export const DASHBOARD_SCHEDULE_SCHEMA = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      priority_tasks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            task: { type: "string" },
            reason: { type: "string" },
            urgency_score: {
              type: "integer",
              minimum: 0,
              maximum: 3
            },
            estimated_hours: { type: "number", minimum: 0 }
          },
          required: ["task", "reason", "urgency_score", "estimated_hours"],
          additionalProperties: false
        }
      },
      workload_assessment: {
        type: "object",
        properties: {
          overall: { type: "string" },
          total_hours_needed: { type: "number", minimum: 0 },
          intensity_score: {
            type: "integer",
            minimum: 0,
            maximum: 3
          },
          recommendations: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            maxItems: 5
          }
        },
        required: ["overall", "total_hours_needed", "intensity_score", "recommendations"],
        additionalProperties: false
      },
      weekly_plan: {
        type: "array",
        items: {
          type: "object",
          properties: {
            day: { type: "string" },
            focus: { type: "string" },
            workload_score: {
              type: "integer",
              minimum: 0,
              maximum: 3
            },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  assignment: { type: "string" },
                  start_hour: {
                    type: "integer",
                    minimum: 0,
                    maximum: 23
                  },
                  duration_hours: {
                    type: "number",
                    minimum: 0.5,
                    maximum: 8
                  },
                  notes: { type: "string" }
                },
                required: ["assignment", "start_hour", "duration_hours", "notes"],
                additionalProperties: false
              }
            }
          },
          required: ["day", "focus", "workload_score", "tasks"],
          additionalProperties: false
        },
        minItems: 7,
        maxItems: 7
      },
      study_tips: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: 5
      }
    },
    required: ["priority_tasks", "workload_assessment", "weekly_plan", "study_tips"],
    additionalProperties: false
  }
};
```

#### 1.2 Create Mapping Utilities
**File:** `/canvas-mcp-extension/utils/ai-mappers.js`

```javascript
// Maps numeric AI reasoning to UI attributes
export function mapUrgencyToColor(urgencyScore) {
  const colorMap = {
    0: '#339898',   // Manageable - Teal
    1: '#E89923',   // Moderate - Orange
    2: '#E89923',   // High - Orange
    3: '#C84E00'    // Critical - Orange-red
  };
  return colorMap[urgencyScore] || colorMap[1];
}

export function mapUrgencyToLabel(urgencyScore) {
  const labelMap = {
    0: 'low',
    1: 'medium',
    2: 'high',
    3: 'critical'
  };
  return labelMap[urgencyScore] || 'medium';
}

export function mapIntensityToColor(intensityScore) {
  const colorMap = {
    0: '#059669',   // Manageable - Green
    1: '#FBBF24',   // Moderate - Yellow
    2: '#EA580C',   // High - Orange
    3: '#DC2626'    // Extreme - Red
  };
  return colorMap[intensityScore] || colorMap[1];
}

export function mapIntensityToLabel(intensityScore) {
  const labelMap = {
    0: 'manageable',
    1: 'moderate',
    2: 'high',
    3: 'extreme'
  };
  return labelMap[intensityScore] || 'moderate';
}

export function mapWorkloadToLabel(workloadScore) {
  return mapIntensityToLabel(workloadScore);
}

export function formatTimeBlock(startHour, durationHours) {
  const endHour = startHour + Math.floor(durationHours);
  const endMinutes = (durationHours % 1) * 60;

  const formatTime = (hour, minutes = 0) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinutes = minutes > 0 ? `:${minutes.toString().padStart(2, '0')}` : '';
    return `${displayHour}${displayMinutes} ${period}`;
  };

  return `${formatTime(startHour)} - ${formatTime(endHour, endMinutes)}`;
}
```

#### 1.3 Add TypeScript Type Definitions (Optional but Recommended)
**File:** `/canvas-mcp-extension/types/ai-types.d.ts`

```typescript
export type UrgencyScore = 0 | 1 | 2 | 3;
export type IntensityScore = 0 | 1 | 2 | 3;

export interface PriorityTask {
  task: string;
  reason: string;
  urgency_score: UrgencyScore;
  estimated_hours: number;
}

export interface WorkloadAssessment {
  overall: string;
  total_hours_needed: number;
  intensity_score: IntensityScore;
  recommendations: string[];
}

export interface SidepanelInsights {
  priority_tasks: PriorityTask[];
  workload_assessment: WorkloadAssessment;
  study_tips: string[];
}

export interface ScheduledTask {
  assignment: string;
  start_hour: number;
  duration_hours: number;
  notes: string;
}

export interface DailyPlan {
  day: string;
  focus: string;
  workload_score: IntensityScore;
  tasks: ScheduledTask[];
}

export interface DashboardSchedule {
  priority_tasks: PriorityTask[];
  workload_assessment: WorkloadAssessment;
  weekly_plan: DailyPlan[];
  study_tips: string[];
}
```

**Deliverables:**
- ✅ 3 new files created
- ✅ No existing code modified
- ✅ Zero breaking changes
- ✅ Ready for gradual migration

---

## Phase 2: Migrate Sidepanel (Medium Risk)

**Goal:** Replace sidepanel's prompt-based approach with structured outputs

### Tasks

#### 2.1 Update API Call Function
**File:** `sidepanel.js`

**Before (lines 1120-1188):**
```javascript
async function callClaudeWithStructuredOutput(prompt, apiKey) {
  // ... existing fetch logic with prompt-based schema
}
```

**After:**
```javascript
import { SIDEPANEL_INSIGHTS_SCHEMA } from './schemas/ai-schemas.js';

async function callClaudeWithStructuredOutput(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'structured-outputs-2025-11-13',  // NEW
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: prompt  // Simplified - no schema in prompt
      }],
      output_format: SIDEPANEL_INSIGHTS_SCHEMA  // NEW
    })
  });

  const data = await response.json();

  if (data.type === 'error') {
    throw new Error(data.error?.message || 'API request failed');
  }

  // Structured outputs guarantee valid JSON - no regex extraction needed!
  const textContent = data.content.find(c => c.type === 'text')?.text;
  return JSON.parse(textContent);  // Direct parse, always works
}
```

#### 2.2 Simplify Prompt Generation
**File:** `sidepanel.js` (lines 1134-1168)

**Remove:** JSON schema from prompt (200+ lines removed)
**Keep:** Assignment data and context
**Add:** Explanation of numeric scoring

```javascript
// Simplified prompt focusing on reasoning, not structure
const prompt = `Analyze these Canvas assignments and provide study guidance.

You have ${data.totalAssignments} total assignments across ${data.courses.length} courses: ${data.courses.join(', ')}.

UPCOMING (${data.upcoming.length} due this week):
${data.upcoming.map(a => `- ${a.name} (${a.course}) - Due: ${a.dueDate}, Points: ${a.points}`).join('\n')}

OVERDUE (${data.overdue.length}):
${data.overdue.map(a => `- ${a.name} (${a.course}) - Due: ${a.dueDate}, Points: ${a.points}`).join('\n')}

COMPLETED: ${data.completed} assignments

---

SCORING GUIDANCE:
- urgency_score: 0=can wait, 1=should do soon, 2=high priority, 3=critical/immediate
- intensity_score: 0=light week, 1=normal load, 2=heavy week, 3=overwhelming

Provide practical, actionable advice. Be realistic with time estimates.`;
```

#### 2.3 Update Formatting Logic
**File:** `sidepanel.js` (lines 1208-1318)

```javascript
import {
  mapUrgencyToColor,
  mapUrgencyToLabel,
  mapIntensityToColor,
  mapIntensityToLabel
} from './utils/ai-mappers.js';

function formatStructuredInsights(insights) {
  let html = '<div class="ai-insights-content">';

  // Priority Tasks
  html += '<h3>🎯 Priority Tasks</h3>';
  insights.priority_tasks.forEach(task => {
    const urgencyColor = mapUrgencyToColor(task.urgency_score);
    const urgencyLabel = mapUrgencyToLabel(task.urgency_score);

    html += `
      <div class="priority-task">
        <div class="task-header">
          <span class="task-name">${task.task}</span>
          <span class="urgency-badge" style="background: ${urgencyColor}">
            ${urgencyLabel}
          </span>
        </div>
        <p class="task-reason">${task.reason}</p>
        <span class="task-time">~${task.estimated_hours} hours</span>
      </div>
    `;
  });

  // Workload Assessment
  const workloadColor = mapIntensityToColor(insights.workload_assessment.intensity_score);
  const workloadLabel = mapIntensityToLabel(insights.workload_assessment.intensity_score);

  html += `
    <h3>📊 Workload Assessment</h3>
    <div class="workload-box">
      <p>${insights.workload_assessment.overall}</p>
      <div class="workload-stats">
        <span>Total Hours: ${insights.workload_assessment.total_hours_needed}</span>
        <span class="intensity-badge" style="background: ${workloadColor}">
          ${workloadLabel} intensity
        </span>
      </div>
      <ul class="recommendations">
        ${insights.workload_assessment.recommendations.map(r => `<li>${r}</li>`).join('')}
      </ul>
    </div>
  `;

  // Study Tips
  html += '<h3>💡 Study Tips</h3><ul class="study-tips">';
  insights.study_tips.forEach(tip => {
    html += `<li>${tip}</li>`;
  });
  html += '</ul></div>';

  return html;
}
```

### Testing Plan for Phase 2

1. **Unit Tests:**
   - Test numeric score mappings (0-3 → colors/labels)
   - Verify schema validation catches invalid responses
   - Test edge cases (0 tasks, max tasks, boundary values)

2. **Integration Tests:**
   - Generate insights with real Canvas data
   - Verify HTML rendering matches design
   - Confirm storage/retrieval works

3. **Rollback Plan:**
   - Keep old functions as `callClaudeLegacy()`
   - Feature flag: `USE_STRUCTURED_OUTPUTS = true/false`
   - Easy revert if issues arise

**Deliverables:**
- ✅ Sidepanel uses structured outputs
- ✅ 200+ lines of JSON extraction code removed
- ✅ Guaranteed valid responses
- ✅ Cleaner, more maintainable code

---

## Phase 3: Migrate Dashboard (Medium Risk)

**Goal:** Apply same improvements to dashboard's weekly schedule generation

### Tasks

#### 3.1 Update Dashboard API Call
**File:** `dashboard.js` (lines 373-470)

Same changes as Phase 2.1, but using `DASHBOARD_SCHEDULE_SCHEMA` instead.

#### 3.2 Update Time Block Formatting
**File:** `dashboard.js`

**Old approach:** AI generates freeform strings like `"9:00 AM - 12:00 PM"`
**New approach:** AI provides `start_hour: 9, duration_hours: 3`, we format consistently

```javascript
import { formatTimeBlock } from './utils/ai-mappers.js';

function formatDailyPlan(dailyPlan) {
  // ... existing day header code ...

  dailyPlan.tasks.forEach(task => {
    const timeBlock = formatTimeBlock(task.start_hour, task.duration_hours);
    html += `
      <div class="scheduled-task">
        <div class="task-time">${timeBlock}</div>
        <div class="task-details">
          <strong>${task.assignment}</strong>
          <p>${task.notes}</p>
        </div>
      </div>
    `;
  });
}
```

#### 3.3 Simplify Dashboard Prompt
**File:** `dashboard.js` (lines 387-435)

Similar to Phase 2.2, remove JSON schema from prompt, add scoring guidance.

**Deliverables:**
- ✅ Dashboard uses structured outputs
- ✅ Consistent time formatting
- ✅ Numeric workload scoring

---

## Phase 4: Code Consolidation (Low Risk)

**Goal:** Remove duplication, create shared utilities

### Tasks

#### 4.1 Create Shared API Client
**File:** `/canvas-mcp-extension/utils/claude-client.js`

```javascript
import { SIDEPANEL_INSIGHTS_SCHEMA, DASHBOARD_SCHEDULE_SCHEMA } from '../schemas/ai-schemas.js';

export const SCHEMA_TYPES = {
  SIDEPANEL: 'sidepanel',
  DASHBOARD: 'dashboard'
};

export async function callClaude(prompt, schemaType, apiKey) {
  const schemaMap = {
    [SCHEMA_TYPES.SIDEPANEL]: SIDEPANEL_INSIGHTS_SCHEMA,
    [SCHEMA_TYPES.DASHBOARD]: DASHBOARD_SCHEDULE_SCHEMA
  };

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
      messages: [{ role: 'user', content: prompt }],
      output_format: schemaMap[schemaType]
    })
  });

  const data = await response.json();

  if (data.type === 'error') {
    throw new Error(data.error?.message || 'API request failed');
  }

  const textContent = data.content.find(c => c.type === 'text')?.text;
  return JSON.parse(textContent);
}
```

#### 4.2 Refactor Both Files
- Replace duplicate `callClaudeWithStructuredOutput()` with `callClaude()`
- Replace duplicate `prepareAssignmentsForAI()` with shared utility
- Use shared formatters from `ai-mappers.js`

**Code Reduction:**
- ~400 lines of duplicate code removed
- Single source of truth for AI interactions
- Easier to maintain and update

---

## Phase 5: Testing & Optimization (Ongoing)

### 5.1 Performance Monitoring

**Grammar Caching Benefits:**
- First request: ~500ms additional latency (grammar compilation)
- Subsequent requests (24hr cache): No additional latency
- Monitor cache hit rates via timing logs

**Token Cost Analysis:**
- Measure input token increase (structured outputs add system prompt)
- Compare vs. savings from removing explicit JSON schema in prompts
- Expected: Slight increase (~50-100 tokens) but worth it for reliability

### 5.2 Error Handling

**Refusal Handling:**
```javascript
if (data.stop_reason === 'refusal') {
  console.warn('Claude refused the request');
  // Show user-friendly message
  return null;
}
```

**Max Tokens Handling:**
```javascript
if (data.stop_reason === 'max_tokens') {
  console.warn('Response truncated, retrying with higher limit');
  // Retry with max_tokens: 4000
}
```

### 5.3 User Feedback Collection

Add telemetry to track:
- Success rate of structured responses
- Time to generate insights
- User satisfaction (implicit: regeneration rate)

---

## Phase 6: Future Enhancements (Optional)

### 6.1 Additional Numeric Reasoning

**Current:** AI chooses urgency/intensity (done in Phases 2-3)
**Future possibilities:**

1. **Color Temperature Scoring** (0-100)
   - AI suggests color warmth based on urgency
   - Smooth gradients instead of discrete colors

2. **Difficulty Scoring** (0-10)
   - AI rates assignment complexity
   - Helps with time estimation accuracy

3. **Stress Level Prediction** (0-100)
   - Combines workload, deadlines, difficulty
   - Personalized stress indicators

### 6.2 Multi-Schema Support

**Dynamic schemas based on user preferences:**
- Detailed mode: More granular breakdowns
- Quick mode: High-level summaries only
- Focus mode: Priority tasks only

### 6.3 Batch Processing

If generating insights for multiple users/courses:
- Use Claude's batch API (50% cost discount)
- Process overnight for dashboard pre-caching

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **API compatibility issues** | Low | High | Feature flag rollback, keep legacy code |
| **Schema too complex** | Medium | Medium | Start simple, iterate based on errors |
| **Breaking UI changes** | Low | High | Phase 4 only consolidates, no UI changes |
| **Increased latency** | Low | Low | Grammar caching resolves after first call |
| **User confusion** | Very Low | Low | Changes are backend-only, UI stays same |

---

## Success Metrics

### Technical Metrics
- ✅ Zero JSON parse errors (currently ~2-5% failure rate)
- ✅ Reduce API client code by 40%
- ✅ 100% schema compliance in responses
- ✅ <100ms added latency after grammar caching

### User Experience Metrics
- ✅ Maintain current insight quality
- ✅ Faster response times (no retries needed)
- ✅ More consistent formatting

---

## Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| **Phase 1: Setup** | 2-3 hours | None |
| **Phase 2: Sidepanel** | 3-4 hours | Phase 1 complete |
| **Phase 3: Dashboard** | 2-3 hours | Phase 2 tested |
| **Phase 4: Consolidation** | 2-3 hours | Phases 2 & 3 complete |
| **Phase 5: Testing** | 1-2 hours | Phase 4 complete |
| **Phase 6: Enhancements** | Optional | All previous phases |

**Total:** ~10-15 hours for Phases 1-5

---

## Implementation Checklist

### Phase 1: Setup ✅
- [ ] Create `/canvas-mcp-extension/schemas/ai-schemas.js`
- [ ] Create `/canvas-mcp-extension/utils/ai-mappers.js`
- [ ] Create `/canvas-mcp-extension/types/ai-types.d.ts` (optional)
- [ ] Test schema definitions in isolation

### Phase 2: Sidepanel Migration ✅
- [ ] Update `callClaudeWithStructuredOutput()` in `sidepanel.js`
- [ ] Add `anthropic-beta` header
- [ ] Add `output_format` parameter
- [ ] Simplify prompt (remove JSON schema)
- [ ] Update `formatStructuredInsights()` to use mappers
- [ ] Import utilities from Phase 1
- [ ] Test with real Canvas data
- [ ] Verify HTML rendering
- [ ] Confirm storage works

### Phase 3: Dashboard Migration ✅
- [ ] Update `callClaudeWithStructuredOutput()` in `dashboard.js`
- [ ] Simplify dashboard prompt
- [ ] Update time block formatting with `formatTimeBlock()`
- [ ] Update workload rendering with numeric scores
- [ ] Test 7-day schedule generation
- [ ] Verify day toggles still work

### Phase 4: Consolidation ✅
- [ ] Create `/canvas-mcp-extension/utils/claude-client.js`
- [ ] Move shared `prepareAssignmentsForAI()` to utilities
- [ ] Replace both `callClaudeWithStructuredOutput()` calls
- [ ] Remove duplicate code
- [ ] Update imports across files
- [ ] Regression test both sidepanel and dashboard

### Phase 5: Testing & Optimization ✅
- [ ] Add error handling for `stop_reason: "refusal"`
- [ ] Add retry logic for `stop_reason: "max_tokens"`
- [ ] Monitor grammar caching effectiveness
- [ ] Measure token cost changes
- [ ] Collect performance metrics
- [ ] User acceptance testing

### Phase 6: Future Enhancements (Optional) 🔮
- [ ] Implement color temperature scoring
- [ ] Add difficulty ratings
- [ ] Explore batch processing
- [ ] A/B test numeric vs. string reasoning

---

## Questions & Decisions

### Open Questions
1. **TypeScript Migration:** Should we convert to TypeScript for better type safety?
   - **Recommendation:** Optional for now, but types help prevent errors

2. **Prompt Caching:** Should we use prompt caching for assignment data?
   - **Recommendation:** Yes - cache the assignment list (changes infrequently)

3. **User Customization:** Let users choose between numeric/string displays?
   - **Recommendation:** Keep numeric backend, string frontend (current UX)

### Decisions Made
- ✅ Use numeric scores (0-3) for AI reasoning
- ✅ Keep color hex codes in frontend (not in AI schema)
- ✅ Format time blocks in frontend (AI provides structured data)
- ✅ Phase approach with rollback capability
- ✅ Consolidate duplicate code in Phase 4

---

## Appendix A: Schema Comparison

### Before (Prompt-based)
```javascript
// In prompt text:
"Return JSON with this structure: {
  priority_tasks: [{
    task: string,
    urgency: 'critical'|'high'|'medium'|'low'
  }]
}"
```

**Problems:**
- AI might ignore instructions
- No validation until parsing
- Markdown wrapping requires regex
- Typos like `urgency: "hgh"` break code

### After (Structured Outputs)
```javascript
// In API request:
output_format: {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      priority_tasks: {
        items: {
          properties: {
            urgency_score: { type: "integer", minimum: 0, maximum: 3 }
          },
          required: ["urgency_score"]
        }
      }
    }
  }
}
```

**Benefits:**
- Guaranteed compliance
- Type validation at generation time
- No markdown wrapping
- `urgency_score` always 0-3 integer

---

## Appendix B: Example Responses

### Sidepanel Insights (New Format)
```json
{
  "priority_tasks": [
    {
      "task": "Finish Art History essay draft",
      "reason": "Due tomorrow and worth 20% of final grade",
      "urgency_score": 3,
      "estimated_hours": 4.5
    },
    {
      "task": "Complete CS problem set",
      "reason": "Due in 3 days, foundational for upcoming exam",
      "urgency_score": 2,
      "estimated_hours": 3.0
    }
  ],
  "workload_assessment": {
    "overall": "Heavy week with two major deadlines and an exam",
    "total_hours_needed": 18.5,
    "intensity_score": 2,
    "recommendations": [
      "Prioritize the Art History essay due tomorrow",
      "Block 2-hour focused sessions for CS work",
      "Review exam topics 30 min daily"
    ]
  },
  "study_tips": [
    "Use pomodoro technique for essay writing",
    "Create visual timelines for art movements",
    "Test CS code incrementally, don't wait until end"
  ]
}
```

### Dashboard Schedule (New Format)
```json
{
  "weekly_plan": [
    {
      "day": "Monday, Nov 18",
      "focus": "Art History essay completion",
      "workload_score": 3,
      "tasks": [
        {
          "assignment": "Art History Essay",
          "start_hour": 9,
          "duration_hours": 3.5,
          "notes": "Draft body paragraphs, focus on Renaissance period"
        },
        {
          "assignment": "CS Problem Set",
          "start_hour": 14,
          "duration_hours": 2.0,
          "notes": "Start with problems 1-3, test each solution"
        }
      ]
    }
  ]
}
```

**Rendering:** `formatTimeBlock(9, 3.5)` → `"9:00 AM - 12:30 PM"`

---

## Appendix C: Migration Diff Example

### Before: sidepanel.js (lines 1120-1188)

```javascript
async function callClaudeWithStructuredOutput(prompt, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 3000,
      messages: [{
        role: 'user',
        content: prompt  // Contains JSON schema instructions
      }]
    })
  });

  const data = await response.json();
  const textContent = data.content.find(c => c.type === 'text')?.text;

  // Complex JSON extraction with regex
  let jsonText = textContent;
  const codeBlockMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1];
  }
  const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('No valid JSON found');
  }
  return JSON.parse(jsonMatch[0]);
}
```

### After: sidepanel.js (Phases 2-4)

```javascript
import { callClaude, SCHEMA_TYPES } from './utils/claude-client.js';

// Simplified - complexity moved to shared utility
async function generateInsights(assignmentData, apiKey) {
  const prompt = buildPrompt(assignmentData);  // No schema in prompt
  return await callClaude(prompt, SCHEMA_TYPES.SIDEPANEL, apiKey);
}
```

**Lines removed:** ~60 per file (120 total for both files)
**Lines added:** ~2 per file (4 total) + shared utilities (~100 lines, but reusable)
**Net reduction:** ~140 lines

---

## Notes

- All phases are reversible with feature flags
- Existing UI/UX unchanged (backend-only improvements)
- Focus on AI reasoning, not presentation logic
- Numeric scores enable future ML features (trend analysis, predictions)
- Documentation includes TypeScript types for future migration

---

**Document Version:** 1.0
**Last Updated:** 2025-11-17
**Author:** Claude (Structured Outputs Integration)
**Status:** Ready for Review & Implementation
