import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Bell, Calendar, Clock, Menu } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

const DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
});

const COMPACT_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : true
  );
  const [isSmUp, setIsSmUp] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 640px)').matches : true
  );
  const [now, setNow] = useState(() => new Date());

  const menuButtonRef = useRef(null);
  const notifContainerRef = useRef(null);
  const wasMobileNavOpenRef = useRef(false);

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

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const lgQuery = window.matchMedia('(min-width: 1024px)');
    const smQuery = window.matchMedia('(min-width: 640px)');

    const syncBreakpoints = () => {
      const desktop = lgQuery.matches;
      setIsDesktop(desktop);
      setIsSmUp(smQuery.matches);
      if (desktop) {
        setIsMobileNavOpen(false);
      }
    };

    syncBreakpoints();
    lgQuery.addEventListener?.('change', syncBreakpoints);
    smQuery.addEventListener?.('change', syncBreakpoints);

    return () => {
      lgQuery.removeEventListener?.('change', syncBreakpoints);
      smQuery.removeEventListener?.('change', syncBreakpoints);
    };
  }, []);

  // Automatically close the mobile navigation drawer after route changes
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [activeTab]);

  // Synchronize drawer DOM state, accessibility (inert/focus), Escape key, and swipe-left dismiss
  useEffect(() => {
    const drawer = document.getElementById('examia-navigation-drawer');
    const mainShell = document.getElementById('examia-main-shell');
    if (!drawer) return undefined;

    if (isDesktop) {
      drawer.removeAttribute('data-mobile-open');
      drawer.inert = false;
      drawer.removeAttribute('aria-hidden');
      if (mainShell) mainShell.inert = false;
      wasMobileNavOpenRef.current = false;
      return undefined;
    }

    if (isMobileNavOpen) {
      drawer.setAttribute('data-mobile-open', 'true');
      drawer.inert = false;
      drawer.removeAttribute('aria-hidden');
      if (mainShell) mainShell.inert = true;
      wasMobileNavOpenRef.current = true;

      requestAnimationFrame(() => {
        window.dispatchEvent(new Event('resize'));
        drawer.focus({ preventScroll: true });
      });
    } else {
      drawer.removeAttribute('data-mobile-open');
      drawer.inert = true;
      drawer.setAttribute('aria-hidden', 'true');
      if (mainShell) mainShell.inert = false;

      if (wasMobileNavOpenRef.current) {
        wasMobileNavOpenRef.current = false;
        requestAnimationFrame(() => {
          menuButtonRef.current?.focus({ preventScroll: true });
        });
      }
    }

    let touchStartX = null;
    let touchStartY = null;
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e) => {
      if (touchStartX === null || !e.changedTouches?.length) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = Math.abs(e.changedTouches[0].clientY - (touchStartY ?? 0));
      touchStartX = null;
      touchStartY = null;
      if (dx < -48 && dy < 60) {
        setIsMobileNavOpen(false);
      }
    };

    const handleCloseEvent = () => setIsMobileNavOpen(false);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };

    drawer.addEventListener('touchstart', handleTouchStart, { passive: true });
    drawer.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('examia-close-mobile-nav', handleCloseEvent);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      drawer.removeEventListener('touchstart', handleTouchStart);
      drawer.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('examia-close-mobile-nav', handleCloseEvent);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDesktop, isMobileNavOpen]);

  // Dismiss notification popover on outside click or Escape key
  useEffect(() => {
    if (!showNotifications) return undefined;
    const handlePointerDown = (e) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setShowNotifications(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNotifications]);

  const getPageMeta = (tab) => {
    switch (tab) {
      case 'dashboard':
        return { title: 'Dashboard', breadcrumb: 'Examia / Dashboard' };
      case 'manage':
        return { title: 'Manage Data', breadcrumb: 'Examia / Manage Data' };
      case 'generator':
        return { title: 'Timetable Generator', breadcrumb: 'Examia / Timetable Generator' };
      default:
        return { title: 'Dashboard', breadcrumb: 'Examia' };
    }
  };

  const meta = getPageMeta(activeTab);
  const currentDateFormatted = DATE_FORMATTER.format(now);
  const compactDateFormatted = COMPACT_DATE_FORMATTER.format(now);
  const currentTimeFormatted = TIME_FORMATTER.format(now);
  const localDateIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const isoTimestamp = now.toISOString();

  return (
    <>
      {!isDesktop && typeof document !== 'undefined' && createPortal(
        <div
          aria-hidden="true"
          onClick={() => setIsMobileNavOpen(false)}
          className={`examia-drawer-backdrop no-print fixed inset-0 z-30 bg-[#361522]/45 backdrop-blur-[2px] lg:hidden transition-opacity duration-300 ${
            isMobileNavOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />,
        document.body
      )}

      <header className="bg-[#FDF9FA] border-b border-[#C58E9B]/40 shadow-[0_4px_18px_-4px_rgba(100,47,67,0.08)] sticky top-0 z-20 select-none examia-safe-pt">
        <div className="min-h-16 md:h-20 px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-3">
          {/* Left: Mobile Drawer Trigger + Title & Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              ref={menuButtonRef}
              id="examia-mobile-menu-btn"
              type="button"
              onClick={() => setIsMobileNavOpen((open) => !open)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileNavOpen}
              aria-controls="examia-navigation-drawer"
              className="lg:hidden min-w-[44px] min-h-[44px] -ml-1 rounded-xl border border-[#C58E9B]/55 bg-[#FAF0F3] hover:bg-[#F3E2E7] shadow-[0_2px_8px_-2px_rgba(100,47,67,0.10)] flex items-center justify-center text-[#642F43] shrink-0 transition-colors"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <div className="min-w-0">
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#6F4253] tracking-wide uppercase truncate">
                {meta.breadcrumb}
              </p>
              <h2 className="text-base sm:text-xl font-serif font-bold text-[#642F43] tracking-tight truncate">
                {meta.title}
              </h2>
            </div>
          </div>

          {/* Center: Live Real-Time Date & Clock (Tablet MD+ & Desktop) */}
          <div
            aria-label="Current date and local time"
            className="hidden md:flex items-center gap-3 px-4 py-2 rounded-full bg-[#F4E4E9] border border-[#C58E9B]/52 shadow-[inset_0_1px_2px_rgba(100,47,67,0.06)] shrink-0"
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

          {/* Right: Avatar, Notification, Profile */}
          <div className="flex items-center gap-1.5 sm:gap-3.5 shrink-0">
            <UserAvatar name="Kiko" size={isSmUp ? 42 : 34} />

            {/* Notifications */}
            <div ref={notifContainerRef} className="relative">
              <button
                type="button"
                aria-label="System alerts"
                aria-expanded={showNotifications}
                onClick={() => setShowNotifications((v) => !v)}
                className="w-10 h-10 sm:w-9 sm:h-9 rounded-full border border-[#C58E9B]/55 bg-[#FAF0F3] hover:bg-[#F3E2E7] shadow-[0_2px_8px_-2px_rgba(100,47,67,0.10)] flex items-center justify-center text-[#642F43] relative transition-[background-color,border-color,box-shadow] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <Bell className="w-4 h-4" aria-hidden="true" />
                <span className="w-2 h-2 bg-[#642F43] rounded-full absolute top-2 right-2 sm:top-1.5 sm:right-2 ring-2 ring-[#FAF0F3]" aria-hidden="true" />
              </button>

              {showNotifications && (
                <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-[4.25rem] sm:top-auto sm:mt-2 sm:w-80 card-premium p-4 shadow-lg z-30 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-[#C58E9B]/30">
                    <h4 className="font-serif font-bold text-sm text-[#642F43]">System Alerts</h4>
                    <span className="badge badge-lavender text-[10px]">Real-time</span>
                  </div>
                  <div className="py-2.5 space-y-2 text-xs">
                    <div className="p-2.5 rounded-xl clay-inset">
                      <p className="font-semibold text-[#361522]">Conflict Detection Active</p>
                      <p className="text-[11px] text-[#6F4253] mt-0.5">
                        Conflicts automatically recalculate whenever subjects or divisions change.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Admin Profile */}
            <div className="flex items-center gap-2.5 pl-1.5 sm:pl-3 border-l border-[#C58E9B]/35">
              <div className="w-9 h-9 rounded-full bg-[#642F43] border border-[#4A1F30] shadow-[0_4px_10px_-2px_rgba(100,47,67,0.28)] flex items-center justify-center text-[#FDF8FA] font-bold text-xs">
                AD
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-bold text-[#361522] leading-none">Administrator</p>
                <p className="text-[10px] font-medium text-[#6F4253] mt-0.5 leading-none">Exam Controller</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Real-Time Date & Clock Bar (< 768px) */}
        <div
          aria-label="Current date and local time"
          className="md:hidden px-3 sm:px-6 py-1.5 bg-[#F4E4E9]/85 border-t border-[#C58E9B]/28 flex items-center justify-between gap-2 text-[11px]"
        >
          <div className="flex items-center gap-1.5 font-semibold text-[#361522] min-w-0">
            <Calendar className="w-3 h-3 text-[#642F43] shrink-0" aria-hidden="true" />
            <time dateTime={localDateIso} className="truncate">{compactDateFormatted}</time>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Clock className="w-3 h-3 text-[#642F43]" aria-hidden="true" />
            <time
              dateTime={isoTimestamp}
              aria-live="off"
              className="font-mono tabular-nums font-semibold text-[#642F43] tracking-tight"
            >
              {currentTimeFormatted}
            </time>
            <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#642F43]" />
          </div>
        </div>
      </header>
    </>
  );
}
