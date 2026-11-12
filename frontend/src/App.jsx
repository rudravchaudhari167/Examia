import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import LoadingScreen from './components/LoadingScreen';

import DashboardView from './views/DashboardView';
import ManageDataView from './views/ManageDataView';
import TimetableGeneratorView from './views/TimetableGeneratorView';

import * as api from './api/apiService';
import { buildConflictGraph } from './algorithms/graph';

const DEFAULT_CONFIG = {
  startDate: '2026-11-20',
  dailyStartTime: '09:00',
  examDurationMinutes: 180,
  breakDurationMinutes: 60,
  numDays: 5,
  maxExamsPerDay: 2,
  sessionDurationsMinutes: [180, 180],
  sessionStartTimes: ['09:00', '13:00'],
};

export default function App() {
  // Strictly 3 pages: 'dashboard' | 'manage' | 'generator'
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

  // Real SQLite-backed application state
  const [subjects, setSubjects] = useState([]);
  const [studentGroups, setStudentGroups] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [latestTimetable, setLatestTimetable] = useState(null);
  const [algoRuns, setAlgoRuns] = useState({ greedy: null, backtracking: null });
  const [backendError, setBackendError] = useState(null);

  // Toast State
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const applyBootstrapState = useCallback((data) => {
    if (!data) return;
    setSubjects(Array.isArray(data.subjects) ? data.subjects : []);
    setStudentGroups(Array.isArray(data.studentGroups) ? data.studentGroups : []);
    setClassrooms(Array.isArray(data.classrooms) ? data.classrooms : []);
    if (data.config) setConfig(data.config);
    setLatestTimetable(data.latestTimetable ?? null);
    setAlgoRuns(data.algoRuns ?? { greedy: null, backtracking: null });
    setBackendError(null);
  }, []);

  const refreshFromBackend = useCallback(async () => {
    try {
      const data = await api.fetchBootstrapState();
      applyBootstrapState(data);
      return data;
    } catch (err) {
      setBackendError(err.message || 'Unable to connect to Examia backend.');
      return null;
    }
  }, [applyBootstrapState]);

  // Initial full-page loading screen + initial SQLite bootstrap
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

      const bootstrapPromise = refreshFromBackend();
      const minShowcaseMs = reducedMotion ? 220 : 1200;

      await Promise.all([fontsReady, bootstrapPromise, delay(minShowcaseMs)]);
      if (cancelled) return;
      setIsAppReady(true);
    };

    initializeApp();
    return () => {
      cancelled = true;
    };
  }, [refreshFromBackend]);

  // Dynamically compute conflict graph from persisted subjects & group enrolments
  const graph = useMemo(() => buildConflictGraph(subjects), [subjects]);

  // --- CRUD Handlers backed by Java REST + SQLite ---
  const handleAddSubject = async (payload) => {
    const created = await api.createSubject(payload);
    await refreshFromBackend();
    showToast(`Subject ${created.code} added to database.`);
  };

  const handleEditSubject = async (payload) => {
    const updated = await api.updateSubject(payload);
    await refreshFromBackend();
    showToast(`Subject ${updated.code} updated.`);
  };

  const handleDeleteSubject = async (id) => {
    const data = await api.deleteSubject(id);
    applyBootstrapState(data);
    showToast('Subject removed.');
  };

  const handleAddGroup = async (payload) => {
    const created = await api.createStudentGroup(payload);
    await refreshFromBackend();
    showToast(`Division "${created.name}" added.`);
  };

  const handleEditGroup = async (payload) => {
    const updated = await api.updateStudentGroup(payload);
    await refreshFromBackend();
    showToast(`Division "${updated.name}" updated.`);
  };

  const handleDeleteGroup = async (id) => {
    const data = await api.deleteStudentGroup(id);
    applyBootstrapState(data);
    showToast('Division deleted.');
  };

  const handleUpdateEnrolments = async ({ subjectId, groupIds, groupId, subjectIds }) => {
    const data = await api.updateSubjectEnrolments({ subjectId, groupIds, groupId, subjectIds });
    applyBootstrapState(data);
    showToast('Subject enrolments saved and totals recalculated.');
  };

  const handleAddClassroom = async (payload) => {
    const created = await api.createClassroom(payload);
    await refreshFromBackend();
    showToast(`Classroom "${created.name}" added.`);
  };

  const handleEditClassroom = async (payload) => {
    const updated = await api.updateClassroom(payload);
    await refreshFromBackend();
    showToast(`Classroom "${updated.name}" updated.`);
  };

  const handleDeleteClassroom = async (id, clearSchedule = false) => {
    const data = await api.deleteClassroom(id, clearSchedule);
    applyBootstrapState(data);
    showToast(
      clearSchedule
        ? 'Cleared assigned schedule and deleted classroom.'
        : 'Classroom deleted.'
    );
  };

  const handleResetSampleData = async () => {
    const data = await api.resetSampleDataset();
    applyBootstrapState(data);
    showToast('Default sample dataset restored in database.');
  };

  const handleSaveConfig = async (nextConfig) => {
    const saved = await api.saveExamConfiguration(nextConfig);
    setConfig(saved);
    showToast('Examination configuration saved.');
    return saved;
  };

  const handleGenerateTimetable = async ({ algorithm, maxSlots, config: incomingConfig }) => {
    const res = await api.generateExaminationTimetable({
      algorithm,
      maxSlots,
      config: incomingConfig,
    });
    if (res.timetable) setLatestTimetable(res.timetable);
    if (res.algoRuns) setAlgoRuns(res.algoRuns);
    if (res.config) setConfig(res.config);
    if (res.classrooms) setClassrooms(res.classrooms);
    showToast(
      `Generated conflict-free timetable (${res.timetable?.numSlots ?? 0} slots, ${
        res.timetable?.scheduledExams?.length ?? 0
      } exams).`
    );
    return res;
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
            <div key={renderedTab} className="max-w-6xl mx-auto space-y-4">
              {backendError && (
                <div
                  role="alert"
                  className="p-4 rounded-2xl bg-[#F8EAEF] border-2 border-[#642F43] text-[#361522] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#642F43] shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="font-bold text-[#642F43]">Database Server Unavailable</p>
                      <p className="text-[#4A1F30] mt-0.5">{backendError}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={refreshFromBackend}
                    className="btn-secondary min-h-[40px] px-3.5 py-2 text-xs font-semibold inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Retry Connection</span>
                  </button>
                </div>
              )}

              {renderedTab === 'dashboard' && (
                <DashboardView
                  subjects={subjects}
                  studentGroups={studentGroups}
                  classrooms={classrooms}
                  latestTimetable={latestTimetable}
                  setActiveTab={handleTabChange}
                />
              )}

              {renderedTab === 'manage' && (
                <ManageDataView
                  subjects={subjects}
                  studentGroups={studentGroups}
                  classrooms={classrooms}
                  onAddSubject={handleAddSubject}
                  onEditSubject={handleEditSubject}
                  onDeleteSubject={handleDeleteSubject}
                  onAddGroup={handleAddGroup}
                  onEditGroup={handleEditGroup}
                  onDeleteGroup={handleDeleteGroup}
                  onUpdateEnrolments={handleUpdateEnrolments}
                  onAddClassroom={handleAddClassroom}
                  onEditClassroom={handleEditClassroom}
                  onDeleteClassroom={handleDeleteClassroom}
                  onResetSampleData={handleResetSampleData}
                />
              )}

              {renderedTab === 'generator' && (
                <TimetableGeneratorView
                  subjects={subjects}
                  classrooms={classrooms}
                  graph={graph}
                  config={config}
                  latestTimetable={latestTimetable}
                  algoRuns={algoRuns}
                  onSaveConfig={handleSaveConfig}
                  onGenerateTimetable={handleGenerateTimetable}
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
