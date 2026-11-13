package com.examoptima.service;

import com.examoptima.algorithm.BacktrackingColoring;
import com.examoptima.algorithm.GreedyColoring;
import com.examoptima.model.ColoringResult;
import com.examoptima.model.ConflictGraph;
import com.examoptima.model.Subject;
import com.examoptima.server.JsonHelper;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Validates examination schedules, converts slot indices into real dates and times,
 * performs slot-aware single/multi-classroom allocation, and verifies all constraints.
 */
public class TimetablePlanner {

    private static final DateTimeFormatter TIME_12H = DateTimeFormatter.ofPattern("hh:mm a", Locale.US);

    public static class PlanningException extends RuntimeException {
        private static final long serialVersionUID = 1L;
        private final int statusCode;

        public PlanningException(int statusCode, String message) {
            super(message);
            this.statusCode = statusCode;
        }

        public int getStatusCode() {
            return statusCode;
        }
    }

    public static List<Integer> resolveSessionDurations(
            List<Integer> rawDurations,
            int fallbackDurationMinutes,
            int maxExamsPerDay
    ) {
        int count = Math.max(1, maxExamsPerDay);
        int fallback = fallbackDurationMinutes;
        List<Integer> resolved = new ArrayList<Integer>();
        for (int i = 0; i < count; i++) {
            int val = (rawDurations != null && i < rawDurations.size() && rawDurations.get(i) != null)
                    ? rawDurations.get(i).intValue()
                    : fallback;
            resolved.add(Integer.valueOf(val));
        }
        return resolved;
    }

    public static List<String> resolveSessionStartTimes(
            List<String> rawStartTimes,
            String dailyStartTime,
            List<Integer> durations,
            int breakDurationMinutes,
            int maxExamsPerDay
    ) {
        int count = Math.max(1, maxExamsPerDay);
        LocalTime fallbackBase = LocalTime.of(9, 0);
        if (dailyStartTime != null && !dailyStartTime.trim().isEmpty()) {
            try {
                fallbackBase = LocalTime.parse(dailyStartTime.trim());
            } catch (DateTimeParseException ignored) {
            }
        }
        int safeBreak = Math.max(0, breakDurationMinutes);
        List<String> resolved = new ArrayList<String>();
        int cursorMin = fallbackBase.getHour() * 60 + fallbackBase.getMinute();

        for (int i = 0; i < count; i++) {
            String candidate = (rawStartTimes != null && i < rawStartTimes.size()) ? rawStartTimes.get(i) : null;
            LocalTime parsed = null;
            if (candidate != null && !candidate.trim().isEmpty()) {
                try {
                    parsed = LocalTime.parse(candidate.trim());
                } catch (DateTimeParseException ignored) {
                }
            }
            int startMin;
            if (parsed != null) {
                startMin = parsed.getHour() * 60 + parsed.getMinute();
            } else {
                startMin = Math.min(23 * 60 + 59, Math.max(0, cursorMin));
            }
            resolved.add(String.format(Locale.US, "%02d:%02d", startMin / 60, startMin % 60));
            int dur = (durations != null && i < durations.size() && durations.get(i) != null)
                    ? durations.get(i).intValue()
                    : 180;
            cursorMin = startMin + dur + safeBreak;
        }
        return resolved;
    }

    public static void validateConfig(
            String startDate,
            String dailyStartTime,
            int examDurationMinutes,
            int breakDurationMinutes,
            int numDays,
            int maxExamsPerDay
    ) {
        validateConfig(startDate, dailyStartTime, examDurationMinutes, breakDurationMinutes, numDays, maxExamsPerDay, null, null);
    }

    public static void validateConfig(
            String startDate,
            String dailyStartTime,
            int examDurationMinutes,
            int breakDurationMinutes,
            int numDays,
            int maxExamsPerDay,
            List<Integer> sessionDurationsMinutes
    ) {
        validateConfig(startDate, dailyStartTime, examDurationMinutes, breakDurationMinutes, numDays, maxExamsPerDay, sessionDurationsMinutes, null);
    }

    public static void validateConfig(
            String startDate,
            String dailyStartTime,
            int examDurationMinutes,
            int breakDurationMinutes,
            int numDays,
            int maxExamsPerDay,
            List<Integer> sessionDurationsMinutes,
            List<String> sessionStartTimes
    ) {
        if (startDate == null || startDate.trim().isEmpty()) {
            throw new PlanningException(400, "Examination starting date is required (YYYY-MM-DD).");
        }
        try {
            LocalDate.parse(startDate.trim());
        } catch (DateTimeParseException e) {
            throw new PlanningException(400, "Invalid starting date format. Expected YYYY-MM-DD.");
        }

        if (dailyStartTime == null || dailyStartTime.trim().isEmpty()) {
            throw new PlanningException(400, "Daily examination starting time is required (HH:MM).");
        }
        try {
            LocalTime.parse(dailyStartTime.trim());
        } catch (DateTimeParseException e) {
            throw new PlanningException(400, "Invalid daily start time format. Expected HH:MM (24-hour).");
        }

        if (breakDurationMinutes < 0 || breakDurationMinutes > 480) {
            throw new PlanningException(400, "Break duration must be between 0 minutes and 8 hours.");
        }
        if (numDays < 1 || numDays > 90) {
            throw new PlanningException(400, "Number of examination days must be between 1 and 90.");
        }
        if (maxExamsPerDay < 1 || maxExamsPerDay > 12) {
            throw new PlanningException(400, "Maximum examinations per day must be between 1 and 12.");
        }

        List<Integer> durations = resolveSessionDurations(sessionDurationsMinutes, examDurationMinutes, maxExamsPerDay);
        for (int i = 0; i < durations.size(); i++) {
            int d = durations.get(i).intValue();
            if (d < 15 || d > 720) {
                throw new PlanningException(
                        400,
                        "Session " + (i + 1) + " exam duration must be between 15 minutes and 12 hours."
                );
            }
        }

        if (sessionStartTimes != null && !sessionStartTimes.isEmpty()) {
            for (int i = 0; i < Math.min(sessionStartTimes.size(), maxExamsPerDay); i++) {
                String raw = sessionStartTimes.get(i);
                if (raw == null || raw.trim().isEmpty()) {
                    throw new PlanningException(400, "Session " + (i + 1) + " start time is required (HH:MM).");
                }
                try {
                    LocalTime.parse(raw.trim());
                } catch (DateTimeParseException e) {
                    throw new PlanningException(400, "Invalid Session " + (i + 1) + " start time format. Expected HH:MM.");
                }
            }
        }

        List<String> resolvedStarts = resolveSessionStartTimes(
                sessionStartTimes,
                dailyStartTime,
                durations,
                breakDurationMinutes,
                maxExamsPerDay
        );

        int prevEndMin = -1;
        for (int i = 0; i < maxExamsPerDay; i++) {
            LocalTime sTime = LocalTime.parse(resolvedStarts.get(i));
            int startMin = sTime.getHour() * 60 + sTime.getMinute();
            int durMin = durations.get(i).intValue();
            int endMin = startMin + durMin;

            if (i > 0 && startMin < prevEndMin) {
                LocalTime prevEndTime = LocalTime.of((prevEndMin / 60) % 24, prevEndMin % 60);
                throw new PlanningException(
                        400,
                        "Session " + (i + 1) + " start time (" + TIME_12H.format(sTime)
                                + ") overlaps Session " + i + " (ends at " + TIME_12H.format(prevEndTime) + ")."
                );
            }
            if (endMin > 24 * 60) {
                throw new PlanningException(
                        400,
                        "Session " + (i + 1) + " schedule extends past midnight. Adjust session start times or durations."
                );
            }
            prevEndMin = endMin;
        }
    }

    public static Map<String, Object> planAndValidate(
            List<Subject> subjects,
            List<Map<String, Object>> classrooms,
            Map<String, Object> config,
            String algorithmKey,
            int maxSlots
    ) {
        if (subjects == null || subjects.isEmpty()) {
            throw new PlanningException(400, "Add at least one subject in Manage Data before generating a timetable.");
        }

        String startDateStr = JsonHelper.getString(config, "startDate", "");
        String dailyStartStr = JsonHelper.getString(config, "dailyStartTime", "");
        int durationMin = JsonHelper.getInt(config, "examDurationMinutes", 180);
        int breakMin = JsonHelper.getInt(config, "breakDurationMinutes", 60);
        int numDays = JsonHelper.getInt(config, "numDays", 5);
        int maxPerDay = JsonHelper.getInt(config, "maxExamsPerDay", 2);
        List<Integer> rawDurations = config != null && config.containsKey("sessionDurationsMinutes")
                ? JsonHelper.getIntList(config, "sessionDurationsMinutes")
                : null;
        List<Integer> sessionDurations = resolveSessionDurations(rawDurations, durationMin, maxPerDay);
        List<String> rawStartTimes = config != null && config.containsKey("sessionStartTimes")
                ? JsonHelper.getStringList(config, "sessionStartTimes")
                : null;
        List<String> resolvedStarts = resolveSessionStartTimes(rawStartTimes, dailyStartStr, sessionDurations, breakMin, maxPerDay);

        validateConfig(startDateStr, dailyStartStr, durationMin, breakMin, numDays, maxPerDay, sessionDurations, resolvedStarts);

        LocalDate baseDate = LocalDate.parse(startDateStr.trim());
        LocalTime[] sessionStarts = new LocalTime[maxPerDay];
        LocalTime[] sessionEnds = new LocalTime[maxPerDay];
        for (int sIdx = 0; sIdx < maxPerDay; sIdx++) {
            LocalTime sStart = LocalTime.parse(resolvedStarts.get(sIdx));
            sessionStarts[sIdx] = sStart;
            sessionEnds[sIdx] = sStart.plusMinutes(sessionDurations.get(sIdx).longValue());
        }

        boolean allowParallelExams = JsonHelper.getBoolean(config, "allowParallelExams", true);
        String normalizedAlgo = "backtracking".equalsIgnoreCase(algorithmKey) ? "backtracking" : "greedy";
        if ("backtracking".equals(normalizedAlgo) && maxSlots < 0) {
            throw new PlanningException(400, "Target slot limit cannot be negative.");
        }

        ConflictGraph graph = new ConflictGraph(subjects);
        ColoringResult coloring;
        if (!allowParallelExams) {
            final Map<String, Integer> degrees = graph.getDegrees();
            List<Subject> sortedByPriority = new ArrayList<Subject>(subjects);
            Collections.sort(sortedByPriority, new Comparator<Subject>() {
                @Override
                public int compare(Subject a, Subject b) {
                    int degA = degrees.containsKey(a.getId()) ? degrees.get(a.getId()) : 0;
                    int degB = degrees.containsKey(b.getId()) ? degrees.get(b.getId()) : 0;
                    if (degB != degA) return Integer.compare(degB, degA);
                    return a.getCode().compareTo(b.getCode());
                }
            });
            Map<String, Integer> seqAssignments = new LinkedHashMap<String, Integer>();
            for (int i = 0; i < sortedByPriority.size(); i++) {
                seqAssignments.put(sortedByPriority.get(i).getId(), Integer.valueOf(i));
            }
            coloring = new ColoringResult(
                    "Sequential Single-Exam Scheduling",
                    seqAssignments,
                    sortedByPriority.size(),
                    50000L,
                    sortedByPriority.size(),
                    true,
                    "Valid sequential timetable generated with 1 exam per time slot."
            );
        } else {
            coloring = "backtracking".equals(normalizedAlgo)
                    ? BacktrackingColoring.solve(graph, maxSlots)
                    : GreedyColoring.solve(graph);
        }

        if (!coloring.isValid() || coloring.getSlotAssignments() == null || coloring.getSlotAssignments().isEmpty()) {
            throw new PlanningException(
                    422,
                    coloring.getStatusMessage() != null && !coloring.getStatusMessage().isEmpty()
                            ? coloring.getStatusMessage()
                            : "Unable to find a conflict-free timetable under the specified slot limit."
            );
        }

        int totalConfiguredSlots = numDays * maxPerDay;
        if (coloring.getNumSlots() > totalConfiguredSlots) {
            throw new PlanningException(
                    422,
                    "Insufficient examination schedule capacity: configuration allows " + totalConfiguredSlots
                            + " slot(s) (" + numDays + " days x " + maxPerDay + " exams/day), but "
                            + coloring.getNumSlots() + " conflict-free slot(s) are required. Increase number of days or maximum exams per day."
            );
        }

        // Filter available classrooms
        List<Map<String, Object>> availableRooms = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> room : classrooms) {
            if (JsonHelper.getBoolean(room, "isAvailable", true) && JsonHelper.getInt(room, "capacity", 0) > 0) {
                availableRooms.add(room);
            }
        }

        boolean anyPositiveStudents = false;
        for (Subject s : subjects) {
            if (s.getStudentCount() > 0) {
                anyPositiveStudents = true;
                break;
            }
        }
        if (anyPositiveStudents && availableRooms.isEmpty()) {
            throw new PlanningException(
                    422,
                    "No available classrooms configured. Add at least one available classroom in Manage Data -> Classrooms."
            );
        }

        // Group subjects by slot
        Map<String, Subject> subjectMap = new LinkedHashMap<String, Subject>();
        for (Subject s : subjects) {
            subjectMap.put(s.getId(), s);
        }

        Map<Integer, List<Subject>> subjectsBySlot = new LinkedHashMap<Integer, List<Subject>>();
        for (Map.Entry<String, Integer> entry : coloring.getSlotAssignments().entrySet()) {
            Subject subj = subjectMap.get(entry.getKey());
            if (subj == null) continue;
            Integer slot = entry.getValue();
            if (!subjectsBySlot.containsKey(slot)) {
                subjectsBySlot.put(slot, new ArrayList<Subject>());
            }
            subjectsBySlot.get(slot).add(subj);
        }

        List<Integer> sortedSlots = new ArrayList<Integer>(subjectsBySlot.keySet());
        Collections.sort(sortedSlots);

        List<Map<String, Object>> scheduledExams = new ArrayList<Map<String, Object>>();

        for (Integer slotObj : sortedSlots) {
            int slotIndex = slotObj.intValue();
            int dayOffset = slotIndex / maxPerDay;
            int sessionOffset = slotIndex % maxPerDay;

            LocalDate examDate = baseDate.plusDays(dayOffset);
            LocalTime slotStart = sessionStarts[sessionOffset];
            LocalTime slotEnd = sessionEnds[sessionOffset];

            String examDateStr = examDate.toString();
            String startTimeStr = slotStart.format(TIME_12H);
            String endTimeStr = slotEnd.format(TIME_12H);

            // Largest classes first inside the same time slot
            List<Subject> slotSubjects = new ArrayList<Subject>(subjectsBySlot.get(slotObj));
            Collections.sort(slotSubjects, new Comparator<Subject>() {
                @Override
                public int compare(Subject a, Subject b) {
                    int cmp = Integer.compare(b.getStudentCount(), a.getStudentCount());
                    return cmp != 0 ? cmp : a.getCode().compareTo(b.getCode());
                }
            });

            // Fresh room pool per time slot so rooms are never double-booked simultaneously,
            // while automatically reused across different slots.
            List<Map<String, Object>> roomPool = new ArrayList<Map<String, Object>>(availableRooms);

            int totalInSlot = slotSubjects.size();
            for (int subIdx = 0; subIdx < totalInSlot; subIdx++) {
                Subject subj = slotSubjects.get(subIdx);
                int needed = Math.max(0, subj.getStudentCount());
                List<Map<String, Object>> allocations = new ArrayList<Map<String, Object>>();

                if (needed > 0) {
                    allocations = allocateRoomsForSubject(
                            subj,
                            needed,
                            roomPool,
                            slotIndex,
                            examDateStr,
                            startTimeStr,
                            endTimeStr
                    );
                }

                boolean isParallel = totalInSlot > 1;
                String slotLabel = "Slot " + (slotIndex + 1);
                String subSlotCode = "";
                if (isParallel) {
                    char letter = (char) ('A' + subIdx);
                    subSlotCode = String.valueOf(letter);
                    slotLabel = "Slot " + (slotIndex + 1) + letter;
                }

                Map<String, Object> examEntry = new LinkedHashMap<String, Object>();
                examEntry.put("id", "exam-" + UUID.randomUUID().toString());
                examEntry.put("subjectId", subj.getId());
                examEntry.put("subjectCode", subj.getCode());
                examEntry.put("subjectName", subj.getName());
                examEntry.put("slotIndex", Integer.valueOf(slotIndex));
                examEntry.put("slotLabel", slotLabel);
                examEntry.put("isParallel", Boolean.valueOf(isParallel));
                examEntry.put("subSlotCode", subSlotCode);
                examEntry.put("totalInSlot", Integer.valueOf(totalInSlot));
                examEntry.put("examDate", examDateStr);
                examEntry.put("startTime", startTimeStr);
                examEntry.put("endTime", endTimeStr);
                examEntry.put("totalStudents", Integer.valueOf(needed));
                examEntry.put("enrolledGroups", subj.getDivisions());
                examEntry.put("classroomAllocations", allocations);
                examEntry.put("classroomsAssignedCount", Integer.valueOf(allocations.size()));
                scheduledExams.add(examEntry);
            }
        }

        // Verify complete schedule invariants before returning
        verifyCompleteSchedule(subjects, scheduledExams, totalConfiguredSlots);

        String timetableId = "tt-" + System.currentTimeMillis();
        Map<String, Object> timetable = new LinkedHashMap<String, Object>();
        timetable.put("id", timetableId);
        timetable.put("algorithmKey", normalizedAlgo);
        timetable.put("algorithmName", coloring.getAlgorithmName());
        timetable.put("numSlots", Integer.valueOf(coloring.getNumSlots()));
        timetable.put("executionTimeMs", Double.valueOf(coloring.getExecutionTimeMs()));
        timetable.put("operationsCount", Long.valueOf(coloring.getOperationsCount()));
        timetable.put("isValid", Boolean.TRUE);
        timetable.put("statusMessage", coloring.getStatusMessage());
        timetable.put("config", config);
        timetable.put("allocationMode", "group_count");
        timetable.put("assignments", coloring.getSlotAssignments());
        timetable.put("scheduledExams", scheduledExams);
        return timetable;
    }

    private static List<Map<String, Object>> allocateRoomsForSubject(
            Subject subj,
            int totalNeeded,
            List<Map<String, Object>> roomPool,
            int slotIndex,
            String examDate,
            String startTime,
            String endTime
    ) {
        int totalRemainingPoolCapacity = 0;
        for (Map<String, Object> r : roomPool) {
            totalRemainingPoolCapacity += JsonHelper.getInt(r, "capacity", 0);
        }

        if (totalRemainingPoolCapacity < totalNeeded) {
            int deficit = totalNeeded - totalRemainingPoolCapacity;
            throw new PlanningException(
                    422,
                    "Insufficient classroom capacity in Slot " + (slotIndex + 1)
                            + " (" + examDate + ", " + startTime + " – " + endTime + ") for "
                            + subj.getCode() + " – " + subj.getName() + ": needs " + totalNeeded
                            + " seats, only " + totalRemainingPoolCapacity + " remaining seats available in this slot. "
                            + deficit + " additional seat(s) required."
            );
        }

        List<Map<String, Object>> chosenAllocations = new ArrayList<Map<String, Object>>();

        // Case 1: Single classroom fits all enrolled students (Best-Fit ascending)
        Collections.sort(roomPool, new Comparator<Map<String, Object>>() {
            @Override
            public int compare(Map<String, Object> a, Map<String, Object> b) {
                int capCmp = Integer.compare(JsonHelper.getInt(a, "capacity", 0), JsonHelper.getInt(b, "capacity", 0));
                return capCmp != 0 ? capCmp : JsonHelper.getString(a, "name", "").compareTo(JsonHelper.getString(b, "name", ""));
            }
        });

        for (int i = 0; i < roomPool.size(); i++) {
            int cap = JsonHelper.getInt(roomPool.get(i), "capacity", 0);
            if (cap >= totalNeeded) {
                Map<String, Object> picked = roomPool.remove(i);
                chosenAllocations.add(buildAllocationRecord(picked, totalNeeded));
                return chosenAllocations;
            }
        }

        // Case 2: Split across multiple classrooms (take largest first, then smallest-fit for remainder)
        int remaining = totalNeeded;
        while (remaining > 0 && !roomPool.isEmpty()) {
            // Check if remainder now fits in a single room (pick smallest fitting room)
            Collections.sort(roomPool, new Comparator<Map<String, Object>>() {
                @Override
                public int compare(Map<String, Object> a, Map<String, Object> b) {
                    int capCmp = Integer.compare(JsonHelper.getInt(a, "capacity", 0), JsonHelper.getInt(b, "capacity", 0));
                    return capCmp != 0 ? capCmp : JsonHelper.getString(a, "name", "").compareTo(JsonHelper.getString(b, "name", ""));
                }
            });

            int bestFitIdx = -1;
            for (int i = 0; i < roomPool.size(); i++) {
                if (JsonHelper.getInt(roomPool.get(i), "capacity", 0) >= remaining) {
                    bestFitIdx = i;
                    break;
                }
            }

            Map<String, Object> picked;
            if (bestFitIdx != -1) {
                picked = roomPool.remove(bestFitIdx);
            } else {
                // Take the largest available room to minimize classroom splits
                picked = roomPool.remove(roomPool.size() - 1);
            }

            int cap = JsonHelper.getInt(picked, "capacity", 0);
            int allocated = Math.min(remaining, cap);
            chosenAllocations.add(buildAllocationRecord(picked, allocated));
            remaining -= allocated;
        }

        return chosenAllocations;
    }

    private static Map<String, Object> buildAllocationRecord(Map<String, Object> room, int allocated) {
        int cap = JsonHelper.getInt(room, "capacity", 0);
        Map<String, Object> alloc = new LinkedHashMap<String, Object>();
        alloc.put("id", "alloc-" + UUID.randomUUID().toString());
        alloc.put("classroomId", JsonHelper.getString(room, "id", ""));
        alloc.put("classroomName", JsonHelper.getString(room, "name", ""));
        alloc.put("building", JsonHelper.getString(room, "building", ""));
        alloc.put("capacity", Integer.valueOf(cap));
        alloc.put("allocatedStudents", Integer.valueOf(allocated));
        alloc.put("remainingSeats", Integer.valueOf(cap - allocated));
        return alloc;
    }

    @SuppressWarnings("unchecked")
    private static void verifyCompleteSchedule(
            List<Subject> subjects,
            List<Map<String, Object>> scheduledExams,
            int totalConfiguredSlots
    ) {
        Map<Integer, Set<String>> groupsUsedPerSlot = new HashMap<Integer, Set<String>>();
        Map<Integer, Set<String>> roomsUsedPerSlot = new HashMap<Integer, Set<String>>();
        Set<String> scheduledSubjectIds = new HashSet<String>();

        for (Map<String, Object> exam : scheduledExams) {
            String sid = JsonHelper.getString(exam, "subjectId", "");
            if (!scheduledSubjectIds.add(sid)) {
                throw new PlanningException(500, "Validation error: duplicate examination entry for subject " + sid);
            }

            int slot = JsonHelper.getInt(exam, "slotIndex", -1);
            if (slot < 0 || slot >= totalConfiguredSlots) {
                throw new PlanningException(422, "Validation error: assigned slot out of configured bounds.");
            }

            Set<String> slotGroups = groupsUsedPerSlot.computeIfAbsent(Integer.valueOf(slot), k -> new HashSet<String>());
            List<String> groups = JsonHelper.getStringList(exam, "enrolledGroups");
            for (String gName : groups) {
                if (!slotGroups.add(gName)) {
                    throw new PlanningException(500, "Conflict violation: student group '" + gName + "' scheduled twice in Slot " + (slot + 1));
                }
            }

            int totalStudents = JsonHelper.getInt(exam, "totalStudents", 0);
            int allocatedSum = 0;
            Set<String> slotRooms = roomsUsedPerSlot.computeIfAbsent(Integer.valueOf(slot), k -> new HashSet<String>());
            List<Map<String, Object>> allocs = (List<Map<String, Object>>) exam.get("classroomAllocations");
            if (allocs != null) {
                for (Map<String, Object> alloc : allocs) {
                    String roomId = JsonHelper.getString(alloc, "classroomId", "");
                    int cap = JsonHelper.getInt(alloc, "capacity", 0);
                    int seated = JsonHelper.getInt(alloc, "allocatedStudents", 0);
                    if (!slotRooms.add(roomId)) {
                        throw new PlanningException(500, "Classroom conflict: room double-booked in Slot " + (slot + 1));
                    }
                    if (seated <= 0 || seated > cap) {
                        throw new PlanningException(500, "Capacity violation in classroom " + JsonHelper.getString(alloc, "classroomName", roomId));
                    }
                    allocatedSum += seated;
                }
            }
            if (allocatedSum != totalStudents) {
                throw new PlanningException(500, "Seat allocation mismatch: allocated " + allocatedSum + " vs " + totalStudents + " enrolled.");
            }
        }

        if (scheduledSubjectIds.size() != subjects.size()) {
            throw new PlanningException(500, "Validation error: not all subjects were scheduled.");
        }
    }
}

