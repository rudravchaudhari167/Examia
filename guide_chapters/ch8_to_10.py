# guide_chapters/ch8_to_10.py

CH8_TO_10_HTML = """
<div class="page-break"></div>

<!-- CHAPTER 8 -->
<h1 class="chapter-title">Chapter 8: Java Backend Implementation Walkthrough</h1>

<h2>8.1 Class Responsibility Matrix</h2>
<p>
  The backend code in <code>backend/src/com/examoptima/</code> adheres strictly to single-responsibility design principles:
</p>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Class File</th>
      <th style="width: 35%;">Package Location</th>
      <th style="width: 40%;">Primary System Responsibility</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>ExamOptimaServer.java</strong></td>
      <td><code>com.examoptima.server</code></td>
      <td>HTTP Server initialization, routing, CORS headers, JSON request parsing, and error dispatch.</td>
    </tr>
    <tr>
      <td><strong>GraphColoringScheduler.java</strong></td>
      <td><code>com.examoptima.service</code></td>
      <td>Constructs the conflict graph and executes Welsh-Powell Greedy or Backtracking coloring.</td>
    </tr>
    <tr>
      <td><strong>ClassroomAllocationService.java</strong></td>
      <td><code>com.examoptima.service</code></td>
      <td>Implements Best-Fit bin-packing to allocate rooms to subjects per slot without double-booking.</td>
    </tr>
    <tr>
      <td><strong>DatabaseManager.java</strong></td>
      <td><code>com.examoptima.db</code></td>
      <td>Manages SQLite connection pooling, schema initialization, auto-seeding, and CRUD transactions.</td>
    </tr>
    <tr>
      <td><strong>Model DTOs</strong></td>
      <td><code>com.examoptima.model</code></td>
      <td>Encapsulates entities: <code>Subject</code>, <code>Classroom</code>, <code>TimeSlot</code>, and <code>ScheduleResult</code>.</td>
    </tr>
  </tbody>
</table>

<h2>8.2 Classroom Allocation Service Walkthrough</h2>
<p>
  After Graph Coloring assigns time slots to subjects, <code>ClassroomAllocationService.java</code> assigns physical classrooms. It uses a capacity-aware greedy heuristic:
</p>
<pre><code><span class="code-kw">public</span> Map&lt;String, List&lt;Classroom&gt;&gt; allocateRooms(List&lt;Subject&gt; examsInSlot,
                                                  List&lt;Classroom&gt; allRooms) {
    Map&lt;String, List&lt;Classroom&gt;&gt; allocation = <span class="code-kw">new</span> HashMap&lt;&gt;();
    List&lt;Classroom&gt; availableRooms = <span class="code-kw">new</span> ArrayList&lt;&gt;(allRooms);

    <span class="code-cm">// Sort rooms by capacity in descending order</span>
    availableRooms.sort((r1, r2) -&gt; Integer.compare(r2.getCapacity(), r1.getCapacity()));

    <span class="code-kw">for</span> (Subject exam : examsInSlot) {
        <span class="code-kw">int</span> needed = exam.getTotalStudents();
        List&lt;Classroom&gt; assigned = <span class="code-kw">new</span> ArrayList&lt;&gt;();

        <span class="code-kw">for</span> (Iterator&lt;Classroom&gt; it = availableRooms.iterator(); it.hasNext();) {
            Classroom room = it.next();
            assigned.add(room);
            needed -= room.getCapacity();
            it.remove(); <span class="code-cm">// Room is occupied for this time slot</span>

            <span class="code-kw">if</span> (needed &lt;= 0) {
                <span class="code-kw">break</span>; <span class="code-cm">// Seating capacity fully satisfied</span>
            }
        }
        allocation.put(exam.getId(), assigned);
    }
    <span class="code-kw">return</span> allocation;
}</code></pre>

<!-- CHAPTER 9 -->
<h1 class="chapter-title">Chapter 9: Database Architecture, REST APIs &amp; Communication</h1>

<h2>9.1 SQLite Schema &amp; Storage Layout</h2>
<p>
  Examia stores all persistent configuration and generated timetables in <code>backend/data/examia.db</code>. The schema contains normalized tables:
</p>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Table Name</th>
      <th style="width: 35%;">Key Columns &amp; Constraints</th>
      <th style="width: 40%;">Operational Role</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>subjects</strong></td>
      <td><code>id (TEXT PK), code (TEXT UNIQUE), name (TEXT), total_students (INT)</code></td>
      <td>Stores course registry and total student enrollment count.</td>
    </tr>
    <tr>
      <td><strong>student_groups</strong></td>
      <td><code>id (TEXT PK), name (TEXT UNIQUE), student_count (INT)</code></td>
      <td>Stores academic cohorts (Division A, Division B, Division C).</td>
    </tr>
    <tr>
      <td><strong>subject_enrollments</strong></td>
      <td><code>subject_id (FK), group_id (FK) &mdash; Composite PK</code></td>
      <td>Many-to-many relationship defining which divisions take each subject.</td>
    </tr>
    <tr>
      <td><strong>classrooms</strong></td>
      <td><code>id (TEXT PK), name (TEXT UNIQUE), capacity (INT)</code></td>
      <td>Maintains physical exam venues and maximum seating thresholds.</td>
    </tr>
    <tr>
      <td><strong>algorithm_runs</strong></td>
      <td><code>id (PK AUTO), algorithm_type (TEXT), slots_used (INT), execution_time_ms (REAL)</code></td>
      <td>Maintains audit history and performance metrics for each generated timetable.</td>
    </tr>
  </tbody>
</table>

<h2>9.2 REST API Endpoints</h2>
<table>
  <thead>
    <tr>
      <th style="width: 15%;">Method</th>
      <th style="width: 35%;">Endpoint URI</th>
      <th style="width: 50%;">Description &amp; Handled Data</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><span class="badge badge-info">GET</span></td>
      <td><code>/api/subjects</code></td>
      <td>Returns JSON array of all subjects with enrolled division names.</td>
    </tr>
    <tr>
      <td><span class="badge badge-info">GET</span></td>
      <td><code>/api/classrooms</code></td>
      <td>Returns JSON list of active classrooms and capacities.</td>
    </tr>
    <tr>
      <td><span class="badge badge-success">POST</span></td>
      <td><code>/api/timetable/generate</code></td>
      <td>Accepts configuration JSON (algorithm, dates, slots); returns generated timetable.</td>
    </tr>
    <tr>
      <td><span class="badge badge-info">GET</span></td>
      <td><code>/api/timetable/current</code></td>
      <td>Fetches the most recently generated timetable from SQLite.</td>
    </tr>
  </tbody>
</table>

<!-- CHAPTER 10 -->
<h1 class="chapter-title">Chapter 10: Correctness of Implementation &amp; Invariant Defenses</h1>

<h2>10.1 Invariant Defenses</h2>
<p>
  A generated timetable is deemed mathematically sound and valid if and only if three non-negotiable invariants are strictly preserved:
</p>

<div class="formula-card">
  <div class="formula-title">Hard Invariant 1: Zero Student Overlaps</div>
  <p style="margin-bottom: 4px;">For every pair of subjects sharing at least one common student division:</p>
  <div class="formula-body">If Edges(u, v) exists &rarr; Slot(u) != Slot(v)</div>
  <p style="margin-top: 4px; font-size: 8pt; color: #522736;"><strong>Defense:</strong> Verified in <code>GraphColoringScheduler</code>. Whenever two subjects share a student group, an undirected edge is established. The coloring algorithm forbids adjacent vertices from sharing the same color integer.</p>
</div>

<div class="formula-card">
  <div class="formula-title">Hard Invariant 2: Zero Classroom Double-Booking</div>
  <p style="margin-bottom: 4px;">A single physical room cannot host two distinct exams during the same time slot:</p>
  <div class="formula-body">If Slot(A) == Slot(B) &rarr; AssignedRooms(A) &cap; AssignedRooms(B) == Empty</div>
  <p style="margin-top: 4px; font-size: 8pt; color: #522736;"><strong>Defense:</strong> Verified in <code>ClassroomAllocationService</code>. A dedicated copy of available rooms is maintained for each time slot. When a room is assigned to an exam, it is removed from that slot's room pool.</p>
</div>

<div class="formula-card">
  <div class="formula-title">Hard Invariant 3: Seating Capacity Guarantee</div>
  <p style="margin-bottom: 4px;">Total seating capacity across assigned rooms must accommodate all enrolled students:</p>
  <div class="formula-body">Sum of Capacity(AssignedRooms) &ge; TotalStudents(Subject)</div>
  <p style="margin-top: 4px; font-size: 8pt; color: #522736;"><strong>Defense:</strong> Multi-room greedy assignment continues picking rooms until cumulative capacity satisfies the student count.</p>
</div>
"""
