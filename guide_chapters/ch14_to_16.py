# guide_chapters/ch14_to_16.py

CH14_TO_16_HTML = """
<div class="page-break"></div>

<!-- CHAPTER 14 -->
<h1 class="chapter-title">Chapter 14: Individual Contribution &amp; Team Viva Preparation</h1>

<h2>14.1 Team Responsibility Matrix (3 Members)</h2>
<p>
  To ensure every team member demonstrates clear ownership during the viva, responsibilities are allocated across 3 distinct technical domains:
</p>

<table>
  <thead>
    <tr>
      <th style="width: 20%;">Role / Member</th>
      <th style="width: 40%;">Core Responsibilities &amp; Implemented Modules</th>
      <th style="width: 40%;">Key Viva Topics to Defend</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Member 1:<br>DAA &amp; Algorithms Specialist</strong></td>
      <td>
        Implemented <code>GraphColoringScheduler.java</code>; graph construction logic, degree calculation, Welsh-Powell sorting, and recursive Backtracking with <code>isSafe()</code> pruning.
      </td>
      <td>
        Graph coloring definitions, Welsh-Powell degree heuristic, Chromatic Number &chi;(G), worst-case &amp; best-case time complexity, recursion tree pruning, and NP-completeness.
      </td>
    </tr>
    <tr>
      <td><strong>Member 2:<br>Java Backend Architect</strong></td>
      <td>
        Implemented <code>ExamOptimaServer.java</code> and <code>ClassroomAllocationService.java</code>; HTTP routing, JSON serialization, concurrency thread pools, and capacity bin-packing.
      </td>
      <td>
        Lightweight HTTP server architecture, REST endpoints, room allocation bin-packing logic, handling capacity overflows, multithreading, and error response handling.
      </td>
    </tr>
    <tr>
      <td><strong>Member 3:<br>Database &amp; Frontend Engineer</strong></td>
      <td>
        Implemented <code>DatabaseManager.java</code> (SQLite WAL mode, schema design, auto-seeding) and React 18 frontend (Vite, Tailwind UI, print CSS).
      </td>
      <td>
        Database schema, many-to-many enrollment table, WAL journal mode concurrency, REST API integration, frontend state management, and printable timetable layout.
      </td>
    </tr>
  </tbody>
</table>

<!-- CHAPTER 15 -->
<h1 class="chapter-title">Chapter 15: Master Viva Question &amp; Answer Bank (55 Questions)</h1>

<h2>Section A: Core DAA &amp; Graph Theory (Q1 to Q18)</h2>

<div class="qa-card">
  <div class="qa-q">Q1: What is the Graph Coloring Problem?</div>
  <div class="qa-a">Graph Coloring is the assignment of labels (colors) to the vertices of a graph such that no two adjacent vertices share the same color. The objective is to minimize the total number of colors used, which is known as the Chromatic Number &chi;(G).</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q2: How does Examia map the examination scheduling problem to graph coloring?</div>
  <div class="qa-a">Each academic subject is mapped to a vertex in the graph. If two subjects share at least one student division, an undirected conflict edge is created between them. The colors assigned to vertices represent the distinct examination time slots.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q3: What does an edge represent in your conflict graph?</div>
  <div class="qa-a">An edge represents a potential scheduling clash between two subjects due to shared student enrollments. If an edge exists between Subject A and Subject B, they cannot be scheduled in the same time slot.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q4: What is the Chromatic Number of a graph?</div>
  <div class="qa-a">The Chromatic Number, denoted as &chi;(G), is the minimum number of colors needed to color a graph such that no two adjacent vertices share the same color. In Examia, &chi;(G) represents the minimum number of examination time slots required.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q5: Is the Graph Coloring Problem polynomial or NP-complete?</div>
  <div class="qa-a">Finding the chromatic number for general graphs is NP-hard, and deciding if a graph can be colored with k colors (for k &ge; 3) is NP-complete. Therefore, finding an optimal schedule for large inputs requires heuristics like greedy coloring.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q6: What is a Greedy Algorithm?</div>
  <div class="qa-a">A greedy algorithm builds a solution piece by piece, always choosing the immediate next piece that offers the most obvious benefit (a local optimum) without reconsidering previous decisions.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q7: How does the Welsh-Powell Algorithm improve upon basic greedy coloring?</div>
  <div class="qa-a">Basic greedy coloring processes vertices in arbitrary order, which can use unnecessary colors. Welsh-Powell sorts vertices by descending order of their degree first. Higher-degree vertices are the hardest to schedule, so coloring them first leads to better color reuse.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q8: What is vertex degree, and why is it important in Welsh-Powell?</div>
  <div class="qa-a">Vertex degree is the number of edges incident to a vertex. In Examia, it represents how many other subjects conflict with that subject. Higher-degree subjects have more constraints, so resolving them first minimizes overall slots.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q9: What is the upper bound on the number of colors used by Welsh-Powell?</div>
  <div class="qa-a">Welsh-Powell is guaranteed to color any graph using at most &Delta;(G) + 1 colors, where &Delta;(G) is the maximum vertex degree in the graph.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q10: What is the Time Complexity of Welsh-Powell greedy coloring in Examia?</div>
  <div class="qa-a">The time complexity is O(V log V + E), where V is the number of subjects and E is the number of conflict edges. Sorting takes O(V log V), and checking neighbor colors across all vertices takes O(E) time.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q11: What is Backtracking?</div>
  <div class="qa-a">Backtracking is an algorithmic approach that systematically searches for solutions by trying partial assignments and abandoning (pruning) branches as soon as it determines they cannot lead to a valid full solution.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q12: How does your Backtracking algorithm differ from Greedy Coloring?</div>
  <div class="qa-a">Greedy coloring makes irreversible choices in one pass and may use more colors than the optimal chromatic number. Backtracking can undo choices and explore alternate paths, guaranteeing an optimal coloring at the cost of exponential worst-case time.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q13: What is the state-space tree in your Backtracking coloring?</div>
  <div class="qa-a">The state-space tree represents all possible color assignments. The root represents the start, each tree level corresponds to an exam subject, and each branch from a node represents assigning a candidate time slot.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q14: What is the purpose of the isSafe() method in Backtracking?</div>
  <div class="qa-a">The isSafe() method verifies that none of the current subject's conflicting neighbors have already been assigned the candidate time slot. If a conflict is found, it returns false, pruning that branch immediately.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q15: What is the Time Complexity of Backtracking Graph Coloring?</div>
  <div class="qa-a">In the worst case, Backtracking has a time complexity of O(V &times; m<sup>V</sup>), where V is the number of subjects and m is the number of allowed time slots. With branch-and-bound pruning, average runtime on sparse graphs is significantly faster.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q16: How does Examia find the minimum chromatic number using Backtracking?</div>
  <div class="qa-a">It runs an incremental search: it attempts to color the graph with k = 1 slot. If Backtracking fails, it increments k to 2, 3, etc. The first value of k for which Backtracking returns true is mathematically guaranteed to be the exact Chromatic Number &chi;(G).</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q17: What is the Space Complexity of your Backtracking algorithm?</div>
  <div class="qa-a">The space complexity is O(V), required for the recursion call stack (depth equal to the number of subjects V) and the hash map storing current slot assignments.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q18: What is a complete graph (clique), and how many slots does it require?</div>
  <div class="qa-a">A complete graph K<sub>n</sub> has an edge between every pair of vertices. If n subjects all share students, the conflict graph is a clique, and its chromatic number is exactly n. Each exam must be in its own separate time slot.</div>
</div>

<h2>Section B: Java Backend Architecture &amp; OOP (Q19 to Q33)</h2>

<div class="qa-card">
  <div class="qa-q">Q19: Why did you use pure Java without Spring Boot?</div>
  <div class="qa-a">We used Java 21 LTS standard libraries to keep the project lightweight, transparent, and focused purely on DAA principles. Using com.sun.net.httpserver eliminates heavy framework overhead and allows direct line-by-line inspection of data structures and algorithms.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q20: What Java collection data structures are used for the graph?</div>
  <div class="qa-a">The conflict graph uses an Adjacency List modeled with a Map&lt;String, List&lt;String&gt;&gt;, where the key is the subject ID and the value is the list of adjacent conflicting subject IDs. Sets (HashSet) are used for fast O(1) neighbor color lookups.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q21: How does your backend handle concurrent incoming HTTP requests?</div>
  <div class="qa-a">The HttpServer instance is configured with an ExecutorService thread pool. Each incoming request is handled asynchronously on an isolated worker thread without blocking other requests.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q22: How do you sort vertices by degree in Java?</div>
  <div class="qa-a">We use Collections.sort() with a custom Comparator that queries vertex degrees from a precomputed degrees map and orders them in descending numerical order (Integer.compare(deg2, deg1)).</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q23: How is recursion implemented in Backtracking, and what is the base case?</div>
  <div class="qa-a">The backtrack() method calls itself with index + 1. The base case is when index == subjects.size(), meaning every subject has been assigned a valid non-conflicting time slot, returning true.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q24: What happens during the backtrack step in your Java code?</div>
  <div class="qa-a">If subsequent recursive calls return false, the code executes assignments.remove(current.getId()), undoing the tentative assignment before testing the next candidate slot.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q25: Why do you clone the classroom list in ClassroomAllocationService?</div>
  <div class="qa-a">Each time slot has the full set of physical classrooms available. We clone the master room list for each time slot so assigning a room in Slot 1 does not remove it from Slot 2.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q26: How are room conflicts avoided in the same time slot?</div>
  <div class="qa-a">Within a given time slot, once a classroom is allocated to an exam, it is removed from that slot's available room pool. No two exams in the same slot can receive the same classroom.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q27: What algorithm is used for classroom allocation?</div>
  <div class="qa-a">A Greedy Best-Fit / First-Fit Decreasing heuristic. Rooms are sorted by capacity in descending order, and the largest available rooms are assigned until cumulative capacity satisfies the student enrollment.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q28: How is CORS handled in your Java HTTP server?</div>
  <div class="qa-a">Every HTTP exchange includes headers for Access-Control-Allow-Origin: *, along with allowed methods (GET, POST, OPTIONS) and headers, and handles HTTP OPTIONS preflight requests.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q29: How do you parse JSON in the Java backend?</div>
  <div class="qa-a">We use a lightweight, dedicated JSON utility parser within the backend to extract configuration fields from the request stream and serialize timetable objects into JSON response strings.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q30: What is the role of DTO classes in your project?</div>
  <div class="qa-a">Data Transfer Objects (DTOs) like Subject, Classroom, and TimeSlot encapsulate domain data with immutable getters and setters, ensuring clean separation between database records and algorithm processing.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q31: How do you prevent memory leaks during timetable generation?</div>
  <div class="qa-a">All transient data structures (adjacency lists, sets, temporary maps) are scoped locally within generation methods and cleared immediately, making them eligible for Java garbage collection.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q32: What exception handling is implemented in the backend?</div>
  <div class="qa-a">All database interactions and algorithm invocations are wrapped in try-catch blocks. If an unrecoverable conflict or error occurs, the server logs the stack trace and dispatches a structured JSON error response with HTTP 500 or 400.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q33: How does the server measure algorithm execution time?</div>
  <div class="qa-a">We record System.nanoTime() immediately before invoking the scheduler and immediately after completion, computing elapsed time in milliseconds with microsecond precision.</div>
</div>

<h2>Section C: Database, Constraints &amp; Classroom Allocation (Q34 to Q45)</h2>

<div class="qa-card">
  <div class="qa-q">Q34: Why did you choose SQLite for Examia?</div>
  <div class="qa-a">SQLite is a serverless, self-contained, zero-configuration database stored as a single file on disk (examia.db). It allows the entire application to be easily demonstrated without needing external database server setup.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q35: What is SQLite WAL mode, and why is it enabled?</div>
  <div class="qa-a">WAL stands for Write-Ahead Logging. In standard rollback journal mode, writing locks the entire database. WAL mode allows concurrent readers and writers simultaneously, preventing database locked exceptions during concurrent generation.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q36: Explain the database relationship between subjects and student groups.</div>
  <div class="qa-a">It is a many-to-many relationship. A subject can be taken by multiple divisions, and a division takes multiple subjects. This is modeled using an intermediate join table called subject_enrollments.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q37: What is the difference between a Hard Constraint and a Soft Constraint?</div>
  <div class="qa-a">A hard constraint must be satisfied for a timetable to be valid (e.g., zero student overlaps, room capacity). A soft constraint is an optimization goal that should be minimized where possible (e.g., minimizing total examination days).</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q38: What happens if an exam's enrollment exceeds the largest classroom?</div>
  <div class="qa-a">Examia implements multi-room allocation. If Mathematics has 130 students and the largest room holds 100, the system assigns a 100-capacity room plus a second room (e.g., 60-capacity), satisfying the total headcount.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q39: What happens if total enrollment across all exams in a slot exceeds total campus seating?</div>
  <div class="qa-a">The classroom allocation service identifies that the room pool is exhausted and flags a capacity warning, indicating that additional rooms or an extra time slot must be provided.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q40: How are database transactions handled during generation?</div>
  <div class="qa-a">When saving a generated timetable, auto-commit is disabled. The algorithm run record and all exam slot assignments are written inside a single atomic transaction, followed by commit(). If any write fails, rollback() is executed.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q41: How does the application seed mock data if the database is empty?</div>
  <div class="qa-a">On startup, DatabaseManager checks the count of records in the subjects table. If the count is 0, it automatically executes seed scripts inserting 5 standard engineering subjects, 3 student divisions, and 4 classrooms.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q42: Can Examia handle elective courses with mixed enrollments?</div>
  <div class="qa-a">Yes. By adding individual students or elective subgroups into the subject_enrollments table, any combination of shared student registrations will automatically generate the appropriate conflict edges.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q43: How is data integrity enforced in the database schema?</div>
  <div class="qa-a">Foreign key constraints (PRAGMA foreign_keys = ON) link enrollments to subjects and groups. Unique constraints on subject codes and classroom names prevent duplicate records.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q44: What information is stored in the algorithm_runs audit table?</div>
  <div class="qa-a">It records the timestamp, algorithm used (Greedy vs Backtracking), total time slots required, execution time in milliseconds, and status, enabling comparative performance audits over time.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q45: How does the frontend fetch updated timetable results?</div>
  <div class="qa-a">After sending the POST generation request, the frontend receives the full schedule directly in the HTTP JSON response, updating the React state and rendering the timetable immediately.</div>
</div>

<h2>Section D: Tough Examiner Cross-Examination &amp; Edge Cases (Q46 to Q55)</h2>

<div class="qa-card">
  <div class="qa-q">Q46: Why do two exams appear in Slot 4 in your final schedule? Is that a bug?</div>
  <div class="qa-a">No, it is not a bug; it is proof that Graph Coloring works! In our conflict graph, CS203 (DBMS) is enrolled by Divisions B and C, while CS202 (Data Structures) is enrolled only by Division A. Because they share zero common students, there is no conflict edge between them. Both can safely occur in Slot 4. Furthermore, they are assigned different classrooms, avoiding physical room clashes.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q47: Why does Welsh-Powell not always find the minimal Chromatic Number?</div>
  <div class="qa-a">Welsh-Powell is a heuristic. It makes irreversible greedy choices based solely on degree ordering. On certain graph structures (such as cycle graphs of odd length or crown graphs), greedy choices can trap the algorithm into using one color more than the true chromatic number.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q48: What is Brooks' Theorem, and how does it relate to your project?</div>
  <div class="qa-a">Brooks' Theorem states that for any connected undirected graph that is neither a complete graph nor an odd cycle, the chromatic number is at most the maximum degree &Delta;(G). Welsh-Powell respects this bound and often achieves it.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q49: If you have 1000 subjects, which algorithm would you choose and why?</div>
  <div class="qa-a">We would choose Welsh-Powell Greedy Coloring. Its O(V log V + E) polynomial time complexity will schedule 1000 subjects in less than 50 milliseconds. Backtracking on 1000 subjects could take years due to exponential worst-case complexity O(m<sup>V</sup>).</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q50: Can Graph Coloring handle teacher or invigilator availability?</div>
  <div class="qa-a">Yes. Teacher availability can be modeled either as a secondary bipartite matching problem after slot assignment, or by adding teacher nodes and conflict edges to the initial graph. This is detailed in our Future Scope.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q51: How does Examia prevent two exams in the same slot from using the same classroom?</div>
  <div class="qa-a">In ClassroomAllocationService, available rooms are copied into an active list for each time slot. Once a room is assigned to an exam, it is removed from that slot's list, making it impossible for another exam in that slot to receive it.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q52: What is the maximum number of edges a conflict graph of V subjects can have?</div>
  <div class="qa-a">The maximum number of edges occurs in a complete graph where every subject conflicts with every other subject: E_max = [V &times; (V - 1)] / 2, which is O(V<sup>2</sup>).</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q53: What happens if Backtracking runs on a graph that cannot be colored in m slots?</div>
  <div class="qa-a">The algorithm explores all valid paths, prunes every branch, and ultimately returns false from the root call. The backend catches this condition and notifies the user that more time slots or examination days are required.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q54: How would you parallelize your timetable generation for very large institutions?</div>
  <div class="qa-a">We can partition the conflict graph into independent connected components using Breadth-First Search (BFS). Each disconnected component can be colored independently and concurrently on separate threads.</div>
</div>

<div class="qa-card">
  <div class="qa-q">Q55: What is the biggest strength of your implementation?</div>
  <div class="qa-a">Its mathematical correctness, speed, and clean zero-dependency design. By directly implementing Welsh-Powell and Backtracking in pure Java 21, the system guarantees zero student clashes, zero room double-booking, and instant response times under 10 milliseconds.</div>
</div>

<!-- CHAPTER 16 -->
<h1 class="chapter-title">Chapter 16: Advantages, Limitations, Future Scope &amp; Conclusion</h1>

<h2>16.1 System Advantages</h2>
<ul>
  <li><strong>Mathematical Guarantee of Zero Clashes:</strong> Graph coloring principles guarantee that conflicting courses never share time slots.</li>
  <li><strong>Blazing Fast Performance:</strong> Generates complete examination schedules in under 10 milliseconds for standard college loads.</li>
  <li><strong>Zero External Framework Overhead:</strong> Built on standard Java 21 LTS without requiring heavyweight application servers.</li>
  <li><strong>Full Classroom Allocation:</strong> Automatically allocates physical exam halls with capacity awareness and double-booking prevention.</li>
</ul>

<h2>16.2 Known Project Boundaries &amp; Limitations</h2>
<ul>
  <li><strong>Single-Campus Seating Scope:</strong> Assumes all classrooms are located within walking distance; travel times between distant campuses are not modeled.</li>
  <li><strong>Invigilator Scheduling:</strong> The current implementation focuses exclusively on student conflicts and classroom capacities; assigning faculty invigilators is designated for future releases.</li>
</ul>

<h2>16.3 Future Scope &amp; Enhancements</h2>
<ul>
  <li><strong>Faculty Invigilator Allocation:</strong> Implementing bipartite matching (Hopcroft-Karp algorithm) to assign faculty members to examination halls according to department workload rules.</li>
  <li><strong>Metaheuristic Optimization:</strong> Incorporating Genetic Algorithms (GA) or Simulated Annealing to optimize soft constraints, such as ensuring students have at least one study day between consecutive exams.</li>
  <li><strong>Multi-Campus Logistics:</strong> Adding travel distance matrices between satellite university campuses to prevent students from having consecutive exams across different locations.</li>
</ul>

<h2>16.4 Conclusion</h2>
<p>
  <strong>Examia</strong> successfully bridges abstract graph theory and practical software engineering. By translating the complex Examination Timetabling Problem into Graph Coloring, it provides academic institutions with an automated, provably correct, and high-performance scheduling platform. Through Welsh-Powell greedy heuristics and exact backtracking search, Examia delivers conflict-free, classroom-optimized examination timetables in milliseconds.
</p>
"""
