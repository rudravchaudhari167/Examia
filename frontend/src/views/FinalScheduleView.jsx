import React, { useState, useMemo } from 'react';
import { 
  Printer, Download, Filter, ShieldCheck, 
  AlertTriangle, RefreshCw, Calendar, Clock, MapPin, 
  Users, CheckCircle2, Building, ChevronDown
} from 'lucide-react';
import { SLOT_PALETTES } from '../data/defaultData';
import { validateSchedule } from '../algorithms/graph';

export default function FinalScheduleView({ 
  subjects, 
  divisions, 
  timetableResult, 
  config, 
  setActiveTab 
}) {
  const [divisionFilter, setDivisionFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('ALL');
  const [sortField, setSortField] = useState('date'); // 'date' | 'code' | 'slot' | 'students'
  const [sortAsc, setSortAsc] = useState(true);

  // Compute schedule calendar entries
  const scheduleEntries = useMemo(() => {
    if (!timetableResult || !timetableResult.assignments) return [];

    const assignments = timetableResult.assignments;
    const roomAlloc = timetableResult.roomAllocation || {};
    const startDate = new Date(config.startDate || '2026-12-01');
    const sessionsPerDay = config.sessionsPerDay || 2;

    const entries = [];

    subjects.forEach(subject => {
      const slot = assignments[subject.id];
      if (slot === undefined || slot === null || slot < 0) return;

      // Map slot index to calendar day and session
      const dayOffset = Math.floor(slot / sessionsPerDay);
      const sessionIndex = slot % sessionsPerDay;

      // Add days skipping Sundays
      const examDate = new Date(startDate);
      let addedDays = 0;
      let currentDay = 0;
      while (addedDays < dayOffset) {
        currentDay++;
        const testDate = new Date(startDate);
        testDate.setDate(startDate.getDate() + currentDay);
        // Skip Sunday (0)
        if (testDate.getDay() !== 0) {
          addedDays++;
        }
      }
      examDate.setDate(startDate.getDate() + currentDay);

      const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(examDate);
      const dateString = examDate.toISOString().split('T')[0];
      const dateFormatted = new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }).format(examDate);

      const timing = sessionIndex === 0 
        ? (config.morningTiming || '09:30 AM - 12:30 PM')
        : (config.afternoonTiming || '02:00 PM - 05:00 PM');
      
      const sessionLabel = sessionIndex === 0 ? 'Morning Session' : 'Afternoon Session';

      const roomInfo = roomAlloc[subject.id] || {
        roomName: 'Main Exam Hall',
        capacity: 100,
        building: 'Main Block',
        isSufficient: true
      };

      entries.push({
        subject,
        slot,
        slotNumber: slot + 1,
        date: dateString,
        dateFormatted,
        dayName,
        sessionLabel,
        timing,
        roomInfo
      });
    });

    return entries;
  }, [timetableResult, subjects, config]);

  // Extract unique dates for filter
  const uniqueDates = useMemo(() => {
    const dates = new Set();
    scheduleEntries.forEach(e => dates.add(e.date));
    return Array.from(dates).sort();
  }, [scheduleEntries]);

  // Filter & Sort
  const filteredEntries = useMemo(() => {
    let result = scheduleEntries.filter(entry => {
      const s = entry.subject;

      const matchesDivision = 
        divisionFilter === 'ALL' || 
        s.divisions.includes(divisionFilter);

      const matchesDate = 
        dateFilter === 'ALL' || 
        entry.date === dateFilter;

      return matchesDivision && matchesDate;
    });

    result.sort((a, b) => {
      let comp = 0;
      if (sortField === 'date') {
        comp = a.slot - b.slot;
      } else if (sortField === 'code') {
        comp = a.subject.code.localeCompare(b.subject.code);
      } else if (sortField === 'slot') {
        comp = a.slot - b.slot;
      } else if (sortField === 'students') {
        comp = b.subject.studentCount - a.subject.studentCount;
      }
      return sortAsc ? comp : -comp;
    });

    return result;
  }, [scheduleEntries, divisionFilter, dateFilter, sortField, sortAsc]);

  // Actual Rigorous Conflict Validation (Requirement 14)
  const validationResult = useMemo(() => {
    if (!timetableResult || !timetableResult.assignments) return { isValid: false, violations: [] };
    return validateSchedule(subjects, timetableResult.assignments);
  }, [subjects, timetableResult]);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (scheduleEntries.length === 0) return;
    const headers = ["Date", "Day", "Session", "Time", "Subject Code", "Subject Name", "Divisions", "Students", "Slot", "Allocated Room", "Room Capacity"];
    const rows = scheduleEntries.map(e => [
      `"${e.dateFormatted}"`,
      `"${e.dayName}"`,
      `"${e.sessionLabel}"`,
      `"${e.timing}"`,
      `"${e.subject.code}"`,
      `"${e.subject.name}"`,
      `"${e.subject.divisions.join(', ')}"`,
      e.subject.studentCount,
      `"Slot ${e.slotNumber}"`,
      `"${e.roomInfo.roomName}"`,
      e.roomInfo.capacity
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Examia_Timetable_${config.startDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!timetableResult || scheduleEntries.length === 0) {
    return (
      <div className="card-premium p-6 sm:p-12 text-center space-y-4 max-w-xl mx-auto my-6 sm:my-12 animate-fade-in">
        <Calendar className="w-12 h-12 mx-auto text-[#642F43] stroke-[1.5]" />
        <h3 className="font-serif font-bold text-xl text-[#642F43]">No Final Timetable Available</h3>
        <p className="text-xs text-[#6F4253] max-w-sm mx-auto">
          Please run the timetable generator to color the graph, allocate halls, and establish conflict-free examination dates.
        </p>
        <button
          type="button"
          onClick={() => setActiveTab('generate')}
          className="btn-primary text-xs min-h-[44px] py-2.5 px-6 mx-auto"
        >
          Go to Generator
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Printable Institutional Header (Shown only during print) */}
      <div className="print-only hidden p-6 border-b-2 border-black text-center">
        <h1 className="text-2xl font-bold uppercase tracking-wider">Examia Academic Timetable</h1>
        <p className="text-sm mt-1">Official Examination Schedule &middot; Conflict-Free DAA Allocation</p>
        <p className="text-xs text-[#6F4253] print:text-black mt-1">Start Date: {config.startDate} | Generated via {timetableResult.algorithmName}</p>
      </div>

      {/* Header Bar */}
      <div className="no-print flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#642F43]">Final Examination Schedule</h2>
          <p className="text-xs text-[#6F4253] mt-0.5">
            Verified institutional examination schedule with non-overlapping student divisions and room capacity allocations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className="btn-secondary text-xs min-h-[42px] py-2 px-4 w-full sm:w-auto justify-center whitespace-nowrap flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Regenerate Timetable</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="btn-secondary text-xs min-h-[42px] py-2 px-4 flex-1 sm:flex-initial justify-center whitespace-nowrap flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn-primary text-xs min-h-[42px] py-2 px-4 flex-1 sm:flex-initial justify-center whitespace-nowrap flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4 shrink-0" />
            <span>Print Timetable</span>
          </button>
        </div>
      </div>

      {/* Validation Verification Banner (Requirement 14) */}
      <div className="no-print">
        {validationResult.isValid ? (
          <div className="card-premium p-4 bg-[#FAF0F3] border-[#C58E9B]/65 text-xs text-[#361522] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#642F43] border border-[#4A1F30] text-[#FDF8FA] shadow-xs flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-[#642F43]">
                  All student division conflicts successfully resolved.
                </p>
                <p className="text-[11px] text-[#6F4253] mt-0.5 leading-relaxed">
                  Mathematical proof: &forall; S<sub>a</sub>, S<sub>b</sub> &isin; Slot<sub>k</sub>, Divisions(S<sub>a</sub>) &cap; Divisions(S<sub>b</sub>) = &empty;. Zero examinees have clashing exams.
                </p>
              </div>
            </div>
            <span className="badge badge-sage self-start sm:self-center shrink-0">Mathematically Verified</span>
          </div>
        ) : (
          <div className="card-premium p-4 bg-[#F4E4E9] border-[#642F43]/45 text-xs text-[#4A1F30] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#642F43] shrink-0" />
              <div>
                <p className="font-bold">Conflict Warning Detected</p>
                <p className="text-[11px] mt-0.5">
                  {validationResult.violations.length} division collision(s) detected in the current schedule!
                </p>
              </div>
            </div>
            <span className="badge badge-rose self-start sm:self-center shrink-0">Needs Resolution</span>
          </div>
        )}
      </div>

      {/* Room Warnings Banner (Requirement 15) */}
      {timetableResult.roomWarnings && timetableResult.roomWarnings.length > 0 && (
        <div className="no-print card-premium p-4 bg-[#F4E4E9] border-[#642F43]/45 text-xs text-[#4A1F30] space-y-1">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4 text-[#642F43]" />
            <span>Room Allocation Overcapacity Notice</span>
          </div>
          {timetableResult.roomWarnings.map((w, idx) => (
            <p key={idx} className="text-[11px] text-[#4A1F30] pl-6">
              &bull; {w.message}
            </p>
          ))}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="no-print card-premium p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-[#6F4253] w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#642F43]" />
            <span className="font-semibold uppercase text-[10px] tracking-wider">Filter:</span>
          </div>

          {/* Division Filter */}
          <select
            aria-label="Filter schedule by division"
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="w-full sm:w-auto min-h-[40px] clay-inset rounded-full px-3.5 py-2 text-xs font-medium text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
          >
            <option value="ALL">All Cohort Divisions</option>
            {divisions.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          {/* Date Filter */}
          <select
            aria-label="Filter schedule by date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full sm:w-auto min-h-[40px] clay-inset rounded-full px-3.5 py-2 text-xs font-medium text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
          >
            <option value="ALL">All Examination Dates</option>
            {uniqueDates.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Sort Field */}
          <select
            aria-label="Sort schedule entries"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
            className="w-full sm:w-auto min-h-[40px] clay-inset rounded-full px-3.5 py-2 text-xs font-medium text-[#361522] focus:outline-none focus:ring-2 focus:ring-[#642F43]/30"
          >
            <option value="date">Sort by Date &amp; Slot</option>
            <option value="code">Sort by Subject Code</option>
            <option value="students">Sort by Student Count</option>
          </select>

          {(divisionFilter !== 'ALL' || dateFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setDivisionFilter('ALL');
                setDateFilter('ALL');
              }}
              className="min-h-[36px] text-xs font-semibold text-[#642F43] hover:underline px-1"
            >
              Reset filters
            </button>
          )}
        </div>

        <div className="text-xs text-[#6F4253] self-start md:self-auto">
          Displaying <strong className="text-[#361522]">{filteredEntries.length}</strong> scheduled examination sessions
        </div>
      </div>

      {/* Schedule Cards (< 1024px screen) & Institutional Table (lg+ and print) */}
      <div className="card-premium overflow-hidden">
        {/* Mobile & Tablet Examination Session Cards (< 1024px, hidden in print) */}
        <div className="lg:hidden print:hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:gap-4 md:p-4 bg-[#FDF9FA]">
          {filteredEntries.map((entry, idx) => {
            const s = entry.subject;
            const palette = SLOT_PALETTES[entry.slot % SLOT_PALETTES.length];
            const room = entry.roomInfo;

            return (
              <div key={`card-${s.id}-${idx}`} className="p-4 md:rounded-2xl md:border md:border-[#C58E9B]/35 space-y-3 bg-[#FDF9FA]">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge badge-lavender font-mono text-xs">{s.code}</span>
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs"
                      style={{
                        backgroundColor: palette.fillColor,
                        borderColor: palette.strokeColor,
                        color: palette.textColor
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: palette.strokeColor }}
                      />
                      Slot {entry.slotNumber}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-[#642F43]">
                    {s.studentCount} students
                  </span>
                </div>

                <div>
                  <h3 className="font-serif font-bold text-base text-[#361522] leading-snug">
                    {s.name}
                  </h3>
                  {s.category && (
                    <p className="text-[11px] text-[#6F4253] mt-0.5">{s.category}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl clay-inset">
                    <p className="text-[10px] font-bold uppercase text-[#6F4253]">Date &amp; Day</p>
                    <p className="font-bold text-[#361522] mt-0.5">{entry.dateFormatted}</p>
                    <p className="text-[11px] text-[#6F4253]">{entry.dayName}</p>
                  </div>
                  <div className="p-2.5 rounded-xl clay-inset">
                    <p className="text-[10px] font-bold uppercase text-[#6F4253]">{entry.sessionLabel}</p>
                    <p className="text-[11px] text-[#361522] font-mono flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-[#642F43] shrink-0" />
                      <span>{entry.timing}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[#6F4253]">Divisions:</span>
                  {s.divisions.map(div => (
                    <span key={div} className="badge badge-sage text-[10px]">
                      {div}
                    </span>
                  ))}
                </div>

                <div className="p-2.5 rounded-xl clay-inset flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <Building className="w-3.5 h-3.5 text-[#642F43] shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-[#361522]">{room.roomName}</p>
                      <p className="text-[10px] text-[#6F4253]">
                        Capacity: {room.capacity} &middot; {room.building}
                      </p>
                    </div>
                  </div>
                  {!room.isSufficient && (
                    <span className="inline-block text-[10px] text-[#FDF8FA] bg-[#642F43] border border-[#4A1F30] px-2 py-0.5 rounded-full font-semibold">
                      Overcapacity (Deficit {room.deficit})
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop & Print Institutional Table (lg+ and print) */}
        <div
          role="region"
          tabIndex={0}
          aria-label="Final examination schedule table"
          className="hidden lg:block print:block examia-table-region"
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F4E4E9] border-b border-[#C58E9B]/40 text-[#642F43] font-bold uppercase text-[10px] tracking-wider print:bg-gray-100 print:text-black">
                <th className="py-3.5 px-5">Date &amp; Day</th>
                <th className="py-3.5 px-4">Session &amp; Timing</th>
                <th className="py-3.5 px-4">Subject Code</th>
                <th className="py-3.5 px-4">Subject Name</th>
                <th className="py-3.5 px-4">Enrolled Divisions</th>
                <th className="py-3.5 px-4 text-center">Students</th>
                <th className="py-3.5 px-4 text-center">Examination Slot</th>
                <th className="py-3.5 px-5">Allocated Hall &amp; Capacity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#C58E9B]/22 bg-[#FDF9FA] print:bg-white print:divide-gray-200">
              {filteredEntries.map((entry, idx) => {
                const s = entry.subject;
                const palette = SLOT_PALETTES[entry.slot % SLOT_PALETTES.length];
                const room = entry.roomInfo;

                return (
                  <tr key={`${s.id}-${idx}`} className="hover:bg-[#FAF0F3] transition-colors print:bg-white">
                    {/* Date & Day */}
                    <td className="py-4 px-5">
                      <p className="font-bold text-[#361522]">{entry.dateFormatted}</p>
                      <p className="text-[11px] text-[#6F4253]">{entry.dayName}</p>
                    </td>

                    {/* Session & Timing */}
                    <td className="py-4 px-4">
                      <span className="font-bold text-[#361522] block">{entry.sessionLabel}</span>
                      <span className="text-[11px] text-[#6F4253] font-mono flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-[#642F43]" />
                        {entry.timing}
                      </span>
                    </td>

                    {/* Subject Code */}
                    <td className="py-4 px-4 font-mono font-bold text-[#642F43]">
                      <span className="badge badge-lavender font-mono text-xs">
                        {s.code}
                      </span>
                    </td>

                    {/* Subject Name */}
                    <td className="py-4 px-4 font-bold text-[#361522]">
                      {s.name}
                      <span className="block text-[10px] font-medium text-[#6F4253] mt-0.5">
                        {s.category}
                      </span>
                    </td>

                    {/* Divisions */}
                    <td className="py-4 px-4">
                      <div className="flex flex-wrap gap-1">
                        {s.divisions.map(div => (
                          <span key={div} className="badge badge-sage text-[10px]">
                            {div}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Students Count */}
                    <td className="py-4 px-4 text-center font-bold text-[#361522]">
                      {s.studentCount}
                    </td>

                    {/* Slot Indicator */}
                    <td className="py-4 px-4 text-center">
                      <span 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs"
                        style={{
                          backgroundColor: palette.fillColor,
                          borderColor: palette.strokeColor,
                          color: palette.textColor
                        }}
                      >
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: palette.strokeColor }} 
                        />
                        Slot {entry.slotNumber}
                      </span>
                    </td>

                    {/* Room Allocation */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <Building className={`w-3.5 h-3.5 ${room.isSufficient ? 'text-[#642F43]' : 'text-[#4A1F30]'}`} />
                        <div>
                          <p className="font-bold text-[#361522]">
                            {room.roomName}
                          </p>
                          <p className="text-[10px] text-[#6F4253]">
                            Capacity: {room.capacity} &middot; {room.building}
                          </p>
                        </div>
                      </div>
                      {!room.isSufficient && (
                        <span className="inline-block text-[10px] text-[#FDF8FA] bg-[#642F43] border border-[#4A1F30] px-2 py-0.5 rounded-full mt-1 font-semibold">
                          Overcapacity (Deficit {room.deficit})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

