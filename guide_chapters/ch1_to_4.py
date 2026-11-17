# guide_chapters/ch1_to_4.py

CH1_TO_4_HTML = """
<div class="page-break"></div>

<!-- CHAPTER 1 -->
<h1 class="chapter-title">Chapter 1: Project Introduction &amp; Problem Statement</h1>

<h2>1.1 What is Examia?</h2>
<p>
  <strong>Examia</strong> is an automated, conflict-free examination scheduling and room allocation system developed for academic institutions. In universities and engineering colleges, organizing end-semester examinations is a notoriously complex administrative task. An institution offers dozens of courses across multiple engineering divisions (for example, Division A, Division B, and Division C). Many subjects have cross-departmental or shared student enrollments.
</p>
<p>
  If two examinations with common students are scheduled in the same time slot, a <strong>student conflict</strong> occurs, making it physically impossible for enrolled students to take both exams. Furthermore, even after resolving timing conflicts, the institution must allocate classrooms without exceeding student capacities or assigning the same classroom to two distinct exams simultaneously (a <strong>room conflict</strong>).
</p>
<p>
  Examia completely solves this problem by modeling examination timetabling as a <strong>Graph Coloring Problem</strong>. It provides two powerful Design and Analysis of Algorithms (DAA) strategies: the <strong>Welsh-Powell Greedy Graph Coloring Algorithm</strong> and the exact <strong>Backtracking Algorithm</strong>, coupled with a capacity-aware greedy classroom bin-packing algorithm.
</p>

<h2>1.2 The Problem Statement</h2>
<p>
  Formally, the <strong>Examination Timetabling Problem (ETP)</strong> is defined as follows:
</p>

<div class="callout">
  <div class="callout-title">Formal Problem Definition</div>
  <p>
    Given a set of <span class="math-var">N</span> academic subjects <span class="math-var">S = {s<sub>1</sub>, s<sub>2</sub>, ..., s<sub>N</sub>}</span>, a set of student divisions enrolled in each subject, a set of available classrooms <span class="math-var">C = {c<sub>1</sub>, c<sub>2</sub>, ..., c<sub>M</sub>}</span> each with a fixed seating capacity, and a configured examination period consisting of calendar dates and daily time slots:
  </p>
  <ul>
    <li><strong>Objective 1:</strong> Assign each subject <span class="math-var">s<sub>i</sub></span> to an examination time slot such that no two subjects sharing enrolled students are assigned to the same time slot.</li>
    <li><strong>Objective 2:</strong> Minimize the total number of time slots used (approximating the <em>Chromatic Number</em> of the conflict graph).</li>
    <li><strong>Objective 3:</strong> For every subject in each time slot, assign one or more classrooms such that the sum of room capacities is greater than or equal to the total enrolled students, and no classroom is double-booked in the same slot.</li>
  </ul>
</div>

<h2>1.3 Computational Complexity: NP-Completeness</h2>
<p>
  The general Graph Coloring Problem (determining whether a graph can be colored with <span class="math-var">k</span> colors for <span class="math-var">k &ge; 3</span>) was proven to be <strong>NP-Complete</strong> by Richard Karp in 1972.
</p>
<p>
  Because the Examination Timetabling Problem is isomorphic to Graph Vertex Coloring, finding the absolute minimum number of examination slots is NP-hard. A brute-force search over <span class="math-var">m</span> slots and <span class="math-var">V</span> subjects requires checking <span class="math-var">m<sup>V</sup></span> possibilities, which is computationally intractable for realistic university schedules. This theoretical foundation justifies the implementation of:
</p>
<ol>
  <li><strong>Greedy Graph Coloring (Welsh-Powell Heuristic):</strong> Executes in polynomial time <span class="math-var">O(V log V + E)</span> to produce near-optimal, conflict-free schedules in under 5 milliseconds.</li>
  <li><strong>Backtracking Algorithm with State-Space Pruning:</strong> Systematically explores potential colorings with depth-first branch-and-bound pruning to find the exact minimal chromatic number for moderate-sized input graphs.</li>
</ol>

<!-- CHAPTER 2 -->
<h1 class="chapter-title">Chapter 2: Problem Selection &amp; Real-World Applications</h1>

<h2>2.1 Why We Selected This Problem</h2>
<p>
  Examination scheduling was selected because it represents a perfect bridge between rigorous theoretical computer science and real-world practical software engineering:
</p>
<ul>
  <li><strong>Direct Algorithmic Applicability:</strong> Graph theory and graph coloring are standard pillars of DAA curricula. Rather than demonstrating graph coloring on synthetic test graphs, Examia applies it directly to a tangible, high-stakes operational problem.</li>
  <li><strong>Multi-Constraint Optimization:</strong> Timetabling involves both <em>Hard Constraints</em> (zero student overlap, zero room double-booking, seating capacity limits) and <em>Soft Constraints</em> (slot minimization, compact dates).</li>
  <li><strong>Measurable Benchmarks:</strong> It allows direct, empirical comparison between greedy heuristics and exact backtracking algorithms on execution time, recursion depth, and total slots used.</li>
</ul>

<h2>2.2 Manual Timetable Scheduling vs. Examia Automation</h2>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">Evaluation Metric</th>
      <th style="width: 37%;">Manual College Scheduling</th>
      <th style="width: 38%;">Examia Automated Engine</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Computation Time</strong></td>
      <td>3 to 7 working days of manual trial and error.</td>
      <td>Less than 10 milliseconds (<span class="math-var">O(V log V + E)</span>).</td>
    </tr>
    <tr>
      <td><strong>Conflict Guarantee</strong></td>
      <td>Prone to human oversight, resulting in student clashes.</td>
      <td>Mathematically guaranteed zero clashes via adjacency checking.</td>
    </tr>
    <tr>
      <td><strong>Slot Efficiency</strong></td>
      <td>Excessive slots assigned due to conservative scheduling.</td>
      <td>Minimizes slots close to the graph's chromatic number.</td>
    </tr>
    <tr>
      <td><strong>Classroom Seating</strong></td>
      <td>Frequent room overflows and manual headcount mismatch.</td>
      <td>Greedy Best-Fit bin-packing ensures seating sufficiency.</td>
    </tr>
    <tr>
      <td><strong>Rescheduling Agility</strong></td>
      <td>Emergency changes require restarting the entire manual process.</td>
      <td>Instant re-generation upon adding or modifying courses.</td>
    </tr>
  </tbody>
</table>

<!-- CHAPTER 3 -->
<h1 class="chapter-title">Chapter 3: Project Architecture &amp; Technology Stack</h1>

<h2>3.1 Architecture Overview</h2>
<p>
  Examia is built with a decoupled, high-performance 3-tier architecture adhering to clean separation of concerns:
</p>

<!-- ARCHITECTURE SVG DIAGRAM -->
<div class="diagram-container">
  <svg width="100%" height="210" viewBox="0 0 650 210" xmlns="http://www.w3.org/2000/svg">
    <!-- Frontend Layer -->
    <rect x="20" y="15" width="610" height="42" rx="6" fill="#FDF7F8" stroke="#642F43" stroke-width="1.5"/>
    <text x="35" y="40" font-family="-apple-system, sans-serif" font-size="11" font-weight="bold" fill="#642F43">CLIENT LAYER (FRONTEND)</text>
    <text x="230" y="40" font-family="-apple-system, sans-serif" font-size="9.5" fill="#2D1A22">React 18 Single-Page App  |  Tailwind CSS  |  Lucide Icons  |  Vite Bundler</text>

    <!-- Communication Arrow -->
    <line x1="325" y1="57" x2="325" y2="78" stroke="#781D42" stroke-width="2" stroke-dasharray="4,3"/>
    <polygon points="325,82 321,75 329,75" fill="#781D42"/>
    <text x="335" y="72" font-family="-apple-system, sans-serif" font-size="8" font-weight="bold" fill="#781D42">HTTP REST API (JSON / port 8080)</text>

    <!-- Backend Layer -->
    <rect x="20" y="85" width="610" height="68" rx="6" fill="#FAF0F2" stroke="#781D42" stroke-width="1.5"/>
    <text x="35" y="105" font-family="-apple-system, sans-serif" font-size="11" font-weight="bold" fill="#781D42">BACKEND LOGIC (JAVA 21 LTS)</text>
    <text x="250" y="105" font-family="-apple-system, sans-serif" font-size="9" fill="#522736">com.sun.net.httpserver.HttpServer  |  Concurrent ThreadPoolExecutor</text>

    <!-- Sub components inside Backend -->
    <rect x="35" y="115" width="275" height="30" rx="4" fill="#FFFFFF" stroke="#A3485E" stroke-width="1"/>
    <text x="45" y="133" font-family="-apple-system, sans-serif" font-size="8.5" font-weight="bold" fill="#642F43">GraphColoringScheduler.java</text>
    <text x="180" y="133" font-family="-apple-system, sans-serif" font-size="8" fill="#7D5563">(Greedy &amp; Backtracking)</text>

    <rect x="330" y="115" width="285" height="30" rx="4" fill="#FFFFFF" stroke="#A3485E" stroke-width="1"/>
    <text x="340" y="133" font-family="-apple-system, sans-serif" font-size="8.5" font-weight="bold" fill="#642F43">ClassroomAllocationService.java</text>
    <text x="500" y="133" font-family="-apple-system, sans-serif" font-size="8" fill="#7D5563">(Best-Fit Bin Packing)</text>

    <!-- Communication Arrow to DB -->
    <line x1="325" y1="153" x2="325" y2="171" stroke="#642F43" stroke-width="2"/>
    <polygon points="325,175 321,168 329,168" fill="#642F43"/>
    <text x="335" y="166" font-family="-apple-system, sans-serif" font-size="8" font-weight="bold" fill="#642F43">JDBC Thread-Safe Connection Pool</text>

    <!-- Database Layer -->
    <rect x="20" y="177" width="610" height="28" rx="5" fill="#ECE0E3" stroke="#642F43" stroke-width="1.5"/>
    <text x="35" y="195" font-family="-apple-system, sans-serif" font-size="10" font-weight="bold" fill="#642F43">PERSISTENCE LAYER (SQLITE WAL MODE)</text>
    <text x="300" y="195" font-family="-apple-system, sans-serif" font-size="8.5" fill="#2D1A22">examia.db  |  Tables: subjects, student_groups, classrooms, algorithm_runs</text>
  </svg>
  <div class="diagram-caption">Figure 3.1: Complete Architectural Flow of the Examia System</div>
</div>

<h2>3.2 Technology Stack Details</h2>
<ul>
  <li><strong>Java 21 LTS:</strong> Used for the core server and algorithms. Utilizes modern Java features such as pattern matching, the standard light-weight HTTP server (<code>com.sun.net.httpserver</code>), and robust object-oriented collections without heavy third-party framework overhead.</li>
  <li><strong>SQLite 3 with WAL Mode:</strong> A self-contained, serverless embedded database. Write-Ahead Logging (WAL) is enabled for high-concurrency read-write performance without locking errors.</li>
  <li><strong>React 18 SPA:</strong> Single-Page Application running on Vite, providing a modern user interface for subject management, visual graph inspections, and printable PDF examination timetables.</li>
</ul>

<!-- CHAPTER 4 -->
<h1 class="chapter-title">Chapter 4: Complete Project Working (Step-by-Step Lifecycle)</h1>

<p>
  When a user operates Examia, the system transitions through 11 sequential, well-defined execution steps:
</p>

<ol>
  <li><strong>Database Initialization:</strong> Upon startup, <code>DatabaseManager.java</code> establishes a thread-safe connection to <code>examia.db</code> and executes DDL scripts to verify that tables (<code>subjects</code>, <code>student_groups</code>, <code>subject_enrollments</code>, <code>classrooms</code>, <code>algorithm_runs</code>) exist.</li>
  <li><strong>Default Seeding:</strong> If the database is empty, Examia automatically populates realistic mock data: 5 core subjects (CS201, CS202, CS203, CS204, MA201), 3 student divisions (Division A with 45 students, Division B with 45 students, Division C with 40 students), and 4 physical classrooms (A101, B202, Mega Hall 201, Auditorium 103).</li>
  <li><strong>Client Configuration:</strong> The user selects the desired scheduling algorithm (Greedy Welsh-Powell or Backtracking), specifies an examination start date, and sets available daily time slots (e.g., Slot 1: 09:00 AM - 12:00 PM; Slot 2: 01:00 PM - 04:00 PM).</li>
  <li><strong>API Request Dispatch:</strong> The React frontend packages the parameters into a JSON payload and issues an HTTP <code>POST /api/timetable/generate</code> request to the Java backend.</li>
  <li><strong>Data Retrieval:</strong> <code>ExamOptimaServer.java</code> invokes <code>DatabaseManager</code> to load all subjects, their enrolled divisions, student counts, and active classrooms.</li>
  <li><strong>Conflict Graph Construction:</strong> The Java backend constructs an undirected graph <span class="math-var">G = (V, E)</span>. Each subject represents a vertex. For every pair of subjects <span class="math-var">(s<sub>i</sub>, s<sub>j</sub>)</span>, if their enrolled divisions overlap, an undirected edge is created.</li>
  <li><strong>Graph Coloring Execution:</strong> The selected algorithm assigns a non-negative color integer <span class="math-var">c &ge; 0</span> to every vertex such that adjacent vertices receive different colors.</li>
  <li><strong>Date &amp; Time Slot Mapping:</strong> Color integers (0, 1, 2, ...) are mapped to physical calendar dates and daily time windows.</li>
  <li><strong>Classroom Bin-Packing Allocation:</strong> For each time slot, <code>ClassroomAllocationService.java</code> assigns classrooms to subjects. It uses a capacity-aware Best-Fit strategy to prevent room double-booking and ensure total seating capacity meets student enrollment.</li>
  <li><strong>Database Persistence:</strong> The schedule, room allocations, execution time, and algorithm metrics are stored atomically inside SQLite.</li>
  <li><strong>UI Rendering &amp; Print Preview:</strong> The JSON response is returned to React, rendering an interactive timetable with room breakdown accordions and a clean print view.</li>
</ol>
"""
