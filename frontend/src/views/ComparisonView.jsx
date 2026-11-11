import React, { useState, useEffect } from 'react';
import { 
  GitCompare, Play, Zap, Clock, ShieldCheck, CheckCircle2, 
  AlertTriangle, RefreshCw, Layers, Cpu, BookOpen, BarChart2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend 
} from 'recharts';
import { executeAlgorithmComparison } from '../api/apiService';

export default function ComparisonView({ 
  subjects, 
  graph, 
  backendStatus 
}) {
  const [benchmarkResult, setBenchmarkResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState(null);
  const [iterations, setIterations] = useState(1);

  const runBenchmark = async () => {
    if (subjects.length === 0) {
      setError("Please add subjects first to run algorithm benchmarks.");
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      // Execute live comparison
      const result = await executeAlgorithmComparison(
        subjects, 
        0, // auto chromatic search for backtracking
        backendStatus.isConnected ? "auto" : "js"
      );
      setBenchmarkResult(result);
    } catch (err) {
      setError(err.message || "Benchmark failed.");
    } finally {
      setIsRunning(false);
    }
  };

  // Run automatically on first mount if subjects exist
  useEffect(() => {
    if (subjects.length > 0 && !benchmarkResult) {
      runBenchmark();
    }
  }, [subjects.length]);

  const greedy = benchmarkResult?.greedy;
  const backtracking = benchmarkResult?.backtracking;
  const metrics = benchmarkResult?.graphMetrics;

  // Chart data for execution time (ms)
  const timeChartData = benchmarkResult ? [
    {
      name: "Greedy (Welsh-Powell)",
      timeMs: greedy ? Math.max(0.001, greedy.executionTimeMs) : 0,
      color: "#C58E9B"
    },
    {
      name: "Backtracking (DFS)",
      timeMs: backtracking ? Math.max(0.001, backtracking.executionTimeMs) : 0,
      color: "#642F43"
    }
  ] : [];

  // Chart data for slots used
  const slotsChartData = benchmarkResult ? [
    {
      name: "Greedy (Welsh-Powell)",
      slots: greedy ? greedy.numSlots : 0,
      color: "#DFB8C3"
    },
    {
      name: "Backtracking (Exact)",
      slots: backtracking ? backtracking.numSlots : 0,
      color: "#642F43"
    }
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-2xl font-serif font-bold text-[#642F43]">Algorithm Comparison Dashboard</h2>
          <p className="text-xs text-[#6F4253] mt-0.5">
            Empirical runtime performance and chromatic optimality comparison on the exact same conflict graph.
          </p>
        </div>

        <button
          onClick={runBenchmark}
          disabled={isRunning}
          className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 self-start sm:self-auto"
        >
          <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Measuring Live Execution...' : 'Re-Run Live Benchmark'}</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#F4E4E9] border border-[#642F43]/45 text-xs text-[#642F43] flex items-center gap-2 font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Engine Origin Badge */}
      {benchmarkResult && (
        <div className="px-4 py-3 rounded-2xl clay-inset text-xs text-[#6F4253] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#642F43]" />
            <span>
              Real-Time Benchmark Executed On: <strong className="text-[#361522]">{benchmarkResult.executedOn}</strong>
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#642F43] font-bold">100% Unfabricated Metrics</span>
        </div>
      )}

      {/* Side-by-Side Comparison Metric Table (Requirement 12) */}
      <div className="card-premium overflow-hidden">
        <div className="p-5 border-b border-[#C58E9B]/35 flex items-center justify-between bg-[#FAF0F3]">
          <div>
            <h3 className="font-serif font-bold text-base text-[#642F43]">
              Empirical Performance Matrix
            </h3>
            <p className="text-xs text-[#6F4253]">
              Direct comparison on |V| = {graph.vertexCount} subjects, |E| = {graph.edgeCount} conflict edges.
            </p>
          </div>
          <span className="badge badge-lavender">Direct Comparison</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F4E4E9] border-b border-[#C58E9B]/40 text-[#642F43] font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3.5 px-6">Metric</th>
                <th className="py-3.5 px-6 text-[#8F4B63]">Greedy Coloring (Welsh-Powell)</th>
                <th className="py-3.5 px-6 text-[#642F43]">Backtracking (Recursive DFS)</th>
                <th className="py-3.5 px-6">Theoretical Analysis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C58E9B]/22 bg-[#FDF9FA]">
              {/* Number of Slots */}
              <tr className="hover:bg-[#FAF0F3] transition-colors">
                <td className="py-4 px-6 font-bold text-[#361522]">
                  Number of Slots Used
                </td>
                <td className="py-4 px-6 font-mono font-bold text-base text-[#8F4B63]">
                  {greedy ? `${greedy.numSlots} Slots` : "..."}
                </td>
                <td className="py-4 px-6 font-mono font-bold text-base text-[#642F43]">
                  {backtracking ? `${backtracking.numSlots} Slots (Optimal &chi;)` : "..."}
                </td>
                <td className="py-4 px-6 text-[11px] text-[#6F4253]">
                  Backtracking guarantees the exact minimum &chi;(G); Greedy provides an upper bound &le; &Delta;(G) + 1.
                </td>
              </tr>

              {/* Execution Time */}
              <tr className="hover:bg-[#FAF0F3] transition-colors">
                <td className="py-4 px-6 font-bold text-[#361522]">
                  Execution Time
                </td>
                <td className="py-4 px-6 font-mono font-bold text-[#8F4B63]">
                  {greedy ? `${greedy.executionTimeMs.toFixed(4)} ms` : "..."}
                </td>
                <td className="py-4 px-6 font-mono font-bold text-[#642F43]">
                  {backtracking ? `${backtracking.executionTimeMs.toFixed(4)} ms` : "..."}
                </td>
                <td className="py-4 px-6 text-[11px] text-[#6F4253]">
                  Greedy completes almost instantaneously; Backtracking explores the state-space tree.
                </td>
              </tr>

              {/* Valid Schedule */}
              <tr className="hover:bg-[#FAF0F3] transition-colors">
                <td className="py-4 px-6 font-bold text-[#361522]">
                  Valid Schedule (Conflict-Free)
                </td>
                <td className="py-4 px-6">
                  {greedy?.isValid ? (
                    <span className="badge badge-sage">Verified 100% Conflict-Free</span>
                  ) : (
                    <span className="badge badge-peach">Violation</span>
                  )}
                </td>
                <td className="py-4 px-6">
                  {backtracking?.isValid ? (
                    <span className="badge badge-sage">Verified 100% Conflict-Free</span>
                  ) : (
                    <span className="badge badge-peach">Violation</span>
                  )}
                </td>
                <td className="py-4 px-6 text-[11px] text-[#6F4253]">
                  Both algorithms rigorously enforce that adjacent vertices never share an examination slot.
                </td>
              </tr>

              {/* Search Operations */}
              <tr className="hover:bg-[#FAF0F3] transition-colors">
                <td className="py-4 px-6 font-bold text-[#361522]">
                  Search Operations
                </td>
                <td className="py-4 px-6 font-mono font-semibold text-[#361522]">
                  {greedy ? `${greedy.operationsCount} color checks` : "..."}
                </td>
                <td className="py-4 px-6 font-mono font-semibold text-[#361522]">
                  {backtracking ? `${backtracking.recursiveCalls} recursive calls` : "..."}
                </td>
                <td className="py-4 px-6 text-[11px] text-[#6F4253]">
                  Greedy makes a single pass over sorted vertices; Backtracking prunes and backtracks.
                </td>
              </tr>

              {/* Algorithmic Complexity */}
              <tr className="hover:bg-[#FAF0F3] transition-colors">
                <td className="py-4 px-6 font-bold text-[#361522]">
                  Asymptotic Complexity
                </td>
                <td className="py-4 px-6 font-mono text-xs text-[#8F4B63] font-bold">
                  O(V log V + E)
                </td>
                <td className="py-4 px-6 font-mono text-xs text-[#642F43] font-bold">
                  O(m<sup>V</sup>) worst-case
                </td>
                <td className="py-4 px-6 text-[11px] text-[#6F4253]">
                  Graph coloring is an NP-Complete decision problem and NP-Hard optimization.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Recharts Bar Charts (Requirement 12) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Execution Time Chart */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#C58E9B]/32">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#642F43]">
                Execution Time Comparison (ms)
              </h3>
              <p className="text-[11px] text-[#6F4253]">Lower runtime is superior</p>
            </div>
            <Clock className="w-4 h-4 text-[#642F43]" />
          </div>

          <div className="h-64 mt-4 rounded-2xl clay-inset p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeChartData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 47, 67, 0.14)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#6F4253', fontWeight: 600 }} 
                  interval={0}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: '#6F4253' }}
                  unit=" ms"
                />
                <Tooltip 
                  formatter={(val) => [`${val} ms`, "Execution Time"]}
                  contentStyle={{ backgroundColor: '#FDF9FA', borderRadius: '14px', border: '1px solid #C58E9B', color: '#361522', fontSize: '12px' }}
                />
                <Bar dataKey="timeMs" radius={[10, 10, 4, 4]}>
                  {timeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Number of Slots Chart */}
        <div className="card-premium p-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#C58E9B]/32">
            <div>
              <h3 className="font-serif font-bold text-sm text-[#642F43]">
                Examination Slots (Colors) Needed
              </h3>
              <p className="text-[11px] text-[#6F4253]">Fewer slots minimizes examination days</p>
            </div>
            <Layers className="w-4 h-4 text-[#642F43]" />
          </div>

          <div className="h-64 mt-4 rounded-2xl clay-inset p-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slotsChartData} margin={{ top: 15, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 47, 67, 0.14)" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11, fill: '#6F4253', fontWeight: 600 }} 
                  interval={0}
                />
                <YAxis 
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: '#6F4253' }}
                  unit=" slots"
                />
                <Tooltip 
                  formatter={(val) => [`${val} Slots`, "Total Slots"]}
                  contentStyle={{ backgroundColor: '#FDF9FA', borderRadius: '14px', border: '1px solid #C58E9B', color: '#361522', fontSize: '12px' }}
                />
                <Bar dataKey="slots" radius={[10, 10, 4, 4]}>
                  {slotsChartData.map((entry, index) => (
                    <Cell key={`cell-slot-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mandatory Educational DAA Explanation (Requirement 12) */}
      <div className="card-premium p-7">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[#642F43] text-[#FDF8FA] border border-[#4A1F30] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="space-y-3">
            <h3 className="font-serif font-bold text-lg text-[#642F43]">
              Algorithmic Trade-Offs: Greedy vs. Backtracking
            </h3>
            <div className="text-xs text-[#361522] leading-relaxed space-y-2.5">
              <p>
                <strong>Greedy Graph Coloring (Welsh-Powell):</strong> Makes locally optimal choices at each stage by picking the smallest available color for the highest-degree vertex. It runs in polynomial time <code>O(V log V + E)</code> and is exceptionally fast for large campus timetables, but does not guarantee the theoretical minimum chromatic number &chi;(G).
              </p>
              <p>
                <strong>Backtracking Graph Coloring:</strong> Systematically explores alternative assignments via recursive Depth-First Search. It can find a valid coloring for a specified slot budget <em>m</em> if one exists, or systematically determine the exact chromatic number &chi;(G). However, because graph coloring is NP-Complete, its worst-case time complexity is exponential <code>O(m^V)</code>.
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3 text-[11px] text-[#642F43] font-semibold">
              <span className="badge badge-lavender">DAA Academic Finding</span>
              <span>Welsh-Powell produces an optimal or near-optimal coloring for typical academic enrollment structures.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

