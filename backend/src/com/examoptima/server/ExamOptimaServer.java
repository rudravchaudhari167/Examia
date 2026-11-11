package com.examoptima.server;

import com.examoptima.algorithm.BacktrackingColoring;
import com.examoptima.algorithm.GreedyColoring;
import com.examoptima.model.ColoringResult;
import com.examoptima.model.ConflictEdge;
import com.examoptima.model.ConflictGraph;
import com.examoptima.model.Subject;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.Executor;

/**
 * Module I, III & IV: OOP, Exception Handling, Multithreading & Collections.
 * 
 * Lightweight HTTP REST Server for Examia.
 * Demonstrates:
 * - Thread creation & lifecycle with Runnable (Module IV)
 * - Thread synchronization with synchronized keyword (Module IV)
 * - Checked Exception handling with try-catch-finally (Module III)
 * - Standard JDK com.sun.net.httpserver without external frameworks (Module II
 * Packages)
 */
public class ExamOptimaServer {

    private static final int DEFAULT_PORT = 8080;

    // Shared thread counter synchronized for thread-safety (Module IV)
    private static int totalRequestsServed = 0;

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

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        // API Endpoints
        server.createContext("/api/health", new HealthHandler());
        server.createContext("/api/graph/analyze", new GraphAnalyzeHandler());
        server.createContext("/api/solve/greedy", new GreedyHandler());
        server.createContext("/api/solve/backtrack", new BacktrackHandler());
        server.createContext("/api/compare", new CompareHandler());

        // Multithreading (Module IV): Custom Executor using Thread & Runnable
        // Each incoming HTTP request is dispatched to a dedicated worker thread
        server.setExecutor(new Executor() {
            @Override
            public void execute(Runnable command) {
                Thread workerThread = new Thread(command);
                workerThread.setName("Worker-Thread-" + getNextRequestId());
                workerThread.start(); // Thread lifecycle: New -> Runnable -> Running
            }
        });

        server.start();

        System.out.println("======================================================");
        System.out.println("  EXAMIA DAA ALGORITHM ENGINE (JAVA KERNEL)");
        System.out.println("  College DAA & Java Syllabus Compliant Implementation");
        System.out.println("======================================================");
        System.out.println("  Status: RUNNING");
        System.out.println("  Port:   " + port);
        System.out.println("  Health: http://localhost:" + port + "/api/health");
        System.out.println("======================================================");
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String responseJson) throws IOException {
        byte[] bytes = responseJson.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Accept");
        exchange.sendResponseHeaders(statusCode, bytes.length);

        OutputStream os = null;
        try {
            os = exchange.getResponseBody();
            os.write(bytes);
        } finally {
            // Resource cleanup in finally block (Module III)
            if (os != null) {
                try {
                    os.close();
                } catch (IOException ignored) {
                }
            }
        }
    }

    private static void handleCorsPreflight(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Accept");
        exchange.sendResponseHeaders(204, -1);
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

    // --- HANDLER CLASSES (Module I & II: Classes and Interfaces) ---

    static class HealthHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsPreflight(exchange);
                return;
            }
            String json = "{"
                    + "\"status\":\"healthy\","
                    + "\"engine\":\"Java DAA Syllabus Kernel\","
                    + "\"jvm\":\"" + System.getProperty("java.version") + "\","
                    + "\"requestsServed\":" + totalRequestsServed + ","
                    + "\"timestamp\":" + System.currentTimeMillis()
                    + "}";
            sendResponse(exchange, 200, json);
        }
    }

    static class GraphAnalyzeHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsPreflight(exchange);
                return;
            }
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
                        if (d < e.sharedDivisions.size() - 1)
                            sb.append(",");
                    }
                    sb.append("]}");
                    if (i < edges.size() - 1)
                        sb.append(",");
                }
                sb.append("],");
                sb.append("\"degrees\":{");
                int idx = 0;
                Iterator<Map.Entry<String, Integer>> it = graph.getDegrees().entrySet().iterator();
                while (it.hasNext()) {
                    Map.Entry<String, Integer> entry = it.next();
                    sb.append("\"").append(JsonHelper.escapeJson(entry.getKey())).append("\":")
                            .append(entry.getValue());
                    if (++idx < graph.getDegrees().size())
                        sb.append(",");
                }
                sb.append("}");
                sb.append("}");

                sendResponse(exchange, 200, sb.toString());
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"" + JsonHelper.escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    static class GreedyHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsPreflight(exchange);
                return;
            }
            try {
                String body = readBody(exchange);
                List<Subject> subjects = JsonHelper.parseSubjects(body);
                ConflictGraph graph = new ConflictGraph(subjects);

                ColoringResult result = GreedyColoring.solve(graph);
                String json = formatColoringResultJson(result, graph);
                sendResponse(exchange, 200, json);
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"" + JsonHelper.escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    static class BacktrackHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsPreflight(exchange);
                return;
            }
            try {
                String body = readBody(exchange);
                List<Subject> subjects = JsonHelper.parseSubjects(body);
                int maxSlots = JsonHelper.extractIntField(body, "maxSlots", 0);
                ConflictGraph graph = new ConflictGraph(subjects);

                ColoringResult result = BacktrackingColoring.solve(graph, maxSlots);
                String json = formatColoringResultJson(result, graph);
                sendResponse(exchange, 200, json);
            } catch (Exception e) {
                e.printStackTrace();
                sendResponse(exchange, 500, "{\"error\":\"" + JsonHelper.escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    static class CompareHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                handleCorsPreflight(exchange);
                return;
            }
            try {
                String body = readBody(exchange);
                List<Subject> subjects = JsonHelper.parseSubjects(body);
                int maxSlots = JsonHelper.extractIntField(body, "maxSlots", 0);
                ConflictGraph graph = new ConflictGraph(subjects);

                ColoringResult greedyRes = GreedyColoring.solve(graph);
                ColoringResult backtrackRes = BacktrackingColoring.solve(graph, maxSlots);

                // Compute graph metrics
                int vertexCount = graph.getVertexCount();
                int edgeCount = graph.getEdgeCount();
                int maxDegree = 0;
                double totalDegree = 0;
                Iterator<Integer> degIt = graph.getDegrees().values().iterator();
                while (degIt.hasNext()) {
                    int deg = degIt.next();
                    if (deg > maxDegree)
                        maxDegree = deg;
                    totalDegree += deg;
                }
                double avgDegree = vertexCount > 0 ? (totalDegree / vertexCount) : 0;
                double density = (vertexCount > 1) ? (2.0 * edgeCount) / (vertexCount * (vertexCount - 1)) : 0;

                StringBuilder sb = new StringBuilder();
                sb.append("{");
                sb.append("\"greedy\":").append(formatColoringResultJson(greedyRes, graph)).append(",");
                sb.append("\"backtracking\":").append(formatColoringResultJson(backtrackRes, graph)).append(",");
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
                sendResponse(exchange, 500, "{\"error\":\"" + JsonHelper.escapeJson(e.getMessage()) + "\"}");
            }
        }
    }

    private static String formatColoringResultJson(ColoringResult res, ConflictGraph graph) {
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
            if (++idx < res.getSlotAssignments().size())
                sb.append(",");
        }
        sb.append("}");
        sb.append("}");
        return sb.toString();
    }
}
