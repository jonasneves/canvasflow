/**
 * Assignment Processing Module
 * Handles assignment data preparation, filtering, and scoring.
 */

window.CanvasFlowAssignments = window.CanvasFlowAssignments || {};

/**
 * Calculate Impact Score for priority-based sorting
 * @param {Object} assignment - Assignment object with dueDate and pointsPossible
 * @returns {number} Impact score (0-100)
 */
window.CanvasFlowAssignments.calculateImpactScore = function(assignment) {
  const now = new Date();
  const due = new Date(assignment.dueDate);
  const points = assignment.pointsPossible || 10;

  // Hours until due (minimum 1 to avoid division by zero)
  const hoursUntilDue = Math.max(1, (due - now) / (1000 * 60 * 60));

  // Time urgency factor
  let timeMultiplier;
  if (hoursUntilDue <= 0) {
    timeMultiplier = 20; // Overdue = highest priority
  } else if (hoursUntilDue <= 24) {
    timeMultiplier = 10; // Due today
  } else if (hoursUntilDue <= 48) {
    timeMultiplier = 5;  // Due tomorrow
  } else if (hoursUntilDue <= 168) {
    timeMultiplier = 2;  // Due this week
  } else {
    timeMultiplier = 1;  // Due later
  }

  // Raw score: points weighted by urgency, divided by days remaining
  const rawScore = (points * timeMultiplier) / (hoursUntilDue / 24);

  // Normalize to 0-100 using logarithmic scaling
  return Math.min(100, Math.log10(rawScore + 1) * 30);
};

/**
 * Prepare assignments data for AI analysis
 * @param {Array} allAssignments - Array of all assignments
 * @param {Object} timeRange - Object with weeksBefore and weeksAfter
 * @returns {Object} Prepared data for AI
 */
window.CanvasFlowAssignments.prepareAssignmentsForAI = function(allAssignments, timeRange) {
  const now = new Date();
  const weeksBefore = timeRange?.weeksBefore ?? 0;
  const weeksAfter = timeRange?.weeksAfter ?? 2;

  const timeRangeStart = new Date(now.getTime() - weeksBefore * 7 * 24 * 60 * 60 * 1000);
  const timeRangeEnd = new Date(now.getTime() + weeksAfter * 7 * 24 * 60 * 60 * 1000);

  // Filter assignments to only those within the configured time range
  const assignments = (allAssignments || []).filter(a => {
    if (!a.dueDate) return true;
    const dueDate = new Date(a.dueDate);
    return dueDate >= timeRangeStart && dueDate <= timeRangeEnd;
  });

  return {
    totalAssignments: assignments.length,
    courses: [...new Set(assignments.map(a => a.courseName))],
    upcoming: assignments.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return dueDate >= now && dueDate <= weekFromNow && !a.submission?.submitted;
    }).map(a => ({
      id: a.id,
      name: a.name,
      course: a.courseName,
      dueDate: a.dueDate,
      points: a.pointsPossible
    })),
    overdue: assignments.filter(a => {
      if (!a.dueDate) return false;
      const dueDate = new Date(a.dueDate);
      return dueDate < now && !a.submission?.submitted;
    }).map(a => ({
      id: a.id,
      name: a.name,
      course: a.courseName,
      dueDate: a.dueDate,
      points: a.pointsPossible
    })),
    completed: assignments.filter(a =>
      a.submission?.submitted || a.submission?.workflowState === 'graded'
    ).length
  };
};

/**
 * Find assignment URL by fuzzy matching name
 * @param {string} assignmentName - Name to search for
 * @param {Array} allAssignments - Array of all assignments
 * @returns {string|null} Assignment URL or null
 */
window.CanvasFlowAssignments.findAssignmentUrl = function(assignmentName, allAssignments) {
  if (!allAssignments || allAssignments.length === 0) {
    return null;
  }

  const cleanName = assignmentName.toLowerCase().trim();
  const scored = allAssignments
    .filter(a => a.name && a.url)
    .map(assignment => {
      const aName = assignment.name.toLowerCase().trim();
      let score = 0;

      if (aName === cleanName) {
        score = 100;
      } else if (aName.includes(cleanName) || cleanName.includes(aName)) {
        score = 80;
      } else {
        const aiWords = cleanName.split(/\s+/).filter(w => w.length > 3);
        const assignmentWords = aName.split(/\s+/).filter(w => w.length > 3);

        if (aiWords.length > 0 && assignmentWords.length > 0) {
          const matchingWords = aiWords.filter(word =>
            assignmentWords.some(aWord => aWord.includes(word) || word.includes(aWord))
          );
          const matchRatio = matchingWords.length / aiWords.length;
          if (matchRatio >= 0.7) {
            score = matchRatio * 60;
          }
        }
      }

      return { assignment, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length > 0 && scored[0].score >= 70) {
    return scored[0].assignment.url;
  }

  return null;
};

/**
 * Filter assignments by visible courses
 * @param {Array} assignments - Array of assignments
 * @param {Array} visibleCourseIds - Array of visible course IDs
 * @returns {Array} Filtered assignments
 */
window.CanvasFlowAssignments.filterByVisibleCourses = function(assignments, visibleCourseIds) {
  return assignments.filter(a => visibleCourseIds.includes(a.courseId));
};

/**
 * Get visible course IDs based on hidden courses and term settings
 * @param {Array} allCourses - Array of all courses
 * @param {Array} hiddenCourseIds - Array of hidden course IDs
 * @param {boolean} hideEndedTerms - Whether to hide ended terms
 * @returns {Array} Array of visible course IDs
 */
window.CanvasFlowAssignments.getVisibleCourseIds = function(allCourses, hiddenCourseIds, hideEndedTerms) {
  const now = new Date();
  return allCourses
    .filter(course => {
      if (hiddenCourseIds.includes(course.id)) return false;
      if (hideEndedTerms && course.termEndAt) {
        const termEnd = new Date(course.termEndAt);
        if (termEnd < now) return false;
      }
      return true;
    })
    .map(course => course.id);
};

/**
 * Get assignment badges HTML
 * @param {Object} assignment - Assignment object
 * @returns {string} HTML string for badges
 */
window.CanvasFlowAssignments.getAssignmentBadges = function(assignment) {
  const badges = [];

  if (assignment.submission?.submitted) {
    badges.push('<span class="assignment-badge submitted">Submitted</span>');
    if (assignment.submission.late) {
      badges.push('<span class="assignment-badge late">Late</span>');
    }
  }

  if (assignment.submission?.workflowState === 'graded') {
    badges.push('<span class="assignment-badge completed">Graded</span>');
  }

  if (assignment.submission?.missing && !assignment.submission?.submitted) {
    badges.push('<span class="assignment-badge missing">Missing</span>');
  }

  return badges.join('');
};

/**
 * Get grade display HTML
 * @param {Object} assignment - Assignment object
 * @param {boolean} showGrades - Whether to show grades
 * @returns {string} HTML string for grade display
 */
window.CanvasFlowAssignments.getGradeDisplay = function(assignment, showGrades) {
  if (!showGrades) return '';

  const submission = assignment.submission;
  if (!submission || submission.workflowState !== 'graded') return '';

  const score = submission.score;
  const pointsPossible = assignment.pointsPossible;

  if (score !== undefined && score !== null && pointsPossible) {
    const percentage = ((score / pointsPossible) * 100).toFixed(1);
    return `<span class="assignment-grade">${score}/${pointsPossible} (${percentage}%)</span>`;
  } else if (score !== undefined && score !== null) {
    return `<span class="assignment-grade">${score} pts</span>`;
  }

  return '';
};
