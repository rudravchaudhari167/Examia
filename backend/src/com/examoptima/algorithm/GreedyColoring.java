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
 * Module I, II & IV: Inheritance, Collections, and Greedy DAA Algorithm.
 * 
 * DAA ALGORITHM: GREEDY GRAPH COLORING (Welsh-Powell Heuristic)
 * 
 * Algorithm Steps:
 * 1. Calculate degree for all vertices in the conflict graph.
 * 2. Sort subjects in descending order of their vertex degrees.
 * 3. Pick the highest-degree uncolored subject.
 * 4. Scan colors 0, 1, 2... and assign the lowest non-conflicting color.
 * 5. Repeat until every subject has an examination time slot.
 * 
 * Time Complexity: O(V log V + E)
 * Space Complexity: O(V)
 */
public class GreedyColoring extends BaseColoringAlgorithm {

    // Constructor using super keyword (Module II)
    public GreedyColoring() {
        super("Greedy Graph Coloring (Welsh-Powell)");
    }

    // Static helper method for quick invocation
    public static ColoringResult solve(ConflictGraph graph) {
        GreedyColoring algorithm = new GreedyColoring();
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
                "Scheduling error: " + e.getMessage()
            );
        }
    }

    /**
     * Module II: Method Overriding
     * Implements the Greedy Coloring algorithm.
     */
    @Override
    public ColoringResult schedule(ConflictGraph graph) throws SchedulingException {
        long startTime = System.nanoTime();
        long operationsCount = 0;

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

        final Map<String, Integer> degrees = graph.getDegrees();
        final Map<String, Set<String>> adjList = graph.getAdjacencyList();

        // Step 1 & 2: Sort subjects by descending vertex degree
        // Uses traditional Anonymous Inner Class (Module I/II/IV - NO lambdas!)
        Collections.sort(subjects, new Comparator<Subject>() {
            @Override
            public int compare(Subject s1, Subject s2) {
                int deg1 = degrees.containsKey(s1.getId()) ? degrees.get(s1.getId()) : 0;
                int deg2 = degrees.containsKey(s2.getId()) ? degrees.get(s2.getId()) : 0;
                // Descending degree order
                if (deg2 != deg1) {
                    return Integer.compare(deg2, deg1);
                }
                // Tie breaker: alphabetical code
                return s1.getCode().compareTo(s2.getCode());
            }
        });
        operationsCount += subjects.size();

        Map<String, Integer> assignments = new HashMap<String, Integer>();
        int maxColorUsed = -1;

        // Step 3 & 4: Sequentially assign the lowest non-conflicting color
        for (int i = 0; i < subjects.size(); i++) {
            Subject subject = subjects.get(i);
            String uId = subject.getId();
            Set<String> neighbors = adjList.get(uId);
            if (neighbors == null) {
                neighbors = new HashSet<String>();
            }

            // Collect all colors already used by conflicting adjacent subjects
            Set<Integer> neighborColors = new HashSet<Integer>();
            Iterator<String> neighborIt = neighbors.iterator();
            while (neighborIt.hasNext()) {
                String neighborId = neighborIt.next();
                operationsCount++;
                if (assignments.containsKey(neighborId)) {
                    neighborColors.add(assignments.get(neighborId));
                }
            }

            // Find the smallest non-negative integer color not in neighborColors
            int candidateColor = 0;
            while (neighborColors.contains(candidateColor)) {
                operationsCount++;
                candidateColor++;
            }

            // Assign color to subject
            assignments.put(uId, candidateColor);
            if (candidateColor > maxColorUsed) {
                maxColorUsed = candidateColor;
            }
        }

        long executionTimeNanos = System.nanoTime() - startTime;
        int numSlots = (maxColorUsed >= 0) ? (maxColorUsed + 1) : 0;

        // Validate solution using final method from base class
        boolean isValid = validateColoring(graph, assignments);

        return new ColoringResult(
            this.algorithmName,
            assignments,
            numSlots,
            executionTimeNanos,
            operationsCount,
            isValid,
            isValid ? "Valid conflict-free schedule generated using " + numSlots + " time slots."
                    : "Conflict constraint violated!"
        );
    }
}
