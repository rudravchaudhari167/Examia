package com.examoptima.server;

import com.examoptima.algorithm.BacktrackingColoring;
import com.examoptima.algorithm.GreedyColoring;
import com.examoptima.db.DatabaseManager;
import com.examoptima.db.DatabaseManager.ClassroomInUseException;
import com.examoptima.model.ColoringResult;
import com.examoptima.model.ConflictEdge;
import com.examoptima.model.ConflictGraph;
import com.examoptima.model.Subject;
import com.examoptima.service.TimetablePlanner;
import com.examoptima.service.TimetablePlanner.PlanningException;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Executor;

/**
 * HTTP REST Server for Examia backed by persistent SQLite storage and
 * DAA Graph Coloring + Date/Time Scheduling + Multi-Classroom Allocation.
 */
public class ExamOptimaServer {

    private static final int DEFAULT_PORT = 8080;
    private static int totalRequestsServed = 0;
    private static DatabaseManager db;

    public static synchronized int getNextRequestId() {
        totalRequestsServed++;
        return totalRequestsServed;
    }

    public static void main(String[] args) throws IOException {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {
            }
        }

        db = new DatabaseManager();
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // Database & Workflow REST Endpoints
        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/bootstrap", new BootstrapHandler());
        server.createContext("/api/subjects", new SubjectsHandler());
        server.createContext("/api/groups", new GroupsHandler());
        server.createContext("/api/enrolments", new EnrolmentsHandler());
        server.createContext("/api/classrooms", new ClassroomsHandler());
        server.createContext("/api/config", new ConfigHandler());
        server.createContext("/api/timetable/generate", new GenerateTimetableHandler());
        server.createContext("/api/timetable", new TimetableHandler());
        server.createContext("/api/reset", new ResetHandler());

        // Direct DAA Graph / Solver Endpoints
        server.createContext("/api/graph/analyze", new GraphAnalyzeHandler());
        server.createContext("/api/solve/greedy", new GreedyHandler());
        server.createContext("/api/solve/backtrack", new BacktrackHandler());
        server.createContext("/api/compare", new CompareHandler());

        server.setExecutor(new Executor() {
            @Override
            public void execute(Runnable command) {
                Thread workerThread = new Thread(command);
                workerThread.setName("Worker-Thread-" + getNextRequestId());
                workerThread.start();
            }
        });

        server.start();

        System.out.println("======================================================");
        System.out.println("  EXAMIA DAA ALGORITHM & TIMETABLE SERVER");
        System.out.println("  SQLite DB: " + db.getDbPathString());
        System.out.println("======================================================");
        System.out.println("  Status: RUNNING on port " + port);
        System.out.println("  Health: http://localhost:" + port + "/api/health");
        System.out.println("======================================================");
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Accept");
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String responseJson) throws IOException {
        byte[] bytes = responseJson.getBytes(StandardCharsets.UTF_8);
        addCorsHeaders(exchange);
        exchange.sendResponseHeaders(statusCode, bytes.length);

        OutputStream os = null;
        try {
            os = exchange.getResponseBody();
            os.write(bytes);
        } finally {
            if (os != null) {
                try {
                    os.close();
                } catch (IOException ignored) {
                }
            }
        }
    }

    private static void sendError(HttpExchange exchange, int statusCode, String message) throws IOException {
        Map<String, Object> err = new LinkedHashMap<String, Object>();
        err.put("error", message == null ? "Unexpected server error." : message);
        sendResponse(exchange, statusCode, JsonHelper.toJson(err));
    }

    private static boolean handleCorsPreflightIfOptions(HttpExchange exchange) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            addCorsHeaders(exchange);
            exchange.sendResponseHeaders(204, -1);
            return true;
        }
        return false;
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        InputStream is = null;
        try {
            is = exchange.getRequestBody();
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } finally {
            if (is != null) {
                try {
                    is.close();
                } catch (IOException ignored) {
                }
            }
        }
    }

    private static Map<String, String> parseQueryParams(HttpExchange exchange) {
        Map<String, String> params = new LinkedHashMap<String, String>();
        String query = exchange.getRequestURI().getRawQuery();
        if (query == null || query.isEmpty()) {
            return params;
        }
        for (String pair : query.split("&")) {
            int eq = pair.indexOf('=');
            if (eq > 0) {
                String k = URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8);
                String v = URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
                params.put(k, v);
            }
        }
        return params;
    }

    // --- Handlers ---

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            Map<String, Object> res = new LinkedHashMap<String, Object>();
            res.put("status", "healthy");
            res.put("engine", "Java DAA & SQLite Server");
            res.put("jvm", System.getProperty("java.version"));
            res.put("database", "SQLite");
            res.put("requestsServed", Integer.valueOf(totalRequestsServed));
            res.put("timestamp", Long.valueOf(System.currentTimeMillis()));
            sendResponse(exchange, 200, JsonHelper.toJson(res));
        }
    }

    static class BootstrapHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            try {
                sendResponse(exchange, 200, JsonHelper.toJson(db.getBootstrapState()));
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class SubjectsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            String method = exchange.getRequestMethod().toUpperCase(Locale.US);
            try {
                if ("GET".equals(method)) {
                    sendResponse(exchange, 200, JsonHelper.toJson(db.listSubjectsWithEnrolments()));
                    return;
                }
                Map<String, Object> body = JsonHelper.parseObject(readBody(exchange));
                if ("POST".equals(method)) {
                    String code = JsonHelper.getString(body, "code", "").trim().toUpperCase(Locale.US);
                    String name = JsonHelper.getString(body, "name", "").trim();
                    String category = JsonHelper.getString(body, "category", "General").trim();
                    List<String> groupIds = JsonHelper.getStringList(body, "groupIds");
                    if (code.isEmpty() || name.isEmpty()) {
                        sendError(exchange, 400, "Subject code and subject name are required.");
                        return;
                    }
                    String id = JsonHelper.getString(body, "id", "").trim();
                    if (id.isEmpty()) {
                        id = "sub-" + UUID.randomUUID().toString();
                    }
                    Map<String, Object> created = db.createSubject(id, code, name, category.isEmpty() ? "General" : category, groupIds);
                    sendResponse(exchange, 201, JsonHelper.toJson(created));
                    return;
                }
                if ("PUT".equals(method)) {
                    String id = JsonHelper.getString(body, "id", "").trim();
                    String code = JsonHelper.getString(body, "code", "").trim().toUpperCase(Locale.US);
                    String name = JsonHelper.getString(body, "name", "").trim();
                    String category = JsonHelper.getString(body, "category", "General").trim();
                    List<String> groupIds = body.containsKey("groupIds") ? JsonHelper.getStringList(body, "groupIds") : null;
                    if (id.isEmpty() || code.isEmpty() || name.isEmpty()) {
                        sendError(exchange, 400, "Subject id, code, and name are required.");
                        return;
                    }
                    Map<String, Object> updated = db.updateSubject(id, code, name, category.isEmpty() ? "General" : category, groupIds);
                    sendResponse(exchange, 200, JsonHelper.toJson(updated));
                    return;
                }
                if ("DELETE".equals(method)) {
                    Map<String, String> qp = parseQueryParams(exchange);
                    String id = qp.getOrDefault("id", JsonHelper.getString(body, "id", "")).trim();
                    if (id.isEmpty()) {
                        sendError(exchange, 400, "Subject id is required.");
                        return;
                    }
                    db.deleteSubject(id);
                    sendResponse(exchange, 200, JsonHelper.toJson(db.getBootstrapState()));
                    return;
                }
                sendError(exchange, 405, "Method not allowed.");
            } catch (IllegalArgumentException e) {
                sendError(exchange, 400, e.getMessage());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class GroupsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            String method = exchange.getRequestMethod().toUpperCase(Locale.US);
            try {
                if ("GET".equals(method)) {
                    sendResponse(exchange, 200, JsonHelper.toJson(db.listStudentGroups()));
                    return;
                }
                Map<String, Object> body = JsonHelper.parseObject(readBody(exchange));
                if ("POST".equals(method)) {
                    String name = JsonHelper.getString(body, "name", "").trim();
                    int studentCount = JsonHelper.getInt(body, "studentCount", 0);
                    String dept = JsonHelper.getString(body, "department", "").trim();
                    String sem = JsonHelper.getString(body, "semester", "").trim();
                    if (name.isEmpty()) {
                        sendError(exchange, 400, "Student group name is required.");
                        return;
                    }
                    if (studentCount <= 0 || studentCount > 10000) {
                        sendError(exchange, 400, "Student count must be between 1 and 10,000.");
                        return;
                    }
                    String id = JsonHelper.getString(body, "id", "").trim();
                    if (id.isEmpty()) {
                        id = "div-" + UUID.randomUUID().toString();
                    }
                    Map<String, Object> created = db.createStudentGroup(id, name, studentCount, dept, sem);
                    sendResponse(exchange, 201, JsonHelper.toJson(created));
                    return;
                }
                if ("PUT".equals(method)) {
                    String id = JsonHelper.getString(body, "id", "").trim();
                    String name = JsonHelper.getString(body, "name", "").trim();
                    int studentCount = JsonHelper.getInt(body, "studentCount", 0);
                    String dept = JsonHelper.getString(body, "department", "").trim();
                    String sem = JsonHelper.getString(body, "semester", "").trim();
                    if (id.isEmpty() || name.isEmpty()) {
                        sendError(exchange, 400, "Group id and name are required.");
                        return;
                    }
                    if (studentCount <= 0 || studentCount > 10000) {
                        sendError(exchange, 400, "Student count must be between 1 and 10,000.");
                        return;
                    }
                    Map<String, Object> updated = db.updateStudentGroup(id, name, studentCount, dept, sem);
                    sendResponse(exchange, 200, JsonHelper.toJson(updated));
                    return;
                }
                if ("DELETE".equals(method)) {
                    Map<String, String> qp = parseQueryParams(exchange);
                    String id = qp.getOrDefault("id", JsonHelper.getString(body, "id", "")).trim();
                    if (id.isEmpty()) {
                        sendError(exchange, 400, "Group id is required.");
                        return;
                    }
                    db.deleteStudentGroup(id);
                    sendResponse(exchange, 200, JsonHelper.toJson(db.getBootstrapState()));
                    return;
                }
                sendError(exchange, 405, "Method not allowed.");
            } catch (IllegalArgumentException e) {
                sendError(exchange, 400, e.getMessage());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class EnrolmentsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            String method = exchange.getRequestMethod().toUpperCase(Locale.US);
            if (!"PUT".equals(method) && !"POST".equals(method)) {
                sendError(exchange, 405, "Method not allowed.");
                return;
            }
            try {
                Map<String, Object> body = JsonHelper.parseObject(readBody(exchange));
                String subjectId = JsonHelper.getString(body, "subjectId", "").trim();
                String groupId = JsonHelper.getString(body, "groupId", "").trim();

                if (!subjectId.isEmpty()) {
                    List<String> groupIds = JsonHelper.getStringList(body, "groupIds");
                    db.setEnrolmentsForSubject(subjectId, groupIds);
                } else if (!groupId.isEmpty()) {
                    List<String> subjectIds = JsonHelper.getStringList(body, "subjectIds");
                    db.setEnrolmentsForGroup(groupId, subjectIds);
                } else {
                    sendError(exchange, 400, "Specify either subjectId with groupIds, or groupId with subjectIds.");
                    return;
                }
                sendResponse(exchange, 200, JsonHelper.toJson(db.getBootstrapState()));
            } catch (IllegalArgumentException e) {
                sendError(exchange, 400, e.getMessage());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class ClassroomsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            String method = exchange.getRequestMethod().toUpperCase(Locale.US);
            try {
                if ("GET".equals(method)) {
                    sendResponse(exchange, 200, JsonHelper.toJson(db.listClassrooms()));
                    return;
                }
                Map<String, Object> body = JsonHelper.parseObject(readBody(exchange));
                if ("POST".equals(method)) {
                    String name = JsonHelper.getString(body, "name", "").trim();
                    String building = JsonHelper.getString(body, "building", "").trim();
                    int capacity = JsonHelper.getInt(body, "capacity", 0);
                    boolean isAvailable = JsonHelper.getBoolean(body, "isAvailable", true);
                    if (name.isEmpty()) {
                        sendError(exchange, 400, "Classroom name or room number is required.");
                        return;
                    }
                    if (capacity <= 0 || capacity > 5000) {
                        sendError(exchange, 400, "Classroom seating capacity must be between 1 and 5,000.");
                        return;
                    }
                    String id = JsonHelper.getString(body, "id", "").trim();
                    if (id.isEmpty()) {
                        id = "room-" + UUID.randomUUID().toString();
                    }
                    Map<String, Object> created = db.createClassroom(id, name, building, capacity, isAvailable);
                    sendResponse(exchange, 201, JsonHelper.toJson(created));
                    return;
                }
                if ("PUT".equals(method)) {
                    String id = JsonHelper.getString(body, "id", "").trim();
                    String name = JsonHelper.getString(body, "name", "").trim();
                    String building = JsonHelper.getString(body, "building", "").trim();
                    int capacity = JsonHelper.getInt(body, "capacity", 0);
                    boolean isAvailable = JsonHelper.getBoolean(body, "isAvailable", true);
                    if (id.isEmpty() || name.isEmpty()) {
                        sendError(exchange, 400, "Classroom id and name are required.");
                        return;
                    }
                    if (capacity <= 0 || capacity > 5000) {
                        sendError(exchange, 400, "Classroom seating capacity must be between 1 and 5,000.");
                        return;
                    }
                    Map<String, Object> updated = db.updateClassroom(id, name, building, capacity, isAvailable);
                    sendResponse(exchange, 200, JsonHelper.toJson(updated));
                    return;
                }
                if ("DELETE".equals(method)) {
                    Map<String, String> qp = parseQueryParams(exchange);
                    String id = qp.getOrDefault("id", JsonHelper.getString(body, "id", "")).trim();
                    boolean clearAssigned = "true".equalsIgnoreCase(qp.getOrDefault("clearSchedule", "false"))
                            || JsonHelper.getBoolean(body, "clearSchedule", false);
                    if (id.isEmpty()) {
                        sendError(exchange, 400, "Classroom id is required.");
                        return;
                    }
                    db.deleteClassroom(id, clearAssigned);
                    sendResponse(exchange, 200, JsonHelper.toJson(db.getBootstrapState()));
                    return;
                }
                sendError(exchange, 405, "Method not allowed.");
            } catch (ClassroomInUseException e) {
                Map<String, Object> payload = new LinkedHashMap<String, Object>();
                payload.put("error", e.getMessage());
                payload.put("inUse", Boolean.TRUE);
                payload.put("usages", e.getUsages());
                sendResponse(exchange, 409, JsonHelper.toJson(payload));
            } catch (IllegalArgumentException e) {
                sendError(exchange, 400, e.getMessage());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class ConfigHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            String method = exchange.getRequestMethod().toUpperCase(Locale.US);
            try {
                if ("GET".equals(method)) {
                    sendResponse(exchange, 200, JsonHelper.toJson(db.getConfig()));
                    return;
                }
                if ("PUT".equals(method) || "POST".equals(method)) {
                    Map<String, Object> body = JsonHelper.parseObject(readBody(exchange));
                    String startDate = JsonHelper.getString(body, "startDate", "").trim();
                    String dailyStart = JsonHelper.getString(body, "dailyStartTime", "").trim();
                    int durationMin = JsonHelper.getInt(body, "examDurationMinutes", 180);
                    int breakMin = JsonHelper.getInt(body, "breakDurationMinutes", 60);
                    int numDays = JsonHelper.getInt(body, "numDays", 5);
                    int maxPerDay = JsonHelper.getInt(body, "maxExamsPerDay", 2);

                    TimetablePlanner.validateConfig(startDate, dailyStart, durationMin, breakMin, numDays, maxPerDay);
                    db.saveConfig(startDate, dailyStart, durationMin, breakMin, numDays, maxPerDay);
                    sendResponse(exchange, 200, JsonHelper.toJson(db.getConfig()));
                    return;
                }
                sendError(exchange, 405, "Method not allowed.");
            } catch (PlanningException e) {
                sendError(exchange, e.getStatusCode(), e.getMessage());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class GenerateTimetableHandler implements HttpHandler {
        @Override
        @SuppressWarnings("unchecked")
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendError(exchange, 405, "Method not allowed.");
                return;
            }
            try {
                Map<String, Object> body = JsonHelper.parseObject(readBody(exchange));
                String algorithmKey = JsonHelper.getString(body, "algorithm", "greedy").trim().toLowerCase(Locale.US);
                int maxSlots = JsonHelper.getInt(body, "maxSlots", 0);

                // Use provided config (if sent) after validation & persist it; otherwise use saved DB config
                Map<String, Object> cfg = db.getConfig();
                if (body.get("config") instanceof Map) {
                    Map<String, Object> incoming = (Map<String, Object>) body.get("config");
                    String startDate = JsonHelper.getString(incoming, "startDate", JsonHelper.getString(cfg, "startDate", "2026-11-20")).trim();
                    String dailyStart = JsonHelper.getString(incoming, "dailyStartTime", JsonHelper.getString(cfg, "dailyStartTime", "09:00")).trim();
                    int durationMin = JsonHelper.getInt(incoming, "examDurationMinutes", JsonHelper.getInt(cfg, "examDurationMinutes", 180));
                    int breakMin = JsonHelper.getInt(incoming, "breakDurationMinutes", JsonHelper.getInt(cfg, "breakDurationMinutes", 60));
                    int numDays = JsonHelper.getInt(incoming, "numDays", JsonHelper.getInt(cfg, "numDays", 5));
                    int maxPerDay = JsonHelper.getInt(incoming, "maxExamsPerDay", JsonHelper.getInt(cfg, "maxExamsPerDay", 2));

                    TimetablePlanner.validateConfig(startDate, dailyStart, durationMin, breakMin, numDays, maxPerDay);
                    db.saveConfig(startDate, dailyStart, durationMin, breakMin, numDays, maxPerDay);
                    cfg = db.getConfig();
                }

                List<Subject> subjects = db.getSubjectsAsModels();
                List<Map<String, Object>> classrooms = db.listClassrooms();

                Map<String, Object> timetable = TimetablePlanner.planAndValidate(
                        subjects,
                        classrooms,
                        cfg,
                        algorithmKey,
                        maxSlots
                );

                db.saveGeneratedTimetable(
                        JsonHelper.getString(timetable, "id", "tt-latest"),
                        JsonHelper.getString(timetable, "algorithmKey", algorithmKey),
                        JsonHelper.getString(timetable, "algorithmName", ""),
                        JsonHelper.getInt(timetable, "numSlots", 0),
                        ((Number) timetable.get("executionTimeMs")).doubleValue(),
                        ((Number) timetable.get("operationsCount")).longValue(),
                        true,
                        JsonHelper.getString(timetable, "statusMessage", ""),
                        cfg,
                        (List<Map<String, Object>>) timetable.get("scheduledExams")
                );

                Map<String, Object> response = new LinkedHashMap<String, Object>();
                response.put("timetable", db.getLatestTimetable());
                response.put("algoRuns", db.getAlgorithmRuns());
                response.put("config", cfg);
                response.put("classrooms", db.listClassrooms());
                sendResponse(exchange, 200, JsonHelper.toJson(response));
            } catch (PlanningException e) {
                sendError(exchange, e.getStatusCode(), e.getMessage());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class TimetableHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            String method = exchange.getRequestMethod().toUpperCase(Locale.US);
            try {
                if ("GET".equals(method)) {
                    Map<String, Object> res = new LinkedHashMap<String, Object>();
                    res.put("timetable", db.getLatestTimetable());
                    res.put("algoRuns", db.getAlgorithmRuns());
                    sendResponse(exchange, 200, JsonHelper.toJson(res));
                    return;
                }
                if ("DELETE".equals(method)) {
                    db.clearGeneratedTimetable();
                    sendResponse(exchange, 200, JsonHelper.toJson(db.getBootstrapState()));
                    return;
                }
                sendError(exchange, 405, "Method not allowed.");
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class ResetHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendError(exchange, 405, "Method not allowed.");
                return;
            }
            try {
                db.seedInitialDataset();
                sendResponse(exchange, 200, JsonHelper.toJson(db.getBootstrapState()));
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    // --- Existing Graph & Solver Endpoints Preserved ---

    static class GraphAnalyzeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            try {
                String body = readBody(exchange);
                List<Subject> subjects = JsonHelper.parseSubjects(body);
                ConflictGraph graph = new ConflictGraph(subjects);

                StringBuilder sb = new StringBuilder();
                sb.append("{");
                sb.append("\"vertexCount\":").append(graph.getVertexCount()).append(",");
                sb.append("\"edgeCount\":").append(graph.getEdgeCount()).append(",");
                sb.append("\"edges\":[");
                List<ConflictEdge> edges = graph.getEdges();
                for (int i = 0; i < edges.size(); i++) {
                    ConflictEdge e = edges.get(i);
                    sb.append("{\"uId\":\"").append(JsonHelper.escapeJson(e.uId)).append("\",")
                            .append("\"vId\":\"").append(JsonHelper.escapeJson(e.vId)).append("\",")
                            .append("\"uCode\":\"").append(JsonHelper.escapeJson(e.uCode)).append("\",")
                            .append("\"vCode\":\"").append(JsonHelper.escapeJson(e.vCode)).append("\",")
                            .append("\"sharedDivisions\":[");
                    for (int d = 0; d < e.sharedDivisions.size(); d++) {
                        sb.append("\"").append(JsonHelper.escapeJson(e.sharedDivisions.get(d))).append("\"");
                        if (d < e.sharedDivisions.size() - 1) sb.append(",");
                    }
                    sb.append("]}");
                    if (i < edges.size() - 1) sb.append(",");
                }
                sb.append("],\"degrees\":{");
                int idx = 0;
                Iterator<Map.Entry<String, Integer>> it = graph.getDegrees().entrySet().iterator();
                while (it.hasNext()) {
                    Map.Entry<String, Integer> entry = it.next();
                    sb.append("\"").append(JsonHelper.escapeJson(entry.getKey())).append("\":").append(entry.getValue());
                    if (++idx < graph.getDegrees().size()) sb.append(",");
                }
                sb.append("}}");
                sendResponse(exchange, 200, sb.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class GreedyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            try {
                List<Subject> subjects = JsonHelper.parseSubjects(readBody(exchange));
                ConflictGraph graph = new ConflictGraph(subjects);
                ColoringResult result = GreedyColoring.solve(graph);
                sendResponse(exchange, 200, formatColoringResultJson(result));
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class BacktrackHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            try {
                String body = readBody(exchange);
                List<Subject> subjects = JsonHelper.parseSubjects(body);
                int maxSlots = JsonHelper.extractIntField(body, "maxSlots", 0);
                ConflictGraph graph = new ConflictGraph(subjects);
                ColoringResult result = BacktrackingColoring.solve(graph, maxSlots);
                sendResponse(exchange, 200, formatColoringResultJson(result));
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    static class CompareHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if (handleCorsPreflightIfOptions(exchange)) return;
            try {
                String body = readBody(exchange);
                List<Subject> subjects = JsonHelper.parseSubjects(body);
                int maxSlots = JsonHelper.extractIntField(body, "maxSlots", 0);
                ConflictGraph graph = new ConflictGraph(subjects);

                ColoringResult greedyRes = GreedyColoring.solve(graph);
                ColoringResult backtrackRes = BacktrackingColoring.solve(graph, maxSlots);

                int vertexCount = graph.getVertexCount();
                int edgeCount = graph.getEdgeCount();
                int maxDegree = 0;
                double totalDegree = 0;
                for (Integer degVal : graph.getDegrees().values()) {
                    int deg = degVal.intValue();
                    if (deg > maxDegree) maxDegree = deg;
                    totalDegree += deg;
                }
                double avgDegree = vertexCount > 0 ? (totalDegree / vertexCount) : 0;
                double density = (vertexCount > 1) ? (2.0 * edgeCount) / (vertexCount * (vertexCount - 1)) : 0;

                StringBuilder sb = new StringBuilder();
                sb.append("{");
                sb.append("\"greedy\":").append(formatColoringResultJson(greedyRes)).append(",");
                sb.append("\"backtracking\":").append(formatColoringResultJson(backtrackRes)).append(",");
                sb.append("\"graphMetrics\":{")
                        .append("\"vertexCount\":").append(vertexCount).append(",")
                        .append("\"edgeCount\":").append(edgeCount).append(",")
                        .append("\"maxDegree\":").append(maxDegree).append(",")
                        .append(String.format(Locale.US, "\"avgDegree\":%.2f,", avgDegree))
                        .append(String.format(Locale.US, "\"density\":%.3f", density))
                        .append("}");
                sb.append("}");
                sendResponse(exchange, 200, sb.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendError(exchange, 500, e.getMessage());
            }
        }
    }

    private static String formatColoringResultJson(ColoringResult res) {
        StringBuilder sb = new StringBuilder();
        sb.append("{");
        sb.append("\"algorithmName\":\"").append(JsonHelper.escapeJson(res.getAlgorithmName())).append("\",");
        sb.append("\"numSlots\":").append(res.getNumSlots()).append(",");
        sb.append(String.format(Locale.US, "\"executionTimeMs\":%.4f,", res.getExecutionTimeMs()));
        sb.append("\"executionTimeNanos\":").append(res.getExecutionTimeNanos()).append(",");
        sb.append("\"operationsCount\":").append(res.getOperationsCount()).append(",");
        sb.append("\"isValid\":").append(res.isValid()).append(",");
        sb.append("\"statusMessage\":\"").append(JsonHelper.escapeJson(res.getStatusMessage())).append("\",");
        sb.append("\"assignments\":{");
        int idx = 0;
        Iterator<Map.Entry<String, Integer>> it = res.getSlotAssignments().entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<String, Integer> entry = it.next();
            sb.append("\"").append(JsonHelper.escapeJson(entry.getKey())).append("\":").append(entry.getValue());
            if (++idx < res.getSlotAssignments().size()) sb.append(",");
        }
        sb.append("}}");
        return sb.toString();
    }
}
