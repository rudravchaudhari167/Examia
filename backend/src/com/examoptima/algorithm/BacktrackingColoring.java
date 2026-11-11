package com.examoptima.algorithm;

import com.examoptima.exception.SchedulingException;
import com.examoptima.model.ColoringResult;
import com.examoptima.model.ConflictGraph;
import com.examoptima.model.Subject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Module I, II & IV: Inheritance, Recursion, and Backtracking DAA Algorithm.
 * 
 * DAA ALGORITHM: BACKTRACKING GRAPH COLORING (m-Coloring Problem)
 * 
 * Algorithm Steps:
 * 1. Order subjects to prune dense vertices early.
 * 2. In recursive method backtrack(vertexIndex, maxSlots):
 *    a. Base Case: If vertexIndex == subjects.size(), all exams placed safely -> RETURN TRUE.
 *    b. For each candidate slot = 0 to maxSlots - 1:
 *       i.   Check if slot is safe (no adjacent neighbor has this slot).
 *       ii.  If safe: Assign slot to vertex.
 *       iii. Recursively call backtrack for (vertexIndex + 1).
 *       iv.  If recursive call succeeds -> RETURN TRUE.
 *       v.   BACKTRACK STEP: If recursive call failed, undo assignment and try next slot.
 *    c. If no slot worked -> RETURN FALSE.
 * 
 * Time Complexity: O(m^V) worst-case exponential
 * Space Complexity: O(V) recursive call stack
 */
public class BacktrackingColoring extends BaseColoringAlgorithm {

    // Simple helper class to track recursion metrics across call stack
    public static class BacktrackTracker {
        public long recursiveCalls = 0;
        public long backtrackSteps = 0;
    }

    private final int maxSlots;

    public BacktrackingColoring() {
        this(0); // 0 means automatically find minimal chromatic number
    }

    public BacktrackingColoring(int maxSlots) {
        super(maxSlots > 0 
            ? "Backtracking Graph Coloring (Limit m = " + maxSlots + ")" 
            : "Backtracking (Optimal Chromatic Search)");
        this.maxSlots = maxSlots;
    }

    // Static helper method for compatibility with server & GUI
    public static ColoringResult solve(ConflictGraph graph, int maxSlots) {
        BacktrackingColoring algorithm = new BacktrackingColoring(maxSlots);
        try {
            return algorithm.schedule(graph);
        } catch (SchedulingException e) {
            return new ColoringResult(
                algorithm.getAlgorithmName(),
                new HashMap<String, Integer>(),
                0,
                0,
                0,
                false,
                "Backtracking error: " + e.getMessage()
            );
        }
    }

    @Override
    public ColoringResult schedule(ConflictGraph graph) throws SchedulingException {
        long startTime = System.nanoTime();
        BacktrackTracker tracker = new BacktrackTracker();

        if (graph == null) {
            throw new SchedulingException("Cannot schedule a null graph.");
        }

        List<Subject> subjects = new ArrayList<Subject>(graph.getSubjects());
        if (subjects.isEmpty()) {
            long duration = System.nanoTime() - startTime;
            return new ColoringResult(
                this.algorithmName,
                new HashMap<String, Integer>(),
                0,
                duration,
                0,
                true,
                "Graph has 0 subjects - 0 slots needed."
            );
        }

        // Optimize vertex ordering: sort by descending degree to prune search tree early
        // Uses Anonymous Inner Class (Module I/II - NO lambdas!)
        final Map<String, Integer> degrees = graph.getDegrees();
        Collections.sort(subjects, new Comparator<Subject>() {
            @Override
            public int compare(Subject s1, Subject s2) {
                int deg1 = degrees.containsKey(s1.getId()) ? degrees.get(s1.getId()) : 0;
                int deg2 = degrees.containsKey(s2.getId()) ? degrees.get(s2.getId()) : 0;
                return Integer.compare(deg2, deg1);
            }
        });

        Map<String, Integer> assignments = new HashMap<String, Integer>();
        boolean found = false;
        int finalSlotsUsed = 0;

        if (this.maxSlots > 0) {
            // Solve for a specific slot budget limit
            found = backtrack(graph, subjects, 0, this.maxSlots, assignments, tracker);
            if (found) {
                // Find maximum slot index used
                Iterator<Integer> it = assignments.values().iterator();
                while (it.hasNext()) {
                    int slot = it.next();
                    if (slot + 1 > finalSlotsUsed) {
                        finalSlotsUsed = slot + 1;
                    }
                }
            }
        } else {
            // Incrementally find the minimum chromatic number (k = 1, 2, 3...)
            int k = 1;
            while (!found && k <= subjects.size()) {
                assignments.clear();
                found = backtrack(graph, subjects, 0, k, assignments, tracker);
                if (found) {
                    finalSlotsUsed = k;
                    break;
                }
                k++;
            }
        }

        long executionTimeNanos = System.nanoTime() - startTime;
        boolean isValid = found && validateColoring(graph, assignments);

        return new ColoringResult(
            this.algorithmName,
            found ? assignments : new HashMap<String, Integer>(),
            finalSlotsUsed,
            executionTimeNanos,
            tracker.recursiveCalls,
            isValid,
            found 
                ? "Optimal schedule found with " + finalSlotsUsed + " slots across " + tracker.recursiveCalls + " recursive calls."
                : "No valid schedule exists with maximum " + this.maxSlots + " slots. Backtracked after " + tracker.recursiveCalls + " calls."
        );
    }

    // Recursive backtracking method exploring the state-space tree
    private boolean backtrack(ConflictGraph graph, List<Subject> subjects, int index,
                              int slotBudget, Map<String, Integer> assignments, BacktrackTracker tracker) {
        tracker.recursiveCalls++;

        // Base Condition: All subjects colored successfully!
        if (index == subjects.size()) {
            return true;
        }

        Subject current = subjects.get(index);
        String currentId = current.getId();
        Set<String> neighbors = graph.getAdjacencyList().get(currentId);
        if (neighbors == null) {
            neighbors = new HashSet<String>();
        }

        // Try every candidate time slot in [0, slotBudget - 1]
        for (int slot = 0; slot < slotBudget; slot++) {
            // Check if slot is safe with respect to conflicting neighbors
            if (isSafe(slot, neighbors, assignments)) {
                // Tentative Assignment
                assignments.put(currentId, slot);

                // Recursive DFS step
                if (backtrack(graph, subjects, index + 1, slotBudget, assignments, tracker)) {
                    return true; // Found complete solution
                }

                // BACKTRACK STEP: Undo assignment and try alternative slot
                assignments.remove(currentId);
                tracker.backtrackSteps++;
            }
        }

        // No valid slot could be assigned to this subject at this depth
        return false;
    }

    // Helper method: Checks if assigning 'slot' to current vertex creates a clash with neighbors
    private boolean isSafe(int slot, Set<String> neighbors, Map<String, Integer> assignments) {
        Iterator<String> it = neighbors.iterator();
        while (it.hasNext()) {
            String neighborId = it.next();
            Integer neighborSlot = assignments.get(neighborId);
            if (neighborSlot != null && neighborSlot.intValue() == slot) {
                return false; // Neighbor has the same examination slot!
            }
        }
        return true;
    }
}
