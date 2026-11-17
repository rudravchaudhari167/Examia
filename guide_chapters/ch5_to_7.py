# guide_chapters/ch5_to_7.py

CH5_TO_7_HTML = """
<div class="page-break"></div>

<!-- CHAPTER 5 -->
<h1 class="chapter-title">Chapter 5: Graph Theory Fundamentals &amp; Graph Coloring</h1>

<h2>5.1 Graph Theory Terminology in Examia</h2>
<p>
  In Examia, the examination scheduling challenge is mapped mathematically to an <strong>undirected, unweighted graph</strong> <span class="math-var">G = (V, E)</span>:
</p>

<table>
  <thead>
    <tr>
      <th style="width: 25%;">Graph Element</th>
      <th style="width: 35%;">Mathematical Definition</th>
      <th style="width: 40%;">Examia System Representation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Vertex (Node) <span class="math-var">v &isin; V</span></strong></td>
      <td>A fundamental discrete unit in the graph.</td>
      <td>An individual <strong>Examination Subject</strong> (e.g., CS201 Java, CS202 DSA).</td>
    </tr>
    <tr>
      <td><strong>Edge (Arc) <span class="math-var">(u, v) &isin; E</span></strong></td>
      <td>An undirected connection between two vertices.</td>
      <td>A <strong>Student Conflict</strong>: both subjects share at least one student division.</td>
    </tr>
    <tr>
      <td><strong>Vertex Degree <span class="math-var">deg(v)</span></strong></td>
      <td>The number of edges incident to vertex <span class="math-var">v</span>.</td>
      <td>The total count of other subjects conflicting with this subject.</td>
    </tr>
    <tr>
      <td><strong>Color <span class="math-var">c &isin; {0, 1, ..., k-1}</span></strong></td>
      <td>A discrete label assigned to a vertex.</td>
      <td>An <strong>Examination Time Slot</strong> (e.g., Slot 1: 09:00 AM - 12:00 PM).</td>
    </tr>
    <tr>
      <td><strong>Chromatic Number <span class="math-var">&chi;(G)</span></strong></td>
      <td>The minimal number of colors needed to color <span class="math-var">G</span>.</td>
      <td>The absolute <strong>minimum number of time slots</strong> to conduct all exams.</td>
    </tr>
  </tbody>
</table>

<h2>5.2 Visual Conflict Graph of the Examia System</h2>
<p>
  The diagram below illustrates the actual 5-subject conflict graph from the Examia production seed. Notice that <strong>CS203 (DBMS)</strong> and <strong>CS202 (Data Structures)</strong> share <strong>no students</strong>, so there is no edge between them. Consequently, both are safely scheduled together in <strong>Slot 4</strong> without conflict.
</p>

<!-- CONFLICT GRAPH SVG DIAGRAM -->
<div class="diagram-container">
  <svg width="100%" height="280" viewBox="0 0 650 280" xmlns="http://www.w3.org/2000/svg">
    <!-- Conflict Edges (Lines) -->
    <!-- CS201 to CS204 -->
    <line x1="220" y1="70" x2="430" y2="70" stroke="#B87D8E" stroke-width="2"/>
    <text x="325" y="63" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" text-anchor="middle">Shares Div A</text>

    <!-- CS201 to MA201 -->
    <line x1="220" y1="70" x2="325" y2="175" stroke="#B87D8E" stroke-width="2"/>
    <text x="250" y="130" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" text-anchor="middle">Div A, B</text>

    <!-- CS204 to MA201 -->
    <line x1="430" y1="70" x2="325" y2="175" stroke="#B87D8E" stroke-width="2"/>
    <text x="395" y="130" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" text-anchor="middle">Div A, C</text>

    <!-- CS201 to CS203 -->
    <line x1="220" y1="70" x2="150" y2="230" stroke="#B87D8E" stroke-width="2"/>
    <text x="165" y="150" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" text-anchor="middle">Div B</text>

    <!-- MA201 to CS203 -->
    <line x1="325" y1="175" x2="150" y2="230" stroke="#B87D8E" stroke-width="2"/>
    <text x="225" y="215" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" text-anchor="middle">Div B, C</text>

    <!-- CS204 to CS203 -->
    <path d="M 430 70 Q 380 260 150 230" fill="none" stroke="#B87D8E" stroke-width="2"/>
    <text x="320" y="248" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" text-anchor="middle">Shares Div C</text>

    <!-- CS201 to CS202 -->
    <path d="M 220 70 Q 280 20 500 230" fill="none" stroke="#B87D8E" stroke-width="2"/>
    <text x="345" y="28" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" text-anchor="middle">Shares Div A</text>

    <!-- CS204 to CS202 -->
    <line x1="430" y1="70" x2="500" y2="230" stroke="#B87D8E" stroke-width="2"/>
    <text x="485" y="150" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" text-anchor="middle">Div A</text>

    <!-- MA201 to CS202 -->
    <line x1="325" y1="175" x2="500" y2="230" stroke="#B87D8E" stroke-width="2"/>
    <text x="425" y="215" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" text-anchor="middle">Div A</text>

    <!-- IMPORTANT: NO EDGE BETWEEN CS203 AND CS202 -->
    <line x1="150" y1="230" x2="500" y2="230" stroke="#10B981" stroke-width="2" stroke-dasharray="6,4"/>
    <rect x="260" y="220" width="130" height="20" rx="4" fill="#ECFDF5" stroke="#10B981" stroke-width="1"/>
    <text x="325" y="234" font-family="-apple-system, sans-serif" font-size="8" font-weight="bold" fill="#047857" text-anchor="middle">NO CONFLICT (Both in Slot 4)</text>

    <!-- VERTICES (SUBJECT NODES) -->
    <!-- Node CS201 (Slot 1 - Blue) -->
    <circle cx="220" cy="70" r="28" fill="#EFF6FF" stroke="#2563EB" stroke-width="2.5"/>
    <text x="220" y="66" font-family="-apple-system, sans-serif" font-size="9" font-weight="bold" fill="#1E40AF" text-anchor="middle">CS201</text>
    <text x="220" y="77" font-family="-apple-system, sans-serif" font-size="7.5" fill="#1E40AF" text-anchor="middle">Slot 1 (90s)</text>

    <!-- Node CS204 (Slot 2 - Green) -->
    <circle cx="430" cy="70" r="28" fill="#ECFDF5" stroke="#059669" stroke-width="2.5"/>
    <text x="430" y="66" font-family="-apple-system, sans-serif" font-size="9" font-weight="bold" fill="#065F46" text-anchor="middle">CS204</text>
    <text x="430" y="77" font-family="-apple-system, sans-serif" font-size="7.5" fill="#065F46" text-anchor="middle">Slot 2 (85s)</text>

    <!-- Node MA201 (Slot 3 - Orange) -->
    <circle cx="325" cy="175" r="30" fill="#FFFBEB" stroke="#D97706" stroke-width="2.5"/>
    <text x="325" y="171" font-family="-apple-system, sans-serif" font-size="9" font-weight="bold" fill="#92400E" text-anchor="middle">MA201</text>
    <text x="325" y="182" font-family="-apple-system, sans-serif" font-size="7.5" fill="#92400E" text-anchor="middle">Slot 3 (130s)</text>

    <!-- Node CS203 (Slot 4 - Purple) -->
    <circle cx="150" cy="230" r="28" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2.5"/>
    <text x="150" y="226" font-family="-apple-system, sans-serif" font-size="9" font-weight="bold" fill="#5B21B6" text-anchor="middle">CS203</text>
    <text x="150" y="237" font-family="-apple-system, sans-serif" font-size="7.5" fill="#5B21B6" text-anchor="middle">Slot 4 (85s)</text>

    <!-- Node CS202 (Slot 4 - Purple) -->
    <circle cx="500" cy="230" r="28" fill="#F5F3FF" stroke="#7C3AED" stroke-width="2.5"/>
    <text x="500" y="226" font-family="-apple-system, sans-serif" font-size="9" font-weight="bold" fill="#5B21B6" text-anchor="middle">CS202</text>
    <text x="500" y="237" font-family="-apple-system, sans-serif" font-size="7.5" fill="#5B21B6" text-anchor="middle">Slot 4 (45s)</text>
  </svg>
  <div class="diagram-caption">Figure 5.1: Conflict Graph with 5 Vertices and Optimal 4-Color Assignment</div>
</div>

<!-- CHAPTER 6 -->
<h1 class="chapter-title">Chapter 6: Greedy Graph Coloring (Welsh-Powell Algorithm)</h1>

<h2>6.1 The Welsh-Powell Heuristic</h2>
<p>
  A standard greedy coloring algorithm processes vertices in arbitrary order, which can cause poor color utilization. In 1967, Welsh and Powell introduced an optimal ordering heuristic:
</p>
<div class="callout">
  <div class="callout-title">The Welsh-Powell Principle</div>
  <p>
    Vertices with higher degrees (more conflicting neighbors) impose the most severe restrictions on adjacent nodes. Therefore, <strong>order vertices by descending degree</strong> before assigning colors. Higher-degree vertices are colored first when color choices are abundant; lower-degree vertices have fewer restrictions and easily fit into existing colors later.
  </p>
</div>

<h2>6.2 Pseudocode</h2>
<pre><code><span class="code-kw">ALGORITHM</span> <span class="code-fn">WelshPowellGreedyColoring</span>(Graph G = (V, E)):
1.  <span class="code-kw">FOR EACH</span> vertex v <span class="code-kw">IN</span> V:
        degree[v] = count(G.neighbors[v])
2.  Sort vertices in descending order of degree[v]
3.  assignments = empty map (vertex -> slot)
4.  <span class="code-kw">FOR EACH</span> vertex u <span class="code-kw">IN</span> sortedVertices:
        usedSlots = empty set
        <span class="code-kw">FOR EACH</span> neighbor w <span class="code-kw">IN</span> G.neighbors[u]:
            <span class="code-kw">IF</span> w is already in assignments:
                add assignments[w] to usedSlots
        slot = 0
        <span class="code-kw">WHILE</span> slot is in usedSlots:
            slot = slot + 1
        assignments[u] = slot
5.  <span class="code-kw">RETURN</span> assignments</code></pre>

<h2>6.3 Line-by-Line Java Implementation Walkthrough</h2>
<p>From <code>GraphColoringScheduler.java</code>:</p>
<pre><code><span class="code-cm">// Step 1 & 2: Degree sorting using an inline Comparator</span>
Collections.sort(subjects, <span class="code-kw">new</span> Comparator&lt;Subject&gt;() {
    <span class="code-kw">@Override</span>
    <span class="code-kw">public int</span> compare(Subject s1, Subject s2) {
        <span class="code-kw">int</span> deg1 = degrees.getOrDefault(s1.getId(), 0);
        <span class="code-kw">int</span> deg2 = degrees.getOrDefault(s2.getId(), 0);
        <span class="code-kw">return</span> Integer.compare(deg2, deg1); <span class="code-cm">// Descending order</span>
    }
});

<span class="code-cm">// Step 3 & 4: Greedy first-fit coloring</span>
Map&lt;String, Integer&gt; assignments = <span class="code-kw">new</span> HashMap&lt;&gt;();
<span class="code-kw">for</span> (Subject subject : subjects) {
    Set&lt;Integer&gt; neighborColors = <span class="code-kw">new</span> HashSet&lt;&gt;();
    List&lt;String&gt; neighbors = graph.getNeighbors(subject.getId());
    <span class="code-kw">for</span> (String neighborId : neighbors) {
        <span class="code-kw">if</span> (assignments.containsKey(neighborId)) {
            neighborColors.add(assignments.get(neighborId));
        }
    }
    <span class="code-kw">int</span> color = 0;
    <span class="code-kw">while</span> (neighborColors.contains(color)) {
        color++; <span class="code-cm">// Pick the smallest non-conflicting color</span>
    }
    assignments.put(subject.getId(), color);
}</code></pre>

<h2>6.4 Step-by-Step Dry Run on the Conflict Graph</h2>
<p>
  Let us trace the algorithm execution on our 5-subject conflict graph:
</p>

<table>
  <thead>
    <tr>
      <th style="width: 10%;">Step</th>
      <th style="width: 20%;">Subject Picked</th>
      <th style="width: 15%;">Vertex Degree</th>
      <th style="width: 25%;">Neighbor Colors Present</th>
      <th style="width: 30%;">Color Assigned (Time Slot)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td><strong>MA201 (Maths)</strong></td>
      <td>4 (Highest)</td>
      <td>None (first vertex)</td>
      <td><span class="badge badge-info">Color 0 &rarr; Slot 1</span></td>
    </tr>
    <tr>
      <td>2</td>
      <td><strong>CS201 (Java)</strong></td>
      <td>4</td>
      <td>MA201 has Color 0</td>
      <td><span class="badge badge-success">Color 1 &rarr; Slot 2</span></td>
    </tr>
    <tr>
      <td>3</td>
      <td><strong>CS204 (OS)</strong></td>
      <td>4</td>
      <td>MA201 (0), CS201 (1)</td>
      <td><span class="badge badge-warning">Color 2 &rarr; Slot 3</span></td>
    </tr>
    <tr>
      <td>4</td>
      <td><strong>CS203 (DBMS)</strong></td>
      <td>3</td>
      <td>MA201 (0), CS201 (1), CS204 (2)</td>
      <td><span class="badge badge-danger">Color 3 &rarr; Slot 4</span></td>
    </tr>
    <tr>
      <td>5</td>
      <td><strong>CS202 (DSA)</strong></td>
      <td>3</td>
      <td>MA201 (0), CS201 (1), CS204 (2)</td>
      <td><span class="badge badge-danger">Color 3 &rarr; Slot 4 (Reused!)</span></td>
    </tr>
  </tbody>
</table>

<!-- CHAPTER 7 -->
<h1 class="chapter-title">Chapter 7: Backtracking Graph Coloring (m-Coloring Problem)</h1>

<h2>7.1 Concept of Backtracking &amp; State-Space Tree</h2>
<p>
  Backtracking is a systematic, depth-first search strategy for solving <strong>Constraint Satisfaction Problems (CSP)</strong>. Instead of accepting the first greedy choice, backtracking searches the solution space:
</p>
<ol>
  <li><strong>Tentative Assignment:</strong> Pick a candidate time slot <span class="math-var">s</span> from available slots <span class="math-var">{0, 1, ..., m-1}</span> for the current subject.</li>
  <li><strong>Safety Check (<code>isSafe</code>):</strong> Verify whether any adjacent conflicting neighbor is already assigned to slot <span class="math-var">s</span>.</li>
  <li><strong>Branching:</strong> If safe, tentatively assign <span class="math-var">s</span> and recursively advance to the next subject (<span class="math-var">index + 1</span>).</li>
  <li><strong>Pruning &amp; Backtrack Step:</strong> If all slot choices for a subsequent subject fail, the algorithm <strong>prunes</strong> the dead-end branch, returns to the previous subject, unassigns the slot, and tries the next candidate.</li>
</ol>

<h2>7.2 Visual State-Space Tree Diagram</h2>
<p>
  The diagram below demonstrates how the recursive tree expands, detects conflicts, prunes dead branches, and backtracks to reach a conflict-free coloring:
</p>

<!-- STATE SPACE TREE SVG DIAGRAM -->
<div class="diagram-container">
  <svg width="100%" height="240" viewBox="0 0 650 240" xmlns="http://www.w3.org/2000/svg">
    <!-- Level 0: Root -->
    <rect x="250" y="10" width="150" height="28" rx="4" fill="#642F43" stroke="#4A1E2F" stroke-width="1"/>
    <text x="325" y="28" font-family="-apple-system, sans-serif" font-size="9.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Root: CS201 (Java)</text>

    <!-- Branch to Slot 0 -->
    <line x1="325" y1="38" x2="200" y2="75" stroke="#781D42" stroke-width="1.5"/>
    <text x="245" y="52" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" font-weight="bold">Assign Slot 0</text>

    <!-- Branch to Slot 1 -->
    <line x1="325" y1="38" x2="450" y2="75" stroke="#781D42" stroke-width="1.5"/>
    <text x="405" y="52" font-family="-apple-system, sans-serif" font-size="8" fill="#781D42" font-weight="bold">Assign Slot 1</text>

    <!-- Level 1: MA201 under Slot 0 -->
    <rect x="130" y="75" width="140" height="26" rx="4" fill="#FAF0F2" stroke="#781D42" stroke-width="1"/>
    <text x="200" y="92" font-family="-apple-system, sans-serif" font-size="9" font-weight="bold" fill="#642F43" text-anchor="middle">Next: MA201 (Maths)</text>

    <!-- Level 1 Right: MA201 under Slot 1 -->
    <rect x="380" y="75" width="140" height="26" rx="4" fill="#FAF0F2" stroke="#781D42" stroke-width="1"/>
    <text x="450" y="92" font-family="-apple-system, sans-serif" font-size="9" font-weight="bold" fill="#642F43" text-anchor="middle">Next: MA201 (Maths)</text>

    <!-- Level 1 Left Sub-branches -->
    <line x1="170" y1="101" x2="100" y2="135" stroke="#B71C1C" stroke-width="1.5"/>
    <line x1="230" y1="101" x2="270" y2="135" stroke="#1B5E20" stroke-width="1.5"/>

    <!-- Conflict Node (Pruned) -->
    <rect x="30" y="135" width="140" height="32" rx="4" fill="#FFEBEE" stroke="#B71C1C" stroke-width="1.2"/>
    <text x="100" y="149" font-family="-apple-system, sans-serif" font-size="8" font-weight="bold" fill="#B71C1C" text-anchor="middle">Try Slot 0: CONFLICT!</text>
    <text x="100" y="161" font-family="-apple-system, sans-serif" font-size="7.5" fill="#B71C1C" text-anchor="middle">[PRUNED - BACKTRACK]</text>

    <!-- Safe Node -->
    <rect x="200" y="135" width="140" height="32" rx="4" fill="#E8F5E9" stroke="#1B5E20" stroke-width="1.2"/>
    <text x="270" y="149" font-family="-apple-system, sans-serif" font-size="8" font-weight="bold" fill="#1B5E20" text-anchor="middle">Try Slot 1: SAFE</text>
    <text x="270" y="161" font-family="-apple-system, sans-serif" font-size="7.5" fill="#1B5E20" text-anchor="middle">Advance to CS204...</text>

    <!-- Level 2 Branch to CS204 -->
    <line x1="270" y1="167" x2="270" y2="195" stroke="#1B5E20" stroke-width="1.5"/>
    <rect x="190" y="195" width="160" height="26" rx="4" fill="#642F43" stroke="#4A1E2F" stroke-width="1"/>
    <text x="270" y="212" font-family="-apple-system, sans-serif" font-size="8.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">Goal: Valid Schedule Found</text>

    <!-- Legend box -->
    <rect x="420" y="140" width="200" height="80" rx="6" fill="#FDF7F8" stroke="#DFC7CE" stroke-width="1"/>
    <text x="430" y="157" font-family="-apple-system, sans-serif" font-size="8.5" font-weight="bold" fill="#642F43">Tree Exploration Legend:</text>
    <circle cx="438" cy="172" r="5" fill="#1B5E20"/>
    <text x="450" y="176" font-family="-apple-system, sans-serif" font-size="8" fill="#2D1A22">Safe Assignment (Advance)</text>
    <circle cx="438" cy="190" r="5" fill="#B71C1C"/>
    <text x="450" y="194" font-family="-apple-system, sans-serif" font-size="8" fill="#2D1A22">Conflict Detected (Prune Branch)</text>
    <text x="430" y="210" font-family="-apple-system, sans-serif" font-size="7.5" fill="#7D5563">Saves exponential brute-force checks</text>
  </svg>
  <div class="diagram-caption">Figure 7.1: State-Space Tree Exploration with Depth-First Pruning</div>
</div>

<h2>7.3 Line-by-Line Java Implementation Walkthrough</h2>
<p>From <code>GraphColoringScheduler.java</code>:</p>
<pre><code><span class="code-kw">private boolean</span> backtrack(ConflictGraph graph, List&lt;Subject&gt; subjects, <span class="code-kw">int</span> index,
                          <span class="code-kw">int</span> slotBudget, Map&lt;String, Integer&gt; assignments) {
    <span class="code-cm">// BASE CASE: All subjects have been safely colored</span>
    <span class="code-kw">if</span> (index == subjects.size()) {
        <span class="code-kw">return true</span>;
    }

    Subject current = subjects.get(index);
    <span class="code-cm">// Try every candidate time slot up to the slot budget m</span>
    <span class="code-kw">for</span> (<span class="code-kw">int</span> slot = 0; slot &lt; slotBudget; slot++) {
        <span class="code-kw">if</span> (isSafe(graph, current.getId(), slot, assignments)) {
            assignments.put(current.getId(), slot); <span class="code-cm">// Tentative assignment</span>

            <span class="code-kw">if</span> (backtrack(graph, subjects, index + 1, slotBudget, assignments)) {
                <span class="code-kw">return true</span>; <span class="code-cm">// Propagate success up call stack</span>
            }

            assignments.remove(current.getId()); <span class="code-cm">// BACKTRACK (undo assignment)</span>
        }
    }
    <span class="code-kw">return false</span>; <span class="code-cm">// No valid slot found in this branch</span>
}

<span class="code-kw">private boolean</span> isSafe(ConflictGraph graph, String subjectId, <span class="code-kw">int</span> slot,
                       Map&lt;String, Integer&gt; assignments) {
    <span class="code-kw">for</span> (String neighbor : graph.getNeighbors(subjectId)) {
        <span class="code-kw">if</span> (assignments.containsKey(neighbor) &amp;&amp; assignments.get(neighbor) == slot) {
            <span class="code-kw">return false</span>; <span class="code-cm">// Immediate conflict detected</span>
        }
    }
    <span class="code-kw">return true</span>;
}</code></pre>

<h2>7.4 Master Algorithm Comparison</h2>
<table>
  <thead>
    <tr>
      <th style="width: 20%;">Feature</th>
      <th style="width: 40%;">Greedy Welsh-Powell Coloring</th>
      <th style="width: 40%;">Backtracking m-Coloring</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Algorithmic Strategy</strong></td>
      <td>Greedy heuristic based on descending vertex degree.</td>
      <td>Exhaustive state-space search with depth-first pruning.</td>
    </tr>
    <tr>
      <td><strong>Time Complexity</strong></td>
      <td>Polynomial: <span class="math-var">O(V log V + E)</span> (under 5 milliseconds).</td>
      <td>Exponential: <span class="math-var">O(m<sup>V</sup>)</span> worst case.</td>
    </tr>
    <tr>
      <td><strong>Space Complexity</strong></td>
      <td><span class="math-var">O(V + E)</span> for graph adjacency list.</td>
      <td><span class="math-var">O(V)</span> recursive call stack + assignment map.</td>
    </tr>
    <tr>
      <td><strong>Optimality Guarantee</strong></td>
      <td>Upper bounded by <span class="math-var">&Delta;(G) + 1</span>; usually optimal on sparse graphs.</td>
      <td>Guaranteed to find the exact minimal chromatic number.</td>
    </tr>
    <tr>
      <td><strong>Recommended Use</strong></td>
      <td>Instant, real-time schedule generation for large colleges.</td>
      <td>Academic benchmarking and verification of small batches.</td>
    </tr>
  </tbody>
</table>
"""
