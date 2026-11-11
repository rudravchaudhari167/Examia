/**
 * Mathematical Conflict Graph Construction & Analysis Module
 *
 * Conflict Definition:
 * For any two subjects S_i and S_j (i != j):
 * An edge (S_i, S_j) in E exists <=> Divisions(S_i) ∩ Divisions(S_j) != ∅
 */

export function getSharedDivisions(s1, s2) {
  if (!s1 || !s2 || s1.id === s2.id) return [];
  const set2 = new Set(s2.divisions || []);
  return (s1.divisions || []).filter(div => set2.has(div));
}

export function hasConflict(s1, s2) {
  return getSharedDivisions(s1, s2).length > 0;
}

export function buildConflictGraph(subjects) {
  const subjectList = subjects || [];
  const subjectMap = new Map();
  const adjacencyList = new Map();
  const degrees = new Map();
  const edges = [];

  // Initialize data structures
  subjectList.forEach(s => {
    subjectMap.set(s.id, s);
    adjacencyList.set(s.id, new Set());
    degrees.set(s.id, 0);
  });

  // Calculate edges: O(V^2 * D)
  const n = subjectList.length;
  for (let i = 0; i < n; i++) {
    const s1 = subjectList[i];
    for (let j = i + 1; j < n; j++) {
      const s2 = subjectList[j];
      const shared = getSharedDivisions(s1, s2);
      if (shared.length > 0) {
        adjacencyList.get(s1.id).add(s2.id);
        adjacencyList.get(s2.id).add(s1.id);
        edges.push({
          uId: s1.id,
          vId: s2.id,
          uCode: s1.code,
          vCode: s2.code,
          uName: s1.name,
          vName: s2.name,
          sharedDivisions: shared
        });
      }
    }
  }

  // Calculate degrees
  subjectList.forEach(s => {
    const deg = adjacencyList.get(s.id).size;
    degrees.set(s.id, deg);
  });

  // Calculate graph theoretical metrics
  const vertexCount = subjectList.length;
  const edgeCount = edges.length;
  let maxDegree = 0;
  let totalDegree = 0;

  degrees.forEach(deg => {
    if (deg > maxDegree) maxDegree = deg;
    totalDegree += deg;
  });

  const avgDegree = vertexCount > 0 ? (totalDegree / vertexCount).toFixed(2) : "0.00";
  const maxPossibleEdges = vertexCount > 1 ? (vertexCount * (vertexCount - 1)) / 2 : 0;
  const density = maxPossibleEdges > 0 ? (edgeCount / maxPossibleEdges).toFixed(3) : "0.000";

  return {
    subjects: subjectList,
    subjectMap,
    adjacencyList,
    degrees,
    edges,
    vertexCount,
    edgeCount,
    maxDegree,
    avgDegree: Number(avgDegree),
    density: Number(density),
    isConflict(id1, id2) {
      const neighbors = adjacencyList.get(id1);
      return !!(neighbors && neighbors.has(id2));
    }
  };
}

/**
 * Rigorously validates that no two simultaneous examinations share any student divisions.
 * Returns { isValid: boolean, violations: Array }
 */
export function validateSchedule(subjects, assignments) {
  const violations = [];
  const subjectMap = new Map(subjects.map(s => [s.id, s]));

  // Group by slot
  const slotGroups = new Map();
  for (const [subjId, slot] of Object.entries(assignments)) {
    if (!slotGroups.has(slot)) {
      slotGroups.set(slot, []);
    }
    slotGroups.get(slot).push(subjId);
  }

  // Check each slot group for common divisions
  for (const [slot, subjIds] of slotGroups.entries()) {
    for (let i = 0; i < subjIds.length; i++) {
      const s1 = subjectMap.get(subjIds[i]);
      for (let j = i + 1; j < subjIds.length; j++) {
        const s2 = subjectMap.get(subjIds[j]);
        if (s1 && s2) {
          const shared = getSharedDivisions(s1, s2);
          if (shared.length > 0) {
            violations.push({
              slot,
              subj1: s1,
              subj2: s2,
              sharedDivisions: shared,
              reason: `Students in ${shared.join(", ")} enrolled in both ${s1.code} and ${s2.code}`
            });
          }
        }
      }
    }
  }

  return {
    isValid: violations.length === 0,
    violations
  };
}

