import React, { useState } from 'react';
import { 
  Share2, RotateCcw, Table, Network, AlertTriangle, 
  CheckCircle2, ArrowUpDown, Info, Layers
} from 'lucide-react';
import ConflictGraphCanvas from '../components/ConflictGraphCanvas';

export default function ConflictGraphView({ 
  graph, 
  timetableResult, 
  onRebuildGraph 
}) {
  const [viewMode, setViewMode] = useState('canvas'); // 'canvas' | 'matrix' | 'edges'

  // Degree sorted list for Welsh-Powell display
  const degreeSortedSubjects = [...graph.subjects].sort((a, b) => {
    const degA = graph.degrees.get(a.id) || 0;
    const degB = graph.degrees.get(b.id) || 0;
    return degB - degA;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#642F43]">Conflict Graph G = (V, E)</h2>
          <p className="text-xs text-[#6F4253] mt-0.5">
            Mathematical graph representation where vertices are examination subjects and edges are shared student divisions.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex flex-col sm:flex-row sm:flex-nowrap items-stretch sm:items-center gap-1.5 p-1 clay-inset rounded-2xl sm:rounded-full w-full sm:w-fit shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('canvas')}
            aria-pressed={viewMode === 'canvas'}
            className={`examia-tab-pill flex-1 sm:flex-initial justify-center min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'canvas'
                ? 'bg-[#642F43] text-[#FDF8FA] border-[#4A1F30] shadow-sm'
                : 'bg-transparent text-[#6F4253] border-transparent hover:bg-[#FAF0F3]/80 hover:text-[#642F43]'
            }`}
          >
            <Network className="w-3.5 h-3.5 shrink-0" />
            <span>Interactive Graph</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('edges')}
            aria-pressed={viewMode === 'edges'}
            className={`examia-tab-pill flex-1 sm:flex-initial justify-center min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'edges'
                ? 'bg-[#642F43] text-[#FDF8FA] border-[#4A1F30] shadow-sm'
                : 'bg-transparent text-[#6F4253] border-transparent hover:bg-[#FAF0F3]/80 hover:text-[#642F43]'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span>Conflict Pairs ({graph.edgeCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('matrix')}
            aria-pressed={viewMode === 'matrix'}
            className={`examia-tab-pill flex-1 sm:flex-initial justify-center min-h-[40px] px-3 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              viewMode === 'matrix'
                ? 'bg-[#642F43] text-[#FDF8FA] border-[#4A1F30] shadow-sm'
                : 'bg-transparent text-[#6F4253] border-transparent hover:bg-[#FAF0F3]/80 hover:text-[#642F43]'
            }`}
          >
            <Table className="w-3.5 h-3.5 shrink-0" />
            <span>Adjacency Matrix</span>
          </button>
        </div>
      </div>

      {/* Main View Content */}
      {viewMode === 'canvas' && (
        <ConflictGraphCanvas
          graph={graph}
          assignments={timetableResult ? timetableResult.assignments : {}}
          onRebuild={onRebuildGraph}
        />
      )}

      {viewMode === 'edges' && (
        <div className="card-premium overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#C58E9B]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-[#FAF0F3]">
            <div>
              <h3 id="conflict-pairs-heading" className="font-serif font-bold text-base text-[#642F43]">
                Detected Conflict Pairs (Edges in G)
              </h3>
              <p className="text-xs text-[#6F4253]">
                Every pair below cannot be placed into the same examination time slot.
              </p>
            </div>
            <span className="badge badge-peach self-start sm:self-auto shrink-0">{graph.edges.length} Total Edges</span>
          </div>

          {graph.edges.length === 0 ? (
            <div className="p-8 sm:p-12 text-center text-[#6F4253]">
              <CheckCircle2 className="w-10 h-10 mx-auto text-[#642F43] mb-3 stroke-[1.5]" />
              <p className="font-serif text-lg font-bold text-[#642F43]">No Conflicts Detected</p>
              <p className="text-xs mt-1">All subjects are completely independent! They can all share a single time slot.</p>
            </div>
          ) : (
            <>
              {/* Mobile Card Stack (< 768px) */}
              <div className="md:hidden divide-y divide-[#C58E9B]/22 bg-[#FDF9FA]">
                {graph.edges.map((edge, idx) => (
                  <div key={idx} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-[#6F4253]">Edge e{idx + 1}</span>
                      <span className="font-mono text-[11px] text-[#642F43] font-bold bg-[#FAF0F3] px-2.5 py-0.5 rounded-full border border-[#C58E9B]/35">
                        Slot({edge.uCode}) &ne; Slot({edge.vCode})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      <div className="p-2 rounded-xl clay-inset">
                        <span className="font-mono font-bold text-[#642F43] mr-2">{edge.uCode}</span>
                        <span className="text-[#361522] font-medium">{edge.uName}</span>
                      </div>
                      <div className="p-2 rounded-xl clay-inset">
                        <span className="font-mono font-bold text-[#642F43] mr-2">{edge.vCode}</span>
                        <span className="text-[#361522] font-medium">{edge.vName}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-[#6F4253]">Shared:</span>
                      {edge.sharedDivisions.map(div => (
                        <span key={div} className="badge badge-peach text-[10px]">
                          {div}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Accessible Scroll Table (md+) */}
              <div
                role="region"
                tabIndex={0}
                aria-labelledby="conflict-pairs-heading"
                className="hidden md:block examia-table-region"
              >
                <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#F4E4E9] border-b border-[#C58E9B]/40 text-[#642F43] font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3.5 px-5">Edge #</th>
                    <th className="py-3.5 px-4">Subject u</th>
                    <th className="py-3.5 px-4">Subject v</th>
                    <th className="py-3.5 px-4">Conflicting Student Divisions</th>
                    <th className="py-3.5 px-5 text-right">Chromatic Constraint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C58E9B]/22 bg-[#FDF9FA]">
                  {graph.edges.map((edge, idx) => (
                    <tr key={idx} className="hover:bg-[#FAF0F3] transition-colors">
                      <td className="py-3.5 px-5 font-mono text-[#6F4253] font-bold">
                        e{idx + 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#642F43] mr-2">{edge.uCode}</span>
                        <span className="text-[#361522] font-medium">{edge.uName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-[#642F43] mr-2">{edge.vCode}</span>
                        <span className="text-[#361522] font-medium">{edge.vName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1">
                          {edge.sharedDivisions.map(div => (
                            <span key={div} className="badge badge-peach text-[10px]">
                              {div}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-[11px] text-[#642F43] font-bold">
                        Slot({edge.uCode}) &ne; Slot({edge.vCode})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </>
          )}
        </div>
      )}

      {viewMode === 'matrix' && (
        <div className="card-premium p-4 sm:p-6 overflow-hidden">
          <div className="pb-4 border-b border-[#C58E9B]/32 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h3 id="adjacency-matrix-heading" className="font-serif font-bold text-base text-[#642F43]">
                Binary Adjacency Matrix A(G)
              </h3>
              <p className="text-xs text-[#6F4253]">
                A[i][j] = 1 represents an edge (shared division); A[i][j] = 0 represents mutual independence.
              </p>
            </div>
            <span className="badge badge-lavender font-mono self-start sm:self-auto shrink-0">{graph.vertexCount} &times; {graph.vertexCount}</span>
          </div>

          <div
            role="region"
            tabIndex={0}
            aria-labelledby="adjacency-matrix-heading"
            className="examia-table-region mt-4"
          >
            <table className="border-collapse text-xs mx-auto rounded-xl overflow-hidden shadow-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 p-2.5 border border-[#C58E9B]/45 bg-[#F4E4E9] font-mono text-[11px] text-[#6F4253]"></th>
                  {graph.subjects.map(s => (
                    <th key={s.id} className="p-2.5 border border-[#C58E9B]/45 bg-[#F4E4E9] font-mono font-bold text-[#642F43] text-center min-w-[54px]">
                      {s.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {graph.subjects.map(rowSubj => (
                  <tr key={rowSubj.id}>
                    <td className="sticky left-0 z-10 p-2.5 border border-[#C58E9B]/45 bg-[#F4E4E9] font-mono font-bold text-[#642F43] text-center">
                      {rowSubj.code}
                    </td>
                    {graph.subjects.map(colSubj => {
                      const isSelf = rowSubj.id === colSubj.id;
                      const isAdjacent = graph.adjacencyList.get(rowSubj.id)?.has(colSubj.id);
                      return (
                        <td 
                          key={colSubj.id} 
                          className={`p-2.5 border border-[#C58E9B]/45 text-center font-mono text-xs ${
                            isSelf 
                              ? 'bg-[#F4E4E9]/70 text-[#6F4253]/75' 
                              : isAdjacent 
                                ? 'bg-[#642F43] text-[#FDF8FA] font-bold' 
                                : 'bg-[#FDF9FA] text-[#6F4253]'
                          }`}
                        >
                          {isSelf ? '0' : isAdjacent ? '1' : '0'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Degree Ranking & Welsh-Powell Ordering Table */}
      <div className="card-premium p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#C58E9B]/32">
          <div>
            <h3 className="font-serif font-bold text-base text-[#642F43]">
              Welsh-Powell Degree Ranking (Priority Queue)
            </h3>
            <p className="text-xs text-[#6F4253]">
              Greedy graph coloring processes vertices in descending degree order to minimize chromatic overshoot.
            </p>
          </div>
          <span className="badge badge-sage self-start sm:self-auto shrink-0">Descending Order</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-4">
          {degreeSortedSubjects.map((s, rank) => {
            const deg = graph.degrees.get(s.id) || 0;
            return (
              <div 
                key={s.id} 
                className="p-3.5 rounded-2xl clay-inset flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-[10px] font-mono text-[#6F4253] font-bold">Priority #{rank + 1}</span>
                    <span className="badge badge-lavender text-[10px]">deg = {deg}</span>
                  </div>
                  <p className="font-serif font-bold text-sm text-[#642F43]">{s.code}</p>
                  <p className="text-[11px] text-[#361522] font-medium truncate">{s.name}</p>
                </div>
                <div className="mt-2 pt-2 border-t border-[#C58E9B]/32 text-[10px] text-[#6F4253]">
                  Divisions: <strong className="text-[#361522]">{s.divisions.join(", ")}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

