package com.examoptima.algorithm;

import com.examoptima.model.ConflictEdge;
import com.examoptima.model.ConflictGraph;
import java.util.Iterator;
import java.util.Map;

/**
 * Module II: Abstract Classes, Inheritance, super and final keywords.
 * Base class providing common verification logic for timetable algorithms.
 */
public abstract class BaseColoringAlgorithm implements TimetableAlgorithm {

    // Final variable: cannot be reassigned after initialization
    protected final String algorithmName;

    // Constructor called by subclasses via super(name)
    public BaseColoringAlgorithm(String algorithmName) {
        this.algorithmName = algorithmName;
    }

    // Method overriding from interface
    @Override
    public String getAlgorithmName() {
        return this.algorithmName;
    }

    /**
     * Final method: Ensures derived classes use this exact validation logic.
     * Validates that no two conflicting vertices share the same examination slot.
     */
    public final boolean validateColoring(ConflictGraph graph, Map<String, Integer> assignments) {
        if (graph == null || assignments == null) {
            return false;
        }

        Iterator<ConflictEdge> it = graph.getEdges().iterator();
        while (it.hasNext()) {
            ConflictEdge edge = it.next();
            Integer c1 = assignments.get(edge.uId);
            Integer c2 = assignments.get(edge.vId);

            // If both vertices are colored and share the same color, conflict occurred!
            if (c1 != null && c2 != null && c1.equals(c2)) {
                return false;
            }
        }
        return true;
    }
}
