import React, { useEffect, useState } from 'react';
import { Bell, Calendar, Clock } from 'lucide-react';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: true
});

export default function Topbar({ 
  activeTab
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const syncClock = () => setNow(new Date());
    const intervalId = setInterval(syncClock, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') syncClock();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const getPageMeta = (tab) => {
    switch (tab) {
      case 'overview':
        return { title: 'Overview Workspace', breadcrumb: 'Examia / Dashboard' };
      case 'subjects':
        return { title: 'Subject Management', breadcrumb: 'Examia / Curricular Data / Subjects' };
      case 'divisions':
        return { title: 'Student Divisions', breadcrumb: 'Examia / Enrolments / Divisions' };
      case 'graph':
        return { title: 'Conflict Graph Analysis', breadcrumb: 'Examia / Mathematical Graph / G=(V,E)' };
      case 'generate':
        return { title: 'Generate Timetable', breadcrumb: 'Examia / Timetable / Generator' };
      case 'comparison':
        return { title: 'Algorithm Comparison', breadcrumb: 'Examia / DAA Benchmarks / Greedy vs Backtracking' };
      case 'schedule':
        return { title: 'Final Examination Schedule', breadcrumb: 'Examia / Timetable / Verified Schedule' };
      default:
        return { title: 'Workspace', breadcrumb: 'Examia' };
    }
  };

  const meta = getPageMeta(activeTab);
  const currentDateFormatted = DATE_FORMATTER.format(now);
  const currentTimeFormatted = TIME_FORMATTER.format(now);
  const localDateIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isoTimestamp = now.toISOString();

  return (
    <header className="h-20 bg-[#FDF9FA] border-b border-[#C58E9B]/40 shadow-[0_4px_18px_-4px_rgba(100,47,67,0.08)] px-8 flex items-center justify-between sticky top-0 z-10 select-none">
      {/* Left: Title & Breadcrumb */}
      <div>
        <p className="text-[11px] font-semibold text-[#6F4253] tracking-wide uppercase">
          {meta.breadcrumb}
        </p>
        <h2 className="text-xl font-serif font-bold text-[#642F43] tracking-tight">
          {meta.title}
        </h2>
      </div>

      {/* Center: Live Real-Time Date & Clock */}
      <div
        aria-label="Current date and local time"
        className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-[#F4E4E9] border border-[#C58E9B]/52 shadow-[inset_0_1px_2px_rgba(100,47,67,0.06)]"
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-[#361522]">
          <Calendar className="w-3.5 h-3.5 text-[#642F43]" aria-hidden="true" />
          <time dateTime={localDateIso}>{currentDateFormatted}</time>
        </div>

        <span aria-hidden="true" className="w-px h-3.5 bg-[#C58E9B]/55" />

        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#642F43]" aria-hidden="true" />
          <time
            dateTime={isoTimestamp}
            aria-live="off"
            className="font-mono tabular-nums text-xs font-semibold text-[#642F43] tracking-tight"
          >
            {currentTimeFormatted}
          </time>
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-[#642F43]"
          />
        </div>
      </div>

      {/* Right: Notification, Profile */}
      <div className="flex items-center gap-3.5">
        {/* Notifications */}
        <div className="relative">
          <button 
            type="button"
            aria-label="System alerts"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-full border border-[#C58E9B]/55 bg-[#FAF0F3] hover:bg-[#F3E2E7] shadow-[0_2px_8px_-2px_rgba(100,47,67,0.10)] flex items-center justify-center text-[#642F43] relative transition-[background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
            <span className="w-2 h-2 bg-[#642F43] rounded-full absolute top-1.5 right-2 ring-2 ring-[#FAF0F3]" aria-hidden="true" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 card-premium p-4 shadow-lg z-30 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-[#C58E9B]/30">
                <h4 className="font-serif font-bold text-sm text-[#642F43]">System Alerts</h4>
                <span className="badge badge-lavender text-[10px]">Real-time</span>
              </div>
              <div className="py-2.5 space-y-2 text-xs">
                <div className="p-2.5 rounded-xl clay-inset">
                  <p className="font-semibold text-[#361522]">Conflict Detection Active</p>
                  <p className="text-[11px] text-[#6F4253] mt-0.5">
                    Edges automatically recalculate upon any change to student divisions.
                  </p>
                </div>
                <div className="p-2.5 rounded-xl clay-inset">
                  <p className="font-semibold text-[#361522]">
                    Browser In-Memory Engine
                  </p>
                  <p className="text-[11px] text-[#6F4253] mt-0.5">
                    Operating in client-side standalone execution mode.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-[#C58E9B]/35">
          <div className="w-9 h-9 rounded-full bg-[#642F43] border border-[#4A1F30] shadow-[0_4px_10px_-2px_rgba(100,47,67,0.28)] flex items-center justify-center text-[#FDF8FA] font-bold text-xs">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-[#361522] leading-none">Administrator</p>
            <p className="text-[10px] font-medium text-[#6F4253] mt-0.5 leading-none">Exam Controller</p>
          </div>
        </div>
      </div>
    </header>
  );
}

