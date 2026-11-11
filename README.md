# Examia: Intelligent Examination Timetable Generator
### DAA Mini-Project — Graph Coloring & Backtracking Scheduling Engine
> **Tagline:** *"Smarter Scheduling. Conflict-Free Examinations."*  
> **Platform Subtitle:** *Academic Intelligence Platform*

Examia is an automated examination scheduling application engineered to demonstrate the real-world application of **Design and Analysis of Algorithms (DAA)** techniques. It transforms institutional student enrollment data into a mathematical **Conflict Graph $G = (V, E)$** and computes optimal, conflict-free examination schedules using both **Welsh-Powell Greedy Graph Coloring** and **Recursive Backtracking (DFS with Pruning)**.

The backend Java implementation strictly follows undergraduate BTech CSE Java curriculum concepts (OOP, Inheritance, Interfaces, Exception Handling, File I/O, Multithreading, Collections, and Swing GUI) without unnecessary advanced frameworks or syntax.

---

## 🏛️ 1. Project Architecture

The system features a decoupled dual-engine architecture:

```
DAA Miniproject/
├── backend/                             # Java 21 LTS Standard Library Backend
│   ├── src/com/examoptima/
│   │   ├── model/
│   │   │   ├── Subject.java             # Module I & III: Vertex model, Encapsulation, Serializable
│   │   │   ├── ConflictGraph.java       # Module I & IV: Graph vertices & edges, Map, Set, Iterator
│   │   │   └── ColoringResult.java      # Module I & III: Encapsulated metrics, Serializable
│   │   ├── algorithm/
│   │   │   ├── TimetableAlgorithm.java  # Module II: Interface definition
│   │   │   ├── BaseColoringAlgorithm.java# Module II: Abstract class, method overriding, super, final
│   │   │   ├── GreedyColoring.java      # Welsh-Powell O(V log V + E) with Anonymous Comparator
│   │   │   └── BacktrackingColoring.java# Recursive Backtracking DFS m-coloring with pruning
│   │   ├── exception/
│   │   │   ├── SchedulingException.java # Module III: Custom checked exception
│   │   │   └── InvalidSubjectException.java # Module II & III: Multilevel inheritance exception
│   │   ├── io/
│   │   │   └── TimetableFileManager.java# Module III: File, FileReader/Writer, BufferedReader/Writer, Serialization
│   │   ├── gui/
│   │   │   └── ExamOptimaSwingGUI.java  # Module V: Swing Desktop GUI (JFrame, JTable, ActionListener)
│   │   └── server/
│   │       ├── ExamOptimaServer.java    # Module IV: Thread, Runnable, synchronized, HttpServer on :8080
│   │       └── JsonHelper.java          # Module I: Standard string & loop parsing (no 3rd-party JARs)
│   └── bin/                             # Compiled bytecode (Java 21 LTS, Major Version 65)
├── frontend/                            # High-End Editorial Academic React Interface
│   ├── src/
│   │   ├── algorithms/                  # Client-side mirror of DAA algorithms
│   │   │   ├── graph.js                 # Conflict detection & verification
│   │   │   ├── greedyColoring.js        # Welsh-Powell in JavaScript
│   │   │   ├── backtrackingColoring.js  # Recursive backtracking in JavaScript
│   │   │   └── roomAllocator.js         # Best-Fit Decreasing Hall Allocator
│   │   ├── api/apiService.js            # Auto-detects Java Backend or falls back to Browser
│   │   ├── components/                  # Premium UI components & Interactive SVG Graph
│   │   ├── views/                       # 7 Core Views (Overview, Subjects, Divisions, Graph,
│   │   │                                #  Generate, Comparison, Final Schedule)
│   │   └── data/defaultData.js          # Benchmark curriculum dataset
├── start.sh                             # All-in-one launcher script
├── compile-backend.sh                   # Java 21 backend compiler
└── run-backend.sh                       # Standalone Java REST server runner
```

---

## 📚 2. College Java Syllabus Concepts Mapping

| Syllabus Module | Concepts Covered | Implementation in Examia |
| :--- | :--- | :--- |
| **Module I: OOP & Java Basics** | Classes, objects, encapsulation, constructor overloading, static members, control structures | `Subject`, `ConflictGraph`, and `ColoringResult` encapsulate private data with getters/setters. Multiple overloaded constructors in `Subject`. Control flow via `for`, `while`, `if-else`. |
| **Module II: Inheritance & Interfaces** | Single/multilevel inheritance, abstract classes, interfaces, method overriding, `super`, `final` | `TimetableAlgorithm` (Interface), `BaseColoringAlgorithm` (Abstract class). `GreedyColoring` and `BacktrackingColoring` extend `BaseColoringAlgorithm`. Subclasses call `super()`. Validation method marked `final`. `InvalidSubjectException` extends `SchedulingException` (multilevel). |
| **Module III: Exceptions & File I/O** | Custom exceptions, `try-catch-finally`, `throw`, `throws`, `File`, `FileReader`/`FileWriter`, `BufferedReader`/`BufferedWriter`, Serialization | Custom exceptions `SchedulingException` and `InvalidSubjectException`. `TimetableFileManager` exports CSV using `BufferedWriter` and serializes `Subject` lists with `ObjectOutputStream`/`ObjectInputStream`. Resource streams closed safely in `finally`. |
| **Module IV: Multithreading & Collections** | Thread lifecycle, `Thread` & `Runnable`, `synchronized`, `List`, `Set`, `Map`, `Iterator`, Generics | `ExamOptimaServer` dispatches each HTTP request to a worker `Thread(Runnable)`. Synchronized request counter. Collections: `ArrayList<Subject>`, `HashSet<String>`, `HashMap<String, Integer>`. Traversed using explicit `Iterator` objects. `Comparator<Subject>` implemented via traditional anonymous inner class (NO lambdas). |
| **Module V: GUI Programming & Event Handling** | AWT, Swing, Layout managers, `ActionListener`, event handling | `ExamOptimaSwingGUI` extends `JFrame` implements `ActionListener`. Built using `BorderLayout`, `GridLayout`, `FlowLayout`, `JTable`, `JTextArea`, `JButton`. Run standalone with `java -cp backend/bin com.examoptima.gui.ExamOptimaSwingGUI`. |

---

## 📐 3. Algorithmic Formulation

### A. Conflict Graph Representation
- **Vertices $V$:** Each examination subject $S_i$.
- **Edges $E$:** An undirected edge $(S_i, S_j) \in E$ is formed if and only if:
  $$\text{Divisions}(S_i) \cap \text{Divisions}(S_j) \neq \emptyset$$
- **Coloring Condition:** Find an assignment $c: V \to \{0, 1, \dots, k-1\}$ such that:
  $$(u, v) \in E \implies c(u) \neq c(v)$$
  Each color index $c$ maps directly to a non-conflicting examination time slot.

### B. Greedy Graph Coloring (Welsh-Powell Heuristic)
1. Calculate the degree $\text{deg}(v)$ for every vertex in $G$.
2. Sort vertices in non-increasing degree order using a `Comparator<Subject>`: $\text{deg}(v_1) \ge \text{deg}(v_2) \ge \dots \ge \text{deg}(v_n)$.
3. Assign the smallest non-negative integer color $c \ge 0$ not currently occupied by any colored neighbor.
4. **Time Complexity:** $O(V \log V + E)$
5. **Space Complexity:** $O(V)$
6. **Properties:** Polynomial-time heuristic; guarantees an upper bound of $\Delta(G) + 1$ colors.

### C. Backtracking Graph Coloring (Exact Recursive DFS)
1. Recursively attempt to assign time slots $0 \dots m-1$ to vertices.
2. At each assignment, check if the slot is safe (`isSafe` checking adjacent neighbors in $G$).
3. If safe, tentatively color the vertex and recurse to the next vertex.
4. If a dead end is reached (no valid slot exists for the next vertex), **backtrack**: undo the assignment and try the next slot.
5. Can solve for a constrained budget $m$, or iteratively find the exact chromatic number $\chi(G)$ starting from $k = 1$.
6. **Time Complexity:** $O(m^V)$ worst-case.
7. **Space Complexity:** $O(V)$ call-stack depth.

---

## 🎨 4. Design System & Palette

- **Warm Ivory:** `#FAF8F3` (App background)
- **Soft Cream:** `#F4F0E8` (Sidebar & card accents)
- **Muted Lavender:** `#E8E0F5` (Slot 1, badges & primary accents)
- **Dusty Purple:** `#9882BD` (Primary interactive buttons & headers)
- **Sage Green:** `#DDE9DB` / **Forest Green:** `#58765E` (Slot 2, verification states)
- **Soft Peach:** `#F7DFD2` / **Terracotta:** `#C77D61` (Slot 3, conflict indicators)
- **Dusty Rose:** `#F2D9E2` (Slot 4) & **Soft Amber:** `#F6E6C9` (Slot 5)
- **Charcoal Text:** `#302D35` & **Muted Gray:** `#89858D`
- **Typography:** *Fraunces* (Editorial Serif headings) + *Plus Jakarta Sans* (Body) + *JetBrains Mono* (Code/Metrics)

---

## 🚀 5. How to Run the Project

### One-Command Quickstart
```bash
./start.sh
```
This script compiles the Java backend with `--release 21`, starts the REST API on **`http://localhost:8080`**, and launches the React frontend on **`http://localhost:3000`**.

### Independent Manual Execution

#### Terminal 1 — Java Backend Server:
```bash
./run-backend.sh 8080
```

#### Terminal 2 — React Web Frontend:
```bash
cd frontend
npm run dev
```

#### Terminal 3 — Swing Desktop GUI (Optional viva demo):
```bash
java -cp backend/bin com.examoptima.gui.ExamOptimaSwingGUI
```
