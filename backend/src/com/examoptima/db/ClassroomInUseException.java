package com.examoptima.db;

import java.util.List;
import java.util.Map;

/**
 * Thrown when deleting a classroom that is currently assigned to one or more
 * scheduled examinations in the active timetable unless schedule clearing is requested.
 */
public class ClassroomInUseException extends RuntimeException {
    private final List<Map<String, Object>> usages;

    public ClassroomInUseException(String message, List<Map<String, Object>> usages) {
        super(message);
        this.usages = usages;
    }

    public List<Map<String, Object>> getUsages() {
        return usages;
    }
}
