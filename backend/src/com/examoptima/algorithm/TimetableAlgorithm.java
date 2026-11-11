package com.examoptima.algorithm;

import com.examoptima.exception.SchedulingException;
import com.examoptima.model.ColoringResult;
import com.examoptima.model.ConflictGraph;

/**
 * Module II: Interfaces and Polymorphism
 * Contract defining examination scheduling algorithms.
 */
public interface TimetableAlgorithm {

    /**
     * Solves graph coloring on the given conflict graph.
     * @param graph The conflict graph representing subjects and clashing divisions.
     * @return ColoringResult containing time slot assignments and metrics.
     * @throws SchedulingException if scheduling is impossible under active constraints.
     */
    ColoringResult schedule(ConflictGraph graph) throws SchedulingException;

    /**
     * Returns the human-readable name of the DAA algorithm.
     */
    String getAlgorithmName();
}

