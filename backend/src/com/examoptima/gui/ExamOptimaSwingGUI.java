package com.examoptima.gui;

import com.examoptima.algorithm.BacktrackingColoring;
import com.examoptima.algorithm.GreedyColoring;
import com.examoptima.io.TimetableFileManager;
import com.examoptima.model.ColoringResult;
import com.examoptima.model.ConflictGraph;
import com.examoptima.model.Subject;

import java.awt.BorderLayout;
import java.awt.Color;
import java.awt.FlowLayout;
import java.awt.Font;
import java.awt.GridLayout;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JTable;
import javax.swing.JTextArea;
import javax.swing.SwingUtilities;
import javax.swing.table.DefaultTableModel;

/**
 * Module V: GUI Programming and Event Handling using Swing & AWT.
 * 
 * Demonstrates:
 * - JFrame, JPanel, JButton, JLabel, JTable, JTextArea, JScrollPane
 * - Layout Managers: BorderLayout, FlowLayout, GridLayout
 * - ActionListener interface implementation & event handling mechanism
 */
public class ExamOptimaSwingGUI extends JFrame implements ActionListener {
    private static final long serialVersionUID = 1L;

    // GUI Components
    private JTable subjectTable;
    private DefaultTableModel tableModel;
    private JTextArea logArea;
    private JButton btnGreedy;
    private JButton btnBacktrack;
    private JButton btnExport;
    private JButton btnReset;
    private JLabel statusLabel;

    // Data models
    private List<Subject> currentSubjects;
    private ColoringResult latestResult;

    public ExamOptimaSwingGUI() {
        // Initialize window properties
        super("Examia — DAA Timetable Scheduling Engine (Java Swing)");
        setSize(850, 600);
        setDefaultCloseOperation(JFrame.DISPOSE_ON_CLOSE);
        setLocationRelativeTo(null);

        // Layout Manager: BorderLayout for main window (Module V)
        setLayout(new BorderLayout(10, 10));

        // 1. Top Panel: Header Label
        JPanel topPanel = new JPanel(new FlowLayout(FlowLayout.CENTER));
        topPanel.setBackground(new Color(250, 248, 243));
        JLabel titleLabel = new JLabel("Examia: Intelligent Examination Timetable Generator");
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 18));
        titleLabel.setForeground(new Color(48, 45, 53));
        topPanel.add(titleLabel);
        add(topPanel, BorderLayout.NORTH);

        // 2. Center Panel: Split into Table (Top) and Log Area (Bottom) using GridLayout
        JPanel centerPanel = new JPanel(new GridLayout(2, 1, 10, 10));

        // Table Model with benchmark subjects
        String[] columns = {"Code", "Subject Name", "Enrolled Divisions", "Students", "Assigned Slot"};
        tableModel = new DefaultTableModel(columns, 0);
        subjectTable = new JTable(tableModel);
        subjectTable.setFont(new Font("SansSerif", Font.PLAIN, 12));
        subjectTable.setRowHeight(24);
        JScrollPane tableScrollPane = new JScrollPane(subjectTable);

        // Text Area for logging algorithm execution metrics
        logArea = new JTextArea();
        logArea.setEditable(false);
        logArea.setFont(new Font("Monospaced", Font.PLAIN, 12));
        logArea.setBackground(new Color(244, 240, 232));
        JScrollPane logScrollPane = new JScrollPane(logArea);

        centerPanel.add(tableScrollPane);
        centerPanel.add(logScrollPane);
        add(centerPanel, BorderLayout.CENTER);

        // 3. Bottom Panel: Action Buttons and Status Label (FlowLayout)
        JPanel bottomPanel = new JPanel(new BorderLayout(5, 5));
        JPanel buttonsPanel = new JPanel(new FlowLayout(FlowLayout.CENTER, 10, 10));

        btnGreedy = new JButton("Run Welsh-Powell Greedy");
        btnBacktrack = new JButton("Run Backtracking DFS");
        btnExport = new JButton("Export CSV");
        btnReset = new JButton("Reset Benchmark");

        // Event Handling: Register ActionListener (Module V)
        btnGreedy.addActionListener(this);
        btnBacktrack.addActionListener(this);
        btnExport.addActionListener(this);
        btnReset.addActionListener(this);

        buttonsPanel.add(btnGreedy);
        buttonsPanel.add(btnBacktrack);
        buttonsPanel.add(btnExport);
        buttonsPanel.add(btnReset);

        statusLabel = new JLabel("Ready. Click an algorithm button to color the conflict graph.", JLabel.CENTER);
        statusLabel.setFont(new Font("SansSerif", Font.ITALIC, 12));
        statusLabel.setForeground(new Color(88, 118, 94));

        bottomPanel.add(buttonsPanel, BorderLayout.CENTER);
        bottomPanel.add(statusLabel, BorderLayout.SOUTH);
        add(bottomPanel, BorderLayout.SOUTH);

        // Load Initial Benchmark Subjects
        loadBenchmarkSubjects();
    }

    /**
     * Seeds the standard college benchmark data.
     */
    private void loadBenchmarkSubjects() {
        currentSubjects = new ArrayList<Subject>();
        currentSubjects.add(new Subject("sub-1", "CS201", "Java Programming", Arrays.asList("Division A", "Division B"), 90, "Core"));
        currentSubjects.add(new Subject("sub-2", "CS202", "Data Structures", Arrays.asList("Division A"), 45, "Core"));
        currentSubjects.add(new Subject("sub-3", "CS203", "DBMS", Arrays.asList("Division B", "Division C"), 85, "Core"));
        currentSubjects.add(new Subject("sub-4", "CS204", "Operating Systems", Arrays.asList("Division A", "Division C"), 80, "Core"));
        currentSubjects.add(new Subject("sub-5", "MA201", "Mathematics", Arrays.asList("Division A", "Division B", "Division C"), 130, "Foundational"));

        refreshTable(null);
        logArea.setText("Benchmark subjects loaded.\nConflicts detected automatically based on shared student divisions.\n");
    }

    /**
     * Refreshes JTable with current subjects and any assigned examination slots.
     */
    private void refreshTable(Map<String, Integer> assignments) {
        tableModel.setRowCount(0);
        for (int i = 0; i < currentSubjects.size(); i++) {
            Subject s = currentSubjects.get(i);
            String slotText = "Unscheduled";
            if (assignments != null && assignments.containsKey(s.getId())) {
                slotText = "Slot " + (assignments.get(s.getId()) + 1);
            }

            tableModel.addRow(new Object[]{
                s.getCode(),
                s.getName(),
                String.join(", ", s.getDivisions()),
                s.getStudentCount(),
                slotText
            });
        }
    }

    /**
     * Module V: Event Handling Mechanism.
     * Invoked when any button is clicked.
     */
    @Override
    public void actionPerformed(ActionEvent e) {
        Object source = e.getSource();

        if (source == btnGreedy) {
            runGreedy();
        } else if (source == btnBacktrack) {
            runBacktracking();
        } else if (source == btnExport) {
            exportCSV();
        } else if (source == btnReset) {
            loadBenchmarkSubjects();
            statusLabel.setText("Benchmark dataset reloaded.");
        }
    }

    private void runGreedy() {
        ConflictGraph graph = new ConflictGraph(currentSubjects);
        latestResult = GreedyColoring.solve(graph);

        refreshTable(latestResult.getSlotAssignments());
        logArea.append("\n======================================================\n");
        logArea.append("Algorithm: " + latestResult.getAlgorithmName() + "\n");
        logArea.append("Vertices: " + graph.getVertexCount() + " | Conflict Edges: " + graph.getEdgeCount() + "\n");
        logArea.append("Examination Slots Required: " + latestResult.getNumSlots() + "\n");
        logArea.append("Execution Time: " + String.format("%.4f", latestResult.getExecutionTimeMs()) + " ms (" + latestResult.getExecutionTimeNanos() + " ns)\n");
        logArea.append("Search Operations: " + latestResult.getOperationsCount() + " color checks\n");
        logArea.append("Validity Check: " + (latestResult.isValid() ? "100% CONFLICT-FREE" : "VIOLATION") + "\n");

        statusLabel.setText("Greedy Coloring Complete. Slots used: " + latestResult.getNumSlots());
    }

    private void runBacktracking() {
        ConflictGraph graph = new ConflictGraph(currentSubjects);
        latestResult = BacktrackingColoring.solve(graph, 0); // automatic chromatic search

        refreshTable(latestResult.getSlotAssignments());
        logArea.append("\n======================================================\n");
        logArea.append("Algorithm: " + latestResult.getAlgorithmName() + "\n");
        logArea.append("Vertices: " + graph.getVertexCount() + " | Conflict Edges: " + graph.getEdgeCount() + "\n");
        logArea.append("Minimum Chromatic Number: " + latestResult.getNumSlots() + " slots\n");
        logArea.append("Execution Time: " + String.format("%.4f", latestResult.getExecutionTimeMs()) + " ms (" + latestResult.getExecutionTimeNanos() + " ns)\n");
        logArea.append("Recursive Calls: " + latestResult.getOperationsCount() + "\n");
        logArea.append("Validity Check: " + (latestResult.isValid() ? "100% CONFLICT-FREE" : "VIOLATION") + "\n");

        statusLabel.setText("Backtracking Complete. Exact chromatic number: " + latestResult.getNumSlots());
    }

    private void exportCSV() {
        if (latestResult == null) {
            JOptionPane.showMessageDialog(this, "Please run an algorithm first before exporting.", "Notice", JOptionPane.INFORMATION_MESSAGE);
            return;
        }

        try {
            File exportFile = new File("Examia_Schedule.csv");
            TimetableFileManager.exportTimetableToCSV(exportFile, currentSubjects, latestResult);
            JOptionPane.showMessageDialog(this, "Timetable exported successfully to:\n" + exportFile.getAbsolutePath(), "Export Success", JOptionPane.INFORMATION_MESSAGE);
            logArea.append("\nFile I/O: Exported timetable to " + exportFile.getName() + " using BufferedWriter.\n");
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, "File export failed: " + ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    /**
     * Standalone main method to launch the Swing GUI.
     */
    public static void main(String[] args) {
        SwingUtilities.invokeLater(new Runnable() {
            @Override
            public void run() {
                ExamOptimaSwingGUI gui = new ExamOptimaSwingGUI();
                gui.setVisible(true);
            }
        });
    }
}

