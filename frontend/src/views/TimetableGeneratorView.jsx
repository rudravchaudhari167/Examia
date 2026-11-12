import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  Download,
  Loader2,
  Printer,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  executeBacktrackingColoring,
  executeGreedyColoring,
} from '../api/apiService';
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

export default function TimetableGeneratorView({
  subjects,
  graph,
  timetableResult,
  algoRuns,
  onTimetableGenerated,
  onNavigateToManage,
}) {
  const [selectedAlgo, setSelectedAlgo] = useState(() =>
    timetableResult?.algorithmName?.includes('Backtracking') ? 'backtracking' : 'greedy'
  );
  const [maxSlotsInput, setMaxSlotsInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const handleGenerate = async () => {
    if (!subjects || subjects.length === 0) {
      setStatusFeedback({
        type: 'error',
        message: 'Add at least one subject in Manage Data before generating a timetable.',
      });
      return;
    }

    let parsedMaxSlots = 0;
    if (selectedAlgo === 'backtracking' && maxSlotsInput.trim() !== '') {
      parsedMaxSlots = parseInt(maxSlotsInput, 10);
      if (Number.isNaN(parsedMaxSlots) || parsedMaxSlots < 1) {
        setStatusFeedback({
          type: 'error',
          message: 'Slot limit must be at least 1, or leave it blank to find the minimum slots automatically.',
        });
        return;
      }
    }

    setIsGenerating(true);
    setStatusFeedback(null);

    try {
      const result =
        selectedAlgo === 'greedy'
          ? await executeGreedyColoring(subjects, 'auto')
          : await executeBacktrackingColoring(subjects, parsedMaxSlots, 'auto');

      if (!result.isValid || !result.assignments || Object.keys(result.assignments).length === 0) {
        setStatusFeedback({
          type: 'error',
          message:
            result.statusMessage ||
            `Could not find a valid timetable with ${parsedMaxSlots} slot(s). Try leaving the slot limit blank.`,
        });
        return;
      }

      onTimetableGenerated(selectedAlgo, result);
      setStatusFeedback({
        type: 'success',
        message: `Timetable generated using ${selectedAlgo === 'greedy' ? 'Greedy Coloring' : 'Backtracking Coloring'} (${result.numSlots} examination ${result.numSlots === 1 ? 'slot' : 'slots'}).`,
      });
    } catch (err) {
      setStatusFeedback({
        type: 'error',
        message: err?.message || 'Unable to generate timetable. Please check your data and try again.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Validate current assignments dynamically against current subjects
  const validation = useMemo(() => {
    if (!timetableResult?.assignments || subjects.length === 0) {
      return { isValid: false, violations: [], conflictingIds: new Set() };
    }
    const res = validateSchedule(subjects, timetableResult.assignments);
    const conflictingIds = new Set();
    for (const v of res.violations) {
      if (v.subj1?.id) conflictingIds.add(v.subj1.id);
      if (v.subj2?.id) conflictingIds.add(v.subj2.id);
    }
    return { ...res, conflictingIds };
  }, [subjects, timetableResult]);

  // Build sorted timetable rows ordered by slot number then subject code
  const scheduledRows = useMemo(() => {
    if (!timetableResult?.assignments) return [];
    const assignments = timetableResult.assignments;

    return subjects
      .filter((s) => Object.prototype.hasOwnProperty.call(assignments, s.id))
      .map((s) => {
        const slotIndex = assignments[s.id];
        const palette = SLOT_PALETTES[slotIndex % SLOT_PALETTES.length];
        const hasConflict = validation.conflictingIds.has(s.id);
        return {
          subject: s,
          slotIndex,
          slotLabel: `Slot ${slotIndex + 1}`,
          palette,
          hasConflict,
        };
      })
      .sort((a, b) => {
        if (a.slotIndex !== b.slotIndex) return a.slotIndex - b.slotIndex;
        return a.subject.code.localeCompare(b.subject.code);
      });
  }, [subjects, timetableResult, validation]);

  const unscheduledCount = useMemo(() => {
    if (!timetableResult?.assignments) return 0;
    return subjects.filter(
      (s) => !Object.prototype.hasOwnProperty.call(timetableResult.assignments, s.id)
    ).length;
  }, [subjects, timetableResult]);

  const activeAlgorithmLabel = useMemo(() => {
    if (!timetableResult?.algorithmName) return 'None';
    return timetableResult.algorithmName.includes('Backtracking')
      ? 'Backtracking Coloring'
      : 'Greedy Coloring';
  }, [timetableResult]);

  const handleDownloadCsv = () => {
    if (scheduledRows.length === 0) return;

    const header = [
      'Examination Slot',
      'Subject Code',
      'Subject Name',
      'Student Groups',
      'Conflict Status',
    ];
    const lines = [
      header.join(','),
      ...scheduledRows.map((row) =>
        [
          escapeCsvCell(row.slotLabel),
          escapeCsvCell(row.subject.code),
          escapeCsvCell(row.subject.name),
          escapeCsvCell((row.subject.divisions || []).join('; ') || 'None'),
          escapeCsvCell(row.hasConflict ? 'Conflict Detected' : 'Conflict-Free'),
        ].join(',')
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'examia-timetable.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasBothComparisonRuns = Boolean(algoRuns?.greedy && algoRuns?.backtracking);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div className="no-print">
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#642F43] tracking-tight">
          Timetable Generator
        </h1>
        <p className="text-xs sm:text-sm text-[#6F4253] mt-0.5">
          Choose an algorithm, generate a conflict-free timetable, and review the schedule.
        </p>
      </div>

      {/* STEP 1 — CHOOSE AN ALGORITHM */}
      <section className="no-print card-premium p-4 sm:p-6 space-y-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563]">
            Step 1
          </span>
          <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
            Choose an Algorithm
          </h2>
        </div>

        <div
          role="radiogroup"
          aria-label="Scheduling algorithm"
          className="grid grid-cols-1 md:grid-cols-2 gap-3.5"
        >
          {/* Card 1: Greedy Coloring */}
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
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F4E4E9] text-[#642F43]">
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

          {/* Card 2: Backtracking Coloring */}
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

        {/* Optional Slot Limit only when Backtracking is selected */}
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

        {/* Small collapsible Learn how it works */}
        <details className="examia-details rounded-2xl bg-[#FAF0F3]/70 border border-[#C58E9B]/35 px-4 py-1.5">
          <summary className="examia-summary text-xs sm:text-sm font-semibold text-[#642F43]">
            <ChevronRight className="examia-chevron w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Learn how it works</span>
          </summary>
          <div className="pb-3 pt-1 text-xs text-[#6F4253] space-y-2 leading-relaxed border-t border-[#C58E9B]/25">
            <p>
              <strong className="text-[#361522]">Greedy Coloring (Welsh-Powell):</strong>{' '}
              Ranks subjects by how many other subjects they conflict with and assigns each one the earliest free examination slot. It runs very fast, though slot count can vary with conflict order.
            </p>
            <p>
              <strong className="text-[#361522]">Backtracking Coloring:</strong>{' '}
              Explores slot assignments step by step and undoes choices whenever a conflict blocks remaining subjects, finding a valid minimal-slot schedule when run automatically.
            </p>
          </div>
        </details>
      </section>

      {/* STEP 2 — GENERATE TIMETABLE */}
      <section className="no-print card-premium p-4 sm:p-6 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563]">
              Step 2
            </span>
            <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
              Generate Timetable
            </h2>
            <p className="text-xs text-[#6F4253]">
              Scheduling {subjects.length} {subjects.length === 1 ? 'subject' : 'subjects'} with {graph.edgeCount} detected conflict {graph.edgeCount === 1 ? 'pair' : 'pairs'}.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary w-full sm:w-auto min-h-[48px] px-6 py-3 text-sm sm:text-base font-semibold flex items-center justify-center gap-2.5 shadow-[0_12px_24px_-6px_rgba(100,47,67,0.34)] disabled:opacity-65 cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                <span>Generating Timetable...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                <span>Generate My Timetable</span>
              </>
            )}
          </button>
        </div>

        {statusFeedback && (
          <div
            role={statusFeedback.type === 'error' ? 'alert' : 'status'}
            className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm font-medium ${
              statusFeedback.type === 'error'
                ? 'bg-[#FFF1F3] border-[#642F43]/40 text-[#4A1F30]'
                : 'bg-[#F0FAF3] border-[#2E7D4F]/30 text-[#1B4D31]'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {statusFeedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 text-[#642F43]" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2E7D4F]" aria-hidden="true" />
              )}
              <span>{statusFeedback.message}</span>
            </div>

            {subjects.length === 0 && onNavigateToManage && (
              <button
                type="button"
                onClick={onNavigateToManage}
                className="btn-secondary text-xs min-h-[36px] px-3 py-1.5 self-start sm:self-auto"
              >
                Open Manage Data
              </button>
            )}
          </div>
        )}
      </section>

      {/* STEP 3 — VIEW YOUR TIMETABLE (Most Prominent Section) */}
      <section
        aria-label="Generated Examination Timetable"
        className="rounded-[24px] border-2 border-[#642F43]/35 bg-[#FDF9FA] p-5 sm:p-7 shadow-[0_20px_42px_-12px_rgba(100,47,67,0.18)] space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563]">
              Step 3
            </span>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#642F43]">
              View Your Timetable
            </h2>
          </div>

          {scheduledRows.length > 0 && (
            <div className="no-print flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadCsv}
                className="btn-primary text-xs sm:text-sm min-h-[44px] px-4 py-2 flex items-center gap-2"
              >
                <Download className="w-4 h-4" aria-hidden="true" />
                <span>Download Timetable</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary text-xs sm:text-sm min-h-[44px] px-3.5 py-2 flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                <span>Print</span>
              </button>
            </div>
          )}
        </div>

        {!timetableResult || scheduledRows.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#FAF0F3]/85 border border-dashed border-[#C58E9B] text-center space-y-2.5">
            <Sparkles className="w-8 h-8 text-[#C58E9B] mx-auto" aria-hidden="true" />
            <p className="text-sm sm:text-base font-serif font-bold text-[#642F43]">
              Your timetable will appear here
            </p>
            <p className="text-xs sm:text-sm text-[#6F4253] max-w-md mx-auto">
              Select an algorithm above and click &ldquo;Generate My Timetable&rdquo; to assign every subject into conflict-free examination slots.
            </p>
          </div>
        ) : (
          <>
            {/* Stale notice if user modified subjects after generating */}
            {(!validation.isValid || unscheduledCount > 0) && (
              <div
                role="alert"
                className="no-print p-3.5 rounded-2xl bg-[#FFF1F3] border border-[#642F43]/40 text-xs sm:text-sm font-medium text-[#4A1F30] flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-[#642F43]" aria-hidden="true" />
                <span>
                  Your subject or enrolment data changed after this timetable was generated. Click &ldquo;Generate My Timetable&rdquo; to refresh slot assignments.
                </span>
              </div>
            )}

            {/* Key Summary Values Above the Table */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-[#FAF0F3] border border-[#C58E9B]/45">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6F4253]">
                  Total subjects scheduled
                </p>
                <p className="text-2xl font-serif font-bold text-[#642F43] mt-1">
                  {scheduledRows.length}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF0F3] border border-[#C58E9B]/45">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6F4253]">
                  Total examination slots used
                </p>
                <p className="text-2xl font-serif font-bold text-[#642F43] mt-1">
                  {timetableResult.numSlots}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF0F3] border border-[#C58E9B]/45">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6F4253]">
                  Selected algorithm
                </p>
                <p className="text-lg sm:text-xl font-serif font-bold text-[#642F43] mt-1">
                  {activeAlgorithmLabel}
                </p>
              </div>
            </div>

            {/* Clean Responsive Table (Desktop & Print) */}
            <div className="hidden md:block print:block overflow-x-auto rounded-2xl border border-[#C58E9B]/45">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#642F43] text-[#FDF8FA] text-xs uppercase tracking-wider">
                    <th className="py-3.5 px-4 font-bold">Examination Slot</th>
                    <th className="py-3.5 px-4 font-bold">Subject Name</th>
                    <th className="py-3.5 px-4 font-bold">Subject Code</th>
                    <th className="py-3.5 px-4 font-bold">Conflict-Free Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EED8DF] text-sm bg-white">
                  {scheduledRows.map((row) => (
                    <tr key={row.subject.id} className="hover:bg-[#FAF0F3]/75 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                          style={{
                            backgroundColor: row.palette.badgeBg,
                            borderColor: row.palette.badgeBorder,
                            color: row.palette.textColor,
                          }}
                        >
                          {row.slotLabel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#361522]">
                        <span>{row.subject.name}</span>
                        {row.subject.divisions?.length > 0 && (
                          <span className="block text-[11px] font-normal text-[#7D5563] mt-0.5">
                            Groups: {row.subject.divisions.join(', ')}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#642F43] whitespace-nowrap">
                        {row.subject.code}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {row.hasConflict ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#FFF1F3] text-[#4A1F30] border border-[#642F43]/40">
                            <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Conflict Detected</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F0FAF3] text-[#1B4D31] border border-[#2E7D4F]/30">
                            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Conflict-Free</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Clean Mobile Timetable Cards (< md) */}
            <div className="md:hidden print:hidden space-y-2.5">
              {scheduledRows.map((row) => (
                <div
                  key={row.subject.id}
                  className="p-4 rounded-2xl bg-white border border-[#C58E9B]/45 space-y-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
                      style={{
                        backgroundColor: row.palette.badgeBg,
                        borderColor: row.palette.badgeBorder,
                        color: row.palette.textColor,
                      }}
                    >
                      {row.slotLabel}
                    </span>

                    {row.hasConflict ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFF1F3] text-[#4A1F30] border border-[#642F43]/40">
                        <AlertCircle className="w-3 h-3" aria-hidden="true" />
                        <span>Conflict</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F0FAF3] text-[#1B4D31] border border-[#2E7D4F]/30">
                        <CheckCircle2 className="w-3 h-3" aria-hidden="true" />
                        <span>Conflict-Free</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="font-mono text-xs font-bold text-[#642F43]">
                      {row.subject.code}
                    </span>
                    <h3 className="text-sm font-bold text-[#361522]">
                      {row.subject.name}
                    </h3>
                    {row.subject.divisions?.length > 0 && (
                      <p className="text-xs text-[#6F4253] mt-0.5">
                        Groups: {row.subject.divisions.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* STEP 4 — UNDERSTAND THE RESULTS (Collapsible Accordions) */}
      <section className="no-print space-y-3" aria-label="Understand the results">
        <div className="px-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D5563]">
            Step 4
          </span>
          <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
            Understand the Results
          </h2>
        </div>

        {/* A. Conflict Graph */}
        <details className="examia-details card-premium px-4 sm:px-6 py-2">
          <summary className="examia-summary text-sm sm:text-base font-serif font-bold text-[#642F43]">
            <ChevronRight className="examia-chevron w-4 h-4 shrink-0" aria-hidden="true" />
            <span>A. Conflict Graph</span>
          </summary>

          <div className="pb-4 pt-2 space-y-4 border-t border-[#C58E9B]/25">
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-xs text-[#6F4253]">
              <li className="p-3 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/30">
                <strong className="text-[#361522] block mb-0.5">Vertices (Nodes)</strong>
                Each node represents an examination subject.
              </li>
              <li className="p-3 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/30">
                <strong className="text-[#361522] block mb-0.5">Edges (Lines)</strong>
                Connected subjects share a student group and cannot share the same slot.
              </li>
              <li className="p-3 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/30">
                <strong className="text-[#361522] block mb-0.5">Colors</strong>
                Different colors denote different examination time slots.
              </li>
            </ul>

            <ConflictGraphCanvas
              graph={graph}
              assignments={timetableResult?.assignments || {}}
              title="Subject Conflict Network"
            />
          </div>
        </details>

        {/* B. Algorithm Details */}
        <details className="examia-details card-premium px-4 sm:px-6 py-2">
          <summary className="examia-summary text-sm sm:text-base font-serif font-bold text-[#642F43]">
            <ChevronRight className="examia-chevron w-4 h-4 shrink-0" aria-hidden="true" />
            <span>B. Algorithm Details</span>
          </summary>

          <div className="pb-4 pt-2 space-y-4 border-t border-[#C58E9B]/25 text-xs sm:text-sm text-[#6F4253]">
            {!timetableResult ? (
              <p>
                Generate a timetable above to inspect measured slot counts, execution timing, and conflict validation.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/35">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7D5563] block">
                      Slots Used
                    </span>
                    <span className="text-lg font-serif font-bold text-[#642F43]">
                      {timetableResult.numSlots}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/35">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7D5563] block">
                      Execution Time
                    </span>
                    <span className="text-lg font-mono font-bold text-[#642F43]">
                      {Number(timetableResult.executionTimeMs ?? 0).toFixed(3)} ms
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/35">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7D5563] block">
                      Steps / Calls
                    </span>
                    <span className="text-lg font-mono font-bold text-[#642F43]">
                      {timetableResult.recursiveCalls ?? timetableResult.operationsCount ?? '—'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF0F3]/80 border border-[#C58E9B]/35">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-[#7D5563] block">
                      Validation
                    </span>
                    <span className="text-sm font-bold text-[#1B4D31] block mt-0.5">
                      {validation.isValid ? 'Valid Coloring' : 'Needs Re-run'}
                    </span>
                  </div>
                </div>

                <p className="text-xs leading-relaxed">
                  {activeAlgorithmLabel === 'Greedy Coloring'
                    ? 'Greedy Coloring orders subjects by conflict degree and assigns the earliest available slot. It prioritizes speed and produces a valid timetable, though vertex ordering can sometimes use slightly more slots than the theoretical minimum.'
                    : 'Backtracking Coloring explores valid slot assignments recursively and undoes conflicting choices, confirming a valid coloring (and finding the minimum number of slots when run automatically).'}
                </p>

                {/* Side-by-side comparison table shown once BOTH algorithms have been executed */}
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
                            <th className="py-2.5 px-3.5 font-bold">Slots Used</th>
                            <th className="py-2.5 px-3.5 font-bold">Time (ms)</th>
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
                            <td className="py-2.5 px-3.5 font-semibold text-[#1B4D31]">
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
                              {algoRuns.backtracking.recursiveCalls ?? algoRuns.backtracking.operationsCount ?? '—'} calls
                            </td>
                            <td className="py-2.5 px-3.5 font-semibold text-[#1B4D31]">
                              {algoRuns.backtracking.isValid ? 'Valid Optimal' : 'Invalid'}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs italic text-[#7D5563]">
                    Tip: Run both Greedy Coloring and Backtracking Coloring on this dataset to unlock a side-by-side comparison table here.
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

