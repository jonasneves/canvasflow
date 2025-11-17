# Structured Outputs Optimization Plan

## Overview
This plan optimizes the Claude API structured outputs implementation to reduce token usage while improving output quality and reasoning capabilities.

## Expected Impact
- **Input tokens**: Reduce by ~80-150 per request
- **Output tokens**: Reduce by ~100-300 per request
- **Cost savings**: ~15-25% per API call
- **Quality improvement**: Better reasoning with Extended Thinking

---

## Phase 1: Schema Optimizations (High Priority)

### 1.1 Add Array Length Constraints
**Files to modify:**
- `canvas-mcp-extension/schemas/ai-schemas.js`
- `canvas-mcp-extension/ai-schemas-browser.js`
- `canvas-mcp-extension/ai-schemas-dashboard-browser.js`

**Changes:**
- Add `minItems` and `maxItems` to all arrays
- Prevents Claude from generating excessive content
- Directly reduces output tokens

**Specific constraints:**
```javascript
study_tips: minItems: 3, maxItems: 5
recommendations: minItems: 2, maxItems: 5
priority_tasks: minItems: 1, maxItems: 8
weekly_plan: minItems: 7, maxItems: 7 (exactly 7 days)
tasks (per day): minItems: 0, maxItems: 6
```

**Estimated savings**: 100-300 output tokens per request

---

### 1.2 Streamline Schema Descriptions
**Files to modify:**
- `canvas-mcp-extension/schemas/ai-schemas.js`
- `canvas-mcp-extension/ai-schemas-browser.js`
- `canvas-mcp-extension/ai-schemas-dashboard-browser.js`

**Changes:**
- Reduce verbose descriptions
- Remove redundant context (already in prompt)
- Keep descriptions clear but concise

**Examples:**
```javascript
// Before
"Top priority assignments that need immediate attention"
// After
"Top priority assignments"

// Before
"Urgency level from 0-3 where 0=manageable, 1=moderate, 2=high, 3=critical"
// After
"0=manageable, 1=moderate, 2=high, 3=critical"
```

**Estimated savings**: 50-100 input tokens per request

---

### 1.3 Add String Length Constraints
**Files to modify:**
- `canvas-mcp-extension/schemas/ai-schemas.js`
- `canvas-mcp-extension/ai-schemas-browser.js`
- `canvas-mcp-extension/ai-schemas-dashboard-browser.js`

**Changes:**
- Add `maxLength` to string fields to prevent verbosity
- Ensures concise, actionable content

**Specific constraints:**
```javascript
task: maxLength: 150
reason: maxLength: 200
overall: maxLength: 200
recommendations (items): maxLength: 150
study_tips (items): maxLength: 150
focus: maxLength: 100
notes: maxLength: 150
```

**Estimated savings**: 50-100 output tokens per request

---

## Phase 2: API Configuration Optimizations (High Priority)

### 2.1 Differentiate max_tokens by Endpoint
**Files to modify:**
- `canvas-mcp-extension/claude-client-browser.js`

**Changes:**
- Use adaptive `max_tokens` based on prompt type
- Sidepanel insights are simpler, need fewer tokens
- Dashboard schedule is more complex, needs more tokens

**Implementation:**
```javascript
// Line 33 in claude-client-browser.js
const maxTokens = promptType === 'dashboard' ? 3000 : 1500;

body: JSON.stringify({
  model: 'claude-sonnet-4-5',
  max_tokens: maxTokens,
  ...
})
```

**Estimated savings**: Up to 1500 tokens per sidepanel request (unused max_tokens don't cost, but this prevents over-generation)

---

### 2.2 Enable Extended Thinking
**Files to modify:**
- `canvas-mcp-extension/claude-client-browser.js`

**Changes:**
- Add `thinking` parameter to API request
- Allows Claude to reason more deeply about workload analysis
- Thinking tokens don't affect structured JSON output

**Implementation:**
```javascript
body: JSON.stringify({
  model: 'claude-sonnet-4-5',
  max_tokens: maxTokens,
  thinking: {
    type: "enabled",
    budget_tokens: 2000
  },
  messages: [...]
})
```

**Benefits:**
- Better workload assessment accuracy
- More realistic time estimates
- Improved priority rankings
- No impact on output token usage (thinking is separate)

---

## Phase 3: Prompt Optimizations (Medium Priority)

### 3.1 Remove Redundant Scoring Guidance
**Files to modify:**
- `canvas-mcp-extension/claude-client-browser.js`

**Changes:**
- Remove scoring guidance from prompt (lines 87-89)
- Keep in schema descriptions only
- Avoid duplication between prompt and schema

**Current redundancy:**
```javascript
// In prompt (buildPrompt function)
SCORING GUIDANCE:
- urgency_score: 0=can wait, 1=should do soon, 2=high priority, 3=critical/immediate
- intensity_score: 0=light week, 1=normal load, 2=heavy week, 3=overwhelming

// Also in schema description
"Urgency level from 0-3 where 0=manageable, 1=moderate, 2=high, 3=critical"
```

**Decision options:**
1. **Option A**: Keep in schema only (recommended - schemas are always visible)
2. **Option B**: Keep in prompt only (schemas less verbose)
3. **Option C**: Keep both but simplify prompt to just numbers

**Estimated savings**: 30-50 input tokens per request

---

### 3.2 Add minLength to Number Fields
**Files to modify:**
- `canvas-mcp-extension/schemas/ai-schemas.js`
- `canvas-mcp-extension/ai-schemas-browser.js`
- `canvas-mcp-extension/ai-schemas-dashboard-browser.js`

**Changes:**
- Add `minimum` constraint to numeric fields
- Ensures realistic estimates

**Implementation:**
```javascript
estimated_hours: {
  type: "number",
  description: "Estimated hours needed (0.5-8)",
  minimum: 0.5,
  maximum: 8
},
total_hours_needed: {
  type: "number",
  description: "Total hours needed",
  minimum: 0
},
duration_hours: {
  type: "number",
  description: "Duration in hours (0.5-8)",
  minimum: 0.5,
  maximum: 8
}
```

**Note**: If using SDK, these would be transformed to description hints. Since using direct HTTP, these will be enforced by structured outputs grammar.

---

## Phase 4: Type Definitions Updates (Low Priority)

### 4.1 Update TypeScript Interfaces
**Files to modify:**
- `canvas-mcp-extension/types/ai-types.d.ts`

**Changes:**
- Add JSDoc comments documenting constraints
- Helps developers understand limits

**Example:**
```typescript
export interface PriorityTask {
  /** Assignment name (max 150 chars) */
  task: string;
  /** Priority rationale (max 200 chars) */
  reason: string;
  /** Urgency: 0=manageable, 1=moderate, 2=high, 3=critical */
  urgency_score: UrgencyScore;
  /** Estimated hours (0.5-8) */
  estimated_hours: number;
}
```

---

## Implementation Checklist

### Pre-implementation
- [ ] Review current token usage baseline
- [ ] Backup current schema files
- [ ] Test current implementation works

### Phase 1: Schema Optimizations
- [ ] Add array length constraints (minItems, maxItems)
- [ ] Streamline schema descriptions
- [ ] Add string length constraints (maxLength)
- [ ] Update all 3 schema files (main + 2 browser versions)
- [ ] Test schema validation

### Phase 2: API Configuration
- [ ] Implement adaptive max_tokens
- [ ] Add Extended Thinking configuration
- [ ] Test API calls with new config

### Phase 3: Prompt Optimizations
- [ ] Remove redundant scoring guidance
- [ ] Add numeric constraints (minimum, maximum)
- [ ] Test prompts generate correct outputs

### Phase 4: Documentation
- [ ] Update TypeScript types with JSDoc
- [ ] Document new constraints in code comments
- [ ] Update any relevant README files

### Post-implementation
- [ ] Test both sidepanel and dashboard endpoints
- [ ] Compare token usage before/after
- [ ] Verify output quality maintained or improved
- [ ] Monitor for any schema validation errors

---

## Testing Strategy

### Unit Tests
1. Validate schema structure is valid JSON Schema
2. Verify all required fields present
3. Check constraint values are sensible

### Integration Tests
1. Call sidepanel endpoint with test data
2. Call dashboard endpoint with test data
3. Verify responses match schema
4. Confirm array lengths within bounds
5. Check string lengths within limits

### Performance Tests
1. Measure input tokens before/after
2. Measure output tokens before/after
3. Calculate cost savings
4. Verify Extended Thinking improves quality

---

## Rollback Plan

If issues arise:
1. Git revert to previous commit
2. All changes are in discrete files (easy to rollback)
3. No breaking changes to data structures
4. Existing code will continue working with old schemas

---

## Success Metrics

### Quantitative
- [ ] Input tokens reduced by 80-150 per request
- [ ] Output tokens reduced by 100-300 per request
- [ ] No schema validation errors in production
- [ ] 100% of responses within new constraints

### Qualitative
- [ ] Output quality maintained or improved
- [ ] More accurate workload assessments
- [ ] More realistic time estimates
- [ ] Better priority rankings

---

## Notes

### Why These Optimizations Work
1. **Array constraints**: Directly limit output verbosity
2. **String maxLength**: Enforces concise, actionable content
3. **Extended Thinking**: Better reasoning without affecting JSON size
4. **Adaptive max_tokens**: Right-sized limits per use case
5. **Streamlined descriptions**: Less redundant text in prompts

### Compatibility
- All changes backward compatible
- No breaking changes to data structures
- TypeScript types remain unchanged (only JSDoc added)
- Existing frontend code needs no modifications

### Future Optimizations (Not in this plan)
- Prompt caching (if making many similar requests)
- Strict tool use for MCP tools (if building agent workflows)
- Response streaming (if latency is concern)
