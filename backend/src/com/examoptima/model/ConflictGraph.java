package com.examoptima.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Module I & IV: Graph Data Structure and Java Collections Framework
 * Mathematical Conflict Graph G = (V, E).
 * 
 * - V (Vertices): Set of subjects scheduled for examination.
 * - E (Edges): Undirected conflict edges created whenever two subjects share student divisions.
 */
public class ConflictGraph implements Serializable {
    private static final long serialVersionUID = 1L;

    // Graph representation using Collections Framework (Module IV)
    private final List<Subject> subjects;
    private final Map<String, Subject> subjectMap;
    private final Map<String, Set<String>> adjacencyList;
    private final Map<String, Integer> degrees;
    private final List<ConflictEdge> edges;

    public ConflictGraph(List<Subject> subjects) {
        this.subjects = (subjects != null) ? new ArrayList<Subject>(subjects) : new ArrayList<Subject>();
        this.subjectMap = new HashMap<String, Subject>();
        this.adjacencyList = new HashMap<String, Set<String>>();
        this.degrees = new HashMap<String, Integer>();
        this.edges = new ArrayList<ConflictEdge>();

        // Initialize adjacency list for all vertices
        for (int i = 0; i < this.subjects.size(); i++) {
            Subject s = this.subjects.get(i);
            this.subjectMap.put(s.getId(), s);
            this.adjacencyList.put(s.getId(), new HashSet<String>());
            this.degrees.put(s.getId(), 0);
        }

        // Dynamically compute conflict edges based on common divisions
        buildGraph();
    }

    /**
     * Examines all pairs of subjects to detect student division overlaps.
     * Uses nested loops with standard array indexing (Module I Control Structures).
     */
    private void buildGraph() {
        int n = this.subjects.size();
        for (int i = 0; i < n; i++) {
            Subject s1 = this.subjects.get(i);
            for (int j = i + 1; j < n; j++) {
                Subject s2 = this.subjects.get(j);
                if (s1.conflictsWith(s2)) {
                    // Add undirected edge between s1 and s2
                    this.adjacencyList.get(s1.getId()).add(s2.getId());
                    this.adjacencyList.get(s2.getId()).add(s1.getId());

                    List<String> shared = s1.getSharedDivisions(s2);
                    ConflictEdge edge = new ConflictEdge(s1.getId(), s2.getId(), s1.getCode(), s2.getCode(), shared);
                    this.edges.add(edge);
                }
            }
        }

        // Calculate vertex degrees: degree(v) = number of neighbors
        for (int i = 0; i < n; i++) {
            Subject s = this.subjects.get(i);
            int degree = this.adjacencyList.get(s.getId()).size();
            this.degrees.put(s.getId(), degree);
        }
    }

    // --- Getters ---

    public List<Subject> getSubjects() {
        return subjects;
    }

    public Map<String, Subject> getSubjectMap() {
        return subjectMap;
    }

    public Map<String, Set<String>> getAdjacencyList() {
        return adjacencyList;
    }

    public Map<String, Integer> getDegrees() {
        return degrees;
    }

    public List<ConflictEdge> getEdges() {
        return edges;
    }

    public int getVertexCount() {
        return subjects.size();
    }

    public int getEdgeCount() {
        return edges.size();
    }

    /**
     * Checks if two subjects share an edge in the graph.
     */
    public boolean hasConflict(String subjectId1, String subjectId2) {
        Set<String> neighbors = this.adjacencyList.get(subjectId1);
        if (neighbors != null) {
            return neighbors.contains(subjectId2);
        }
        return false;
    }
}
