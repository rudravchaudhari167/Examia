import React, { useEffect, useMemo, useState, memo } from 'react';
import {
  AlertCircle,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Loader2,
  Printer,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from 'lucide-react';
import {
  buildDailySessionPreview,
  formatIsoDateDisplay,
  resolveSessionDurationsMinutes,
  resolveSessionStartTimes,
} from '../algorithms/roomAllocator';
import { validateSchedule } from '../algorithms/graph';
import { SLOT_PALETTES } from '../data/defaultData';
import ConflictGraphCanvas from '../components/ConflictGraphCanvas';

function escapeCsvCell(value) {
  const str = String(value ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function minutesToHoursString(minutes) {
  const hrs = Number(minutes || 0) / 60;
  return Number.isInteger(hrs) ? String(hrs) : String(Math.round(hrs * 100) / 100);
}

function formatDurationBadge(minutes) {
  const m = Number(minutes || 0);
  if (m <= 0) return '0 min';
  const hrs = Math.floor(m / 60);
  const rem = m % 60;
  if (hrs === 0) return `${rem} min`;
  if (rem === 0) return `${hrs} hr${hrs === 1 ? '' : 's'} (${m} min)`;
  return `${hrs} hr ${rem} min (${m} min)`;
}

function buildSessionDurationsHours(cfg) {
  return resolveSessionDurationsMinutes({
    maxExamsPerDay: cfg?.maxExamsPerDay ?? 2,
    examDurationMinutes: cfg?.examDurationMinutes ?? 180,
    sessionDurationsMinutes: cfg?.sessionDurationsMinutes,
  }).map((m) => minutesToHoursString(m));
}

function buildSessionStartTimes(cfg) {
  return resolveSessionStartTimes({
    maxExamsPerDay: cfg?.maxExamsPerDay ?? 2,
    dailyStartTime: cfg?.dailyStartTime ?? '09:00',
    breakDurationMinutes: cfg?.breakDurationMinutes ?? 60,
    sessionDurationsMinutes: cfg?.sessionDurationsMinutes,
    sessionStartTimes: cfg?.sessionStartTimes,
  });
}

function TimetableGeneratorView({
  subjects,
  classrooms = [],
  graph,
  config,
  latestTimetable,
  algoRuns,
  onSaveConfig,
  onGenerateTimetable,
  onNavigateToManage,
}) {
  const [selectedAlgo, setSelectedAlgo] = useState(() =>
    latestTimetable?.algorithmKey === 'backtracking' ? 'backtracking' : 'greedy'
  );
  const [maxSlotsInput, setMaxSlotsInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationPhase, setGenerationPhase] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [configFeedback, setConfigFeedback] = useState(null);
  const [expandedExamIds, setExpandedExamIds] = useState({});

  const [draftConfig, setDraftConfig] = useState(() => ({
    startDate: config?.startDate || '2026-11-20',
    dailyStartTime: config?.dailyStartTime || '09:00',
    sessionDurationsHours: buildSessionDurationsHours(config),
    sessionStartTimes: buildSessionStartTimes(config),
    breakDurationHours: minutesToHoursString(config?.breakDurationMinutes ?? 60),
    numDays: String(config?.numDays ?? 5),
    maxExamsPerDay: String(config?.maxExamsPerDay ?? 2),
  }));

  // Reassuring dynamic status updates during algorithm execution
  useEffect(() => {
    if (!isGenerating) {
      setGenerationPhase('');
      return;
    }
    const startTime = Date.now();
    setGenerationPhase('Analyzing conflict graph & verifying division constraints…');

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      if (elapsed > 2400) {
        setGenerationPhase(
          selectedAlgo === 'backtracking'
            ? 'Deep state exploration: solving multi-exam sessions & room capacities…'
            : 'Allocating optimal classroom capacities across daily exam sessions…'
        );
      } else if (elapsed > 800) {
        setGenerationPhase('Evaluating chromatic coloring & mapping examination time slots…');
      }
    }, 400);

    return () => clearInterval(interval);
  }, [isGenerating, selectedAlgo]);

  useEffect(() => {
    if (!config) return;
    setDraftConfig({
      startDate: config.startDate || '2026-11-20',
      dailyStartTime: config.dailyStartTime || '09:00',
      sessionDurationsHours: buildSessionDurationsHours(config),
      sessionStartTimes: buildSessionStartTimes(config),
      breakDurationHours: minutesToHoursString(config.breakDurationMinutes ?? 60),
      numDays: String(config.numDays ?? 5),
      maxExamsPerDay: String(config.maxExamsPerDay ?? 2),
    });
  }, [config]);

  useEffect(() => {
    if (latestTimetable?.algorithmKey) {
      setSelectedAlgo(
        latestTimetable.algorithmKey === 'backtracking' ? 'backtracking' : 'greedy'
      );
    }
  }, [latestTimetable?.algorithmKey]);

  const handleDailyStartTimeChange = (rawVal) => {
    setDraftConfig((prev) => {
      const count = Math.max(1, Math.min(10, parseInt(prev.maxExamsPerDay, 10) || prev.sessionDurationsHours?.length || 2));
      const durationsMin = Array.from({ length: count }, (_, i) =>
        Math.round((parseFloat(prev.sessionDurationsHours?.[i]) || 3) * 60)
      );
      const breakMin = Number.isFinite(parseFloat(prev.breakDurationHours))
        ? Math.max(0, Math.round(parseFloat(prev.breakDurationHours) * 60))
        : 60;
      const nextStarts = resolveSessionStartTimes({
        maxExamsPerDay: count,
        dailyStartTime: rawVal,
        breakDurationMinutes: breakMin,
        sessionDurationsMinutes: durationsMin,
        sessionStartTimes: [],
      });
      return {
        ...prev,
        dailyStartTime: rawVal,
        sessionStartTimes: nextStarts,
      };
    });
  };

  const handleBreakDurationChange = (rawVal) => {
    const breakHrs = parseFloat(rawVal);
    setDraftConfig((prev) => {
      if (!Number.isFinite(breakHrs) || breakHrs < 0) {
        return { ...prev, breakDurationHours: rawVal };
      }
      const count = Math.max(1, Math.min(10, parseInt(prev.maxExamsPerDay, 10) || prev.sessionDurationsHours?.length || 2));
      const durationsMin = Array.from({ length: count }, (_, i) =>
        Math.round((parseFloat(prev.sessionDurationsHours?.[i]) || 3) * 60)
      );
      const nextStarts = resolveSessionStartTimes({
        maxExamsPerDay: count,
        dailyStartTime: prev.sessionStartTimes?.[0] || prev.dailyStartTime || '09:00',
        breakDurationMinutes: Math.round(breakHrs * 60),
        sessionDurationsMinutes: durationsMin,
        sessionStartTimes: [],
      });
      return {
        ...prev,
        breakDurationHours: rawVal,
        sessionStartTimes: nextStarts,
      };
    });
  };

  const handleMaxExamsPerDayChange = (rawVal) => {
    const parsed = parseInt(rawVal, 10);
    setDraftConfig((prev) => {
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 10) {
        return { ...prev, maxExamsPerDay: rawVal };
      }
      const nextDurations = [...(prev.sessionDurationsHours || [])];
      const fallback = nextDurations[nextDurations.length - 1] || '3';
      while (nextDurations.length < parsed) {
        nextDurations.push(fallback);
      }
      const durationsMin = nextDurations
        .slice(0, parsed)
        .map((h) => Math.round((parseFloat(h) || 3) * 60));
      const breakMin = Number.isFinite(parseFloat(prev.breakDurationHours))
        ? Math.max(0, Math.round(parseFloat(prev.breakDurationHours) * 60))
        : 60;
      const nextStarts = resolveSessionStartTimes({
        maxExamsPerDay: parsed,
        dailyStartTime: prev.sessionStartTimes?.[0] || prev.dailyStartTime || '09:00',
        breakDurationMinutes: breakMin,
        sessionDurationsMinutes: durationsMin,
        sessionStartTimes: prev.sessionStartTimes || [],
      });
      return {
        ...prev,
        maxExamsPerDay: rawVal,
        sessionDurationsHours: nextDurations.slice(0, parsed),
        sessionStartTimes: nextStarts,
      };
    });
  };

  const handleSessionStartTimeChange = (index, rawVal) => {
    setDraftConfig((prev) => {
      const nextStarts = [...(prev.sessionStartTimes || [])];
      nextStarts[index] = rawVal;
      return {
        ...prev,
        sessionStartTimes: nextStarts,
        dailyStartTime: index === 0 ? rawVal : prev.dailyStartTime,
      };
    });
  };

  const handleSessionDurationChange = (index, rawVal) => {
    setDraftConfig((prev) => {
      const nextDurations = [...(prev.sessionDurationsHours || [])];
      nextDurations[index] = rawVal;
      return { ...prev, sessionDurationsHours: nextDurations };
    });
  };

  const parsedConfigPayload = useMemo(() => {
    const breakHrs = parseFloat(draftConfig.breakDurationHours);
    const days = parseInt(draftConfig.numDays, 10);
    const maxPerDay = parseInt(draftConfig.maxExamsPerDay, 10);
    const sessionCount =
      Number.isFinite(maxPerDay) && maxPerDay >= 1 ? Math.min(maxPerDay, 10) : 0;
    const sessionDurationsMinutes = Array.from({ length: sessionCount }, (_, idx) => {
      const hrs = parseFloat(draftConfig.sessionDurationsHours?.[idx]);
      return Number.isFinite(hrs) ? Math.round(hrs * 60) : 0;
    });
    const sessionStartTimes = Array.from({ length: sessionCount }, (_, idx) => {
      return draftConfig.sessionStartTimes?.[idx] || '';
    });

    return {
      startDate: draftConfig.startDate,
      dailyStartTime: sessionStartTimes[0] || draftConfig.dailyStartTime,
      examDurationMinutes: sessionDurationsMinutes[0] || 0,
      sessionDurationsMinutes,
      sessionStartTimes,
      breakDurationMinutes: Number.isFinite(breakHrs) ? Math.round(breakHrs * 60) : -1,
      numDays: Number.isFinite(days) ? days : 0,
      maxExamsPerDay: Number.isFinite(maxPerDay) ? maxPerDay : 0,
    };
  }, [draftConfig]);

  const sessionPreview = useMemo(
    () => buildDailySessionPreview(parsedConfigPayload),
    [parsedConfigPayload]
  );

  const validateDraftConfig = () => {
    if (!parsedConfigPayload.startDate || !/^\d{4}-\d{2}-\d{2}$/.test(parsedConfigPayload.startDate)) {
      return 'Select a valid starting exam date.';
    }
    if (!parsedConfigPayload.dailyStartTime || !/^\d{2}:\d{2}$/.test(parsedConfigPayload.dailyStartTime)) {
      return 'Select a valid daily start time.';
    }
    if (parsedConfigPayload.maxExamsPerDay < 1 || parsedConfigPayload.maxExamsPerDay > 10) {
      return 'Max exams per day must be between 1 and 10.';
    }
    for (let i = 0; i < parsedConfigPayload.sessionStartTimes.length; i++) {
      const st = parsedConfigPayload.sessionStartTimes[i];
      if (!st || !/^\d{2}:\d{2}$/.test(st)) {
        return `Select a valid start time for Session ${i + 1}.`;
      }
    }
    for (let i = 0; i < parsedConfigPayload.sessionDurationsMinutes.length; i++) {
      const dur = parsedConfigPayload.sessionDurationsMinutes[i];
      if (dur < 15 || dur > 720) {
        return `Session ${i + 1} exam duration must be between 0.25 hours (15 min) and 12 hours.`;
      }
    }
    if (parsedConfigPayload.breakDurationMinutes < 0 || parsedConfigPayload.breakDurationMinutes > 480) {
      return 'Break duration must be between 0 and 8 hours.';
    }
    if (parsedConfigPayload.numDays < 1 || parsedConfigPayload.numDays > 60) {
      return 'Number of exam days must be between 1 and 60.';
    }
    if (!sessionPreview.isValid) {
      return sessionPreview.error;
    }
    return null;
  };

  const handleSaveConfigClick = async (e) => {
    e.preventDefault();
    const validationErr = validateDraftConfig();
    if (validationErr) {
      setConfigFeedback({ type: 'error', message: validationErr });
      return;
    }

    setIsSavingConfig(true);
    setConfigFeedback(null);
    try {
      await onSaveConfig(parsedConfigPayload);
      setConfigFeedback({
        type: 'success',
        message: 'Examination schedule configuration saved to database.',
      });
    } catch (err) {
      setConfigFeedback({
        type: 'error',
        message: err?.message || 'Could not save examination configuration.',
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleGenerate = async () => {
    if (!subjects || subjects.length === 0) {
      setStatusFeedback({
        type: 'error',
        message: 'Add at least one subject in Manage Data before generating a timetable.',
      });
      return;
    }
    if (!classrooms || classrooms.length === 0) {
      setStatusFeedback({
        type: 'error',
        message: 'Add at least one classroom in Manage Data before generating a timetable.',
      });
      return;
    }

    const configErr = validateDraftConfig();
    if (configErr) {
      setStatusFeedback({
        type: 'error',
        message: configErr,
      });
      return;
    }

    let parsedMaxSlots = 0;
    if (selectedAlgo === 'backtracking' && maxSlotsInput.trim() !== '') {
      parsedMaxSlots = parseInt(maxSlotsInput, 10);
      if (Number.isNaN(parsedMaxSlots) || parsedMaxSlots < 1) {
        setStatusFeedback({
          type: 'error',
          message:
            'Maximum slot limit must be at least 1, or leave it blank to find the minimum slots automatically.',
        });
        return;
      }
    }

    setIsGenerating(true);
    setStatusFeedback(null);
    setConfigFeedback(null);

    try {
      const result = await onGenerateTimetable({
        algorithm: selectedAlgo,
        maxSlots: parsedMaxSlots,
        config: parsedConfigPayload,
      });

      const generated = result?.timetable;
      setExpandedExamIds({});
      setStatusFeedback({
        type: 'success',
        message: `Generated conflict-free timetable using ${
          generated?.algorithmName || (selectedAlgo === 'greedy' ? 'Greedy Coloring' : 'Backtracking Coloring')
        } (${generated?.numSlots ?? 0} examination ${
          generated?.numSlots === 1 ? 'slot' : 'slots'
        }, ${generated?.scheduledExams?.length ?? 0} scheduled exams).`,
      });
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        message:
          err?.message ||
          'Unable to generate examination timetable. Please verify exam configuration and classroom capacities.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleExamExpanded = (examKey) => {
    setExpandedExamIds((prev) => ({
      ...prev,
      [examKey]: !prev[examKey],
    }));
  };

  const validation = useMemo(() => {
    if (!latestTimetable?.assignments || subjects.length === 0) {
      return { isValid: true, violations: [] };
    }
    return validateSchedule(subjects, latestTimetable.assignments);
  }, [subjects, latestTimetable]);

  const scheduledExams = useMemo(() => {
    return Array.isArray(latestTimetable?.scheduledExams)
      ? latestTimetable.scheduledExams
      : [];
  }, [latestTimetable]);

  const handleExportCsv = () => {
    if (!scheduledExams.length) return;
    const headers = [
      'Subject Code',
      'Subject Name',
      'Exam Date',
      'Start Time',
      'End Time',
      'Total Students',
      'Classrooms Assigned Count',
      'Classroom Breakdown',
    ];
    const rows = scheduledExams.map((exam) => {
      const breakdown = (exam.classroomAllocations || [])
        .map(
          (room) =>
            `${room.classroomName} (${room.building}): ${room.allocatedStudents}/${room.capacity} seats, ${room.remainingSeats} remaining`
        )
        .join(' | ');
      return [
        escapeCsvCell(exam.subjectCode),
        escapeCsvCell(exam.subjectName),
        escapeCsvCell(exam.examDate),
        escapeCsvCell(exam.startTime),
        escapeCsvCell(exam.endTime),
        escapeCsvCell(exam.totalStudents),
        escapeCsvCell(exam.classroomsAssignedCount),
        escapeCsvCell(breakdown),
      ].join(',');
    });
    const csvContent = [headers.map(escapeCsvCell).join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'examia-timetable.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const hasBothComparisonRuns = Boolean(algoRuns?.greedy && algoRuns?.backtracking);

  const activeAlgorithmLabel = latestTimetable?.algorithmName
    ? latestTimetable.algorithmName.includes('Backtracking')
      ? 'Backtracking Coloring'
      : 'Greedy Coloring'
    : selectedAlgo === 'greedy'
      ? 'Greedy Coloring'
      : 'Backtracking Coloring';

  const totalScheduleSlotCapacity =
    Math.max(0, parsedConfigPayload.numDays) *
    Math.max(0, parsedConfigPayload.maxExamsPerDay);

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <header className="no-print space-y-1">
        <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#642F43]">
          Timetable Generator
        </h1>
        <p className="text-sm text-[#6F4253]">
          Configure examination timing, choose a graph coloring algorithm, generate date/time schedules with classroom seat allocation, and inspect conflict insights.
        </p>
      </header>

      {/* STEP 1 — EXAMINATION CONFIGURATION */}
      <section className="no-print card-premium p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563]">
              Step 1
            </span>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
              Examination Configuration
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#642F43] bg-[#FAF0F3] border border-[#C58E9B]/55 rounded-full px-3 py-1 self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            Max Slot Window: {totalScheduleSlotCapacity} slots
          </span>
        </div>

        <form onSubmit={handleSaveConfigClick} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div>
              <label
                htmlFor="cfg-start-date"
                className="block text-xs font-bold text-[#642F43] mb-1.5"
              >
                Starting Date
              </label>
              <input
                id="cfg-start-date"
                type="date"
                required
                value={draftConfig.startDate}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="input-editorial w-full text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="cfg-daily-start-time"
                className="block text-xs font-bold text-[#642F43] mb-1.5"
              >
                Daily Start Time
              </label>
              <input
                id="cfg-daily-start-time"
                type="time"
                required
                value={draftConfig.dailyStartTime}
                onChange={(e) => handleDailyStartTimeChange(e.target.value)}
                className="input-editorial w-full text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="cfg-break-duration"
                className="block text-xs font-bold text-[#642F43] mb-1.5"
              >
                Break Between Exams (hours)
              </label>
              <input
                id="cfg-break-duration"
                type="number"
                min="0"
                max="8"
                step="0.25"
                required
                value={draftConfig.breakDurationHours}
                onChange={(e) => handleBreakDurationChange(e.target.value)}
                className="input-editorial w-full text-sm font-mono"
              />
              <span className="text-[11px] text-[#7D5563] mt-1 block">
                {formatDurationBadge(parsedConfigPayload.breakDurationMinutes)}
              </span>
            </div>

            <div>
              <label
                htmlFor="cfg-num-days"
                className="block text-xs font-bold text-[#642F43] mb-1.5"
              >
                Number of Exam Days
              </label>
              <input
                id="cfg-num-days"
                type="number"
                min="1"
                max="60"
                required
                value={draftConfig.numDays}
                onChange={(e) =>
                  setDraftConfig((prev) => ({ ...prev, numDays: e.target.value }))
                }
                className="input-editorial w-full text-sm font-mono"
              />
            </div>

            <div>
              <label
                htmlFor="cfg-max-exams-day"
                className="block text-xs font-bold text-[#642F43] mb-1.5"
              >
                Max Exams Per Day (Sessions)
              </label>
              <input
                id="cfg-max-exams-day"
                type="number"
                min="1"
                max="10"
                required
                value={draftConfig.maxExamsPerDay}
                onChange={(e) => handleMaxExamsPerDayChange(e.target.value)}
                className="input-editorial w-full text-sm font-mono"
              />
            </div>
          </div>

          {/* Per-Session Start Time & Exam Duration Inputs (1..n sessions) */}
          <div className="p-3.5 rounded-2xl bg-white/80 border border-[#C58E9B]/45 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#642F43] inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                Session Start Times & Exam Durations
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF0F3] border border-[#C58E9B]/55 text-[#642F43]">
                {parsedConfigPayload.sessionDurationsMinutes.length}{' '}
                {parsedConfigPayload.sessionDurationsMinutes.length === 1 ? 'session' : 'sessions'} / day
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {parsedConfigPayload.sessionDurationsMinutes.map((durMin, idx) => (
                <div
                  key={`session-card-${idx + 1}`}
                  className="p-3 rounded-xl bg-[#FAF0F3]/60 border border-[#C58E9B]/40 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#642F43]">
                      Session {idx + 1}
                    </span>
                    <span className="text-[11px] font-medium text-[#7D5563]">
                      {sessionPreview.isValid && sessionPreview.sessions[idx]
                        ? `${sessionPreview.sessions[idx].startTime} – ${sessionPreview.sessions[idx].endTime}`
                        : formatDurationBadge(durMin)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label
                        htmlFor={`cfg-session-start-${idx + 1}`}
                        className="block text-[11px] font-bold text-[#642F43] mb-1"
                      >
                        Start Time
                      </label>
                      <input
                        id={`cfg-session-start-${idx + 1}`}
                        type="time"
                        required
                        value={draftConfig.sessionStartTimes?.[idx] ?? (idx === 0 ? '09:00' : '13:00')}
                        onChange={(e) => handleSessionStartTimeChange(idx, e.target.value)}
                        className="input-editorial w-full text-xs sm:text-sm font-mono"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`cfg-session-duration-${idx + 1}`}
                        className="block text-[11px] font-bold text-[#642F43] mb-1"
                      >
                        Duration (hrs)
                      </label>
                      <input
                        id={`cfg-session-duration-${idx + 1}`}
                        type="number"
                        min="0.25"
                        max="12"
                        step="0.25"
                        required
                        value={draftConfig.sessionDurationsHours?.[idx] ?? '3'}
                        onChange={(e) => handleSessionDurationChange(idx, e.target.value)}
                        className="input-editorial w-full text-xs sm:text-sm font-mono"
                      />
                    </div>
                  </div>

                  <span className="text-[11px] text-[#7D5563] block">
                    {formatDurationBadge(durMin)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Daily Session Preview */}
          <div className="p-3.5 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/45 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#642F43] inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                Daily Session Timing Preview
              </span>
              <span className="text-[11px] text-[#7D5563]">
                Starting {formatIsoDateDisplay(parsedConfigPayload.startDate)}
              </span>
            </div>

            {sessionPreview.isValid ? (
              <div className="flex flex-wrap gap-2">
                {sessionPreview.sessions.map((session) => (
                  <span
                    key={session.sessionIndex}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-[#C58E9B]/60 text-[#361522]"
                  >
                    <strong className="text-[#642F43]">
                      Session {session.sessionIndex}:
                    </strong>{' '}
                    {session.startTime} – {session.endTime}{' '}
                    <span className="text-[11px] text-[#7D5563]">
                      ({minutesToHoursString(session.durationMinutes)}h)
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs font-semibold text-[#642F43]">
                {sessionPreview.error}
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="btn-secondary w-full sm:w-auto px-4 py-2 text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSavingConfig && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />}
              Save Configuration
            </button>

            {configFeedback && (
              <div
                role="status"
                className={`text-xs font-medium px-3 py-1.5 rounded-xl border ${
                  configFeedback.type === 'error'
                    ? 'bg-[#F8EAEF] border-[#642F43] text-[#4A1F30]'
                    : 'bg-[#FAF0F3] border-[#C58E9B] text-[#642F43]'
                }`}
              >
                {configFeedback.message}
              </div>
            )}
          </div>
        </form>
      </section>

      {/* STEP 2 — SELECT ALGORITHM */}
      <section className="no-print card-premium p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563]">
              Step 2
            </span>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
              Select Algorithm
            </h2>
          </div>
          <span className="text-xs text-[#7D5563]">
            {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} ·{' '}
            {graph.edgeCount} {graph.edgeCount === 1 ? 'conflict' : 'conflicts'} ·{' '}
            {classrooms.length} {classrooms.length === 1 ? 'classroom' : 'classrooms'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5" role="radiogroup" aria-label="Scheduling algorithm">
          {/* Greedy Coloring */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedAlgo === 'greedy'}
            onClick={() => setSelectedAlgo('greedy')}
            className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 cursor-pointer ${
              selectedAlgo === 'greedy'
                ? 'bg-[#FDF9FA] border-[#642F43] shadow-[0_10px_24px_-8px_rgba(100,47,67,0.22)]'
                : 'bg-[#FAF0F3]/75 border-[#C58E9B]/45 hover:border-[#642F43]/50'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F8EAEF] text-[#642F43] border border-[#C58E9B]/60">
                  <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                  Fast approach
                </span>
                <span
                  aria-hidden="true"
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedAlgo === 'greedy'
                      ? 'bg-[#642F43] border-[#642F43] text-white'
                      : 'border-[#C58E9B] bg-white'
                  }`}
                >
                  {selectedAlgo === 'greedy' && <Check className="w-3 h-3" />}
                </span>
              </div>

              <h3 className="text-base font-serif font-bold text-[#361522]">
                Greedy Coloring
              </h3>
              <p className="text-xs sm:text-sm text-[#6F4253] leading-relaxed">
                Generates a timetable quickly by assigning the first available time slot to each subject.
              </p>
            </div>
          </button>

          {/* Backtracking Coloring */}
          <button
            type="button"
            role="radio"
            aria-checked={selectedAlgo === 'backtracking'}
            onClick={() => setSelectedAlgo('backtracking')}
            className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex flex-col justify-between gap-3 cursor-pointer ${
              selectedAlgo === 'backtracking'
                ? 'bg-[#FDF9FA] border-[#642F43] shadow-[0_10px_24px_-8px_rgba(100,47,67,0.22)]'
                : 'bg-[#FAF0F3]/75 border-[#C58E9B]/45 hover:border-[#642F43]/50'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#642F43] text-[#FDF8FA]">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  Systematic approach
                </span>
                <span
                  aria-hidden="true"
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    selectedAlgo === 'backtracking'
                      ? 'bg-[#642F43] border-[#642F43] text-white'
                      : 'border-[#C58E9B] bg-white'
                  }`}
                >
                  {selectedAlgo === 'backtracking' && <Check className="w-3 h-3" />}
                </span>
              </div>

              <h3 className="text-base font-serif font-bold text-[#361522]">
                Backtracking Coloring
              </h3>
              <p className="text-xs sm:text-sm text-[#6F4253] leading-relaxed">
                Systematically searches for a valid assignment while checking subject conflicts.
              </p>
            </div>
          </button>
        </div>

        {selectedAlgo === 'backtracking' && (
          <div className="p-3.5 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label
                htmlFor="examia-slot-limit-input"
                className="text-xs font-bold text-[#642F43] block"
              >
                Optional Maximum Slots Limit (m)
              </label>
              <p className="text-[11px] text-[#6F4253]">
                Leave blank to automatically search for the smallest valid number of slots.
              </p>
            </div>
            <input
              id="examia-slot-limit-input"
              type="number"
              min="1"
              max={Math.max(1, subjects.length)}
              value={maxSlotsInput}
              onChange={(e) => setMaxSlotsInput(e.target.value)}
              placeholder="Auto"
              className="input-editorial w-full sm:w-32 text-sm font-mono text-center"
            />
          </div>
        )}

        <details className="examia-details rounded-2xl bg-[#FAF0F3]/70 border border-[#C58E9B]/35 px-4 py-1.5">
          <summary className="examia-summary text-xs sm:text-sm font-semibold text-[#642F43]">
            <ChevronRight className="examia-chevron w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Learn how it works</span>
          </summary>
          <div className="pb-3 pt-1 text-xs text-[#6F4253] space-y-2 leading-relaxed border-t border-[#C58E9B]/25">
            <p>
              <strong className="text-[#361522]">Greedy Coloring (Welsh-Powell):</strong>{' '}
              Ranks subjects by conflict degree and assigns the earliest available examination slot. Runs rapidly, though vertex ordering can affect total slot count.
            </p>
            <p>
              <strong className="text-[#361522]">Backtracking Coloring:</strong>{' '}
              Explores slot assignments recursively and undoes conflicting branches, guaranteeing the minimal valid slot count when run in Auto mode.
            </p>
          </div>
        </details>
      </section>

      {/* STEP 3 — GENERATE EXAMINATION TIMETABLE */}
      <section className="no-print card-premium p-4 sm:p-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563]">
              Step 3
            </span>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
              Generate Examination Timetable
            </h2>
            <p className="text-xs sm:text-sm text-[#6F4253]">
              Builds conflict-free slots using <strong className="text-[#361522]">{selectedAlgo === 'greedy' ? 'Greedy Coloring' : 'Backtracking Coloring'}</strong>, assigns dates and times, and allocates available classrooms automatically.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary w-full sm:w-auto px-6 py-3 text-sm font-semibold inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            )}
            <span>{isGenerating ? 'Generating…' : 'Generate Timetable'}</span>
          </button>
        </div>

        {isGenerating && (
          <div
            role="status"
            aria-live="polite"
            className="animate-fade-in p-3.5 rounded-2xl border bg-[#FAF0F3] border-[#C58E9B] text-[#642F43] flex items-center gap-3 text-xs sm:text-sm font-medium"
          >
            <Loader2 className="w-4 h-4 animate-spin text-[#642F43] shrink-0" aria-hidden="true" />
            <span>{generationPhase || 'Solving constraints & allocating classrooms…'}</span>
          </div>
        )}

        {statusFeedback && (
          <div
            role="alert"
            className={`p-3.5 rounded-2xl border flex items-start gap-2.5 text-xs sm:text-sm ${
              statusFeedback.type === 'error'
                ? 'bg-[#F8EAEF] border-[#642F43] text-[#4A1F30]'
                : 'bg-[#FAF0F3] border-[#C58E9B] text-[#642F43]'
            }`}
          >
            {statusFeedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#642F43]" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#642F43]" aria-hidden="true" />
            )}
            <span className="font-medium leading-relaxed">{statusFeedback.message}</span>
          </div>
        )}
      </section>

      {/* STEP 4 — FINAL EXAMINATION RESULTS */}
      <section className="card-premium p-4 sm:p-6 space-y-5" aria-label="Final examination results">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563]">
              Step 4
            </span>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-[#642F43]">
              Final Examination Results
            </h2>
          </div>

          {scheduledExams.length > 0 && (
            <div className="no-print flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                className="btn-secondary px-3.5 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary px-3.5 py-2 text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                <span>Print</span>
              </button>
            </div>
          )}
        </div>

        {!latestTimetable || scheduledExams.length === 0 ? (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#FAF0F3]/75 border border-dashed border-[#C58E9B]/60 text-center space-y-3">
            <p className="text-sm font-medium text-[#642F43]">
              No examination timetable generated yet.
            </p>
            <p className="text-xs text-[#6F4253] max-w-md mx-auto">
              Verify your subjects, divisions, and classrooms in{' '}
              <button
                type="button"
                onClick={onNavigateToManage}
                className="font-semibold underline text-[#642F43] cursor-pointer"
              >
                Manage Data
              </button>
              , configure your exam schedule above, and click <strong>Generate Timetable</strong>.
            </p>
          </div>
        ) : (
          <>
            {/* Top Result Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#FAF0F3] border border-[#C58E9B]/45">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563] block">
                  Total Scheduled Exams
                </span>
                <span className="text-2xl font-serif font-bold text-[#642F43]">
                  {scheduledExams.length}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF0F3] border border-[#C58E9B]/45">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563] block">
                  Time Slots Used
                </span>
                <span className="text-2xl font-serif font-bold text-[#642F43]">
                  {latestTimetable.numSlots}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF0F3] border border-[#C58E9B]/45">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563] block">
                  Selected Algorithm
                </span>
                <span className="text-lg font-serif font-bold text-[#642F43] block mt-0.5">
                  {activeAlgorithmLabel}
                </span>
              </div>
            </div>

            {!validation.isValid && (
              <div
                role="alert"
                className="p-3.5 rounded-2xl bg-[#F8EAEF] border border-[#642F43] text-[#4A1F30] text-xs sm:text-sm font-medium flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#642F43]" aria-hidden="true" />
                <span>
                  Data changed since this timetable was generated. Click <strong>Generate Timetable</strong> to recompute date/time slots and classroom seating.
                </span>
              </div>
            )}

            {/* Honest allocation-basis notice */}
            <p className="text-xs text-[#6F4253] bg-[#FAF0F3]/80 border border-[#C58E9B]/35 rounded-xl px-3.5 py-2.5">
              <strong className="text-[#642F43]">Division-level count allocation:</strong>{' '}
              Student totals are calculated by summing distinct assigned divisions per subject. Expand any row to inspect exact classroom capacity breakdown and remaining seats.
            </p>

            {/* Desktop Schedule Table */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-[#C58E9B]/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4E4E9] text-[#642F43] text-xs uppercase tracking-wider border-b border-[#C58E9B]/40">
                    <th className="py-3 px-4 font-bold">Subject</th>
                    <th className="py-3 px-4 font-bold">Exam Date & Time</th>
                    <th className="py-3 px-4 font-bold">Total Students</th>
                    <th className="py-3 px-4 font-bold">Assigned Classrooms</th>
                    <th className="py-3 px-4 font-bold text-right">Room Breakdown</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EED8DF] bg-white">
                  {scheduledExams.map((exam) => {
                    const palette = SLOT_PALETTES[exam.slotIndex % SLOT_PALETTES.length];
                    const rowKey = String(exam.subjectId || exam.id || exam.subjectCode);
                    const isExpanded = Boolean(expandedExamIds[rowKey]);
                    const rooms = exam.classroomAllocations || [];
                    return (
                      <React.Fragment key={rowKey}>
                        <tr className="hover:bg-[#FDF8FA] transition-colors">
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border"
                                style={{
                                  backgroundColor: palette.badgeBg,
                                  color: palette.textColor,
                                  borderColor: palette.badgeBorder,
                                }}
                              >
                                Slot {exam.slotIndex + 1}
                              </span>
                              <span className="font-mono text-xs font-bold text-[#642F43]">
                                {exam.subjectCode}
                              </span>
                            </div>
                            <p className="font-semibold text-sm text-[#361522] mt-1">
                              {exam.subjectName}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <p className="text-sm font-semibold text-[#361522]">
                              {formatIsoDateDisplay(exam.examDate)}
                            </p>
                            <p className="text-xs font-mono text-[#6F4253] mt-0.5">
                              {exam.startTime} – {exam.endTime}
                            </p>
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#361522]">
                              <Users className="w-3.5 h-3.5 text-[#642F43]" aria-hidden="true" />
                              {exam.totalStudents}
                            </span>
                            {(exam.enrolledGroups || []).length > 0 && (
                              <p className="text-[11px] text-[#7D5563] mt-0.5">
                                {exam.enrolledGroups.join(', ')}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 align-top">
                            <p className="text-xs font-bold text-[#642F43] mb-1">
                              {exam.classroomsAssignedCount}{' '}
                              {exam.classroomsAssignedCount === 1 ? 'classroom' : 'classrooms'}
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rooms.map((room) => (
                                <span
                                  key={room.id || room.classroomName}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-[#FAF0F3] text-[#642F43] border border-[#C58E9B]/50"
                                >
                                  <Building2 className="w-3 h-3" aria-hidden="true" />
                                  {room.classroomName} ({room.allocatedStudents}/{room.capacity})
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 align-top text-right">
                            <button
                              type="button"
                              aria-expanded={isExpanded}
                              onClick={() => toggleExamExpanded(rowKey)}
                              className="btn-secondary px-3 py-1.5 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                                  Hide Rooms
                                </>
                              ) : (
                                <>
                                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                                  View Rooms
                                </>
                              )}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-[#FDF9FA] animate-fade-in">
                            <td colSpan={5} className="px-4 py-3 border-t border-[#EED8DF]">
                              <div className="rounded-xl border border-[#C58E9B]/45 bg-white overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs">
                                  <thead>
                                    <tr className="bg-[#FAF0F3] text-[#642F43] uppercase tracking-wider border-b border-[#EED8DF]">
                                      <th className="py-2 px-3 font-bold">Classroom</th>
                                      <th className="py-2 px-3 font-bold">Building</th>
                                      <th className="py-2 px-3 font-bold">Allocated Students</th>
                                      <th className="py-2 px-3 font-bold">Capacity</th>
                                      <th className="py-2 px-3 font-bold">Remaining Available Seats</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-[#F4E4E9]">
                                    {rooms.map((room) => (
                                      <tr key={room.id || room.classroomId || room.classroomName}>
                                        <td className="py-2 px-3 font-semibold text-[#361522]">
                                          {room.classroomName}
                                        </td>
                                        <td className="py-2 px-3 text-[#6F4253]">
                                          {room.building}
                                        </td>
                                        <td className="py-2 px-3 font-mono font-bold text-[#642F43]">
                                          {room.allocatedStudents}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-[#361522]">
                                          {room.capacity}
                                        </td>
                                        <td className="py-2 px-3 font-mono text-[#6F4253]">
                                          {room.remainingSeats}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Exam Cards */}
            <div className="md:hidden space-y-3">
              {scheduledExams.map((exam) => {
                const palette = SLOT_PALETTES[exam.slotIndex % SLOT_PALETTES.length];
                const cardKey = String(exam.subjectId || exam.id || exam.subjectCode);
                const isExpanded = Boolean(expandedExamIds[cardKey]);
                const rooms = exam.classroomAllocations || [];
                return (
                  <article
                    key={cardKey}
                    className="p-3.5 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/45 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border"
                            style={{
                              backgroundColor: palette.badgeBg,
                              color: palette.textColor,
                              borderColor: palette.badgeBorder,
                            }}
                          >
                            Slot {exam.slotIndex + 1}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#642F43]">
                            {exam.subjectCode}
                          </span>
                        </div>
                        <h3 className="text-sm font-serif font-bold text-[#361522] mt-1">
                          {exam.subjectName}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-white border border-[#C58E9B]/55 text-[#642F43] shrink-0">
                        <Users className="w-3 h-3" aria-hidden="true" />
                        {exam.totalStudents}
                      </span>
                    </div>

                    <div className="text-xs text-[#6F4253] space-y-1">
                      <p>
                        <strong className="text-[#361522]">Date & Time:</strong>{' '}
                        {formatIsoDateDisplay(exam.examDate)} · {exam.startTime} – {exam.endTime}
                      </p>
                      <p>
                        <strong className="text-[#361522]">Classrooms ({exam.classroomsAssignedCount}):</strong>{' '}
                        {rooms.map((r) => `${r.classroomName} (${r.allocatedStudents}/${r.capacity})`).join(', ')}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleExamExpanded(cardKey)}
                      className="btn-secondary w-full py-2 text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
                          Hide Classroom Breakdown
                        </>
                      ) : (
                        <>
                          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                          View Classroom Breakdown
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className="space-y-2 pt-1 animate-fade-in">
                        {rooms.map((room) => (
                          <div
                            key={room.id || room.classroomId || room.classroomName}
                            className="p-2.5 rounded-xl bg-white border border-[#C58E9B]/45 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between gap-2 font-semibold text-[#361522]">
                              <span>{room.classroomName}</span>
                              <span className="text-[11px] text-[#7D5563]">{room.building}</span>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#6F4253] font-mono">
                              <span>Allocated: {room.allocatedStudents}</span>
                              <span>Capacity: {room.capacity}</span>
                              <span>Remaining: {room.remainingSeats}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* STEP 5 — DAA ALGORITHM VISUALISATION */}
      <section className="no-print space-y-3" aria-label="Algorithm visualisation">
        <div className="px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563]">
            Step 5
          </span>
          <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
            DAA Algorithm Visualisation
          </h2>
        </div>

        {/* Conflict Graph Section */}
        <details className="examia-details card-premium px-4 sm:px-6 py-2">
          <summary className="examia-summary text-sm sm:text-base font-serif font-bold text-[#642F43]">
            <ChevronRight className="examia-chevron w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Conflict Graph</span>
          </summary>

          <div className="pb-4 pt-2 space-y-4 border-t border-[#C58E9B]/25">
            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs text-[#6F4253]">
              <li className="p-3 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/30">
                <strong className="text-[#361522] block mb-0.5">Vertices (Subjects)</strong>
                Each vertex represents a scheduled examination subject.
              </li>
              <li className="p-3 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/30">
                <strong className="text-[#361522] block mb-0.5">Edges (Shared Divisions)</strong>
                Edges connect subjects sharing any enrolled division.
              </li>
              <li className="p-3 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/30">
                <strong className="text-[#361522] block mb-0.5">Colors (Exam Slots)</strong>
                Distinct colors denote separate non-conflicting time slots.
              </li>
              <li className="p-3 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/30">
                <strong className="text-[#361522] block mb-0.5">Greedy vs Backtracking</strong>
                Greedy assigns first-free slots fast; Backtracking seeks minimal valid slots.
              </li>
            </ul>

            <ConflictGraphCanvas
              graph={graph}
              assignments={latestTimetable?.assignments || {}}
              title="Subject Conflict Network"
            />
          </div>
        </details>

        {/* Algorithm Information Section */}
        <details className="examia-details card-premium px-4 sm:px-6 py-2">
          <summary className="examia-summary text-sm sm:text-base font-serif font-bold text-[#642F43]">
            <ChevronRight className="examia-chevron w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Algorithm Information</span>
          </summary>

          <div className="pb-4 pt-2 space-y-4 border-t border-[#C58E9B]/25 text-xs sm:text-sm text-[#6F4253]">
            {!latestTimetable ? (
              <p>
                Generate an examination timetable above to inspect live algorithm metrics, conflict validation, and Greedy vs. Backtracking comparison.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  <div className="p-3 rounded-xl bg-[#FAF0F3]/85 border border-[#C58E9B]/35">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7D5563] block">
                      Algorithm
                    </span>
                    <span className="text-sm font-serif font-bold text-[#642F43] mt-0.5 block">
                      {activeAlgorithmLabel}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF0F3]/85 border border-[#C58E9B]/35">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7D5563] block">
                      Subjects
                    </span>
                    <span className="text-lg font-serif font-bold text-[#642F43]">
                      {subjects.length}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF0F3]/85 border border-[#C58E9B]/35">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7D5563] block">
                      Conflicts
                    </span>
                    <span className="text-lg font-serif font-bold text-[#642F43]">
                      {graph.edgeCount}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF0F3]/85 border border-[#C58E9B]/35">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7D5563] block">
                      Time Slots Used
                    </span>
                    <span className="text-lg font-serif font-bold text-[#642F43]">
                      {latestTimetable.numSlots}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF0F3]/85 border border-[#C58E9B]/35">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7D5563] block">
                      Execution Time
                    </span>
                    <span className="text-base font-mono font-bold text-[#642F43]">
                      {Number(latestTimetable.executionTimeMs ?? 0).toFixed(3)} ms
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF0F3]/85 border border-[#C58E9B]/35">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7D5563] block">
                      Valid Status
                    </span>
                    <span className="text-sm font-bold text-[#642F43] block mt-0.5">
                      {validation.isValid && latestTimetable.isValid ? 'Conflict-Free' : 'Needs Re-run'}
                    </span>
                  </div>
                </div>

                {hasBothComparisonRuns ? (
                  <div className="space-y-2 pt-1">
                    <h3 className="text-sm font-serif font-bold text-[#642F43]">
                      Greedy vs. Backtracking Comparison (Current Dataset)
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-[#C58E9B]/40">
                      <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead>
                          <tr className="bg-[#F4E4E9] text-[#642F43] text-xs uppercase tracking-wider border-b border-[#C58E9B]/40">
                            <th className="py-2.5 px-3.5 font-bold">Algorithm</th>
                            <th className="py-2.5 px-3.5 font-bold">Time Slots Used</th>
                            <th className="py-2.5 px-3.5 font-bold">Execution Time</th>
                            <th className="py-2.5 px-3.5 font-bold">Operations / Calls</th>
                            <th className="py-2.5 px-3.5 font-bold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#EED8DF] bg-white">
                          <tr>
                            <td className="py-2.5 px-3.5 font-semibold text-[#361522]">
                              Greedy Coloring
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-[#642F43]">
                              {algoRuns.greedy.numSlots}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono">
                              {Number(algoRuns.greedy.executionTimeMs ?? 0).toFixed(3)} ms
                            </td>
                            <td className="py-2.5 px-3.5 font-mono">
                              {algoRuns.greedy.operationsCount ?? '—'} ops
                            </td>
                            <td className="py-2.5 px-3.5 font-semibold text-[#642F43]">
                              {algoRuns.greedy.isValid ? 'Conflict-Free' : 'Invalid'}
                            </td>
                          </tr>
                          <tr>
                            <td className="py-2.5 px-3.5 font-semibold text-[#361522]">
                              Backtracking Coloring
                            </td>
                            <td className="py-2.5 px-3.5 font-mono font-bold text-[#642F43]">
                              {algoRuns.backtracking.numSlots}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono">
                              {Number(algoRuns.backtracking.executionTimeMs ?? 0).toFixed(3)} ms
                            </td>
                            <td className="py-2.5 px-3.5 font-mono">
                              {algoRuns.backtracking.operationsCount ?? '—'} calls
                            </td>
                            <td className="py-2.5 px-3.5 font-semibold text-[#642F43]">
                              {algoRuns.backtracking.isValid ? 'Valid Optimal' : 'Invalid'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs italic text-[#7D5563]">
                    Tip: Execute both Greedy Coloring and Backtracking Coloring on this dataset to display the live comparison table here.
                  </p>
                )}
              </>
            )}
          </div>
        </details>
      </section>
    </div>
  );
}

export default memo(TimetableGeneratorView);
