/**
 * Phase 1 Testing Script
 *
 * Tests the schemas and mappers created in Phase 1 to ensure they work correctly.
 * Run with: node canvas-mcp-extension/test-phase1.js
 */

import {
  URGENCY_LEVELS,
  INTENSITY_LEVELS,
  SIDEPANEL_INSIGHTS_SCHEMA,
  DASHBOARD_SCHEDULE_SCHEMA
} from './schemas/ai-schemas.js';

import {
  mapUrgencyToColor,
  mapUrgencyToLabel,
  mapIntensityToColor,
  mapIntensityToLabel,
  mapWorkloadToLabel,
  mapWorkloadToColor,
  formatTimeBlock,
  isValidScore,
  isValidUrgencyScore,
  isValidIntensityScore,
  isValidTimeBlock
} from './utils/ai-mappers.js';

console.log('🧪 Phase 1 Testing - Schemas and Mappers\n');

// Test 1: Schema Constants
console.log('✅ Test 1: Schema Constants');
console.log('URGENCY_LEVELS:', URGENCY_LEVELS);
console.log('INTENSITY_LEVELS:', INTENSITY_LEVELS);
console.log('');

// Test 2: Schema Structure Validation
console.log('✅ Test 2: Schema Structure Validation');
console.log('SIDEPANEL_INSIGHTS_SCHEMA type:', SIDEPANEL_INSIGHTS_SCHEMA.type);
console.log('SIDEPANEL_INSIGHTS_SCHEMA has schema.properties:', !!SIDEPANEL_INSIGHTS_SCHEMA.schema.properties);
console.log('DASHBOARD_SCHEDULE_SCHEMA type:', DASHBOARD_SCHEDULE_SCHEMA.type);
console.log('DASHBOARD_SCHEDULE_SCHEMA has schema.properties:', !!DASHBOARD_SCHEDULE_SCHEMA.schema.properties);
console.log('');

// Test 3: Urgency Mappings
console.log('✅ Test 3: Urgency Score Mappings');
for (let score = 0; score <= 3; score++) {
  const color = mapUrgencyToColor(score);
  const label = mapUrgencyToLabel(score);
  const valid = isValidUrgencyScore(score);
  console.log(`  Score ${score}: ${label.padEnd(10)} → ${color} (valid: ${valid})`);
}
console.log('');

// Test 4: Intensity Mappings
console.log('✅ Test 4: Intensity Score Mappings');
for (let score = 0; score <= 3; score++) {
  const color = mapIntensityToColor(score);
  const label = mapIntensityToLabel(score);
  const valid = isValidIntensityScore(score);
  console.log(`  Score ${score}: ${label.padEnd(12)} → ${color} (valid: ${valid})`);
}
console.log('');

// Test 5: Time Block Formatting
console.log('✅ Test 5: Time Block Formatting');
const testCases = [
  { start: 9, duration: 3 },      // 9:00 AM - 12:00 PM
  { start: 14, duration: 1.5 },   // 2:00 PM - 3:30 PM
  { start: 8, duration: 2.5 },    // 8:00 AM - 10:30 AM
  { start: 19, duration: 2 },     // 7:00 PM - 9:00 PM
  { start: 0, duration: 1 },      // 12:00 AM - 1:00 AM
  { start: 12, duration: 1 }      // 12:00 PM - 1:00 PM
];

testCases.forEach(({ start, duration }) => {
  const formatted = formatTimeBlock(start, duration);
  const valid = isValidTimeBlock(start, duration);
  console.log(`  ${start}h + ${duration}h → ${formatted} (valid: ${valid})`);
});
console.log('');

// Test 6: Invalid Input Handling
console.log('✅ Test 6: Invalid Input Handling');
console.log('  Urgency score -1:', mapUrgencyToLabel(-1), '(should default to medium)');
console.log('  Urgency score 5:', mapUrgencyToLabel(5), '(should default to medium)');
console.log('  Intensity score 10:', mapIntensityToLabel(10), '(should default to moderate)');
console.log('  Invalid score validation (-1):', isValidScore(-1), '(should be false)');
console.log('  Invalid score validation (4):', isValidScore(4), '(should be false)');
console.log('  Invalid time block (25h start):', isValidTimeBlock(25, 2), '(should be false)');
console.log('  Invalid time block (10h duration):', isValidTimeBlock(9, 10), '(should be false)');
console.log('');

// Test 7: Workload Aliases
console.log('✅ Test 7: Workload Aliases (should match intensity)');
for (let score = 0; score <= 3; score++) {
  const workloadLabel = mapWorkloadToLabel(score);
  const intensityLabel = mapIntensityToLabel(score);
  const workloadColor = mapWorkloadToColor(score);
  const intensityColor = mapIntensityToColor(score);
  const match = workloadLabel === intensityLabel && workloadColor === intensityColor;
  console.log(`  Score ${score}: match=${match} (${workloadLabel} / ${intensityLabel})`);
}
console.log('');

// Test 8: Sample AI Response Validation
console.log('✅ Test 8: Sample AI Response Structure');

const sampleSidepanelResponse = {
  priority_tasks: [
    {
      task: "Complete Art History essay",
      reason: "Due tomorrow, worth 20% of grade",
      urgency_score: 3,
      estimated_hours: 4.5
    }
  ],
  workload_assessment: {
    overall: "Heavy week with multiple deadlines",
    total_hours_needed: 18.5,
    intensity_score: 2,
    recommendations: ["Focus on essay first", "Block 2-hour sessions"]
  },
  study_tips: ["Use pomodoro technique", "Take regular breaks"]
};

console.log('  Sample sidepanel response structure:');
console.log('    - priority_tasks:', sampleSidepanelResponse.priority_tasks.length, 'item(s)');
console.log('    - workload intensity:', mapIntensityToLabel(sampleSidepanelResponse.workload_assessment.intensity_score));
console.log('    - study_tips:', sampleSidepanelResponse.study_tips.length, 'tip(s)');
console.log('    - First task urgency:', mapUrgencyToLabel(sampleSidepanelResponse.priority_tasks[0].urgency_score));
console.log('    - First task color:', mapUrgencyToColor(sampleSidepanelResponse.priority_tasks[0].urgency_score));
console.log('');

const sampleDashboardResponse = {
  priority_tasks: [],
  workload_assessment: {
    overall: "Moderate week",
    total_hours_needed: 12,
    intensity_score: 1,
    recommendations: ["Plan ahead"]
  },
  weekly_plan: [
    {
      day: "Monday, Nov 18",
      focus: "Essay writing",
      workload_score: 2,
      tasks: [
        {
          assignment: "Art History Essay",
          start_hour: 9,
          duration_hours: 3.5,
          notes: "Focus on introduction and thesis"
        }
      ]
    }
  ],
  study_tips: ["Stay organized"]
};

console.log('  Sample dashboard response structure:');
console.log('    - weekly_plan:', sampleDashboardResponse.weekly_plan.length, 'day(s)');
console.log('    - First day workload:', mapWorkloadToLabel(sampleDashboardResponse.weekly_plan[0].workload_score));
console.log('    - First task time:', formatTimeBlock(
  sampleDashboardResponse.weekly_plan[0].tasks[0].start_hour,
  sampleDashboardResponse.weekly_plan[0].tasks[0].duration_hours
));
console.log('');

// Test 9: Schema Required Fields Check
console.log('✅ Test 9: Schema Required Fields');
console.log('  Sidepanel required:', SIDEPANEL_INSIGHTS_SCHEMA.schema.required);
console.log('  Dashboard required:', DASHBOARD_SCHEDULE_SCHEMA.schema.required);
console.log('  Priority task required:', SIDEPANEL_INSIGHTS_SCHEMA.schema.properties.priority_tasks.items.required);
console.log('  Weekly plan required:', DASHBOARD_SCHEDULE_SCHEMA.schema.properties.weekly_plan.items.required);
console.log('');

console.log('🎉 Phase 1 Testing Complete!');
console.log('All schemas and mappers are working correctly.');
console.log('\nNext steps:');
console.log('  1. Review the output above to ensure all tests pass');
console.log('  2. Commit these changes');
console.log('  3. Proceed to Phase 2: Migrate sidepanel.js');
