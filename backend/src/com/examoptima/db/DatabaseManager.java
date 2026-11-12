package com.examoptima.db;

import com.examoptima.model.Subject;
import com.examoptima.server.JsonHelper;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Thread-safe SQLite persistence manager powered by the system sqlite3 CLI.
 * Persists subjects, student groups, subject enrolments, classrooms,
 * examination configuration, active generated timetables, and algorithm metrics.
 */
public class DatabaseManager {

    private static final String SQLITE_BIN = resolveSqliteBinary();
    private final Path dbPath;

    public DatabaseManager() {
        Path baseDir = Files.exists(Paths.get("backend"))
                ? Paths.get("backend", "data")
                : Paths.get("data");
        try {
            Files.createDirectories(baseDir);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create database directory: " + e.getMessage(), e);
        }
        this.dbPath = baseDir.resolve("examia.db").toAbsolutePath();
        initializeSchemaAndSeed();
    }

    private static String resolveSqliteBinary() {
        String[] candidates = { "/usr/bin/sqlite3", "/opt/homebrew/bin/sqlite3", "/usr/local/bin/sqlite3", "sqlite3" };
        for (String c : candidates) {
            if ("sqlite3".equals(c) || new File(c).canExecute()) {
                return c;
            }
        }
        return "sqlite3";
    }

    public String getDbPathString() {
        return dbPath.toString();
    }

    public static String sqlStr(String value) {
        if (value == null) {
            return "''";
        }
        return "'" + value.replace("\0", "").replace("'", "''") + "'";
    }

    private synchronized String runSqlite(String sql, boolean jsonMode) {
        List<String> cmd = new ArrayList<String>();
        cmd.add(SQLITE_BIN);
        cmd.add("-batch");
        if (jsonMode) {
            cmd.add("-json");
        }
        cmd.add("-cmd");
        cmd.add(".timeout 5000");
        cmd.add(dbPath.toString());

        ProcessBuilder pb = new ProcessBuilder(cmd);
        try {
            Process proc = pb.start();
            OutputStream os = proc.getOutputStream();
            os.write(sql.getBytes(StandardCharsets.UTF_8));
            os.close();

            String stdout = readStream(proc.getInputStream());
            String stderr = readStream(proc.getErrorStream());
            int exit = proc.waitFor();
            if (exit != 0) {
                throw new RuntimeException("SQLite error (" + exit + "): " + stderr.trim());
            }
            return stdout == null ? "" : stdout.trim();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("SQLite execution interrupted", e);
        } catch (IOException e) {
            throw new RuntimeException("Failed to invoke sqlite3: " + e.getMessage(), e);
        }
    }

    private static String readStream(InputStream is) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = is.read(buf)) != -1) {
            baos.write(buf, 0, n);
        }
        return new String(baos.toByteArray(), StandardCharsets.UTF_8);
    }

    private List<Map<String, Object>> queryRows(String selectSql) {
        String fullSql = "PRAGMA foreign_keys = ON;\n" + selectSql;
        String out = runSqlite(fullSql, true);
        if (out.isEmpty()) {
            return new ArrayList<Map<String, Object>>();
        }
        return JsonHelper.parseObjectList(out);
    }

    private void executeTransaction(String statementsSql) {
        String fullSql = "PRAGMA foreign_keys = ON;\n"
                + "BEGIN IMMEDIATE;\n"
                + statementsSql + "\n"
                + "COMMIT;\n";
        runSqlite(fullSql, false);
    }

    private synchronized void initializeSchemaAndSeed() {
        runSqlite("PRAGMA journal_mode = WAL;", false);
        String schemaSql = ""
                + "CREATE TABLE IF NOT EXISTS schema_meta ("
                + "  key TEXT PRIMARY KEY,"
                + "  value TEXT NOT NULL"
                + ");\n"
                + "CREATE TABLE IF NOT EXISTS subjects ("
                + "  id TEXT PRIMARY KEY,"
                + "  code TEXT NOT NULL UNIQUE,"
                + "  name TEXT NOT NULL,"
                + "  category TEXT NOT NULL DEFAULT 'General',"
                + "  created_at TEXT DEFAULT CURRENT_TIMESTAMP"
                + ");\n"
                + "CREATE TABLE IF NOT EXISTS student_groups ("
                + "  id TEXT PRIMARY KEY,"
                + "  name TEXT NOT NULL UNIQUE,"
                + "  student_count INTEGER NOT NULL CHECK(student_count > 0),"
                + "  department TEXT NOT NULL DEFAULT '',"
                + "  semester TEXT NOT NULL DEFAULT '',"
                + "  created_at TEXT DEFAULT CURRENT_TIMESTAMP"
                + ");\n"
                + "CREATE TABLE IF NOT EXISTS subject_enrolments ("
                + "  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,"
                + "  group_id TEXT NOT NULL REFERENCES student_groups(id) ON DELETE CASCADE,"
                + "  PRIMARY KEY (subject_id, group_id)"
                + ");\n"
                + "CREATE TABLE IF NOT EXISTS classrooms ("
                + "  id TEXT PRIMARY KEY,"
                + "  name TEXT NOT NULL UNIQUE,"
                + "  building TEXT NOT NULL DEFAULT '',"
                + "  capacity INTEGER NOT NULL CHECK(capacity > 0),"
                + "  is_available INTEGER NOT NULL DEFAULT 1 CHECK(is_available IN (0, 1)),"
                + "  created_at TEXT DEFAULT CURRENT_TIMESTAMP"
                + ");\n"
                + "CREATE TABLE IF NOT EXISTS exam_configurations ("
                + "  id INTEGER PRIMARY KEY CHECK(id = 1),"
                + "  start_date TEXT NOT NULL,"
                + "  daily_start_time TEXT NOT NULL,"
                + "  exam_duration_minutes INTEGER NOT NULL CHECK(exam_duration_minutes > 0),"
                + "  break_duration_minutes INTEGER NOT NULL CHECK(break_duration_minutes >= 0),"
                + "  num_days INTEGER NOT NULL CHECK(num_days > 0),"
                + "  max_exams_per_day INTEGER NOT NULL CHECK(max_exams_per_day > 0),"
                + "  updated_at TEXT DEFAULT CURRENT_TIMESTAMP"
                + ");\n"
                + "CREATE TABLE IF NOT EXISTS generated_timetables ("
                + "  id TEXT PRIMARY KEY,"
                + "  algorithm_key TEXT NOT NULL,"
                + "  algorithm_name TEXT NOT NULL,"
                + "  num_slots INTEGER NOT NULL,"
                + "  execution_time_ms REAL NOT NULL,"
                + "  operations_count INTEGER NOT NULL DEFAULT 0,"
                + "  is_valid INTEGER NOT NULL CHECK(is_valid IN (0, 1)),"
                + "  status_message TEXT NOT NULL,"
                + "  config_json TEXT NOT NULL,"
                + "  allocation_mode TEXT NOT NULL DEFAULT 'group_count',"
                + "  created_at TEXT DEFAULT CURRENT_TIMESTAMP"
                + ");\n"
                + "CREATE TABLE IF NOT EXISTS scheduled_exams ("
                + "  id TEXT PRIMARY KEY,"
                + "  timetable_id TEXT NOT NULL REFERENCES generated_timetables(id) ON DELETE CASCADE,"
                + "  subject_id TEXT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,"
                + "  subject_code TEXT NOT NULL,"
                + "  subject_name TEXT NOT NULL,"
                + "  slot_index INTEGER NOT NULL,"
                + "  exam_date TEXT NOT NULL,"
                + "  start_time TEXT NOT NULL,"
                + "  end_time TEXT NOT NULL,"
                + "  total_students INTEGER NOT NULL,"
                + "  enrolled_groups_json TEXT NOT NULL"
                + ");\n"
                + "CREATE TABLE IF NOT EXISTS classroom_allocations ("
                + "  id TEXT PRIMARY KEY,"
                + "  timetable_id TEXT NOT NULL REFERENCES generated_timetables(id) ON DELETE CASCADE,"
                + "  scheduled_exam_id TEXT NOT NULL REFERENCES scheduled_exams(id) ON DELETE CASCADE,"
                + "  subject_id TEXT NOT NULL,"
                + "  slot_index INTEGER NOT NULL,"
                + "  classroom_id TEXT NOT NULL REFERENCES classrooms(id) ON DELETE RESTRICT,"
                + "  classroom_name TEXT NOT NULL,"
                + "  building TEXT NOT NULL DEFAULT '',"
                + "  classroom_capacity INTEGER NOT NULL,"
                + "  allocated_students INTEGER NOT NULL,"
                + "  remaining_seats INTEGER NOT NULL"
                + ");\n"
                + "CREATE TABLE IF NOT EXISTS algorithm_runs ("
                + "  algorithm_key TEXT PRIMARY KEY,"
                + "  algorithm_name TEXT NOT NULL,"
                + "  num_slots INTEGER NOT NULL,"
                + "  execution_time_ms REAL NOT NULL,"
                + "  operations_count INTEGER NOT NULL DEFAULT 0,"
                + "  is_valid INTEGER NOT NULL CHECK(is_valid IN (0, 1)),"
                + "  status_message TEXT NOT NULL,"
                + "  created_at TEXT DEFAULT CURRENT_TIMESTAMP"
                + ");";

        executeTransaction(schemaSql);

        List<Map<String, Object>> seededCheck = queryRows("SELECT value FROM schema_meta WHERE key = 'seeded';");
        if (seededCheck.isEmpty()) {
            seedInitialDataset();
        }
    }

    public synchronized void seedInitialDataset() {
        StringBuilder sb = new StringBuilder();
        sb.append("DELETE FROM classroom_allocations;\n");
        sb.append("DELETE FROM scheduled_exams;\n");
        sb.append("DELETE FROM generated_timetables;\n");
        sb.append("DELETE FROM algorithm_runs;\n");
        sb.append("DELETE FROM subject_enrolments;\n");
        sb.append("DELETE FROM subjects;\n");
        sb.append("DELETE FROM student_groups;\n");
        sb.append("DELETE FROM classrooms;\n");
        sb.append("DELETE FROM exam_configurations;\n");

        // Student groups
        sb.append("INSERT INTO student_groups(id, name, student_count, department, semester) VALUES ('div-a', 'Division A', 45, 'Computer Engineering', 'Semester IV');\n");
        sb.append("INSERT INTO student_groups(id, name, student_count, department, semester) VALUES ('div-b', 'Division B', 45, 'Computer Engineering', 'Semester IV');\n");
        sb.append("INSERT INTO student_groups(id, name, student_count, department, semester) VALUES ('div-c', 'Division C', 40, 'Information Technology', 'Semester IV');\n");

        // Subjects
        sb.append("INSERT INTO subjects(id, code, name, category) VALUES ('sub-1', 'CS201', 'Java Programming', 'Core Computer Science');\n");
        sb.append("INSERT INTO subjects(id, code, name, category) VALUES ('sub-2', 'CS202', 'Data Structures', 'Core Computer Science');\n");
        sb.append("INSERT INTO subjects(id, code, name, category) VALUES ('sub-3', 'CS203', 'DBMS', 'Information Systems');\n");
        sb.append("INSERT INTO subjects(id, code, name, category) VALUES ('sub-4', 'CS204', 'Operating Systems', 'Systems & Infrastructure');\n");
        sb.append("INSERT INTO subjects(id, code, name, category) VALUES ('sub-5', 'MA201', 'Mathematics', 'Applied Mathematics');\n");

        // Distinct group enrolments per subject
        sb.append("INSERT INTO subject_enrolments(subject_id, group_id) VALUES ('sub-1', 'div-a'), ('sub-1', 'div-b');\n");
        sb.append("INSERT INTO subject_enrolments(subject_id, group_id) VALUES ('sub-2', 'div-a');\n");
        sb.append("INSERT INTO subject_enrolments(subject_id, group_id) VALUES ('sub-3', 'div-b'), ('sub-3', 'div-c');\n");
        sb.append("INSERT INTO subject_enrolments(subject_id, group_id) VALUES ('sub-4', 'div-a'), ('sub-4', 'div-c');\n");
        sb.append("INSERT INTO subject_enrolments(subject_id, group_id) VALUES ('sub-5', 'div-a'), ('sub-5', 'div-b'), ('sub-5', 'div-c');\n");

        // Classrooms
        sb.append("INSERT INTO classrooms(id, name, building, capacity, is_available) VALUES ('room-101', 'A101', 'Main Block', 60, 1);\n");
        sb.append("INSERT INTO classrooms(id, name, building, capacity, is_available) VALUES ('room-102', 'A102', 'Main Block', 40, 1);\n");
        sb.append("INSERT INTO classrooms(id, name, building, capacity, is_available) VALUES ('room-103', 'Auditorium 103', 'Academic Wing', 100, 1);\n");
        sb.append("INSERT INTO classrooms(id, name, building, capacity, is_available) VALUES ('room-104', 'Hall 104', 'Academic Wing', 80, 1);\n");
        sb.append("INSERT INTO classrooms(id, name, building, capacity, is_available) VALUES ('room-105', 'Mega Hall 201', 'Examination Complex', 150, 1);\n");

        // Default exam configuration
        sb.append("INSERT INTO exam_configurations(id, start_date, daily_start_time, exam_duration_minutes, break_duration_minutes, num_days, max_exams_per_day) "
                + "VALUES (1, '2026-11-20', '09:00', 180, 60, 5, 2);\n");

        sb.append("INSERT OR REPLACE INTO schema_meta(key, value) VALUES ('seeded', '1');\n");
        executeTransaction(sb.toString());
    }

    public synchronized Map<String, Object> getBootstrapState() {
        Map<String, Object> state = new LinkedHashMap<String, Object>();
        state.put("subjects", listSubjectsWithEnrolments());
        state.put("studentGroups", listStudentGroups());
        state.put("classrooms", listClassrooms());
        state.put("config", getConfig());
        state.put("latestTimetable", getLatestTimetable());
        state.put("algoRuns", getAlgorithmRuns());
        state.put("allocationMode", "group_count");
        return state;
    }

    public synchronized List<Map<String, Object>> listSubjectsWithEnrolments() {
        List<Map<String, Object>> subjRows = queryRows(
                "SELECT id, code, name, category FROM subjects ORDER BY code ASC;"
        );
        List<Map<String, Object>> enrolRows = queryRows(
                "SELECT se.subject_id, sg.id AS group_id, sg.name AS group_name, sg.student_count "
                        + "FROM subject_enrolments se "
                        + "JOIN student_groups sg ON sg.id = se.group_id "
                        + "ORDER BY sg.name ASC;"
        );

        Map<String, List<Map<String, Object>>> enrolBySubj = new LinkedHashMap<String, List<Map<String, Object>>>();
        for (Map<String, Object> row : enrolRows) {
            String sid = JsonHelper.getString(row, "subject_id", "");
            if (!enrolBySubj.containsKey(sid)) {
                enrolBySubj.put(sid, new ArrayList<Map<String, Object>>());
            }
            enrolBySubj.get(sid).add(row);
        }

        List<Map<String, Object>> out = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> s : subjRows) {
            String sid = JsonHelper.getString(s, "id", "");
            List<Map<String, Object>> attached = enrolBySubj.getOrDefault(sid, new ArrayList<Map<String, Object>>());
            List<String> groupIds = new ArrayList<String>();
            List<String> groupNames = new ArrayList<String>();
            int totalStudents = 0;
            for (Map<String, Object> g : attached) {
                groupIds.add(JsonHelper.getString(g, "group_id", ""));
                groupNames.add(JsonHelper.getString(g, "group_name", ""));
                totalStudents += JsonHelper.getInt(g, "student_count", 0);
            }

            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("id", sid);
            item.put("code", JsonHelper.getString(s, "code", ""));
            item.put("name", JsonHelper.getString(s, "name", ""));
            item.put("category", JsonHelper.getString(s, "category", "General"));
            item.put("groupIds", groupIds);
            item.put("divisions", groupNames);
            item.put("studentCount", Integer.valueOf(totalStudents));
            item.put("allocationBasis", "group_count");
            out.add(item);
        }
        return out;
    }

    public synchronized List<Subject> getSubjectsAsModels() {
        List<Map<String, Object>> rows = listSubjectsWithEnrolments();
        List<Subject> models = new ArrayList<Subject>();
        for (Map<String, Object> r : rows) {
            models.add(new Subject(
                    JsonHelper.getString(r, "id", ""),
                    JsonHelper.getString(r, "code", ""),
                    JsonHelper.getString(r, "name", ""),
                    JsonHelper.getStringList(r, "divisions"),
                    JsonHelper.getInt(r, "studentCount", 0),
                    JsonHelper.getString(r, "category", "General")
            ));
        }
        return models;
    }

    public synchronized List<Map<String, Object>> listStudentGroups() {
        List<Map<String, Object>> rows = queryRows(
                "SELECT sg.id, sg.name, sg.student_count, sg.department, sg.semester, "
                        + "COUNT(se.subject_id) AS subject_count "
                        + "FROM student_groups sg "
                        + "LEFT JOIN subject_enrolments se ON se.group_id = sg.id "
                        + "GROUP BY sg.id "
                        + "ORDER BY sg.name ASC;"
        );
        List<Map<String, Object>> out = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> r : rows) {
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("id", JsonHelper.getString(r, "id", ""));
            item.put("name", JsonHelper.getString(r, "name", ""));
            item.put("studentCount", Integer.valueOf(JsonHelper.getInt(r, "student_count", 0)));
            item.put("department", JsonHelper.getString(r, "department", ""));
            item.put("semester", JsonHelper.getString(r, "semester", ""));
            item.put("subjectCount", Integer.valueOf(JsonHelper.getInt(r, "subject_count", 0)));
            out.add(item);
        }
        return out;
    }

    public synchronized List<Map<String, Object>> listClassrooms() {
        List<Map<String, Object>> rows = queryRows(
                "SELECT id, name, building, capacity, is_available FROM classrooms ORDER BY name ASC;"
        );
        List<Map<String, Object>> allocatedRows = queryRows(
                "SELECT classroom_id, COUNT(*) AS usage_count FROM classroom_allocations GROUP BY classroom_id;"
        );
        Map<String, Integer> usageMap = new LinkedHashMap<String, Integer>();
        for (Map<String, Object> row : allocatedRows) {
            usageMap.put(JsonHelper.getString(row, "classroom_id", ""),
                    Integer.valueOf(JsonHelper.getInt(row, "usage_count", 0)));
        }

        List<Map<String, Object>> out = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> r : rows) {
            String cid = JsonHelper.getString(r, "id", "");
            int usage = usageMap.getOrDefault(cid, Integer.valueOf(0)).intValue();
            Map<String, Object> item = new LinkedHashMap<String, Object>();
            item.put("id", cid);
            item.put("name", JsonHelper.getString(r, "name", ""));
            item.put("building", JsonHelper.getString(r, "building", ""));
            item.put("capacity", Integer.valueOf(JsonHelper.getInt(r, "capacity", 0)));
            item.put("isAvailable", Boolean.valueOf(JsonHelper.getInt(r, "is_available", 1) == 1));
            item.put("scheduledAssignmentsCount", Integer.valueOf(usage));
            out.add(item);
        }
        return out;
    }

    public synchronized Map<String, Object> getConfig() {
        List<Map<String, Object>> rows = queryRows(
                "SELECT start_date, daily_start_time, exam_duration_minutes, break_duration_minutes, num_days, max_exams_per_day "
                        + "FROM exam_configurations WHERE id = 1;"
        );
        Map<String, Object> cfg = new LinkedHashMap<String, Object>();
        if (rows.isEmpty()) {
            cfg.put("startDate", "2026-11-20");
            cfg.put("dailyStartTime", "09:00");
            cfg.put("examDurationMinutes", Integer.valueOf(180));
            cfg.put("breakDurationMinutes", Integer.valueOf(60));
            cfg.put("numDays", Integer.valueOf(5));
            cfg.put("maxExamsPerDay", Integer.valueOf(2));
        } else {
            Map<String, Object> r = rows.get(0);
            cfg.put("startDate", JsonHelper.getString(r, "start_date", "2026-11-20"));
            cfg.put("dailyStartTime", JsonHelper.getString(r, "daily_start_time", "09:00"));
            cfg.put("examDurationMinutes", Integer.valueOf(JsonHelper.getInt(r, "exam_duration_minutes", 180)));
            cfg.put("breakDurationMinutes", Integer.valueOf(JsonHelper.getInt(r, "break_duration_minutes", 60)));
            cfg.put("numDays", Integer.valueOf(JsonHelper.getInt(r, "num_days", 5)));
            cfg.put("maxExamsPerDay", Integer.valueOf(JsonHelper.getInt(r, "max_exams_per_day", 2)));
        }
        return cfg;
    }

    public synchronized void saveConfig(String startDate, String dailyStartTime, int examDurationMinutes,
            int breakDurationMinutes, int numDays, int maxExamsPerDay) {
        String sql = "INSERT INTO exam_configurations(id, start_date, daily_start_time, exam_duration_minutes, break_duration_minutes, num_days, max_exams_per_day, updated_at) "
                + "VALUES (1, " + sqlStr(startDate) + ", " + sqlStr(dailyStartTime) + ", "
                + examDurationMinutes + ", " + breakDurationMinutes + ", " + numDays + ", " + maxExamsPerDay + ", CURRENT_TIMESTAMP) "
                + "ON CONFLICT(id) DO UPDATE SET "
                + "start_date = excluded.start_date, "
                + "daily_start_time = excluded.daily_start_time, "
                + "exam_duration_minutes = excluded.exam_duration_minutes, "
                + "break_duration_minutes = excluded.break_duration_minutes, "
                + "num_days = excluded.num_days, "
                + "max_exams_per_day = excluded.max_exams_per_day, "
                + "updated_at = CURRENT_TIMESTAMP;";
        executeTransaction(sql);
    }

    public synchronized Map<String, Object> createSubject(String id, String code, String name, String category, List<String> groupIds) {
        List<Map<String, Object>> dup = queryRows("SELECT id FROM subjects WHERE LOWER(code) = LOWER(" + sqlStr(code) + ");");
        if (!dup.isEmpty()) {
            throw new IllegalArgumentException("A subject with code '" + code + "' already exists.");
        }
        StringBuilder sb = new StringBuilder();
        sb.append("INSERT INTO subjects(id, code, name, category) VALUES (")
                .append(sqlStr(id)).append(", ")
                .append(sqlStr(code)).append(", ")
                .append(sqlStr(name)).append(", ")
                .append(sqlStr(category)).append(");\n");
        appendEnrolmentsForSubjectSql(sb, id, groupIds);
        sb.append("DELETE FROM algorithm_runs;\n");
        executeTransaction(sb.toString());
        return findSubjectById(id);
    }

    public synchronized Map<String, Object> updateSubject(String id, String code, String name, String category, List<String> groupIds) {
        List<Map<String, Object>> existing = queryRows("SELECT id FROM subjects WHERE id = " + sqlStr(id) + ";");
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Subject not found.");
        }
        List<Map<String, Object>> dup = queryRows(
                "SELECT id FROM subjects WHERE LOWER(code) = LOWER(" + sqlStr(code) + ") AND id != " + sqlStr(id) + ";"
        );
        if (!dup.isEmpty()) {
            throw new IllegalArgumentException("Another subject with code '" + code + "' already exists.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("UPDATE subjects SET code = ").append(sqlStr(code))
                .append(", name = ").append(sqlStr(name))
                .append(", category = ").append(sqlStr(category))
                .append(" WHERE id = ").append(sqlStr(id)).append(";\n");
        if (groupIds != null) {
            sb.append("DELETE FROM subject_enrolments WHERE subject_id = ").append(sqlStr(id)).append(";\n");
            appendEnrolmentsForSubjectSql(sb, id, groupIds);
        }
        sb.append("DELETE FROM algorithm_runs;\n");
        sb.append("DELETE FROM generated_timetables;\n");
        executeTransaction(sb.toString());
        return findSubjectById(id);
    }

    public synchronized void deleteSubject(String id) {
        List<Map<String, Object>> existing = queryRows("SELECT id FROM subjects WHERE id = " + sqlStr(id) + ";");
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Subject not found.");
        }
        StringBuilder sb = new StringBuilder();
        sb.append("DELETE FROM subjects WHERE id = ").append(sqlStr(id)).append(";\n");
        sb.append("DELETE FROM algorithm_runs;\n");
        sb.append("DELETE FROM generated_timetables;\n");
        executeTransaction(sb.toString());
    }

    private void appendEnrolmentsForSubjectSql(StringBuilder sb, String subjectId, List<String> groupIds) {
        if (groupIds == null || groupIds.isEmpty()) {
            return;
        }
        Set<String> distinctIds = new LinkedHashSet<String>();
        for (String gid : groupIds) {
            if (gid != null && !gid.trim().isEmpty()) {
                distinctIds.add(gid.trim());
            }
        }
        for (String gid : distinctIds) {
            sb.append("INSERT OR IGNORE INTO subject_enrolments(subject_id, group_id) ")
                    .append("SELECT ").append(sqlStr(subjectId)).append(", id FROM student_groups WHERE id = ").append(sqlStr(gid)).append(";\n");
        }
    }

    public synchronized Map<String, Object> findSubjectById(String id) {
        for (Map<String, Object> s : listSubjectsWithEnrolments()) {
            if (id.equals(JsonHelper.getString(s, "id", ""))) {
                return s;
            }
        }
        return null;
    }

    public synchronized Map<String, Object> createStudentGroup(String id, String name, int studentCount, String department, String semester) {
        List<Map<String, Object>> dup = queryRows("SELECT id FROM student_groups WHERE LOWER(name) = LOWER(" + sqlStr(name) + ");");
        if (!dup.isEmpty()) {
            throw new IllegalArgumentException("Student group '" + name + "' already exists.");
        }
        String sql = "INSERT INTO student_groups(id, name, student_count, department, semester) VALUES ("
                + sqlStr(id) + ", " + sqlStr(name) + ", " + studentCount + ", "
                + sqlStr(department) + ", " + sqlStr(semester) + ");";
        executeTransaction(sql);
        return findStudentGroupById(id);
    }

    public synchronized Map<String, Object> updateStudentGroup(String id, String name, int studentCount, String department, String semester) {
        List<Map<String, Object>> existing = queryRows("SELECT id FROM student_groups WHERE id = " + sqlStr(id) + ";");
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Student group not found.");
        }
        List<Map<String, Object>> dup = queryRows(
                "SELECT id FROM student_groups WHERE LOWER(name) = LOWER(" + sqlStr(name) + ") AND id != " + sqlStr(id) + ";"
        );
        if (!dup.isEmpty()) {
            throw new IllegalArgumentException("Another student group named '" + name + "' already exists.");
        }
        String sql = "UPDATE student_groups SET name = " + sqlStr(name)
                + ", student_count = " + studentCount
                + ", department = " + sqlStr(department)
                + ", semester = " + sqlStr(semester)
                + " WHERE id = " + sqlStr(id) + ";\n"
                + "DELETE FROM algorithm_runs;\n"
                + "DELETE FROM generated_timetables;\n";
        executeTransaction(sql);
        return findStudentGroupById(id);
    }

    public synchronized void deleteStudentGroup(String id) {
        List<Map<String, Object>> existing = queryRows("SELECT id FROM student_groups WHERE id = " + sqlStr(id) + ";");
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Student group not found.");
        }
        String sql = "DELETE FROM student_groups WHERE id = " + sqlStr(id) + ";\n"
                + "DELETE FROM algorithm_runs;\n"
                + "DELETE FROM generated_timetables;\n";
        executeTransaction(sql);
    }

    public synchronized Map<String, Object> findStudentGroupById(String id) {
        for (Map<String, Object> g : listStudentGroups()) {
            if (id.equals(JsonHelper.getString(g, "id", ""))) {
                return g;
            }
        }
        return null;
    }

    public synchronized void setEnrolmentsForSubject(String subjectId, List<String> groupIds) {
        List<Map<String, Object>> existing = queryRows("SELECT id FROM subjects WHERE id = " + sqlStr(subjectId) + ";");
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Subject not found.");
        }
        StringBuilder sb = new StringBuilder();
        sb.append("DELETE FROM subject_enrolments WHERE subject_id = ").append(sqlStr(subjectId)).append(";\n");
        appendEnrolmentsForSubjectSql(sb, subjectId, groupIds);
        sb.append("DELETE FROM algorithm_runs;\n");
        sb.append("DELETE FROM generated_timetables;\n");
        executeTransaction(sb.toString());
    }

    public synchronized void setEnrolmentsForGroup(String groupId, List<String> subjectIds) {
        List<Map<String, Object>> existing = queryRows("SELECT id FROM student_groups WHERE id = " + sqlStr(groupId) + ";");
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Student group not found.");
        }
        StringBuilder sb = new StringBuilder();
        sb.append("DELETE FROM subject_enrolments WHERE group_id = ").append(sqlStr(groupId)).append(";\n");
        if (subjectIds != null) {
            Set<String> distinct = new LinkedHashSet<String>();
            for (String sid : subjectIds) {
                if (sid != null && !sid.trim().isEmpty()) {
                    distinct.add(sid.trim());
                }
            }
            for (String sid : distinct) {
                sb.append("INSERT OR IGNORE INTO subject_enrolments(subject_id, group_id) ")
                        .append("SELECT id, ").append(sqlStr(groupId)).append(" FROM subjects WHERE id = ").append(sqlStr(sid)).append(";\n");
            }
        }
        sb.append("DELETE FROM algorithm_runs;\n");
        sb.append("DELETE FROM generated_timetables;\n");
        executeTransaction(sb.toString());
    }

    public synchronized Map<String, Object> createClassroom(String id, String name, String building, int capacity, boolean isAvailable) {
        List<Map<String, Object>> dup = queryRows("SELECT id FROM classrooms WHERE LOWER(name) = LOWER(" + sqlStr(name) + ");");
        if (!dup.isEmpty()) {
            throw new IllegalArgumentException("Classroom '" + name + "' already exists.");
        }
        String sql = "INSERT INTO classrooms(id, name, building, capacity, is_available) VALUES ("
                + sqlStr(id) + ", " + sqlStr(name) + ", " + sqlStr(building) + ", "
                + capacity + ", " + (isAvailable ? 1 : 0) + ");";
        executeTransaction(sql);
        return findClassroomById(id);
    }

    public synchronized Map<String, Object> updateClassroom(String id, String name, String building, int capacity, boolean isAvailable) {
        List<Map<String, Object>> existing = queryRows("SELECT id FROM classrooms WHERE id = " + sqlStr(id) + ";");
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Classroom not found.");
        }
        List<Map<String, Object>> dup = queryRows(
                "SELECT id FROM classrooms WHERE LOWER(name) = LOWER(" + sqlStr(name) + ") AND id != " + sqlStr(id) + ";"
        );
        if (!dup.isEmpty()) {
            throw new IllegalArgumentException("Another classroom named '" + name + "' already exists.");
        }
        String sql = "UPDATE classrooms SET name = " + sqlStr(name)
                + ", building = " + sqlStr(building)
                + ", capacity = " + capacity
                + ", is_available = " + (isAvailable ? 1 : 0)
                + " WHERE id = " + sqlStr(id) + ";\n"
                + "DELETE FROM generated_timetables;\n";
        executeTransaction(sql);
        return findClassroomById(id);
    }

    public synchronized List<Map<String, Object>> findClassroomUsages(String classroomId) {
        return queryRows(
                "SELECT se.subject_code, se.subject_name, se.exam_date, se.start_time "
                        + "FROM classroom_allocations ca "
                        + "JOIN scheduled_exams se ON se.id = ca.scheduled_exam_id "
                        + "WHERE ca.classroom_id = " + sqlStr(classroomId) + " "
                        + "ORDER BY se.slot_index ASC, se.subject_code ASC;"
        );
    }

    public synchronized void deleteClassroom(String id, boolean clearAssignedSchedule) {
        List<Map<String, Object>> existing = queryRows("SELECT id, name FROM classrooms WHERE id = " + sqlStr(id) + ";");
        if (existing.isEmpty()) {
            throw new IllegalArgumentException("Classroom not found.");
        }
        String roomName = JsonHelper.getString(existing.get(0), "name", id);
        List<Map<String, Object>> usages = findClassroomUsages(id);
        if (!usages.isEmpty() && !clearAssignedSchedule) {
            List<String> codes = new ArrayList<String>();
            for (Map<String, Object> u : usages) {
                codes.add(JsonHelper.getString(u, "subject_code", ""));
            }
            throw new ClassroomInUseException(
                    "Classroom '" + roomName + "' is currently assigned to scheduled exam(s): "
                            + String.join(", ", codes)
                            + ". Unassign by clearing or regenerating the timetable before deleting it.",
                    usages
            );
        }

        StringBuilder sb = new StringBuilder();
        if (clearAssignedSchedule) {
            sb.append("DELETE FROM generated_timetables;\n");
        }
        sb.append("DELETE FROM classrooms WHERE id = ").append(sqlStr(id)).append(";\n");
        executeTransaction(sb.toString());
    }

    public synchronized Map<String, Object> findClassroomById(String id) {
        for (Map<String, Object> c : listClassrooms()) {
            if (id.equals(JsonHelper.getString(c, "id", ""))) {
                return c;
            }
        }
        return null;
    }

    public synchronized void clearGeneratedTimetable() {
        executeTransaction("DELETE FROM generated_timetables;");
    }

    public synchronized void saveGeneratedTimetable(
            String timetableId,
            String algorithmKey,
            String algorithmName,
            int numSlots,
            double executionTimeMs,
            long operationsCount,
            boolean isValid,
            String statusMessage,
            Map<String, Object> config,
            List<Map<String, Object>> scheduledExams
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("DELETE FROM generated_timetables;\n");
        sb.append("INSERT INTO generated_timetables(id, algorithm_key, algorithm_name, num_slots, execution_time_ms, operations_count, is_valid, status_message, config_json, allocation_mode) VALUES (")
                .append(sqlStr(timetableId)).append(", ")
                .append(sqlStr(algorithmKey)).append(", ")
                .append(sqlStr(algorithmName)).append(", ")
                .append(numSlots).append(", ")
                .append(executionTimeMs).append(", ")
                .append(operationsCount).append(", ")
                .append(isValid ? 1 : 0).append(", ")
                .append(sqlStr(statusMessage)).append(", ")
                .append(sqlStr(JsonHelper.toJson(config))).append(", ")
                .append("'group_count');\n");

        for (Map<String, Object> exam : scheduledExams) {
            String examId = JsonHelper.getString(exam, "id", "");
            String subjectId = JsonHelper.getString(exam, "subjectId", "");
            String subjectCode = JsonHelper.getString(exam, "subjectCode", "");
            String subjectName = JsonHelper.getString(exam, "subjectName", "");
            int slotIndex = JsonHelper.getInt(exam, "slotIndex", 0);
            String examDate = JsonHelper.getString(exam, "examDate", "");
            String startTime = JsonHelper.getString(exam, "startTime", "");
            String endTime = JsonHelper.getString(exam, "endTime", "");
            int totalStudents = JsonHelper.getInt(exam, "totalStudents", 0);
            String groupsJson = JsonHelper.toJson(exam.get("enrolledGroups"));

            sb.append("INSERT INTO scheduled_exams(id, timetable_id, subject_id, subject_code, subject_name, slot_index, exam_date, start_time, end_time, total_students, enrolled_groups_json) VALUES (")
                    .append(sqlStr(examId)).append(", ")
                    .append(sqlStr(timetableId)).append(", ")
                    .append(sqlStr(subjectId)).append(", ")
                    .append(sqlStr(subjectCode)).append(", ")
                    .append(sqlStr(subjectName)).append(", ")
                    .append(slotIndex).append(", ")
                    .append(sqlStr(examDate)).append(", ")
                    .append(sqlStr(startTime)).append(", ")
                    .append(sqlStr(endTime)).append(", ")
                    .append(totalStudents).append(", ")
                    .append(sqlStr(groupsJson)).append(");\n");

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> allocations = (List<Map<String, Object>>) exam.get("classroomAllocations");
            if (allocations != null) {
                for (Map<String, Object> alloc : allocations) {
                    sb.append("INSERT INTO classroom_allocations(id, timetable_id, scheduled_exam_id, subject_id, slot_index, classroom_id, classroom_name, building, classroom_capacity, allocated_students, remaining_seats) VALUES (")
                            .append(sqlStr(JsonHelper.getString(alloc, "id", ""))).append(", ")
                            .append(sqlStr(timetableId)).append(", ")
                            .append(sqlStr(examId)).append(", ")
                            .append(sqlStr(subjectId)).append(", ")
                            .append(slotIndex).append(", ")
                            .append(sqlStr(JsonHelper.getString(alloc, "classroomId", ""))).append(", ")
                            .append(sqlStr(JsonHelper.getString(alloc, "classroomName", ""))).append(", ")
                            .append(sqlStr(JsonHelper.getString(alloc, "building", ""))).append(", ")
                            .append(JsonHelper.getInt(alloc, "capacity", 0)).append(", ")
                            .append(JsonHelper.getInt(alloc, "allocatedStudents", 0)).append(", ")
                            .append(JsonHelper.getInt(alloc, "remainingSeats", 0)).append(");\n");
                }
            }
        }

        // Also record algorithm run metrics for comparison if both algorithms are executed
        sb.append("INSERT INTO algorithm_runs(algorithm_key, algorithm_name, num_slots, execution_time_ms, operations_count, is_valid, status_message, created_at) VALUES (")
                .append(sqlStr(algorithmKey)).append(", ")
                .append(sqlStr(algorithmName)).append(", ")
                .append(numSlots).append(", ")
                .append(executionTimeMs).append(", ")
                .append(operationsCount).append(", ")
                .append(isValid ? 1 : 0).append(", ")
                .append(sqlStr(statusMessage)).append(", CURRENT_TIMESTAMP) "
                + "ON CONFLICT(algorithm_key) DO UPDATE SET "
                + "algorithm_name = excluded.algorithm_name, "
                + "num_slots = excluded.num_slots, "
                + "execution_time_ms = excluded.execution_time_ms, "
                + "operations_count = excluded.operations_count, "
                + "is_valid = excluded.is_valid, "
                + "status_message = excluded.status_message, "
                + "created_at = CURRENT_TIMESTAMP;\n");

        executeTransaction(sb.toString());
    }

    public synchronized Map<String, Object> getLatestTimetable() {
        List<Map<String, Object>> ttRows = queryRows(
                "SELECT id, algorithm_key, algorithm_name, num_slots, execution_time_ms, operations_count, is_valid, status_message, config_json, allocation_mode, created_at "
                        + "FROM generated_timetables ORDER BY created_at DESC LIMIT 1;"
        );
        if (ttRows.isEmpty()) {
            return null;
        }
        Map<String, Object> tt = ttRows.get(0);
        String ttId = JsonHelper.getString(tt, "id", "");

        List<Map<String, Object>> examRows = queryRows(
                "SELECT id, subject_id, subject_code, subject_name, slot_index, exam_date, start_time, end_time, total_students, enrolled_groups_json "
                        + "FROM scheduled_exams WHERE timetable_id = " + sqlStr(ttId)
                        + " ORDER BY slot_index ASC, subject_code ASC;"
        );
        List<Map<String, Object>> allocRows = queryRows(
                "SELECT id, scheduled_exam_id, classroom_id, classroom_name, building, classroom_capacity, allocated_students, remaining_seats "
                        + "FROM classroom_allocations WHERE timetable_id = " + sqlStr(ttId)
                        + " ORDER BY classroom_name ASC;"
        );

        Map<String, List<Map<String, Object>>> allocByExam = new LinkedHashMap<String, List<Map<String, Object>>>();
        for (Map<String, Object> a : allocRows) {
            String eid = JsonHelper.getString(a, "scheduled_exam_id", "");
            if (!allocByExam.containsKey(eid)) {
                allocByExam.put(eid, new ArrayList<Map<String, Object>>());
            }
            Map<String, Object> allocObj = new LinkedHashMap<String, Object>();
            allocObj.put("id", JsonHelper.getString(a, "id", ""));
            allocObj.put("classroomId", JsonHelper.getString(a, "classroom_id", ""));
            allocObj.put("classroomName", JsonHelper.getString(a, "classroom_name", ""));
            allocObj.put("building", JsonHelper.getString(a, "building", ""));
            allocObj.put("capacity", Integer.valueOf(JsonHelper.getInt(a, "classroom_capacity", 0)));
            allocObj.put("allocatedStudents", Integer.valueOf(JsonHelper.getInt(a, "allocated_students", 0)));
            allocObj.put("remainingSeats", Integer.valueOf(JsonHelper.getInt(a, "remaining_seats", 0)));
            allocByExam.get(eid).add(allocObj);
        }

        Map<String, Integer> assignments = new LinkedHashMap<String, Integer>();
        List<Map<String, Object>> scheduledExams = new ArrayList<Map<String, Object>>();
        for (Map<String, Object> e : examRows) {
            String eid = JsonHelper.getString(e, "id", "");
            String sid = JsonHelper.getString(e, "subject_id", "");
            int slotIndex = JsonHelper.getInt(e, "slot_index", 0);
            assignments.put(sid, Integer.valueOf(slotIndex));

            Object parsedGroups = JsonHelper.parse(JsonHelper.getString(e, "enrolled_groups_json", "[]"));
            Map<String, Object> examObj = new LinkedHashMap<String, Object>();
            examObj.put("id", eid);
            examObj.put("subjectId", sid);
            examObj.put("subjectCode", JsonHelper.getString(e, "subject_code", ""));
            examObj.put("subjectName", JsonHelper.getString(e, "subject_name", ""));
            examObj.put("slotIndex", Integer.valueOf(slotIndex));
            examObj.put("examDate", JsonHelper.getString(e, "exam_date", ""));
            examObj.put("startTime", JsonHelper.getString(e, "start_time", ""));
            examObj.put("endTime", JsonHelper.getString(e, "end_time", ""));
            examObj.put("totalStudents", Integer.valueOf(JsonHelper.getInt(e, "total_students", 0)));
            examObj.put("enrolledGroups", parsedGroups instanceof List ? parsedGroups : new ArrayList<Object>());
            List<Map<String, Object>> roomAllocs = allocByExam.getOrDefault(eid, new ArrayList<Map<String, Object>>());
            examObj.put("classroomAllocations", roomAllocs);
            examObj.put("classroomsAssignedCount", Integer.valueOf(roomAllocs.size()));
            scheduledExams.add(examObj);
        }

        Map<String, Object> result = new LinkedHashMap<String, Object>();
        result.put("id", ttId);
        result.put("algorithmKey", JsonHelper.getString(tt, "algorithm_key", "greedy"));
        result.put("algorithmName", JsonHelper.getString(tt, "algorithm_name", ""));
        result.put("numSlots", Integer.valueOf(JsonHelper.getInt(tt, "num_slots", 0)));
        Object execTimeObj = tt.get("execution_time_ms");
        result.put("executionTimeMs", execTimeObj instanceof Number ? execTimeObj : Double.valueOf(0.0));
        result.put("operationsCount", Integer.valueOf(JsonHelper.getInt(tt, "operations_count", 0)));
        result.put("isValid", Boolean.valueOf(JsonHelper.getInt(tt, "is_valid", 0) == 1));
        result.put("statusMessage", JsonHelper.getString(tt, "status_message", ""));
        result.put("config", JsonHelper.parseObject(JsonHelper.getString(tt, "config_json", "{}")));
        result.put("allocationMode", JsonHelper.getString(tt, "allocation_mode", "group_count"));
        result.put("createdAt", JsonHelper.getString(tt, "created_at", ""));
        result.put("assignments", assignments);
        result.put("scheduledExams", scheduledExams);
        return result;
    }

    public synchronized Map<String, Object> getAlgorithmRuns() {
        List<Map<String, Object>> rows = queryRows(
                "SELECT algorithm_key, algorithm_name, num_slots, execution_time_ms, operations_count, is_valid, status_message "
                        + "FROM algorithm_runs;"
        );
        Map<String, Object> runs = new LinkedHashMap<String, Object>();
        runs.put("greedy", null);
        runs.put("backtracking", null);

        for (Map<String, Object> r : rows) {
            String key = JsonHelper.getString(r, "algorithm_key", "");
            Map<String, Object> entry = new LinkedHashMap<String, Object>();
            entry.put("algorithmKey", key);
            entry.put("algorithmName", JsonHelper.getString(r, "algorithm_name", ""));
            entry.put("numSlots", Integer.valueOf(JsonHelper.getInt(r, "num_slots", 0)));
            Object execTimeObj = r.get("execution_time_ms");
            entry.put("executionTimeMs", execTimeObj instanceof Number ? execTimeObj : Double.valueOf(0.0));
            entry.put("operationsCount", Integer.valueOf(JsonHelper.getInt(r, "operations_count", 0)));
            entry.put("isValid", Boolean.valueOf(JsonHelper.getInt(r, "is_valid", 0) == 1));
            entry.put("statusMessage", JsonHelper.getString(r, "status_message", ""));
            if ("greedy".equals(key) || "backtracking".equals(key)) {
                runs.put(key, entry);
            }
        }
        return runs;
    }

    public static class ClassroomInUseException extends RuntimeException {
        private final List<Map<String, Object>> usages;

        public ClassroomInUseException(String message, List<Map<String, Object>> usages) {
            super(message);
            this.usages = usages;
        }

        public List<Map<String, Object>> getUsages() {
            return usages;
        }
    }
}
