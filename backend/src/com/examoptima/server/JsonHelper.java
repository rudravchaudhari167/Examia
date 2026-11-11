package com.examoptima.server;

import com.examoptima.model.Subject;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Module I & III: Helper Utility for JSON parsing and serialization.
 * Implemented using standard Java string manipulations and loops without external third-party JARs.
 */
public class JsonHelper {

    /**
     * Parses a list of Subject objects from an incoming JSON array string.
     */
    public static List<Subject> parseSubjects(String json) {
        List<Subject> subjects = new ArrayList<Subject>();
        if (json == null || json.trim().isEmpty()) {
            return subjects;
        }

        String trimmed = json.trim();
        int arrayStart = trimmed.indexOf('[');
        int arrayEnd = trimmed.lastIndexOf(']');
        if (arrayStart == -1 || arrayEnd == -1 || arrayStart >= arrayEnd) {
            return subjects;
        }

        String arrayContent = trimmed.substring(arrayStart + 1, arrayEnd).trim();
        if (arrayContent.isEmpty()) {
            return subjects;
        }

        // Split individual JSON object representations by tracking brace depth
        List<String> objectStrings = new ArrayList<String>();
        int braceDepth = 0;
        int startIdx = -1;

        for (int i = 0; i < arrayContent.length(); i++) {
            char c = arrayContent.charAt(i);
            if (c == '{') {
                if (braceDepth == 0) {
                    startIdx = i;
                }
                braceDepth++;
            } else if (c == '}') {
                braceDepth--;
                if (braceDepth == 0 && startIdx != -1) {
                    objectStrings.add(arrayContent.substring(startIdx, i + 1));
                    startIdx = -1;
                }
            }
        }

        for (int i = 0; i < objectStrings.size(); i++) {
            Subject s = parseSingleSubject(objectStrings.get(i));
            if (s != null) {
                subjects.add(s);
            }
        }

        return subjects;
    }

    private static Subject parseSingleSubject(String objStr) {
        String id = extractStringField(objStr, "id");
        String code = extractStringField(objStr, "code");
        String name = extractStringField(objStr, "name");
        String category = extractStringField(objStr, "category");
        int studentCount = extractIntField(objStr, "studentCount", 60);
        List<String> divisions = extractStringArrayField(objStr, "divisions");

        if (id == null || id.isEmpty()) {
            id = (code != null && !code.isEmpty()) ? code : UUID.randomUUID().toString();
        }
        if (code == null || code.isEmpty()) code = "SUBJ";
        if (name == null || name.isEmpty()) name = "Subject";

        return new Subject(id, code, name, divisions, studentCount, category);
    }

    public static int extractIntField(String json, String fieldName, int defaultValue) {
        String pattern = "\"" + fieldName + "\"\\s*:\\s*([0-9]+)";
        Pattern p = Pattern.compile(pattern);
        Matcher m = p.matcher(json);
        if (m.find()) {
            try {
                return Integer.parseInt(m.group(1));
            } catch (NumberFormatException ignored) {
            }
        }
        return defaultValue;
    }

    public static String extractStringField(String json, String fieldName) {
        String pattern = "\"" + fieldName + "\"\\s*:\\s*\"([^\"]*)\"";
        Pattern p = Pattern.compile(pattern);
        Matcher m = p.matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return "";
    }

    public static List<String> extractStringArrayField(String json, String fieldName) {
        List<String> list = new ArrayList<String>();
        int fieldIdx = json.indexOf("\"" + fieldName + "\"");
        if (fieldIdx == -1) {
            return list;
        }

        int arrayStart = json.indexOf('[', fieldIdx);
        if (arrayStart == -1) {
            return list;
        }

        int arrayEnd = json.indexOf(']', arrayStart);
        if (arrayEnd == -1) {
            return list;
        }

        String arrayContent = json.substring(arrayStart + 1, arrayEnd);
        Pattern p = Pattern.compile("\"([^\"]*)\"");
        Matcher m = p.matcher(arrayContent);
        while (m.find()) {
            list.add(m.group(1));
        }
        return list;
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
}
