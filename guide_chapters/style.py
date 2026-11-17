# guide_chapters/style.py

HTML_HEADER = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Examia — DAA Mini-Project Viva Preparation & Study Guide</title>
<style>
  @page {
    size: A4 portrait;
    margin: 18mm 15mm 18mm 15mm;
    @top-right {
      content: "Examia — DAA Mini-Project Study Guide";
      font-size: 8pt;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #7D5563;
      border-bottom: 0.5pt solid #C58E9B;
      padding-bottom: 4px;
    }
    @bottom-center {
      content: "Page " counter(page);
      font-size: 8.5pt;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      font-weight: 600;
      color: #642F43;
    }
  }

  @page:first {
    margin: 0;
    @top-right { content: none; }
    @bottom-center { content: none; }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 9.5pt;
    line-height: 1.55;
    color: #2D1A22;
    background-color: #FFFFFF;
    margin: 0;
    padding: 0;
  }

  .page-break {
    page-break-before: always;
  }

  .avoid-break {
    page-break-inside: avoid;
  }

  /* Typography */
  h1.chapter-title {
    font-size: 16pt;
    font-weight: 700;
    color: #642F43;
    border-bottom: 2pt solid #642F43;
    padding-bottom: 4px;
    margin-top: 20px;
    margin-bottom: 12px;
    page-break-after: avoid;
  }

  h2 {
    font-size: 12pt;
    font-weight: 700;
    color: #781D42;
    margin-top: 14px;
    margin-bottom: 6px;
    border-left: 3pt solid #A3485E;
    padding-left: 8px;
    page-break-after: avoid;
  }

  h3 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #3B1B26;
    margin-top: 10px;
    margin-bottom: 4px;
    page-break-after: avoid;
  }

  p {
    margin-top: 0;
    margin-bottom: 8px;
    text-align: justify;
  }

  ul, ol {
    margin-top: 0;
    margin-bottom: 8px;
    padding-left: 20px;
  }

  li {
    margin-bottom: 4px;
  }

  /* Badges */
  .badge {
    display: inline-block;
    padding: 2px 7px;
    font-size: 7.5pt;
    font-weight: 700;
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    vertical-align: middle;
  }
  .badge-primary { background: #642F43; color: #FFFFFF; }
  .badge-success { background: #1B5E20; color: #FFFFFF; }
  .badge-warning { background: #E65100; color: #FFFFFF; }
  .badge-danger  { background: #B71C1C; color: #FFFFFF; }
  .badge-info    { background: #0D47A1; color: #FFFFFF; }
  .badge-neutral { background: #ECE0E3; color: #642F43; }

  /* Math & Formula Presentation */
  .math-var {
    font-family: "Cambria Math", "Times New Roman", Times, Georgia, serif;
    font-style: italic;
    font-weight: 600;
  }

  .formula-card {
    background: #FDF8F9;
    border: 1pt solid #E8CCD3;
    border-left: 3.5pt solid #642F43;
    border-radius: 6px;
    padding: 8px 12px;
    margin: 8px 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    page-break-inside: avoid;
  }

  .formula-title {
    font-weight: 700;
    font-size: 9pt;
    color: #642F43;
    margin-bottom: 4px;
  }

  .formula-body {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 9pt;
    color: #1A0D12;
    background: #FFFFFF;
    padding: 6px 10px;
    border-radius: 4px;
    border: 0.5pt solid #DFC7CE;
    display: inline-block;
    margin: 3px 0;
  }

  /* Callout Boxes */
  .callout {
    background: #FDF9F9;
    border: 1pt solid #E8CCD3;
    border-left: 3.5pt solid #A3485E;
    border-radius: 6px;
    padding: 9px 12px;
    margin: 9px 0;
    page-break-inside: avoid;
  }

  .callout-title {
    font-weight: 700;
    color: #642F43;
    font-size: 9.5pt;
    margin-bottom: 4px;
  }

  /* Diagram Containers */
  .diagram-container {
    background: #FFFFFF;
    border: 1pt solid #DFC7CE;
    border-radius: 6px;
    padding: 10px;
    margin: 10px 0;
    text-align: center;
    page-break-inside: avoid;
  }

  .diagram-caption {
    font-size: 8pt;
    font-weight: 600;
    color: #7D5563;
    margin-top: 6px;
    text-align: center;
  }

  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8px 0;
    font-size: 8.5pt;
    page-break-inside: avoid;
  }

  th {
    background: #642F43;
    color: #FFFFFF;
    font-weight: 600;
    text-align: left;
    padding: 5px 8px;
    border: 0.5pt solid #4A1E2F;
  }

  td {
    padding: 4.5px 8px;
    border: 0.5pt solid #DFC7CE;
    vertical-align: top;
  }

  tr:nth-child(even) {
    background: #FAF3F5;
  }

  /* Code Blocks */
  pre {
    background: #1E1E2E;
    color: #CDD6F4;
    border-radius: 6px;
    padding: 9px 12px;
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 8pt;
    line-height: 1.45;
    overflow-x: auto;
    margin: 8px 0;
    page-break-inside: avoid;
    border: 1pt solid #313244;
  }

  code {
    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 8.5pt;
  }

  p code, li code, td code {
    background: #F3E5E8;
    color: #642F43;
    padding: 1px 4px;
    border-radius: 3px;
    font-size: 8pt;
    border: 0.5pt solid #DFC7CE;
  }

  /* Syntax Highlighting */
  .code-kw { color: #CBA6F7; font-weight: 600; } /* Keyword */
  .code-fn { color: #89B4FA; } /* Function */
  .code-str { color: #A6E3A1; } /* String */
  .code-cm { color: #6C7086; font-style: italic; } /* Comment */
  .code-num { color: #FAB387; } /* Number */
  .code-type { color: #F9E2AF; } /* Type */

  /* Viva QA Formatting */
  .qa-card {
    background: #FFFFFF;
    border: 1pt solid #DFC7CE;
    border-left: 3pt solid #642F43;
    border-radius: 5px;
    padding: 7px 10px;
    margin-bottom: 7px;
    page-break-inside: avoid;
  }

  .qa-q {
    font-weight: 700;
    font-size: 9pt;
    color: #642F43;
    margin-bottom: 3px;
  }

  .qa-a {
    font-size: 8.5pt;
    color: #2D1A22;
    line-height: 1.45;
  }
</style>
</head>
<body>
"""

HTML_FOOTER = """
</body>
</html>
"""
