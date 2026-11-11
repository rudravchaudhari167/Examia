package com.examoptima.io;

import com.examoptima.model.ColoringResult;
import com.examoptima.model.Subject;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Module III: File I/O, Character Streams, and Object Serialization.
 * Demonstrates:
 * - File, FileReader, FileWriter
 * - BufferedReader, BufferedWriter
 * - ObjectOutputStream (Serialization) & ObjectInputStream (Deserialization)
 * - Strict try-catch-finally blocks with resource closing
 */
public class TimetableFileManager {

    /**
     * Exports examination timetable to CSV using FileWriter and BufferedWriter.
     */
    public static void exportTimetableToCSV(File targetFile, List<Subject> subjects, ColoringResult result) throws IOException {
        BufferedWriter writer = null;
        try {
            writer = new BufferedWriter(new FileWriter(targetFile));
            // Write CSV Header
            writer.write("Slot,Subject Code,Subject Name,Enrolled Divisions,Student Count");
            writer.newLine();

            if (subjects != null && result != null && result.getSlotAssignments() != null) {
                Map<String, Integer> assignments = result.getSlotAssignments();
                for (int i = 0; i < subjects.size(); i++) {
                    Subject s = subjects.get(i);
                    Integer slot = assignments.get(s.getId());
                    int slotNumber = (slot != null) ? (slot.intValue() + 1) : 0;

                    // Build divisions string with comma
                    StringBuilder divBuilder = new StringBuilder();
                    Iterator<String> divIt = s.getDivisions().iterator();
                    while (divIt.hasNext()) {
                        divBuilder.append(divIt.next());
                        if (divIt.hasNext()) {
                            divBuilder.append("; ");
                        }
                    }

                    String line = "Slot " + slotNumber + ","
                                + "\"" + s.getCode() + "\","
                                + "\"" + s.getName() + "\","
                                + "\"" + divBuilder.toString() + "\","
                                + s.getStudentCount();
                    writer.write(line);
                    writer.newLine();
                }
            }
        } finally {
            // Explicit resource closing in finally block (Module III)
            if (writer != null) {
                try {
                    writer.close();
                } catch (IOException e) {
                    System.err.println("Error closing BufferedWriter: " + e.getMessage());
                }
            }
        }
    }

    /**
     * Reads a plain text summary report using FileReader and BufferedReader.
     */
    public static String readSummaryText(File sourceFile) throws IOException {
        BufferedReader reader = null;
        StringBuilder content = new StringBuilder();
        try {
            reader = new BufferedReader(new FileReader(sourceFile));
            String line;
            while ((line = reader.readLine()) != null) {
                content.append(line).append("\n");
            }
        } finally {
            if (reader != null) {
                try {
                    reader.close();
                } catch (IOException e) {
                    System.err.println("Error closing BufferedReader: " + e.getMessage());
                }
            }
        }
        return content.toString();
    }

    /**
     * Serializes Subject list to binary file on disk.
     */
    public static void saveSubjectsBinary(File file, List<Subject> subjects) throws IOException {
        ObjectOutputStream oos = null;
        try {
            oos = new ObjectOutputStream(new FileOutputStream(file));
            oos.writeObject(subjects);
        } finally {
            if (oos != null) {
                try {
                    oos.close();
                } catch (IOException e) {
                    System.err.println("Error closing ObjectOutputStream: " + e.getMessage());
                }
            }
        }
    }

    /**
     * Deserializes Subject list from binary file on disk.
     */
    @SuppressWarnings("unchecked")
    public static List<Subject> loadSubjectsBinary(File file) throws IOException, ClassNotFoundException {
        ObjectInputStream ois = null;
        try {
            ois = new ObjectInputStream(new FileInputStream(file));
            Object obj = ois.readObject();
            if (obj instanceof List) {
                return (List<Subject>) obj;
            }
            return new ArrayList<Subject>();
        } finally {
            if (ois != null) {
                try {
                    ois.close();
                } catch (IOException e) {
                    System.err.println("Error closing ObjectInputStream: " + e.getMessage());
                }
            }
        }
    }
}

