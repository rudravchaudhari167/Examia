package com.examoptima.exception;

/**
 * Module III: Exception Handling - Custom User-Defined Exception
 * Thrown when graph coloring or timetable constraints cannot be satisfied.
 */
public class SchedulingException extends Exception {
    private static final long serialVersionUID = 1L;

    public SchedulingException(String message) {
        super(message);
    }

    public SchedulingException(String message, Throwable cause) {
        super(message, cause);
    }
}

