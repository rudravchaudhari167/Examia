import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import LoadingScreen from './components/LoadingScreen';

import DashboardView from './views/DashboardView';
import ManageDataView from './views/ManageDataView';
import TimetableGeneratorView from './views/TimetableGeneratorView';

import { INITIAL_DIVISIONS, INITIAL_SUBJECTS } from './data/defaultData';
import { buildConflictGraph } from './algorithms/graph';

function recalcSubjectStudentCount(groupNames, divisionsList, fallbackCount = 45) {
  const divMap = new Map(divisionsList.map((d) => [d.name, Number(d.studentCount) || 0]));
  const total = groupNames.reduce((sum, name) => sum + (divMap.get(name) || 0), 0);
  return total > 0 ? total : fallbackCount;
}

export default function App() {
  // Navigation State: strictly 3 main pages ('dashboard' | 'manage' | 'generator')
  const [activeTab, setActiveTab] = useState('dashboard');
  const [renderedTab, setRenderedTab] = useState('dashboard');
  const [, startTabTransition] = useTransition();
  const mainScrollRef = useRef(null);

  const handleTabChange = useCallback((nextTab) => {
    const normalized =
      nextTab === 'dashboard' || nextTab === 'manage' || nextTab === 'generator'
        ? nextTab
        : 'dashboard';
    setActiveTab((prev) => (prev === normalized ? prev : normalized));
    startTabTransition(() => {
      setRenderedTab(normalized);
    });
  }, []);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [renderedTab]);

  // Core Data persisted in localStorage with sample defaults
  const [subjects, setSubjects] = useState(() => {
    try {
      const saved = localStorage.getItem('examoptima_subjects');
      return saved ? JSON.parse(saved) : INITIAL_SUBJECTS;
    } catch {
      return INITIAL_SUBJECTS;
    }
  });

  const [divisions, setDivisions] = useState(() => {
    try {
      const saved = localStorage.getItem('examoptima_divisions');
      return saved ? JSON.parse(saved) : INITIAL_DIVISIONS;
    } catch {
      return INITIAL_DIVISIONS;
    }
  });

  const [timetableResult, setTimetableResult] = useState(() => {
    try {
      const saved = localStorage.getItem('examoptima_timetable');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Track individual algorithm runs on current dataset for comparison
  const [algoRuns, setAlgoRuns] = useState({
    greedy: null,
    backtracking: null,
  });

  // Toast State
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3800);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // Initial full-page loading screen state (shown only on initial load / reload)
  const [isAppReady, setIsAppReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);

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

  // Sync changes to localStorage
  useEffect(() => {
    localStorage.setItem('examoptima_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('examoptima_divisions', JSON.stringify(divisions));
  }, [divisions]);

  useEffect(() => {
    if (timetableResult) {
      localStorage.setItem('examoptima_timetable', JSON.stringify(timetableResult));
    } else {
      localStorage.removeItem('examoptima_timetable');
    }
  }, [timetableResult]);

  // Dynamically compute conflict graph from subjects and shared student groups
  const graph = useMemo(() => buildConflictGraph(subjects), [subjects]);

  // Subject CRUD Handlers
  const handleAddSubject = (newSubject) => {
    setSubjects((prev) => [...prev, newSubject]);
    setAlgoRuns({ greedy: null, backtracking: null });
    showToast(`Subject ${newSubject.code} added.`);
  };

  const handleEditSubject = (updated) => {
    setSubjects((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setAlgoRuns({ greedy: null, backtracking: null });
    showToast(`Subject ${updated.code} updated.`);
  };

  const handleDeleteSubject = (id) => {
    const target = subjects.find((s) => s.id === id);
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setAlgoRuns({ greedy: null, backtracking: null });
    showToast(`Subject ${target?.code || ''} deleted.`);
  };

  // Student Group CRUD Handlers (keeps subject group references synced)
  const handleAddDivision = (newGroup) => {
    setDivisions((prev) => [...prev, newGroup]);
    showToast(`Student group "${newGroup.name}" added.`);
  };

  const handleEditDivision = (updatedGroup, previousName) => {
    const nextDivisions = divisions.map((d) => (d.id === updatedGroup.id ? updatedGroup : d));
    setDivisions(nextDivisions);

    setSubjects((prev) =>
      prev.map((subj) => {
        const currentGroups = Array.isArray(subj.divisions) ? subj.divisions : [];
        const renamedGroups =
          previousName && previousName !== updatedGroup.name
            ? currentGroups.map((name) => (name === previousName ? updatedGroup.name : name))
            : currentGroups;
        return {
          ...subj,
          divisions: renamedGroups,
          studentCount: recalcSubjectStudentCount(renamedGroups, nextDivisions, subj.studentCount),
        };
      })
    );

    setAlgoRuns({ greedy: null, backtracking: null });
    showToast(`Student group "${updatedGroup.name}" updated.`);
  };

  const handleDeleteDivision = (id) => {
    const target = divisions.find((d) => d.id === id);
    const nextDivisions = divisions.filter((d) => d.id !== id);
    setDivisions(nextDivisions);

    if (target) {
      setSubjects((prev) =>
        prev.map((subj) => {
          const filtered = (subj.divisions || []).filter((name) => name !== target.name);
          return {
            ...subj,
            divisions: filtered,
            studentCount: recalcSubjectStudentCount(filtered, nextDivisions, subj.studentCount),
          };
        })
      );
    }

    setAlgoRuns({ greedy: null, backtracking: null });
    showToast(`Student group "${target?.name || ''}" deleted.`);
  };

  // Update Enrolments for a Specific Student Group
  const handleUpdateDivisionEnrolments = (groupName, selectedSubjectIds) => {
    const selectedSet = new Set(selectedSubjectIds);
    setSubjects((prev) =>
      prev.map((subj) => {
        const existing = Array.isArray(subj.divisions) ? subj.divisions : [];
        const hasGroup = existing.includes(groupName);
        const shouldHaveGroup = selectedSet.has(subj.id);

        if (hasGroup === shouldHaveGroup) return subj;

        const nextGroups = shouldHaveGroup
          ? [...existing, groupName]
          : existing.filter((name) => name !== groupName);

        return {
          ...subj,
          divisions: nextGroups,
          studentCount: recalcSubjectStudentCount(nextGroups, divisions, subj.studentCount),
        };
      })
    );

    setAlgoRuns({ greedy: null, backtracking: null });
    showToast(`Enrolments updated for ${groupName}.`);
  };

  // Reset Dataset to Sample Data
  const handleResetSampleData = () => {
    setSubjects(INITIAL_SUBJECTS);
    setDivisions(INITIAL_DIVISIONS);
    setTimetableResult(null);
    setAlgoRuns({ greedy: null, backtracking: null });
    showToast('Restored default sample dataset.');
  };

  // Timetable Generated Handler
  const handleTimetableGenerated = (algoKey, result) => {
    setTimetableResult(result);
    setAlgoRuns((prev) => ({
      ...prev,
      [algoKey]: result,
    }));
    showToast(`Conflict-free timetable generated (${result.numSlots} slots).`);
  };

  return (
    <>
      <div
        id="examia-app-shell"
        data-loading={showLoader && !isAppReady ? '' : undefined}
        className="examia-app-shell flex h-dvh w-full max-w-full bg-[#F4E6EA] overflow-hidden text-[#361522]"
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            window.dispatchEvent(new CustomEvent('examia-close-mobile-nav'));
            handleTabChange(tab);
          }}
        />

        <div id="examia-main-shell" className="flex-1 min-w-0 flex flex-col h-dvh overflow-hidden">
          <Topbar activeTab={activeTab} />

          <main
            ref={mainScrollRef}
            className="examia-main-scroll flex-1 overflow-y-auto overscroll-y-contain px-3.5 sm:px-6 lg:px-10 py-4 sm:py-6 examia-safe-pb"
          >
            <div key={renderedTab} className="max-w-6xl mx-auto">
              {renderedTab === 'dashboard' && (
                <DashboardView
                  subjects={subjects}
                  divisions={divisions}
                  graph={graph}
                  timetableResult={timetableResult}
                  setActiveTab={handleTabChange}
                />
              )}

              {renderedTab === 'manage' && (
                <ManageDataView
                  subjects={subjects}
                  divisions={divisions}
                  onAddSubject={handleAddSubject}
                  onEditSubject={handleEditSubject}
                  onDeleteSubject={handleDeleteSubject}
                  onAddDivision={handleAddDivision}
                  onEditDivision={handleEditDivision}
                  onDeleteDivision={handleDeleteDivision}
                  onUpdateDivisionEnrolments={handleUpdateDivisionEnrolments}
                  onResetSampleData={handleResetSampleData}
                />
              )}

              {renderedTab === 'generator' && (
                <TimetableGeneratorView
                  subjects={subjects}
                  graph={graph}
                  timetableResult={timetableResult}
                  algoRuns={algoRuns}
                  onTimetableGenerated={handleTimetableGenerated}
                  onNavigateToManage={() => handleTabChange('manage')}
                />
              )}
            </div>
          </main>
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
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
