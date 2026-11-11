/**
 * Unified API & Execution Service
 * Seamlessly interfaces with either the lightweight Java DAA REST API (Port 8080)
 * or the in-browser high-precision JavaScript DAA implementation.
 */

import { buildConflictGraph } from '../algorithms/graph.js';
import { runGreedyColoring } from '../algorithms/greedyColoring.js';
import { runBacktrackingColoring } from '../algorithms/backtrackingColoring.js';

const JAVA_BACKEND_URL = "http://localhost:8080/api";

export async function checkJavaBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`${JAVA_BACKEND_URL}/health`, {
      method: "GET",
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { isConnected: true, data };
    }
  } catch (err) {
    // Java backend is not running or unreachable
  }
  return { isConnected: false, data: null };
}

export async function executeGreedyColoring(subjects, enginePreference = "auto") {
  const localGraph = buildConflictGraph(subjects);

  if (enginePreference !== "js") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${JAVA_BACKEND_URL}/solve/greedy`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const javaResult = await res.json();
        return {
          ...javaResult,
          executedOn: "Java 21 LTS Engine (Native Backend: Port 8080)",
          isBackendJava: true
        };
      }
    } catch (e) {
      if (enginePreference === "java") {
        throw new Error("Java backend is not responding. Please run ./run-backend.sh or switch to Browser Engine.");
      }
    }
  }

  // Local JS fallback
  const localResult = runGreedyColoring(localGraph);
  return {
    ...localResult,
    executedOn: "Browser DAA Engine (Client-side JavaScript)",
    isBackendJava: false
  };
}

export async function executeBacktrackingColoring(subjects, maxSlots = 0, enginePreference = "auto") {
  const localGraph = buildConflictGraph(subjects);

  if (enginePreference !== "js") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${JAVA_BACKEND_URL}/solve/backtrack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects, maxSlots }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const javaResult = await res.json();
        return {
          ...javaResult,
          executedOn: "Java 21 LTS Engine (Native Backend: Port 8080)",
          isBackendJava: true
        };
      }
    } catch (e) {
      if (enginePreference === "java") {
        throw new Error("Java backend is not responding. Please run ./run-backend.sh or switch to Browser Engine.");
      }
    }
  }

  // Local JS fallback
  const localResult = runBacktrackingColoring(localGraph, maxSlots);
  return {
    ...localResult,
    executedOn: "Browser DAA Engine (Client-side JavaScript)",
    isBackendJava: false
  };
}

export async function executeAlgorithmComparison(subjects, maxSlots = 0, enginePreference = "auto") {
  const localGraph = buildConflictGraph(subjects);

  if (enginePreference !== "js") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${JAVA_BACKEND_URL}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjects, maxSlots }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const javaData = await res.json();
        return {
          ...javaData,
          executedOn: "Java 21 LTS Engine (Native Backend: Port 8080)",
          isBackendJava: true
        };
      }
    } catch (e) {
      if (enginePreference === "java") {
        throw new Error("Java backend is not responding. Please run ./run-backend.sh or switch to Browser Engine.");
      }
    }
  }

  // Local JS fallback
  const greedy = runGreedyColoring(localGraph);
  const backtracking = runBacktrackingColoring(localGraph, maxSlots);

  return {
    greedy,
    backtracking,
    graphMetrics: {
      vertexCount: localGraph.vertexCount,
      edgeCount: localGraph.edgeCount,
      maxDegree: localGraph.maxDegree,
      avgDegree: localGraph.avgDegree,
      density: localGraph.density
    },
    executedOn: "Browser DAA Engine (Client-side JavaScript)",
    isBackendJava: false
  };
}

