import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import StatCard from '../components/StatCard';

/** Returns the time-of-day greeting for the user's local clock. */
function getGreetingForDate(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
}

const STEPS = [
  {
    number: '1',
    title: 'Add subjects, divisions, and classrooms.',
  },
  {
    number: '2',
    title: 'Configure exam dates, session timings, and coloring algorithm.',
  },
  {
    number: '3',
    title: 'Generate a conflict-free schedule with automatic room allocation.',
  },
];

export default function DashboardView({
  subjects,
  studentGroups,
  classrooms,
  latestTimetable,
  setActiveTab,
}) {
  const [greeting, setGreeting] = useState(() => getGreetingForDate());

  useEffect(() => {
    const syncGreeting = () => {
      setGreeting((prev) => {
        const next = getGreetingForDate();
        return prev === next ? prev : next;
      });
    };

    const intervalId = setInterval(syncGreeting, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncGreeting();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const totalStudentsInGroups = studentGroups.reduce(
    (acc, group) => acc + (Number(group.studentCount) || 0),
    0
  );

  const availableRooms = classrooms.filter((r) => r.isAvailable);
  const availableSeats = availableRooms.reduce(
    (acc, r) => acc + (Number(r.capacity) || 0),
    0
  );

  const scheduledExamsCount = latestTimetable?.scheduledExams?.length ?? 0;
  const scheduledSubtitle = latestTimetable
    ? `${latestTimetable.numSlots} ${latestTimetable.numSlots === 1 ? 'slot' : 'slots'} · ${
        latestTimetable.algorithmKey === 'backtracking' ? 'Backtracking' : 'Greedy'
      }`
    : 'Generate timetable to schedule';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Welcome Section + Prominent CTA */}
      <section className="card-premium p-5 sm:p-7 relative overflow-hidden bg-gradient-to-br from-[#FDF9FA] via-[#FAF1F4] to-[#F3E1E7]">
        <div
          aria-hidden="true"
          className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-[#C58E9B]/18 blur-2xl pointer-events-none"
        />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7D5563]">
              {greeting}
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-[2.15rem] font-serif font-bold text-[#642F43] tracking-tight leading-tight">
              Welcome to Examia
            </h1>
            <p className="text-sm sm:text-base font-semibold text-[#4A1F30]">
              Plan smarter. Schedule better.
            </p>
            <p className="text-sm text-[#6F4253] leading-relaxed">
              Generate conflict-free examination timetables with real date and time slots and automatic classroom seat allocation.
            </p>
          </div>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('generator')}
              className="btn-primary w-full md:w-auto min-h-[48px] px-6 py-3 text-sm sm:text-base font-semibold flex items-center justify-center gap-2.5 shadow-[0_12px_24px_-6px_rgba(100,47,67,0.34)]"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Generate Timetable</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Summary Cards (Actual SQLite Backend Counts) */}
      <section aria-label="Quick overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <StatCard
            title="Total Subjects"
            value={subjects.length}
            subtitle={
              subjects.length === 1
                ? '1 exam subject stored'
                : `${subjects.length} exam subjects stored`
            }
            icon={BookOpen}
            accentColor="lavender"
          />

          <StatCard
            title="Total Divisions"
            value={studentGroups.length}
            subtitle={`${totalStudentsInGroups} total students across divisions`}
            icon={Users}
            accentColor="sage"
          />

          <StatCard
            title="Total Classrooms"
            value={classrooms.length}
            subtitle={`${availableRooms.length} available · ${availableSeats} seats`}
            icon={Building2}
            accentColor="peach"
          />

          <StatCard
            title="Total Scheduled Exams"
            value={scheduledExamsCount}
            subtitle={scheduledSubtitle}
            icon={CalendarCheck}
            accentColor="rose"
          />
        </div>
      </section>

      {/* Compact How Examia Works */}
      <section className="card-premium p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3.5">
          <h2 className="text-base sm:text-lg font-serif font-bold text-[#642F43]">
            How Examia Works
          </h2>
          <button
            type="button"
            onClick={() => setActiveTab('manage')}
            className="text-xs font-semibold text-[#642F43] hover:text-[#4A1F30] underline underline-offset-4 self-start sm:self-auto"
          >
            Manage subjects, divisions &amp; classrooms
          </button>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#FAF0F3]/85 border border-[#C58E9B]/35"
            >
              <span
                aria-hidden="true"
                className="w-8 h-8 rounded-xl bg-[#642F43] text-[#FDF8FA] font-serif font-bold text-sm flex items-center justify-center shrink-0"
              >
                {step.number}
              </span>
              <span className="text-xs sm:text-sm font-medium text-[#361522] leading-snug">
                {step.title}
              </span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
