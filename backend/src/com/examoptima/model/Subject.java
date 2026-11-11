package com.examoptima.model;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Module I & III: Object-Oriented Programming & Serialization
 * Represents a Subject vertex in the Examination Conflict Graph.
 * 
 * Demonstrates:
 * - Encapsulation (private variables with public getters and setters)
 * - Constructor Overloading (multiple constructors for flexibility)
 * - Serializable interface (for saving object state to disk)
 */
public class Subject implements Serializable {
    private static final long serialVersionUID = 1L;

    // Encapsulated instance variables
    private String id;
    private String code;
    private String name;
    private List<String> divisions;
    private int studentCount;
    private String category;

    // Constructor 1: Default constructor
    public Subject() {
        this.divisions = new ArrayList<String>();
        this.studentCount = 60;
        this.category = "General";
    }

    // Constructor 2: Overloaded constructor with basic details
    public Subject(String code, String name) {
        this();
        this.id = code;
        this.code = code;
        this.name = name;
    }

    // Constructor 3: Overloaded constructor with all fields
    public Subject(String id, String code, String name, List<String> divisions, int studentCount, String category) {
        this.id = id;
        this.code = code;
        this.name = name;
        this.divisions = (divisions != null) ? new ArrayList<String>(divisions) : new ArrayList<String>();
        this.studentCount = studentCount;
        this.category = category;
    }

    // --- Getters and Setters (Encapsulation) ---

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<String> getDivisions() {
        return divisions;
    }

    public void setDivisions(List<String> divisions) {
        this.divisions = (divisions != null) ? new ArrayList<String>(divisions) : new ArrayList<String>();
    }

    public int getStudentCount() {
        return studentCount;
    }

    public void setStudentCount(int studentCount) {
        this.studentCount = studentCount;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    /**
     * Checks if this subject conflicts with another subject due to shared divisions.
     * Uses standard Iterator traversal (Module IV Collections).
     */
    public boolean conflictsWith(Subject other) {
        if (other == null || this.id.equals(other.id)) {
            return false;
        }

        Iterator<String> it = this.divisions.iterator();
        while (it.hasNext()) {
            String div = it.next();
            if (other.divisions.contains(div)) {
                return true; // Conflict detected!
            }
        }
        return false;
    }

    /**
     * Returns list of shared student divisions between two subjects.
     */
    public List<String> getSharedDivisions(Subject other) {
        List<String> shared = new ArrayList<String>();
        if (other == null) {
            return shared;
        }

        Iterator<String> it = this.divisions.iterator();
        while (it.hasNext()) {
            String div = it.next();
            if (other.divisions.contains(div)) {
                shared.add(div);
            }
        }
        return shared;
    }

    @Override
    public String toString() {
        return code + " - " + name + " (Students: " + studentCount + ")";
    }
}
