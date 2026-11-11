import React, { useState, useEffect, useMemo, useTransition, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import Modal from './components/Modal';
import LoadingScreen from './components/LoadingScreen';
import { UserAvatar } from './components/UserAvatar';

import OverviewView from './views/OverviewView';
import SubjectsView from './views/SubjectsView';
import DivisionsView from './views/DivisionsView';
import ConflictGraphView from './views/ConflictGraphView';
import GenerateTimetableView from './views/GenerateTimetableView';
import ComparisonView from './views/ComparisonView';
import FinalScheduleView from './views/FinalScheduleView';

import { 
  INITIAL_SUBJECTS, 
  INITIAL_DIVISIONS, 
  INITIAL_ROOMS, 
  DEFAULT_TIMETABLE_CONFIG 
} from './data/defaultData';
import { buildConflictGraph } from './algorithms/graph';
import { 
  Building, Plus, Trash2, Cpu, 
  BookOpen, CheckCircle2, ShieldCheck, Code2 
} from 'lucide-react';

export default function App() {
  // Navigation State: split urgent nav highlight from deferred view mount for smooth 60fps switches
  const [activeTab, setActiveTab] = useState('overview');
  const [renderedTab, setRenderedTab] = useState('overview');
  const [, startTabTransition] = useTransition();
  const mainScrollRef = useRef(null);

  const handleTabChange = useCallback((nextTab) => {
    setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
    startTabTransition(() => {
      setRenderedTab(nextTab);
    });
  }, []);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [renderedTab]);

  // Core Data loaded from localStorage with default fallbacks
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem('examoptima_subjects');
      return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
    } catch (e) {
      return INITIAL_SUBJECTS;
    }
  });

  const [divisions, setDivisions] = useState(() => {
    try {
      const saved = localStorage.getItem('examoptima_divisions');
      return saved ? JSON.parse(saved) : INITIAL_DIVISIONS;
    } catch (e) {
      return INITIAL_DIVISIONS;
    }
  });

  const [rooms, setRooms] = useState(() => {
    try {
      const saved = localStorage.getItem('examoptima_rooms');
      return saved ? JSON.parse(saved) : INITIAL_ROOMS;
    } catch (e) {
      return INITIAL_ROOMS;
    }
  });

  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('examoptima_config');
      return saved ? JSON.parse(saved) : DEFAULT_TIMETABLE_CONFIG;
    } catch (e) {
      return DEFAULT_TIMETABLE_CONFIG;
    }
  });

  const [timetableResult, setTimetableResult] = useState(() => {
    try {
      const saved = localStorage.getItem('examoptima_timetable');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Activities Log
  const [activities, setActivities] = useState(() => {
    return [
      { title: "System Initialized", description: "Examia workspace loaded with benchmark dataset.", time: "Just now" },
      { title: "Conflict Graph Built", description: "5 subjects evaluated across Divisions A, B, and C.", time: "Just now" }
    ];
  });

  const logActivity = (title, description) => {
    setActivities(prev => [
      { title, description, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
      ...prev.slice(0, 9)
    ]);
  };

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3800);
  };

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);

  // Initial full-page loading screen state (shown only on initial load / reload)
  const [isAppReady, setIsAppReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

  // Initialize resources on mount, then dismiss loader
  useEffect(() => {
    let cancelled = false;
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const reducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const initializeApp = async () => {
      const fontsReady =
        typeof document !== 'undefined' && document.fonts?.ready
          ? Promise.race([document.fonts.ready, delay(900)])
          : Promise.resolve();

      const minShowcaseMs = reducedMotion ? 220 : 1380;

      await Promise.race([
        Promise.all([fontsReady, delay(minShowcaseMs)]),
        delay(2400),
      ]);

      if (cancelled) return;
      setIsAppReady(true);
    };

    initializeApp();

    return () => {
      cancelled = true;
    };
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('examoptima_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('examoptima_divisions', JSON.stringify(divisions));
  }, [divisions]);

  useEffect(() => {
    localStorage.setItem('examoptima_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('examoptima_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    if (timetableResult) {
      localStorage.setItem('examoptima_timetable', JSON.stringify(timetableResult));
    }
  }, [timetableResult]);

  // Dynamically compute conflict graph
  const graph = useMemo(() => {
    return buildConflictGraph(subjects);
  }, [subjects]);

  // Rebuild graph handler
  const handleRebuildGraph = () => {
    logActivity("Graph Recomputed", `Re-analyzed ${subjects.length} subjects & ${graph.edgeCount} conflict edges.`);
    showToast(`Conflict graph rebuilt: ${graph.edgeCount} conflicts identified.`);
  };

  // Subject CRUD Handlers
  const handleAddSubject = (newSubject) => {
    setSubjects(prev => [...prev, newSubject]);
    logActivity("Subject Added", `Registered ${newSubject.code}: ${newSubject.name}`);
    showToast(`Subject ${newSubject.code} successfully added.`);
  };

  const handleEditSubject = (updated) => {
    setSubjects(prev => prev.map(s => s.id === updated.id ? updated : s));
    logActivity("Subject Updated", `Updated parameters for ${updated.code}`);
    showToast(`Subject ${updated.code} updated.`);
  };

  const handleDeleteSubject = (id) => {
    const subj = subjects.find(s => s.id === id);
    setSubjects(prev => prev.filter(s => s.id !== id));
    logActivity("Subject Removed", `Deleted ${subj?.code || id}`);
    showToast(`Subject deleted.`);
  };

  // Reset to Benchmark Data
  const handleResetBenchmark = () => {
    setSubjects(INITIAL_SUBJECTS);
    setDivisions(INITIAL_DIVISIONS);
    setRooms(INITIAL_ROOMS);
    setTimetableResult(null);
    logActivity("Benchmark Restored", "Reset to CS201, CS202, CS203, CS204, MA201.");
    showToast("Reset to standard DAA benchmark dataset.");
  };

  // Division CRUD Handlers
  const handleAddDivision = (newDiv) => {
    setDivisions(prev => [...prev, newDiv]);
    logActivity("Division Created", `Added cohort ${newDiv.name}`);
    showToast(`Division ${newDiv.name} added.`);
  };

  const handleEditDivision = (updated) => {
    setDivisions(prev => prev.map(d => d.id === updated.id ? updated : d));
    logActivity("Division Updated", `Updated ${updated.name}`);
    showToast(`Division ${updated.name} updated.`);
  };

  const handleDeleteDivision = (id) => {
    const div = divisions.find(d => d.id === id);
    setDivisions(prev => prev.filter(d => d.id !== id));
    logActivity("Division Removed", `Deleted ${div?.name || id}`);
    showToast(`Division deleted.`);
  };

  // Timetable Generated Handler
  const handleTimetableGenerated = (result) => {
    setTimetableResult(result);
    logActivity("Timetable Generated", `${result.algorithmName.split(' ')[0]} produced ${result.numSlots} slots.`);
    showToast(`Conflict-free timetable generated (${result.numSlots} slots)!`);
  };

  // Room Management State in Settings
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomCapacity, setNewRoomCapacity] = useState(80);
  const [newRoomBuilding, setNewRoomBuilding] = useState('Academic Wing');

  const handleAddRoom = (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const room = {
      id: `room-${Date.now()}`,
      name: newRoomName.trim(),
      capacity: parseInt(newRoomCapacity, 10) || 60,
      building: newRoomBuilding.trim(),
      floor: "Ground"
    };
    setRooms(prev => [...prev, room]);
    setNewRoomName('');
    showToast(`Hall ${room.name} registered.`);
  };

  const handleDeleteRoom = (id) => {
    setRooms(prev => prev.filter(r => r.id !== id));
    showToast("Examination hall deleted.");
  };

  return (
    <>
      <div
        data-loading={showLoader && !isAppReady ? '' : undefined}
        className="examia-app-shell flex h-screen bg-[#F4E6EA] overflow-hidden text-[#361522]"
      >
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Topbar */}
        <Topbar activeTab={activeTab} />

        {/* Scrollable View Area */}
        <main ref={mainScrollRef} className="examia-main-scroll flex-1 overflow-y-auto px-6 sm:px-10 py-6">
          <div key={renderedTab} className="max-w-7xl mx-auto">
            {renderedTab === 'overview' && (
              <OverviewView
                subjects={subjects}
                divisions={divisions}
                graph={graph}
                timetableResult={timetableResult}
                setActiveTab={handleTabChange}
                onOpenAddSubject={() => handleTabChange('subjects')}
                activities={activities}
              />
            )}

            {renderedTab === 'subjects' && (
              <SubjectsView
                subjects={subjects}
                divisions={divisions}
                graph={graph}
                onAddSubject={handleAddSubject}
                onEditSubject={handleEditSubject}
                onDeleteSubject={handleDeleteSubject}
                onResetBenchmark={handleResetBenchmark}
              />
            )}

            {renderedTab === 'divisions' && (
              <DivisionsView
                divisions={divisions}
                subjects={subjects}
                graph={graph}
                onAddDivision={handleAddDivision}
                onEditDivision={handleEditDivision}
                onDeleteDivision={handleDeleteDivision}
              />
            )}

            {renderedTab === 'graph' && (
              <ConflictGraphView
                graph={graph}
                timetableResult={timetableResult}
                onRebuildGraph={handleRebuildGraph}
              />
            )}

            {renderedTab === 'generate' && (
              <GenerateTimetableView
                subjects={subjects}
                graph={graph}
                rooms={rooms}
                config={config}
                setConfig={setConfig}
                onTimetableGenerated={handleTimetableGenerated}
                setActiveTab={handleTabChange}
              />
            )}

            {renderedTab === 'comparison' && (
              <ComparisonView
                subjects={subjects}
                graph={graph}
              />
            )}

            {renderedTab === 'schedule' && (
              <FinalScheduleView
                subjects={subjects}
                divisions={divisions}
                timetableResult={timetableResult}
                config={config}
                setActiveTab={handleTabChange}
              />
            )}
          </div>
        </main>
      </div>

      {/* System Settings & Room Configuration Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Settings & Facility Configuration"
        subtitle="Manage examination halls, seating capacities, and default dataset."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Room Allocation Management */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-serif font-bold text-sm text-[#642F43] flex items-center gap-2">
                <Building className="w-4 h-4 text-[#642F43]" />
                <span>Examination Halls &amp; Capacity ({rooms.length})</span>
              </h4>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {rooms.map(room => (
                <div 
                  key={room.id}
                  className="p-2.5 rounded-xl clay-inset flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-[#361522]">{room.name}</span>
                    <span className="text-[#6F4253] ml-2">Capacity: <strong className="text-[#361522]">{room.capacity} seats</strong> &middot; {room.building}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteRoom(room.id)}
                    className="p-1.5 rounded-lg hover:bg-[#DFB8C3]/70 text-[#6F4253] hover:text-[#642F43] transition-colors"
                    title="Delete Room"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Room Form */}
            <form onSubmit={handleAddRoom} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-[#C58E9B]/35">
              <input
                type="text"
                placeholder="Hall Name (e.g. Hall 105)"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                className="clay-inset rounded-xl px-3 py-1.5 text-xs text-[#361522] placeholder:text-[#6F4253]/80 focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
              />
              <input
                type="number"
                min="10"
                max="500"
                placeholder="Capacity"
                value={newRoomCapacity}
                onChange={(e) => setNewRoomCapacity(e.target.value)}
                className="clay-inset rounded-xl px-3 py-1.5 text-xs text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
              />
              <input
                type="text"
                placeholder="Building / Floor"
                value={newRoomBuilding}
                onChange={(e) => setNewRoomBuilding(e.target.value)}
                className="clay-inset rounded-xl px-3 py-1.5 text-xs text-[#361522] placeholder:text-[#6F4253]/80 focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
              />
              <button
                type="submit"
                className="btn-primary text-xs py-1.5 px-3 flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Hall</span>
              </button>
            </form>
          </div>

          {/* Reset Action */}
          <div className="pt-4 border-t border-[#C58E9B]/35 flex items-center justify-between">
            <span className="text-xs text-[#6F4253]">Reset curriculum and halls to factory state:</span>
            <button
              onClick={() => {
                handleResetBenchmark();
                setIsSettingsOpen(false);
              }}
              className="btn-secondary text-xs py-2 px-3.5 text-[#642F43] hover:bg-[#E9CFD6]"
            >
              Reset All Benchmark Data
            </button>
          </div>
        </div>
      </Modal>

      {/* DAA Project Architecture & Educational About Modal */}
      <Modal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        title="Examia Architecture &amp; DAA Theory"
        subtitle="College Design & Analysis of Algorithms (DAA) Mini-Project"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-4 text-xs text-[#361522] leading-relaxed">
          <div className="p-4 rounded-2xl bg-[#642F43] border border-[#4A1F30] shadow-xs">
            <h4 className="font-serif font-bold text-sm text-[#FDF8FA] mb-1">
              Problem Statement: Examination Timetabling Problem (ETP)
            </h4>
            <p className="text-[#F2DCE3]">
              Given a set of subjects <em>V</em> and a set of student divisions <em>D</em>, schedule each subject into a discrete time slot <em>c &in; &#123;1, ..., k&#125;</em> such that no student cohort is scheduled for two exams concurrently. This problem maps directly to the <strong>Vertex Coloring Problem (VCP)</strong> on an undirected conflict graph <em>G = (V, E)</em>, which is proven to be <strong>NP-Hard</strong>.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl clay-inset">
              <h5 className="font-bold text-[#642F43] mb-1">1. Greedy Coloring (Welsh-Powell)</h5>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6F4253]">
                <li>Calculates degrees for all <em>v &in; V</em></li>
                <li>Sorts vertices descending: <em>deg(v<sub>1</sub>) &ge; deg(v<sub>2</sub>)</em></li>
                <li>Assigns minimum non-conflicting color</li>
                <li>Complexity: <strong>O(V log V + E)</strong></li>
                <li>Sub-millisecond execution for large cohorts</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-2xl clay-inset">
              <h5 className="font-bold text-[#642F43] mb-1">2. Backtracking Graph Coloring (DFS)</h5>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-[#6F4253]">
                <li>Recursive state-space tree traversal</li>
                <li>Pruning: Backtracks when conflict occurs</li>
                <li>Exact minimum chromatic number &chi;(G)</li>
                <li>Complexity: <strong>O(m<sup>V</sup>)</strong> worst-case</li>
                <li>Finds optimal slot allocation</li>
              </ul>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl clay-inset">
            <h5 className="font-bold text-[#642F43] mb-1 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-[#642F43]" />
              <span>Technology &amp; Implementation Integrity</span>
            </h5>
            <p className="text-[11px] text-[#6F4253]">
              Engine: High-precision Graph Coloring (Welsh-Powell) and Recursive Backtracking DFS executing directly in-browser.
              <br />
              Frontend: React 18, Vite 6, Tailwind/CSS3 typography with editorial aesthetic and high-precision SVG canvas visualization.
            </p>
          </div>
        </div>
      </Modal>

      {/* Toast Notification Container */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <UserAvatar name="Kiko" size={56} />
      </div>
      {showLoader && (
        <LoadingScreen
          isReady={isAppReady}
          onExited={() => setShowLoader(false)}
        />
      )}
    </>
  );
}

