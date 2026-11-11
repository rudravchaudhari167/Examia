/**
 * GREEDY GRAPH COLORING (Welsh-Powell Heuristic)
 *
 * Algorithm Strategy:
 * 1. Calculate vertex degree for all subjects in the conflict graph.
 * 2. Order vertices by non-increasing degree: deg(v1) >= deg(v2) >= ... >= deg(vn).
 * 3. Color the first vertex with the lowest available color (Color 0).
 * 4. Sequentially examine remaining vertices, finding the smallest integer color
 *    that is not currently assigned to any adjacent neighbor.
 * 5. Return assignment map, total colors (slots) used, execution time, and operation count.
 */

import { validateSchedule } from './graph.js';

export function runGreedyColoring(graph) {
  const startTime = performance.now();
  let operationsCount = 0;

  const subjects = [...graph.subjects];
  if (subjects.length === 0) {
    const elapsed = performance.now() - startTime;
    return {
      algorithmName: "Greedy Graph Coloring (Welsh-Powell)",
      assignments: {},
      numSlots: 0,
      executionTimeMs: Number(elapsed.toFixed(4)),
      operationsCount: 0,
      isValid: true,
      statusMessage: "Empty graph - 0 slots needed."
    };
  }

  // Step 1 & 2: Sort vertices in descending order of degree
  subjects.sort((a, b) => {
    const degA = graph.degrees.get(a.id) || 0;
    const degB = graph.degrees.get(b.id) || 0;
    if (degB !== degA) return degB - degA;
    return a.code.localeCompare(b.code); // deterministic tie breaker
  });
  operationsCount += Math.round(subjects.length * Math.log2(Math.max(2, subjects.length)));

  const assignments = {};
  let maxColorIndex = -1;

  // Step 3 & 4: Sequentially assign the lowest non-conflicting color
  for (const subject of subjects) {
    const uId = subject.id;
    const neighbors = graph.adjacencyList.get(uId) || new Set();

    // Collect colors of adjacent vertices
    const usedColors = new Set();
    for (const neighborId of neighbors) {
      operationsCount++;
      if (neighborId in assignments) {
        usedColors.add(assignments[neighborId]);
      }
    }

    // Find the minimum non-negative integer not in usedColors
    let candidateColor = 0;
    while (usedColors.has(candidateColor)) {
      operationsCount++;
      candidateColor++;
    }

    assignments[uId] = candidateColor;
    if (candidateColor > maxColorIndex) {
      maxColorIndex = candidateColor;
    }
  }

  const elapsed = performance.now() - startTime;
  const numSlots = maxColorIndex >= 0 ? maxColorIndex + 1 : 0;
  const validation = validateSchedule(graph.subjects, assignments);

  return {
    algorithmName: "Greedy Graph Coloring (Welsh-Powell)",
    assignments,
    numSlots,
    executionTimeMs: Number(elapsed.toFixed(4)),
    operationsCount,
    isValid: validation.isValid,
    violations: validation.violations,
    statusMessage: validation.isValid
      ? `Generated conflict-free timetable utilizing ${numSlots} slot(s) with degree-ordered heuristic.`
      : "Constraint violation detected!"
  };
}

