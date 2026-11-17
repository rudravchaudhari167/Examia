# guide_chapters/cover_toc.py

COVER_AND_TOC_HTML = """
<!-- COVER PAGE -->
<div style="height: 100vh; display: flex; flex-direction: column; justify-content: space-between; padding: 45px 30px; text-align: center; border: 4pt double #642F43; border-radius: 8px; margin: 15px; background: linear-gradient(180deg, #FFFFFF 0%, #FDF7F8 100%);">
  <div style="margin-top: 25px;">
    <div style="font-size: 11pt; letter-spacing: 2px; font-weight: 700; color: #7D5563; text-transform: uppercase; margin-bottom: 8px;">
      Design and Analysis of Algorithms (DAA) — Mini-Project
    </div>
    <div style="font-size: 9.5pt; color: #8F5E6F; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
      Academic Evaluation &amp; Comprehensive Viva Preparation Guide
    </div>
  </div>

  <div style="margin: 40px 0;">
    <div style="display: inline-block; background: #642F43; color: #FFFFFF; font-size: 9pt; font-weight: 700; padding: 4px 14px; border-radius: 20px; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 14px;">
      PROJECT VIVA STUDY GUIDE
    </div>
    <h1 style="font-size: 28pt; font-weight: 800; color: #642F43; margin: 0 0 10px 0; letter-spacing: -0.5px; line-height: 1.15;">
      EXAMIA
    </h1>
    <div style="font-size: 15pt; font-weight: 600; color: #781D42; margin-bottom: 16px;">
      Intelligent Examination Timetable Generator
    </div>
    <div style="font-size: 10pt; color: #522736; max-width: 540px; margin: 0 auto; line-height: 1.5;">
      Optimal conflict-free examination scheduling using Graph Coloring heuristics (Welsh-Powell Greedy Algorithm) and exact Constraint Satisfaction (Backtracking Algorithm) with automated classroom bin-packing allocation.
    </div>
  </div>

  <div style="background: #FFFFFF; border: 1pt solid #DFC7CE; border-radius: 8px; padding: 18px 24px; max-width: 520px; margin: 0 auto; text-align: left; box-shadow: 0 2px 4px rgba(100, 47, 67, 0.05);">
    <table style="width: 100%; border-collapse: collapse; margin: 0; font-size: 9pt;">
      <tr>
        <td style="padding: 5px 0; border: none; font-weight: 700; color: #642F43; width: 40%;">Course:</td>
        <td style="padding: 5px 0; border: none; color: #2D1A22;">Design &amp; Analysis of Algorithms (CS204)</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; border: none; font-weight: 700; color: #642F43;">Academic Program:</td>
        <td style="padding: 5px 0; border: none; color: #2D1A22;">B.Tech in Computer Science &amp; Engineering</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; border: none; font-weight: 700; color: #642F43;">Backend Architecture:</td>
        <td style="padding: 5px 0; border: none; color: #2D1A22;">Java 21 LTS Standard Library (Zero External Frameworks)</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; border: none; font-weight: 700; color: #642F43;">Database Engine:</td>
        <td style="padding: 5px 0; border: none; color: #2D1A22;">SQLite Embedded Database (WAL Journal Mode)</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; border: none; font-weight: 700; color: #642F43;">Frontend Technology:</td>
        <td style="padding: 5px 0; border: none; color: #2D1A22;">React 18 Single-Page Application (Tailwind CSS)</td>
      </tr>
      <tr>
        <td style="padding: 5px 0; border: none; font-weight: 700; color: #642F43;">DAA Strategies:</td>
        <td style="padding: 5px 0; border: none; color: #2D1A22;">Greedy Graph Coloring &amp; Backtracking State-Space Search</td>
      </tr>
    </table>
  </div>

  <div style="margin-bottom: 20px; font-size: 8pt; color: #7D5563; border-top: 0.5pt solid #DFC7CE; padding-top: 10px;">
    Prepared for Departmental Review, Project Demonstration, and External Examiner Viva Voce.
  </div>
</div>

<div class="page-break"></div>

<!-- TABLE OF CONTENTS -->
<div style="padding-top: 10px;">
  <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2pt solid #642F43; padding-bottom: 6px; margin-bottom: 14px;">
    <h1 style="font-size: 16pt; font-weight: 800; color: #642F43; margin: 0;">Table of Contents</h1>
    <span style="font-size: 9pt; color: #7D5563; font-weight: 600;">16 Structured Chapters</span>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 9pt;">
    <thead>
      <tr>
        <th style="width: 12%; text-align: center;">Chapter</th>
        <th style="width: 76%;">Chapter Title &amp; Core Content</th>
        <th style="width: 12%; text-align: right;">Coverage</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">1</td>
        <td><strong>Project Introduction &amp; Problem Statement:</strong> Examination timetabling problem, NP-completeness, conflict rules.</td>
        <td style="text-align: right; color: #7D5563;">Overview</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">2</td>
        <td><strong>Problem Selection &amp; Real-World Applications:</strong> Manual vs algorithmic scheduling, university applications.</td>
        <td style="text-align: right; color: #7D5563;">Rationale</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">3</td>
        <td><strong>Project Architecture &amp; Technology Stack:</strong> Clean 3-tier architecture, Java 21, SQLite WAL, React 18 SPA.</td>
        <td style="text-align: right; color: #7D5563;">Architecture</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">4</td>
        <td><strong>Complete Project Working (Step-by-Step Lifecycle):</strong> 11-step execution flow from database seed to final timetable.</td>
        <td style="text-align: right; color: #7D5563;">Workflow</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">5</td>
        <td><strong>Graph Theory Fundamentals &amp; Graph Coloring:</strong> Vertices, edges, conflict graph construction, Chromatic Number.</td>
        <td style="text-align: right; color: #7D5563;">Theory</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">6</td>
        <td><strong>Greedy Coloring (Welsh-Powell):</strong> Degree sorting heuristic, pseudocode, Java code walkthrough, dry-run table.</td>
        <td style="text-align: right; color: #7D5563;">Algorithm 1</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">7</td>
        <td><strong>Backtracking Coloring (m-Coloring Problem):</strong> State-space tree, recursive pruning, isSafe condition, comparison matrix.</td>
        <td style="text-align: right; color: #7D5563;">Algorithm 2</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">8</td>
        <td><strong>Java Backend Implementation Walkthrough:</strong> Class-by-class walkthrough of all backend components.</td>
        <td style="text-align: right; color: #7D5563;">Code Walk</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">9</td>
        <td><strong>Database Architecture, REST APIs &amp; Communication:</strong> SQLite tables, indexes, REST payload formats, HTTP lifecycle.</td>
        <td style="text-align: right; color: #7D5563;">Full Stack</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">10</td>
        <td><strong>Correctness of Implementation &amp; Invariant Defenses:</strong> Zero student clashes, no room double-booking, capacity satisfaction.</td>
        <td style="text-align: right; color: #7D5563;">Verification</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">11</td>
        <td><strong>Time &amp; Space Complexity Analysis:</strong> Mathematical derivations, asymptotic upper and lower bounds, master matrix.</td>
        <td style="text-align: right; color: #7D5563;">Complexity</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">12</td>
        <td><strong>Comprehensive Test Cases &amp; Verification Matrix:</strong> 12 stress scenarios including complete graphs and capacity overflows.</td>
        <td style="text-align: right; color: #7D5563;">Testing</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">13</td>
        <td><strong>Live Project Demonstration Script:</strong> Step-by-step presentation walkthrough for external examiners.</td>
        <td style="text-align: right; color: #7D5563;">Demo Guide</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">14</td>
        <td><strong>Individual Contribution &amp; Team Viva Strategy:</strong> 3-member role allocation matrix and defense guidelines.</td>
        <td style="text-align: right; color: #7D5563;">Team Defense</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">15</td>
        <td><strong>Master Viva Question Bank (55 Questions &amp; Answers):</strong> 4 complete sections covering DAA, Java, Database, and Edge Cases.</td>
        <td style="text-align: right; color: #7D5563;">Viva Prep</td>
      </tr>
      <tr>
        <td style="text-align: center; font-weight: 700; color: #642F43;">16</td>
        <td><strong>Advantages, Limitations, Future Scope &amp; Conclusion:</strong> Real-world impact, production boundaries, future enhancements.</td>
        <td style="text-align: right; color: #7D5563;">Conclusion</td>
      </tr>
    </tbody>
  </table>
</div>
"""
