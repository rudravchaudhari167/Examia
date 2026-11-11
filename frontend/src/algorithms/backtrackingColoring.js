/**
 * BACKTRACKING GRAPH COLORING (m-Coloring Problem)
 *
 * Algorithm Strategy:
 * 1. Order subjects to prune dense vertices early.
 * 2. Recursively assign slots from 0 to K-1 to the current vertex.
 * 3. Verify safety: no adjacent neighbor already has the same slot.
 * 4. If safe, tentatively assign slot and recurse to next vertex.
 * 5. If recursion succeeds, return true.
 * 6. If none of the slots lead to a solution, backtrack: remove assignment and return false.
 * 7. Supports either a fixed slot budget (maxSlots) or automatic minimum chromatic search.
 */

import { validateSchedule } from './graph.js';

export function runBacktrackingColoring(graph, maxSlots = 0) {
  const startTime = performance.now();
  let recursiveCalls = 0;
  let backtrackSteps = 0;

  const subjects = [...graph.subjects];
  if (subjects.length === 0) {
    const elapsed = performance.now() - startTime;
    return {
      algorithmName: "Backtracking Graph Coloring",
      assignments: {},
      numSlots: 0,
      executionTimeMs: Number(elapsed.toFixed(4)),
      recursiveCalls: 0,
      backtrackSteps: 0,
      isValid: true,
      statusMessage: "Empty graph - 0 slots needed."
    };
  }

  // Optimize vertex ordering: sort by descending degree to fail early
  subjects.sort((a, b) => {
    const degA = graph.degrees.get(a.id) || 0;
    const degB = graph.degrees.get(b.id) || 0;
    return degB - degA;
  });

  const assignments = {};

  // Recursive DFS helper
  function backtrack(index, slotBudget) {
    recursiveCalls++;

    // Base condition: all vertices colored
    if (index === subjects.length) {
      return true;
    }

    const currentSubject = subjects[index];
    const uId = currentSubject.id;
    const neighbors = graph.adjacencyList.get(uId) || new Set();

    // Try each slot in range [0, slotBudget - 1]
    for (let slot = 0; slot < slotBudget; slot++) {
      // Check if slot is safe (no neighbor has this slot)
      let conflict = false;
      for (const neighborId of neighbors) {
        if (assignments[neighborId] === slot) {
          conflict = true;
          break;
        }
      }

      if (!conflict) {
        // Tentative assignment
        assignments[uId] = slot;

        // Recurse to next subject
        if (backtrack(index + 1, slotBudget)) {
          return true;
        }

        // Backtrack
        delete assignments[uId];
        backtrackSteps++;
      }
    }

    return false;
  }

  let success = false;
  let finalSlotsUsed = 0;

  if (maxSlots > 0) {
    // Solves for user-defined slot limit
    success = backtrack(0, maxSlots);
    if (success) {
      const assignedSlots = Object.values(assignments);
      finalSlotsUsed = assignedSlots.length > 0 ? Math.max(...assignedSlots) + 1 : 0;
    }
  } else {
    // Incrementally discover minimum chromatic number (K = 1, 2, 3...)
    let k = 1;
    while (!success && k <= subjects.length) {
      for (const key in assignments) delete assignments[key];
      success = backtrack(0, k);
      if (success) {
        finalSlotsUsed = k;
        break;
      }
      k++;
    }
  }

  const elapsed = performance.now() - startTime;
  const validation = success ? validateSchedule(graph.subjects, assignments) : { isValid: false, violations: [] };

  return {
    algorithmName: maxSlots > 0 
      ? `Backtracking Coloring (Limit m = ${maxSlots})` 
      : `Backtracking (Exact Chromatic Search)`,
    assignments: success ? assignments : {},
    numSlots: finalSlotsUsed,
    executionTimeMs: Number(elapsed.toFixed(4)),
    recursiveCalls,
    backtrackSteps,
    isValid: success && validation.isValid,
    violations: validation.violations,
    statusMessage: success
      ? `Exact backtracking resolved conflict-free schedule using ${finalSlotsUsed} slot(s) across ${recursiveCalls} recursive calls.`
      : `No valid coloring exists within ${maxSlots} slot(s). Backtracked through ${recursiveCalls} state configurations.`
  };
}

