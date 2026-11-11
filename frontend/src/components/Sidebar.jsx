import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { 
  LayoutDashboard, BookOpen, Users, Share2, 
  Sparkles, GitCompare, CalendarCheck, Settings, 
  Info, ChevronRight
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'subjects', label: 'Subjects', icon: BookOpen },
  { id: 'divisions', label: 'Student Divisions', icon: Users },
  { id: 'graph', label: 'Conflict Graph', icon: Share2 },
  { id: 'generate', label: 'Generate Timetable', icon: Sparkles },
  { id: 'comparison', label: 'Algorithm Comparison', icon: GitCompare },
  { id: 'schedule', label: 'Final Schedule', icon: CalendarCheck }
];

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onOpenSettings,
  onOpenAbout
}) {
  const navRef = useRef(null);
  const buttonRefs = useRef({});
  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const [indicator, setIndicator] = useState({
    top: 0,
    height: 0,
    ready: false,
    animated: false,
  });

  // Measure active pill position synchronously before paint on tab switch
  useLayoutEffect(() => {
    const btn = buttonRefs.current[activeTab];
    if (!btn) return;
    const top = btn.offsetTop;
    const height = btn.offsetHeight;
    setIndicator((prev) => {
      if (prev.ready && prev.top === top && prev.height === height) return prev;
      return { ...prev, top, height, ready: true };
    });
  }, [activeTab]);

  // Enable smooth compositor transitions only after initial frame paints, and track resizes
  useEffect(() => {
    let rafId = requestAnimationFrame(() => {
      setIndicator((prev) => (prev.animated ? prev : { ...prev, animated: true }));
    });

    const navEl = navRef.current;
    let ro;
    if (navEl && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        const btn = buttonRefs.current[activeTabRef.current];
        if (!btn) return;
        const top = btn.offsetTop;
        const height = btn.offsetHeight;
        setIndicator((prev) => {
          if (prev.ready && prev.top === top && prev.height === height) return prev;
          return { ...prev, top, height, ready: true };
        });
      });
      ro.observe(navEl);
    }

    return () => {
      cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, []);

  return (
    <aside className="w-72 bg-[#FAF1F4] border-r border-[#C58E9B]/45 h-screen flex flex-col justify-between shrink-0 select-none z-20 rounded-r-[26px] shadow-[6px_0_24px_-8px_rgba(100,47,67,0.12)]">
      <div>
        {/* Brand Logo & Header */}
        <div className="p-6 pb-5 border-b border-[#C58E9B]/32">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#642F43] p-[2px] shadow-[0_6px_14px_-4px_rgba(100,47,67,0.34)] flex items-center justify-center">
              <div className="w-full h-full bg-[#FDF9FA] rounded-[14px] flex items-center justify-center">
                <svg className="w-6 h-6 text-[#642F43]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <circle cx="8" cy="15" r="1.5" fill="#642F43" stroke="none" />
                  <circle cx="12" cy="17" r="1.5" fill="#C58E9B" stroke="none" />
                  <circle cx="16" cy="14" r="1.5" fill="#8F4B63" stroke="none" />
                  <line x1="8" y1="15" x2="12" y2="17" stroke="#642F43" strokeWidth="1" />
                  <line x1="12" y1="17" x2="16" y2="14" stroke="#642F43" strokeWidth="1" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="font-serif font-bold text-xl tracking-tight text-[#642F43] flex items-center gap-1.5">
                examia.
              </h1>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-[#6F4253]">
                Academic Intelligence Platform
              </p>
            </div>
          </div>
          
          <div className="mt-3.5 px-3 py-1.5 rounded-xl bg-[#F4E4E9] border border-[#C58E9B]/45 flex items-center justify-between text-xs">
            <span className="text-[#4A1F30] font-medium text-[11px] truncate">
              Browser DAA Engine Active
            </span>
            <span className="w-2 h-2 rounded-full bg-[#642F43] shadow-[0_0_8px_rgba(100,47,67,0.4)]" aria-hidden="true" />
          </div>
        </div>

        {/* Navigation List */}
        <nav ref={navRef} aria-label="Workspace navigation" className="relative p-3.5 space-y-1.5">
          <p className="relative z-10 px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-[#6F4253]">
            Navigation
          </p>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => {
                  if (el) buttonRefs.current[item.id] = el;
                  else delete buttonRefs.current[item.id];
                }}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setActiveTab(item.id)}
                className={`group examia-nav-btn relative z-10 w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl font-semibold text-xs border border-transparent cursor-pointer ${
                  isActive
                    ? 'text-[#FDF8FA]'
                    : 'text-[#361522] hover:bg-[#EED8DF]/75 hover:text-[#642F43]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`examia-nav-icon p-1.5 rounded-xl border ${
                      isActive
                        ? 'bg-[#4A1F30]/50 text-[#FDF8FA] border-[#E8CBD3]/25'
                        : 'bg-[#F4E4E9] text-[#642F43] border-[#C58E9B]/35 group-hover:bg-[#FAF0F3] group-hover:border-[#642F43]/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span>{item.label}</span>
                </div>
                <ChevronRight
                  className={`examia-nav-chevron w-3.5 h-3.5 ${
                    isActive
                      ? 'opacity-100 translate-x-0 text-[#EED7DF]'
                      : 'opacity-0 -translate-x-1.5 text-[#642F43]/60 group-hover:opacity-65 group-hover:translate-x-0'
                  }`}
                />
              </button>
            );
          })}
          <div
            aria-hidden="true"
            data-animated={indicator.animated ? 'true' : 'false'}
            className="examia-nav-pill"
            style={{
              marginTop: 0,
              opacity: indicator.ready ? 1 : 0,
              height: indicator.height ? `${indicator.height}px` : undefined,
              transform: `translate3d(0, ${indicator.top}px, 0)`,
            }}
          />
        </nav>
      </div>

      {/* Footer / Meta section */}
      <div className="m-3 p-3.5 rounded-2xl border border-[#C58E9B]/45 space-y-1.5 bg-[#F4E4E9] shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#361522] border border-transparent hover:bg-[#FDF9FA] hover:border-[#C58E9B]/40 hover:text-[#642F43] transition-[background-color,color,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer"
        >
          <Settings className="w-4 h-4 text-[#642F43]" />
          <span>System Settings & Rooms</span>
        </button>
        <button
          type="button"
          onClick={onOpenAbout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#361522] border border-transparent hover:bg-[#FDF9FA] hover:border-[#C58E9B]/40 hover:text-[#642F43] transition-[background-color,color,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] cursor-pointer"
        >
          <Info className="w-4 h-4 text-[#642F43]" />
          <span>DAA Project Architecture</span>
        </button>

        <div className="pt-2 px-3 flex items-center justify-between text-[11px] text-[#6F4253]">
          <span>examia. v1.0</span>
          <span className="font-mono text-[10px] bg-[#642F43] border border-[#4A1F30] px-2 py-0.5 rounded-full text-[#FDF8FA]">DAA 2026</span>
        </div>
      </div>
    </aside>
  );
}

