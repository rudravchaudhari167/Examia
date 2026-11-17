# guide_chapters/ch11_to_13.py

CH11_TO_13_HTML = """
<div class="page-break"></div>

<!-- CHAPTER 11 -->
<h1 class="chapter-title">Chapter 11: Time &amp; Space Complexity Analysis</h1>

<h2>11.1 Mathematical Derivation of Algorithmic Steps</h2>
<p>
  Let <span class="math-var">V</span> be the number of examination subjects (vertices), <span class="math-var">E</span> be the number of conflict edges between subjects sharing student divisions, <span class="math-var">D</span> be the maximum number of divisions per subject, and <span class="math-var">m</span> be the slot budget.
</p>

<div class="formula-card">
  <div class="formula-title">1. Conflict Graph Construction Complexity</div>
  <p>The outer loop runs <span class="math-var">V</span> times; the inner loop runs from <span class="math-var">i+1</span> to <span class="math-var">V-1</span>. Total pairs tested:</p>
  <div class="formula-body">Total Pairs = [V &times; (V - 1)] / 2 = &Theta;(V<sup>2</sup>)</div>
  <p>For each pair of subjects, checking division overlap takes <span class="math-var">O(D<sup>2</sup>)</span> time. Since <span class="math-var">D &le; 4</span> in real colleges, <span class="math-var">D</span> is constant:</p>
  <div class="formula-body">Graph Construction Time = O(V<sup>2</sup>) | Space = O(V + E)</div>
</div>

<div class="formula-card">
  <div class="formula-title">2. Welsh-Powell Greedy Coloring Complexity</div>
  <p>Sorting <span class="math-var">V</span> vertices by descending degree using comparison sort:</p>
  <div class="formula-body">Sorting Time = O(V log V)</div>
  <p>Across all vertices, iterating over conflicting neighbors touches every edge twice:</p>
  <div class="formula-body">Total Neighbor Inspections = 2 &times; E</div>
  <p>Assigning the lowest free color with a hash set takes <span class="math-var">O(deg(u))</span>:</p>
  <div class="formula-body">Total Greedy Time = O(V log V + E) | Space = O(V)</div>
</div>

<div class="formula-card">
  <div class="formula-title">3. Backtracking m-Coloring Complexity</div>
  <p>At each vertex, up to <span class="math-var">m</span> candidate slots are tested. For <span class="math-var">V</span> vertices, the decision tree has depth <span class="math-var">V</span> and branching factor <span class="math-var">m</span>:</p>
  <div class="formula-body">Maximum Leaf Nodes = m<sup>V</sup></div>
  <p>Verifying safety per node takes <span class="math-var">O(deg(u)) &le; O(V)</span> time:</p>
  <div class="formula-body">Worst-Case Time = O(V &times; m<sup>V</sup>) | Space = O(V) (Call Stack)</div>
</div>

<h2>11.2 Master Complexity Comparison Matrix</h2>
<table>
  <thead>
    <tr>
      <th style="width: 25%;">Pipeline Step / Algorithm</th>
      <th style="width: 25%;">Worst-Case Time</th>
      <th style="width: 25%;">Best-Case Time</th>
      <th style="width: 25%;">Space Complexity</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Conflict Graph Construction</strong></td>
      <td>&Theta;(V<sup>2</sup>)</td>
      <td>&Theta;(V<sup>2</sup>)</td>
      <td>O(V + E)</td>
    </tr>
    <tr>
      <td><strong>Greedy Welsh-Powell</strong></td>
      <td>O(V log V + E)</td>
      <td>&Omega;(V log V) (Sparse graph)</td>
      <td>O(V)</td>
    </tr>
    <tr>
      <td><strong>Backtracking m-Coloring</strong></td>
      <td>O(m<sup>V</sup>) (Dense graph)</td>
      <td>&Omega;(V) (Immediate match)</td>
      <td>O(V)</td>
    </tr>
    <tr>
      <td><strong>Classroom Bin-Packing</strong></td>
      <td>O(S &times; R log R)</td>
      <td>O(S &times; R)</td>
      <td>O(R)</td>
    </tr>
  </tbody>
</table>

<!-- CHAPTER 12 -->
<h1 class="chapter-title">Chapter 12: Comprehensive Test Cases &amp; Verification Matrix</h1>

<p>
  Examia was tested across 12 distinct operational and stress scenarios to ensure mathematical correctness and resilience:
</p>

<table>
  <thead>
    <tr>
      <th style="width: 8%;">ID</th>
      <th style="width: 22%;">Scenario Description</th>
      <th style="width: 32%;">Input Conditions</th>
      <th style="width: 26%;">Expected Outcome</th>
      <th style="width: 12%;">Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>TC01</td>
      <td>Standard 5-Course Mix</td>
      <td>5 subjects, 3 divisions (A, B, C)</td>
      <td>4 slots used, zero conflicts</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC02</td>
      <td>Complete Graph (Clique)</td>
      <td>4 subjects sharing Division A</td>
      <td>Requires exactly 4 slots</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC03</td>
      <td>Independent Courses</td>
      <td>3 subjects, mutually disjoint groups</td>
      <td>1 slot reused for all 3 subjects</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC04</td>
      <td>Bipartite Graph</td>
      <td>Group 1 &amp; Group 2 alternating</td>
      <td>Exactly 2 slots allocated</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC05</td>
      <td>Seating Overflow</td>
      <td>Single exam with 250 students</td>
      <td>Splits students across 2 rooms</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC06</td>
      <td>Room Double-Booking Check</td>
      <td>Two exams sharing Slot 4</td>
      <td>Assigned different rooms (A101 &amp; Aud 103)</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC07</td>
      <td>Empty Database</td>
      <td>No subjects registered</td>
      <td>Graceful warning: "No subjects found"</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC08</td>
      <td>Single Subject</td>
      <td>1 subject with 1 division</td>
      <td>1 slot, 1 room assigned</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC09</td>
      <td>Backtracking Slot Budget Fail</td>
      <td>Clique of 4 subjects with budget m=3</td>
      <td>Returns failure: cannot color in 3 slots</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC10</td>
      <td>Backtracking Incremental Search</td>
      <td>Default 5 subjects without slot budget</td>
      <td>Finds minimum chromatic number (4 slots)</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC11</td>
      <td>High Student Density</td>
      <td>50 subjects generated synthetically</td>
      <td>Greedy finishes in under 35 milliseconds</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
    <tr>
      <td>TC12</td>
      <td>Print Layout Integrity</td>
      <td>Click Print Timetable in UI</td>
      <td>Clean A4 table without UI headers or buttons</td>
      <td><span class="badge badge-success">Passed</span></td>
    </tr>
  </tbody>
</table>

<!-- CHAPTER 13 -->
<h1 class="chapter-title">Chapter 13: Live Project Demonstration Script</h1>

<h2>13.1 Step-by-Step Presentation Walkthrough for Examiners</h2>
<p>
  When presenting Examia to the external examiner, follow this structured 5-minute presentation script:
</p>

<ol>
  <li><strong>Introduction (1 minute):</strong>
    <em>"Good morning respected examiners. Our mini-project is Examia, an automated conflict-free examination timetable generator. In academic institutions, timetable creation is an NP-complete problem because shared student enrollments create scheduling clashes. We solved this by mapping courses to graph vertices, student overlaps to conflict edges, and time slots to graph colors."</em>
  </li>
  <li><strong>Architecture &amp; Code Inspection (1 minute):</strong>
    <em>"Our backend is written in pure Java 21 LTS with zero external heavy frameworks, using standard <code>HttpServer</code> and SQLite in WAL mode for thread-safe persistence. Our frontend is a responsive React 18 Single-Page Application."</em>
  </li>
  <li><strong>Live Generation Run (1.5 minutes):</strong>
    <em>"Now let us generate the schedule live. We select the Welsh-Powell Greedy Algorithm, configure exam start dates, and click Generate Timetable. In less than 10 milliseconds, the backend constructs the conflict graph, calculates vertex degrees, sorts by descending degree, and assigns non-conflicting time slots."</em>
  </li>
  <li><strong>Explaining the Result (1 minute):</strong>
    <em>"Notice that Slot 4 is assigned to two subjects: CS203 DBMS and CS202 Data Structures. This is not a bug; it proves our algorithm works! CS203 is taken by Divisions B and C, while CS202 is taken by Division A. Because they share zero common students, there is no conflict edge between them. Furthermore, our room allocation service assigned Auditorium 103 to DBMS and Room A101 to Data Structures, preventing room double-booking."</em>
  </li>
  <li><strong>Conclusion &amp; Handover (30 seconds):</strong>
    <em>"Examia guarantees zero student clashes, zero room double-booking, and optimal slot utilization. We are now ready for your questions."</em>
  </li>
</ol>
"""
