package com.examoptima.server;

import com.examoptima.model.Subject;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Pure JDK JSON parser and serializer supporting objects, arrays, strings,
 * numbers, booleans, and null without external libraries.
 */
public class JsonHelper {

    public static Object parse(String json) {
        if (json == null || json.trim().isEmpty()) {
            return null;
        }
        return new Parser(json).parseValue();
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> parseObject(String json) {
        Object parsed = parse(json);
        if (parsed instanceof Map) {
            return (Map<String, Object>) parsed;
        }
        return new LinkedHashMap<String, Object>();
    }

    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> parseObjectList(String json) {
        Object parsed = parse(json);
        List<Map<String, Object>> out = new ArrayList<Map<String, Object>>();
        if (parsed instanceof List) {
            for (Object item : (List<Object>) parsed) {
                if (item instanceof Map) {
                    out.add((Map<String, Object>) item);
                }
            }
        }
        return out;
    }

    @SuppressWarnings("unchecked")
    public static String toJson(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof String) {
            return "\"" + escapeJson((String) value) + "\"";
        }
        if (value instanceof Number || value instanceof Boolean) {
            return String.valueOf(value);
        }
        if (value instanceof Map) {
            StringBuilder sb = new StringBuilder();
            sb.append("{");
            boolean first = true;
            for (Map.Entry<Object, Object> entry : ((Map<Object, Object>) value).entrySet()) {
                if (!first) {
                    sb.append(",");
                }
                first = false;
                sb.append("\"").append(escapeJson(String.valueOf(entry.getKey()))).append("\":");
                sb.append(toJson(entry.getValue()));
            }
            sb.append("}");
            return sb.toString();
        }
        if (value instanceof Iterable) {
            StringBuilder sb = new StringBuilder();
            sb.append("[");
            boolean first = true;
            for (Object item : (Iterable<Object>) value) {
                if (!first) {
                    sb.append(",");
                }
                first = false;
                sb.append(toJson(item));
            }
            sb.append("]");
            return sb.toString();
        }
        return "\"" + escapeJson(String.valueOf(value)) + "\"";
    }

    @SuppressWarnings("unchecked")
    public static List<Subject> parseSubjects(String json) {
        List<Subject> subjects = new ArrayList<Subject>();
        if (json == null || json.trim().isEmpty()) {
            return subjects;
        }
        Object parsed = parse(json);
        List<Object> rawList = null;
        if (parsed instanceof Map) {
            Object inner = ((Map<String, Object>) parsed).get("subjects");
            if (inner instanceof List) {
                rawList = (List<Object>) inner;
            }
        } else if (parsed instanceof List) {
            rawList = (List<Object>) parsed;
        }
        if (rawList == null) {
            return subjects;
        }

        for (Object obj : rawList) {
            if (!(obj instanceof Map)) {
                continue;
            }
            Map<String, Object> m = (Map<String, Object>) obj;
            String id = getString(m, "id", "");
            String code = getString(m, "code", "");
            String name = getString(m, "name", "");
            String category = getString(m, "category", "General");
            int studentCount = getInt(m, "studentCount", 60);
            List<String> divisions = getStringList(m, "divisions");

            if (id.isEmpty()) {
                id = !code.isEmpty() ? code : UUID.randomUUID().toString();
            }
            if (code.isEmpty()) {
                code = "SUBJ";
            }
            if (name.isEmpty()) {
                name = "Subject";
            }

            subjects.add(new Subject(id, code, name, divisions, studentCount, category));
        }
        return subjects;
    }

    public static String getString(Map<String, Object> map, String key, String defaultVal) {
        if (map == null || !map.containsKey(key) || map.get(key) == null) {
            return defaultVal;
        }
        return String.valueOf(map.get(key));
    }

    public static int getInt(Map<String, Object> map, String key, int defaultVal) {
        if (map == null || !map.containsKey(key) || map.get(key) == null) {
            return defaultVal;
        }
        Object v = map.get(key);
        if (v instanceof Number) {
            return ((Number) v).intValue();
        }
        try {
            return (int) Math.round(Double.parseDouble(String.valueOf(v)));
        } catch (NumberFormatException ignored) {
            return defaultVal;
        }
    }

    public static boolean getBoolean(Map<String, Object> map, String key, boolean defaultVal) {
        if (map == null || !map.containsKey(key) || map.get(key) == null) {
            return defaultVal;
        }
        Object v = map.get(key);
        if (v instanceof Boolean) {
            return ((Boolean) v).booleanValue();
        }
        if (v instanceof Number) {
            return ((Number) v).intValue() != 0;
        }
        return Boolean.parseBoolean(String.valueOf(v));
    }

    @SuppressWarnings("unchecked")
    public static List<String> getStringList(Map<String, Object> map, String key) {
        List<String> result = new ArrayList<String>();
        if (map == null || !map.containsKey(key) || !(map.get(key) instanceof List)) {
            return result;
        }
        for (Object item : (List<Object>) map.get(key)) {
            if (item != null) {
                result.add(String.valueOf(item));
            }
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    public static List<Integer> getIntList(Map<String, Object> map, String key) {
        List<Integer> result = new ArrayList<Integer>();
        if (map == null || !map.containsKey(key) || !(map.get(key) instanceof List)) {
            return result;
        }
        for (Object item : (List<Object>) map.get(key)) {
            if (item instanceof Number) {
                result.add(Integer.valueOf(((Number) item).intValue()));
            } else if (item != null) {
                try {
                    result.add(Integer.valueOf((int) Math.round(Double.parseDouble(String.valueOf(item)))));
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return result;
    }

    public static int extractIntField(String json, String fieldName, int defaultValue) {
        Map<String, Object> obj = parseObject(json);
        return getInt(obj, fieldName, defaultValue);
    }

    public static String extractStringField(String json, String fieldName) {
        Map<String, Object> obj = parseObject(json);
        return getString(obj, fieldName, "");
    }

    public static List<String> extractStringArrayField(String json, String fieldName) {
        Map<String, Object> obj = parseObject(json);
        return getStringList(obj, fieldName);
    }

    public static String escapeJson(String str) {
        if (str == null) {
            return "";
        }
        return str.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\b", "\\b")
                .replace("\f", "\\f")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static final class Parser {
        private final String src;
        private int pos = 0;

        Parser(String src) {
            this.src = src;
        }

        Object parseValue() {
            skipWhitespace();
            if (pos >= src.length()) {
                return null;
            }
            char c = src.charAt(pos);
            if (c == '{') return parseObject();
            if (c == '[') return parseArray();
            if (c == '"') return parseString();
            if (c == 't' && src.startsWith("true", pos)) {
                pos += 4;
                return Boolean.TRUE;
            }
            if (c == 'f' && src.startsWith("false", pos)) {
                pos += 5;
                return Boolean.FALSE;
            }
            if (c == 'n' && src.startsWith("null", pos)) {
                pos += 4;
                return null;
            }
            if (c == '-' || (c >= '0' && c <= '9')) {
                return parseNumber();
            }
            throw new IllegalArgumentException("Unexpected JSON character '" + c + "' at position " + pos);
        }

        Map<String, Object> parseObject() {
            Map<String, Object> map = new LinkedHashMap<String, Object>();
            pos++; // '{'
            skipWhitespace();
            if (pos < src.length() && src.charAt(pos) == '}') {
                pos++;
                return map;
            }
            while (pos < src.length()) {
                skipWhitespace();
                if (pos >= src.length() || src.charAt(pos) != '"') {
                    throw new IllegalArgumentException("Expected object key at position " + pos);
                }
                String key = parseString();
                skipWhitespace();
                if (pos >= src.length() || src.charAt(pos) != ':') {
                    throw new IllegalArgumentException("Expected ':' at position " + pos);
                }
                pos++;
                Object val = parseValue();
                map.put(key, val);
                skipWhitespace();
                if (pos < src.length() && src.charAt(pos) == ',') {
                    pos++;
                } else if (pos < src.length() && src.charAt(pos) == '}') {
                    pos++;
                    return map;
                } else {
                    throw new IllegalArgumentException("Expected ',' or '}' at position " + pos);
                }
            }
            return map;
        }

        List<Object> parseArray() {
            List<Object> list = new ArrayList<Object>();
            pos++; // '['
            skipWhitespace();
            if (pos < src.length() && src.charAt(pos) == ']') {
                pos++;
                return list;
            }
            while (pos < src.length()) {
                Object val = parseValue();
                list.add(val);
                skipWhitespace();
                if (pos < src.length() && src.charAt(pos) == ',') {
                    pos++;
                } else if (pos < src.length() && src.charAt(pos) == ']') {
                    pos++;
                    return list;
                } else {
                    throw new IllegalArgumentException("Expected ',' or ']' at position " + pos);
                }
            }
            return list;
        }

        String parseString() {
            StringBuilder sb = new StringBuilder();
            pos++; // opening quote
            while (pos < src.length()) {
                char c = src.charAt(pos++);
                if (c == '"') {
                    return sb.toString();
                }
                if (c == '\\' && pos < src.length()) {
                    char esc = src.charAt(pos++);
                    switch (esc) {
                        case '"': sb.append('"'); break;
                        case '\\': sb.append('\\'); break;
                        case '/': sb.append('/'); break;
                        case 'b': sb.append('\b'); break;
                        case 'f': sb.append('\f'); break;
                        case 'n': sb.append('\n'); break;
                        case 'r': sb.append('\r'); break;
                        case 't': sb.append('\t'); break;
                        case 'u':
                            if (pos + 4 <= src.length()) {
                                int code = Integer.parseInt(src.substring(pos, pos + 4), 16);
                                sb.append((char) code);
                                pos += 4;
                            }
                            break;
                        default:
                            sb.append(esc);
                            break;
                    }
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }

        Number parseNumber() {
            int start = pos;
            if (src.charAt(pos) == '-') pos++;
            boolean isFloat = false;
            while (pos < src.length()) {
                char c = src.charAt(pos);
                if (c == '.' || c == 'e' || c == 'E') {
                    isFloat = true;
                    pos++;
                } else if ((c >= '0' && c <= '9') || c == '+' || c == '-') {
                    if ((c == '+' || c == '-') && pos > start && src.charAt(pos - 1) != 'e' && src.charAt(pos - 1) != 'E') {
                        break;
                    }
                    pos++;
                } else {
                    break;
                }
            }
            String numStr = src.substring(start, pos);
            if (isFloat) {
                return Double.valueOf(numStr);
            }
            long l = Long.parseLong(numStr);
            if (l >= Integer.MIN_VALUE && l <= Integer.MAX_VALUE) {
                return Integer.valueOf((int) l);
            }
            return Long.valueOf(l);
        }

        void skipWhitespace() {
            while (pos < src.length() && Character.isWhitespace(src.charAt(pos))) {
                pos++;
            }
        }
    }
}
