package com.examoptima.model;

import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;

/**
 * Module I & III: Result model encapsulating timetable output and performance metrics.
 * Implements Serializable so schedule solutions can be saved to disk.
 */
public class ColoringResult implements Serializable {
    private static final long serialVersionUID = 1L;

    // Encapsulated fields
    private String algorithmName;
    private Map<String, Integer> slotAssignments; // subjectId -> slot index (0, 1, 2...)
    private int numSlots;
    private long executionTimeNanos;
    private double executionTimeMs;
    private long operationsCount;
    private boolean isValid;
    private String statusMessage;

    // Default constructor
    public ColoringResult() {
        this.slotAssignments = new HashMap<String, Integer>();
        this.numSlots = 0;
        this.isValid = true;
        this.statusMessage = "Initialized";
    }

    // Parameterized constructor
    public ColoringResult(String algorithmName, Map<String, Integer> slotAssignments, int numSlots,
                          long executionTimeNanos, long operationsCount, boolean isValid, String statusMessage) {
        this.algorithmName = algorithmName;
        this.slotAssignments = (slotAssignments != null) ? new HashMap<String, Integer>(slotAssignments) : new HashMap<String, Integer>();
        this.numSlots = numSlots;
        this.executionTimeNanos = executionTimeNanos;
        this.executionTimeMs = executionTimeNanos / 1000000.0;
        this.operationsCount = operationsCount;
        this.isValid = isValid;
        this.statusMessage = statusMessage;
    }

    // --- Getters & Setters ---

    public String getAlgorithmName() {
        return algorithmName;
    }

    public void setAlgorithmName(String algorithmName) {
        this.algorithmName = algorithmName;
    }

    public Map<String, Integer> getSlotAssignments() {
        return slotAssignments;
    }

    public void setSlotAssignments(Map<String, Integer> slotAssignments) {
        this.slotAssignments = slotAssignments;
    }

    public int getNumSlots() {
        return numSlots;
    }

    public void setNumSlots(int numSlots) {
        this.numSlots = numSlots;
    }

    public long getExecutionTimeNanos() {
        return executionTimeNanos;
    }

    public void setExecutionTimeNanos(long executionTimeNanos) {
        this.executionTimeNanos = executionTimeNanos;
        this.executionTimeMs = executionTimeNanos / 1000000.0;
    }

    public double getExecutionTimeMs() {
        return executionTimeMs;
    }

    public long getOperationsCount() {
        return operationsCount;
    }

    public void setOperationsCount(long operationsCount) {
        this.operationsCount = operationsCount;
    }

    public boolean isValid() {
        return isValid;
    }

    public void setValid(boolean valid) {
        isValid = valid;
    }

    public String getStatusMessage() {
        return statusMessage;
    }

    public void setStatusMessage(String statusMessage) {
        this.statusMessage = statusMessage;
    }
}
