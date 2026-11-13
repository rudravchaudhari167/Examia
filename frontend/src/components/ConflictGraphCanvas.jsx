import React, { useState, useRef, useEffect, useMemo, memo } from 'react';
import { 
  Maximize2, RotateCcw, Info, Layers, Eye, ShieldAlert,
  Sparkles, CheckCircle2, AlertTriangle, Users, ZoomIn, ZoomOut
} from 'lucide-react';
import { SLOT_PALETTES } from '../data/defaultData';

function ConflictGraphCanvas({ 
  graph, 
  assignments = {}, 
  onRebuild, 
  title = "Examination Conflict Graph G = (V, E)" 
}) {
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);
  const [nodePositions, setNodePositions] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [fitToScreen, setFitToScreen] = useState(false);
  const [zoomFactor, setZoomFactor] = useState(1);
  const svgRef = useRef(null);

  const width = 800;
  const height = 520;
  const centerX = width / 2;
  const centerY = height / 2;

  // Initialize or update circular / organic positions
  useEffect(() => {
    if (!graph || !graph.subjects) return;
    const n = graph.subjects.length;
    if (n === 0) return;

    const radius = Math.min(centerX, centerY) - 85;
    const newPositions = {};

    graph.subjects.forEach((subj, i) => {
      // If position already exists, preserve it to allow smooth dragging
      if (nodePositions[subj.id]) {
        newPositions[subj.id] = nodePositions[subj.id];
      } else {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        newPositions[subj.id] = {
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        };
      }
    });

    setNodePositions(newPositions);
  }, [graph.subjects, centerX, centerY]);

  // Reset positions to canonical circular formation
  const resetLayout = () => {
    if (!graph || !graph.subjects) return;
    const n = graph.subjects.length;
    const radius = Math.min(centerX, centerY) - 85;
    const newPositions = {};
    graph.subjects.forEach((subj, i) => {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      newPositions[subj.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      };
    });
    setNodePositions(newPositions);
    setSelectedNodeId(null);
    setHoveredNodeId(null);
  };

  // Node Drag & Touch handlers using Pointer Events
  const handlePointerDown = (nodeId, e) => {
    e.stopPropagation();
    if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
    svgRef.current?.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    setDraggedNodeId(nodeId);
    setSelectedNodeId(nodeId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !draggedNodeId || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;

    // Constrain within SVG boundary so node & slot tag stay unclipped
    const clampedX = Math.max(52, Math.min(width - 52, x));
    const clampedY = Math.max(58, Math.min(height - 52, y));

    setNodePositions(prev => ({
      ...prev,
      [draggedNodeId]: { x: clampedX, y: clampedY }
    }));
  };

  const handlePointerUp = (e) => {
    if (e?.pointerId !== undefined && svgRef.current?.hasPointerCapture?.(e.pointerId)) {
      svgRef.current.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
    setDraggedNodeId(null);
  };

  // Active highlighted node (either hovered or clicked)
  const activeNodeId = hoveredNodeId || selectedNodeId;

  // Selected subject object
  const selectedSubject = useMemo(() => {
    if (!selectedNodeId || !graph) return null;
    return graph.subjects.find(s => s.id === selectedNodeId) || null;
  }, [selectedNodeId, graph]);

  // Conflicts of selected subject
  const selectedSubjectConflicts = useMemo(() => {
    if (!selectedNodeId || !graph) return [];
    const directNeighbors = graph.adjacencyList.get(selectedNodeId) || new Set();
    return graph.edges.filter(
      e => (e.uId === selectedNodeId && directNeighbors.has(e.vId)) ||
           (e.vId === selectedNodeId && directNeighbors.has(e.uId))
    );
  }, [selectedNodeId, graph]);

  // Precomputed node color mapping based on assigned slots for O(1) rendering
  const nodeVisualsMap = useMemo(() => {
    const map = new Map();
    if (!graph || !graph.subjects) return map;
    graph.subjects.forEach((subj) => {
      const slot = assignments[subj.id];
      if (slot !== undefined && slot !== null && slot >= 0) {
        const palette = SLOT_PALETTES[slot % SLOT_PALETTES.length];
        map.set(subj.id, {
          fill: palette.fillColor,
          stroke: palette.strokeColor,
          textColor: palette.textColor,
          slotLabel: `Slot ${slot + 1}`
        });
      } else {
        map.set(subj.id, {
          fill: "#FAF0F3",
          stroke: "#C58E9B",
          textColor: "#642F43",
          slotLabel: "Unscheduled"
        });
      }
    });
    return map;
  }, [graph, assignments]);

  const getNodeVisuals = (nodeId) => {
    return nodeVisualsMap.get(nodeId) || {
      fill: "#FAF0F3",
      stroke: "#C58E9B",
      textColor: "#642F43",
      slotLabel: "Unscheduled"
    };
  };

  return (
    <div className="card-premium p-4 sm:p-6 relative overflow-hidden">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-[#C58E9B]/32">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#642F43] text-[#FDF8FA] border border-[#4A1F30] shadow-xs shrink-0">
              <Layers className="w-4 h-4" />
            </span>
            <h3 className="text-lg sm:text-xl font-serif font-bold text-[#642F43] leading-snug">{title}</h3>
          </div>
          <p className="text-xs text-[#6F4253] mt-1">
            Interactive topology &middot; Drag vertices to adjust layout &middot; Tap any node to inspect division overlaps
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button 
            type="button"
            onClick={resetLayout} 
            className="btn-secondary text-xs min-h-[40px] py-2 px-3.5 flex items-center gap-1.5"
            title="Reset positions to circle"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Layout</span>
          </button>
          {onRebuild && (
            <button 
              type="button"
              onClick={onRebuild} 
              className="btn-primary text-xs min-h-[40px] py-2 px-4 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Rebuild Conflict Graph</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Graph Area & Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mt-4">
        {/* SVG Graph View */}
        <div className="lg:col-span-8 clay-inset rounded-2xl p-2 sm:p-3 flex flex-col select-none min-w-0">
          {graph.subjects.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 px-1 text-[11px] text-[#6F4253]">
              <span className="font-medium">
                {fitToScreen ? 'Full-graph fit' : zoomFactor > 1 ? `Zoomed ${Math.round(zoomFactor * 100)}% · swipe to pan` : 'Swipe sideways to pan · tap or drag vertices'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setFitToScreen(false);
                    setZoomFactor((z) => Math.max(1, Number((z - 0.25).toFixed(2))));
                  }}
                  aria-label="Zoom out graph"
                  disabled={!fitToScreen && zoomFactor <= 1}
                  className="min-w-[34px] min-h-[34px] rounded-lg border border-[#C58E9B]/55 bg-[#FDF9FA] hover:bg-[#F4E4E9] disabled:opacity-45 flex items-center justify-center text-[#642F43] transition-colors"
                >
                  <ZoomOut className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFitToScreen((f) => !f);
                    setZoomFactor(1);
                  }}
                  aria-pressed={fitToScreen}
                  className={`min-h-[34px] px-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-colors sm:hidden ${
                    fitToScreen
                      ? 'bg-[#642F43] text-[#FDF8FA] border-[#4A1F30]'
                      : 'bg-[#FDF9FA] text-[#642F43] border-[#C58E9B]/55 hover:bg-[#F4E4E9]'
                  }`}
                >
                  <Maximize2 className="w-3 h-3" aria-hidden="true" />
                  <span>{fitToScreen ? 'Pan' : 'Fit'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFitToScreen(false);
                    setZoomFactor((z) => Math.min(1.75, Number((z + 0.25).toFixed(2))));
                  }}
                  aria-label="Zoom in graph"
                  disabled={zoomFactor >= 1.75}
                  className="min-w-[34px] min-h-[34px] rounded-lg border border-[#C58E9B]/55 bg-[#FDF9FA] hover:bg-[#F4E4E9] disabled:opacity-45 flex items-center justify-center text-[#642F43] transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}

          {graph.subjects.length === 0 ? (
            <div className="min-h-[260px] lg:h-[480px] flex flex-col items-center justify-center text-center p-6 text-[#6F4253]">
              <AlertTriangle className="w-12 h-12 text-[#642F43] mb-2 stroke-[1.5]" />
              <p className="font-serif text-lg font-bold text-[#642F43]">No Subjects Available</p>
              <p className="text-sm max-w-sm mt-1">Add subjects with common student divisions to populate the conflict graph.</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto overflow-y-hidden overscroll-x-contain rounded-xl">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                style={{
                  width: zoomFactor > 1 ? `${Math.round(zoomFactor * 100)}%` : '100%',
                  touchAction: 'pan-x pan-y'
                }}
                className={`block ${
                  fitToScreen ? 'min-w-0' : 'min-w-[520px] sm:min-w-0'
                } aspect-[800/520] h-auto lg:h-[480px] cursor-grab active:cursor-grabbing`}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onClick={() => setSelectedNodeId(null)}
              >
              <defs>
                <filter id="nodeShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#642F43" floodOpacity="0.18" />
                </filter>
                <filter id="activeGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#642F43" floodOpacity="0.42" />
                </filter>
              </defs>

              {/* Conflict Edges */}
              <g className="edges">
                {graph.edges.map((edge, idx) => {
                  const posU = nodePositions[edge.uId];
                  const posV = nodePositions[edge.vId];
                  if (!posU || !posV) return null;

                  const isIncident = activeNodeId && (edge.uId === activeNodeId || edge.vId === activeNodeId);
                  const isDimmed = activeNodeId && !isIncident;

                  return (
                    <g key={`edge-${edge.uId}-${edge.vId}-${idx}`}>
                      <line
                        x1={posU.x}
                        y1={posU.y}
                        x2={posV.x}
                        y2={posV.y}
                        stroke={isIncident ? "#642F43" : "#C58E9B"}
                        strokeWidth={isIncident ? 2.8 : 1.6}
                        strokeDasharray={isIncident ? "none" : "none"}
                        opacity={isDimmed ? 0.16 : isIncident ? 1 : 0.78}
                        className="transition-all duration-200"
                      />
                      {/* Midpoint badge for shared divisions when incident */}
                      {isIncident && (
                        <circle
                          cx={(posU.x + posV.x) / 2}
                          cy={(posU.y + posV.y) / 2}
                          r={4.5}
                          fill="#642F43"
                        />
                      )}
                    </g>
                  );
                })}
              </g>

              {/* Subject Vertices */}
              <g className="nodes">
                {graph.subjects.map(subj => {
                  const pos = nodePositions[subj.id];
                  if (!pos) return null;

                  const isSelected = selectedNodeId === subj.id;
                  const isHovered = hoveredNodeId === subj.id;
                  const isActive = isSelected || isHovered;
                  
                  // Check if adjacent to active node
                  const isNeighbor = activeNodeId && graph.adjacencyList.get(activeNodeId)?.has(subj.id);
                  const isDimmed = activeNodeId && !isActive && !isNeighbor;

                  const visuals = getNodeVisuals(subj.id);
                  const degree = graph.degrees.get(subj.id) || 0;

                  return (
                    <g
                      key={`node-${subj.id}`}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Inspect ${subj.code} ${subj.name}, degree ${degree}`}
                      style={{ touchAction: 'none' }}
                      className="cursor-pointer transition-transform duration-150 focus:outline-none"
                      onPointerDown={(e) => handlePointerDown(subj.id, e)}
                      onPointerEnter={() => setHoveredNodeId(subj.id)}
                      onPointerLeave={() => setHoveredNodeId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedNodeId(subj.id);
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(subj.id);
                      }}
                      opacity={isDimmed ? 0.28 : 1}
                      filter={isActive ? "url(#activeGlow)" : "url(#nodeShadow)"}
                    >
                      {/* Pulse ring when selected */}
                      {isActive && (
                        <circle
                          r={38}
                          fill="none"
                          stroke="#642F43"
                          strokeWidth={2}
                          strokeDasharray="4,4"
                          className="animate-spin"
                          style={{ animationDuration: '8s' }}
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={30}
                        fill={visuals.fill}
                        stroke={isActive ? "#361522" : visuals.stroke}
                        strokeWidth={isActive ? 2.8 : 2}
                        strokeDasharray={visuals.slotLabel === "Unscheduled" ? "4,3" : undefined}
                        className="transition-all duration-200"
                      />

                      {/* Subject Code */}
                      <text
                        y={-4}
                        textAnchor="middle"
                        fill={visuals.textColor}
                        fontSize="12px"
                        fontWeight="700"
                        fontFamily="var(--font-sans)"
                        pointerEvents="none"
                      >
                        {subj.code}
                      </text>

                      {/* Degree Badge Pill inside node */}
                      <rect
                        x={-16}
                        y={7}
                        width={32}
                        height={14}
                        rx={7}
                        fill="#FDF9FA"
                        stroke="#C58E9B"
                        strokeWidth={1}
                        pointerEvents="none"
                      />
                      <text
                        y={17.5}
                        textAnchor="middle"
                        fill="#361522"
                        fontSize="8.5px"
                        fontWeight="700"
                        fontFamily="var(--font-sans)"
                        pointerEvents="none"
                      >
                        deg: {degree}
                      </text>

                      {/* Small floating Slot tag when scheduled */}
                      {visuals.slotLabel !== "Unscheduled" && (
                        <g transform="translate(0, -35)">
                          <rect
                            x={-28}
                            y={-9}
                            width={56}
                            height={18}
                            rx={9}
                            fill="#FDF9FA"
                            stroke={visuals.stroke}
                            strokeWidth={1.5}
                          />
                          <text
                            y={3.5}
                            textAnchor="middle"
                            fill="#642F43"
                            fontSize="9px"
                            fontWeight="700"
                            fontFamily="var(--font-sans)"
                          >
                            {visuals.slotLabel}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
            </div>
          )}

          {/* Quick Slot Legend (docked below canvas so no vertex is overlapped) */}
          <div className="mt-2.5 bg-[#FDF9FA]/95 px-3 sm:px-4 py-2 rounded-xl border border-[#C58E9B]/45 shadow-xs flex items-center gap-x-3 gap-y-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-[#6F4253] uppercase tracking-wider">Legend:</span>
            {SLOT_PALETTES.slice(0, 4).map(item => (
              <div key={item.slot} className="flex items-center gap-1.5">
                <span 
                  className="w-3 h-3 rounded-full border shadow-xs shrink-0" 
                  style={{ backgroundColor: item.fillColor, borderColor: item.strokeColor }}
                />
                <span className="text-xs font-semibold text-[#361522]">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Inspector Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4 min-w-0">
          {selectedSubject ? (
            <div className="p-4 sm:p-5 rounded-[20px] clay-inset border border-[#C58E9B]/50 animate-fade-in flex flex-col h-full">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#C58E9B]/32">
                <div className="min-w-0">
                  <span className="badge badge-lavender mb-1.5">{selectedSubject.code}</span>
                  <h4 className="text-lg font-serif font-bold text-[#642F43] break-words">{selectedSubject.name}</h4>
                  <p className="text-xs text-[#6F4253]">{selectedSubject.category || "Standard Examination"}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-bold font-serif text-[#642F43]">
                    {graph.degrees.get(selectedSubject.id) || 0}
                  </span>
                  <p className="text-[10px] uppercase font-semibold text-[#6F4253]">Vertex Degree</p>
                </div>
              </div>

              {/* Subject Details */}
              <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                <div className="p-2.5 bg-[#FDF9FA] rounded-xl border border-[#C58E9B]/45 shadow-xs">
                  <p className="text-[#6F4253] text-[11px]">Enrolled Students</p>
                  <p className="font-bold text-sm text-[#361522] flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-[#642F43]" />
                    {selectedSubject.studentCount}
                  </p>
                </div>
                <div className="p-2.5 bg-[#FDF9FA] rounded-xl border border-[#C58E9B]/45 shadow-xs">
                  <p className="text-[#6F4253] text-[11px]">Assigned Slot</p>
                  <p className="font-bold text-sm text-[#642F43] mt-0.5">
                    {assignments[selectedSubject.id] !== undefined 
                      ? `Slot ${Number(assignments[selectedSubject.id]) + 1}` 
                      : "Pending"}
                  </p>
                </div>
              </div>

              {/* Enrolled Divisions */}
              <div className="mb-3">
                <p className="text-[11px] font-semibold uppercase text-[#6F4253] mb-1.5">Enrolled Divisions:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSubject.divisions.map(div => (
                    <span key={div} className="badge badge-sage text-xs">
                      {div}
                    </span>
                  ))}
                </div>
              </div>

              {/* Incident Conflicts List */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-semibold uppercase text-[#6F4253]">
                    Conflicting Subjects ({selectedSubjectConflicts.length}):
                  </p>
                </div>

                {selectedSubjectConflicts.length === 0 ? (
                  <div className="p-3 bg-[#FDF9FA] rounded-xl border border-[#C58E9B]/45 text-xs text-[#642F43] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Isolated vertex. No division conflicts with other subjects!</span>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                    {selectedSubjectConflicts.map((c, i) => {
                      const otherId = c.uId === selectedSubject.id ? c.vId : c.uId;
                      const otherSubj = graph.subjectMap.get(otherId);
                      return (
                        <div key={i} className="p-2.5 bg-[#FDF9FA] rounded-xl border border-[#C58E9B]/45 text-xs shadow-xs">
                          <div className="flex items-center justify-between font-semibold text-[#361522]">
                            <span>{otherSubj?.code}: {otherSubj?.name}</span>
                            <span className="text-[10px] text-[#FDF8FA] bg-[#642F43] px-2 py-0.5 rounded-full font-bold">
                              Conflict
                            </span>
                          </div>
                          <p className="text-[11px] text-[#6F4253] mt-1">
                            Shared: <strong className="text-[#361522]">{c.sharedDivisions.join(", ")}</strong>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Default prompt when no node is selected */
            <div className="p-6 rounded-[20px] clay-inset border border-dashed border-[#C58E9B]/75 flex flex-col items-center justify-center text-center h-full">
              <Eye className="w-9 h-9 text-[#642F43] mb-3 stroke-[1.5]" />
              <h4 className="font-serif font-bold text-base text-[#642F43]">Select Any Vertex</h4>
              <p className="text-xs text-[#6F4253] max-w-[220px] mt-1">
                Click any subject node in the graph above to inspect its degree, enrolled divisions, and conflicting subjects.
              </p>
            </div>
          )}

          {/* DAA Explanation Panel (as requested in Prompt spec) */}
          <div className="p-4 rounded-2xl clay-inset text-xs text-[#361522] flex gap-3">
            <Info className="w-4 h-4 text-[#642F43] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#642F43] mb-0.5">DAA Theoretical Foundation</p>
              <p className="leading-relaxed text-[11px] text-[#6F4253]">
                Each subject represents a vertex. An edge connects two subjects if students from the same division study both subjects. Different colors represent different examination time slots.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ConflictGraphCanvas);

