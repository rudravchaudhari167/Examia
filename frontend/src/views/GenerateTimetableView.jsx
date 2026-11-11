import React, { useState } from 'react';
import { 
  Sparkles, Calendar, Clock, Layers, Cpu, ShieldCheck, 
  CheckCircle2, AlertTriangle, ArrowRight, Check, Sliders
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { executeGreedyColoring, executeBacktrackingColoring } from '../api/apiService';
import { allocateRooms } from '../algorithms/roomAllocator';

export default function GenerateTimetableView({
  subjects,
  graph,
  rooms,
  config,
  setConfig,
  onTimetableGenerated,
  setActiveTab
}) {
  const [selectedAlgo, setSelectedAlgo] = useState(config.algorithm || 'greedy');
  const [maxSlotsLimit, setMaxSlotsLimit] = useState(config.maxSlots || 0); // 0 = auto
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepIndex, setStepIndex] = useState(0); // 0, 1, 2
  const [generationSummary, setGenerationSummary] = useState(null);
  const [generationError, setGenerationError] = useState(null);

  const steps = [
    "Analyzing examination conflicts...",
    "Optimizing time slots with graph coloring...",
    "Assigning dates, sessions & generating timetable..."
  ];

  const handleGenerate = async () => {
    if (subjects.length === 0) {
      setGenerationError("No subjects available to schedule. Please add subjects first.");
      return;
    }

    setGenerationError(null);
    setGenerationSummary(null);
    setIsGenerating(true);
    setStepIndex(0);

    try {
      // Step 1: Analyzing conflicts
      await new Promise(r => setTimeout(r, 450));
      setStepIndex(1);

      // Step 2: Running algorithm
      let result;
      if (selectedAlgo === 'greedy') {
        result = await executeGreedyColoring(subjects, "js");
      } else {
        result = await executeBacktrackingColoring(subjects, maxSlotsLimit, "js");
      }

      if (!result.isValid && selectedAlgo === 'backtracking' && maxSlotsLimit > 0) {
        setIsGenerating(false);
        setGenerationError(result.statusMessage || `Backtracking failed: Cannot color graph using ${maxSlotsLimit} slots.`);
        return;
      }

      await new Promise(r => setTimeout(r, 450));
      setStepIndex(2);

      // Step 3: Room allocation & calendar placement
      await new Promise(r => setTimeout(r, 350));
      const roomResult = allocateRooms(subjects, result.assignments, rooms);

      const completeResult = {
        ...result,
        roomAllocation: roomResult.roomAllocations,
        roomWarnings: roomResult.allocationWarnings,
        config: {
          ...config,
          algorithm: selectedAlgo,
          maxSlots: maxSlotsLimit
        },
        generatedAt: new Date().toLocaleTimeString()
      };

      onTimetableGenerated(completeResult);
      setGenerationSummary(completeResult);

      // Confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#642F43', '#C58E9B', '#8F4B63', '#E8CBD3']
        });
      } catch (e) {}

    } catch (err) {
      setGenerationError(err.message || "Failed to generate timetable.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto pb-1 sm:pb-2">
        <span className="badge badge-lavender mb-2">Automated Scheduling Engine</span>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#642F43] tracking-tight">
          Generate Examination Timetable
        </h2>
        <p className="text-xs text-[#6F4253] mt-1">
          Select algorithm parameters and calendar constraints to build an optimal, conflict-free schedule.
        </p>
      </div>

      {generationError && (
        <div className="card-premium p-4 bg-[#F4E4E9] border-[#642F43]/45 text-[#4A1F30] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-[#642F43] shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold">Scheduling Error</p>
              <p className="mt-0.5">{generationError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGenerationError(null)}
            className="text-xs font-semibold underline text-[#642F43] hover:text-[#361522] self-end sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Parameters Card */}
      <div className="card-premium p-4 sm:p-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Left Column: Algorithm Selection */}
          <div className="space-y-5">
            <div>
              <h3 className="font-serif font-bold text-base text-[#642F43] flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#642F43]" />
                <span>1. Algorithm Strategy</span>
              </h3>
              <p className="text-xs text-[#6F4253] mt-0.5">
                Choose the graph coloring algorithm to minimize time slots.
              </p>
            </div>

            <div className="space-y-3">
              {/* Greedy Option */}
              <div
                onClick={() => setSelectedAlgo('greedy')}
                className={`examia-tab-pill p-4 rounded-2xl border cursor-pointer ${
                  selectedAlgo === 'greedy'
                    ? 'border-[#642F43] bg-[#F8EAEF] shadow-[0_8px_20px_-6px_rgba(100,47,67,0.18)]'
                    : 'clay-inset hover:bg-[#FAF0F3]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#361522] flex items-center gap-2 flex-wrap">
                      <span>Greedy Graph Coloring (Welsh-Powell)</span>
                      <span className="badge badge-sage text-[10px]">Fast Heuristic</span>
                    </span>
                    <p className="text-[11px] text-[#6F4253] mt-1.5 leading-relaxed">
                      Orders vertices by descending degree &Delta;(G). Makes locally optimal color choices in O(V log V + E) time.
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    selectedAlgo === 'greedy' ? 'border-[#642F43] bg-[#642F43]' : 'border-[#C58E9B]'
                  }`}>
                    {selectedAlgo === 'greedy' && <div className="w-1.5 h-1.5 rounded-full bg-[#FDF8FA]" />}
                  </div>
                </div>
              </div>

              {/* Backtracking Option */}
              <div
                onClick={() => setSelectedAlgo('backtracking')}
                className={`examia-tab-pill p-4 rounded-2xl border cursor-pointer ${
                  selectedAlgo === 'backtracking'
                    ? 'border-[#642F43] bg-[#F2DFE6] shadow-[0_8px_20px_-6px_rgba(100,47,67,0.20)]'
                    : 'clay-inset hover:bg-[#FAF0F3]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-bold text-xs text-[#361522] flex items-center gap-2 flex-wrap">
                      <span>Backtracking Graph Coloring (DFS)</span>
                      <span className="badge badge-lavender text-[10px]">Exact &amp; Optimal</span>
                    </span>
                    <p className="text-[11px] text-[#6F4253] mt-1.5 leading-relaxed">
                      Exhaustive depth-first search with pruning. Guarantees finding an m-coloring solution or proving impossibility.
                    </p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                    selectedAlgo === 'backtracking' ? 'border-[#4A1F30] bg-[#4A1F30]' : 'border-[#C58E9B]'
                  }`}>
                    {selectedAlgo === 'backtracking' && <div className="w-1.5 h-1.5 rounded-full bg-[#FDF8FA]" />}
                  </div>
                </div>

                {/* Backtracking Slot Limit Parameter */}
                {selectedAlgo === 'backtracking' && (
                  <div className="mt-3 pt-3 border-t border-[#C58E9B]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs animate-fade-in">
                    <div>
                      <p className="font-bold text-[#642F43]">Target Slot Budget (m):</p>
                      <p className="text-[10px] text-[#6F4253]">0 = Auto-find minimum chromatic number &chi;(G)</p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[0, 2, 3, 4, 5].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setMaxSlotsLimit(val);
                          }}
                          className={`examia-tab-pill min-h-[36px] px-3 py-1 rounded-full text-xs font-mono font-semibold border cursor-pointer ${
                            maxSlotsLimit === val
                              ? 'bg-[#642F43] text-[#FDF8FA] border-[#4A1F30] shadow-xs'
                              : 'clay-inset text-[#361522] hover:bg-[#FAF0F3]'
                          }`}
                        >
                          {val === 0 ? "Auto" : `m=${val}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Calendar Constraints */}
          <div className="space-y-4">
            <div>
              <h3 className="font-serif font-bold text-base text-[#642F43] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#642F43]" />
                <span>2. Examination Schedule Parameters</span>
              </h3>
              <p className="text-xs text-[#6F4253] mt-0.5">
                Configure calendar dates and session timings.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#642F43] mb-1">
                  Examination Start Date
                </label>
                <input
                  type="date"
                  value={config.startDate}
                  onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                  className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-[#642F43] mb-1">
                  Examination Days
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={config.examDaysCount}
                  onChange={(e) => setConfig({ ...config, examDaysCount: parseInt(e.target.value, 10) || 5 })}
                  className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-bold text-[#642F43] mb-1">
                Sessions Per Day
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[1, 2].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setConfig({ ...config, sessionsPerDay: num })}
                    className={`examia-tab-pill min-h-[42px] py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                      config.sessionsPerDay === num
                        ? 'bg-[#642F43] border-[#4A1F30] text-[#FDF8FA] shadow-sm'
                        : 'clay-inset text-[#6F4253] hover:text-[#642F43]'
                    }`}
                  >
                    {num === 1 ? "1 Session (Morning)" : "2 Sessions (Morning & Afternoon)"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-[#642F43] mb-1">
                  Morning Session Timing
                </label>
                <input
                  type="text"
                  value={config.morningTiming}
                  onChange={(e) => setConfig({ ...config, morningTiming: e.target.value })}
                  placeholder="09:30 AM - 12:30 PM"
                  className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
                />
              </div>

              <div>
                <label className="block font-bold text-[#642F43] mb-1">
                  Afternoon Session Timing
                </label>
                <input
                  type="text"
                  value={config.afternoonTiming}
                  onChange={(e) => setConfig({ ...config, afternoonTiming: e.target.value })}
                  placeholder="02:00 PM - 05:00 PM"
                  disabled={config.sessionsPerDay === 1}
                  className="w-full min-h-[42px] clay-inset rounded-xl px-3.5 py-2 text-sm sm:text-xs text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30 disabled:opacity-45"
                />
              </div>
            </div>

            <div className="p-3 clay-inset rounded-xl text-[11px] text-[#6F4253]">
              Total Available Session Slots: <strong className="text-[#642F43]">{config.examDaysCount * config.sessionsPerDay} slots</strong> across {config.examDaysCount} days.
            </div>
          </div>
        </div>

        {/* Generate Button & Progress State */}
        <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-[#C58E9B]/32 flex flex-col items-center justify-center">
          {isGenerating ? (
            <div className="w-full max-w-md text-center space-y-3 py-3">
              <div className="w-10 h-10 border-3 border-[#642F43] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-serif font-bold text-base text-[#642F43] animate-pulse">
                {steps[stepIndex]}
              </p>
              <div className="w-full clay-inset h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#642F43] h-full transition-all duration-300"
                  style={{ width: `${((stepIndex + 1) / 3) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGenerate}
              className="btn-primary w-full sm:w-auto min-h-[48px] justify-center text-sm sm:text-base py-3.5 px-6 sm:px-8 shadow-lg hover:shadow-xl transform hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center gap-2.5"
            >
              <Sparkles className="w-5 h-5" />
              <span>Generate Smart Timetable</span>
            </button>
          )}
        </div>
      </div>

      {/* Generation Summary Box upon success */}
      {generationSummary && (
        <div className="card-premium p-4 sm:p-6 bg-[#FAF0F3] border-[#C58E9B]/65 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#642F43] text-[#FDF8FA] border border-[#4A1F30] shadow-xs flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="badge badge-sage mb-1 text-[10px]">Optimal Solution Verified</span>
                <h4 className="font-serif font-bold text-lg text-[#642F43]">
                  Timetable Generated Successfully!
                </h4>
                <p className="text-xs text-[#361522] mt-0.5">
                  Scheduled <strong>{subjects.length} subjects</strong> across <strong>{generationSummary.numSlots} examination slots</strong> in {generationSummary.executionTimeMs} ms.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('schedule')}
              className="btn-primary text-xs min-h-[44px] py-2.5 px-5 flex items-center justify-center gap-2 w-full sm:w-auto shrink-0"
            >
              <span>View Final Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

