import React, { useEffect, useRef, useState } from 'react';
import HammerStrike from './HammerStrike';

/**
 * Full-screen initial application loader featuring the 3D HammerStrike WebGL scene
 * harmonized with Examia's claymorphic slate palette, graceful WebGL fallback, and
 * reduced-motion compliance.
 */
export default function LoadingScreen({ isReady, onExited }) {
  const overlayRef = useRef(null);
  const onExitedRef = useRef(onExited);
  onExitedRef.current = onExited;
  const hasExitedRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const [webglUnavailable, setWebglUnavailable] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false;
    }
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  const reducedMotionRef = useRef(prefersReducedMotion);
  reducedMotionRef.current = prefersReducedMotion;

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mq.addEventListener?.('change', handleChange);
    return () => mq.removeEventListener?.('change', handleChange);
  }, []);

  useEffect(() => {
    if (isReady) {
      setIsClosing(true);
    }
  }, [isReady]);

  // Trigger unmount only after the committed opacity transition completes
  useEffect(() => {
    if (!isClosing) return undefined;

    let cancelled = false;
    let failsafeTimer = null;

    const finishExit = () => {
      if (cancelled || hasExitedRef.current) return;
      hasExitedRef.current = true;
      onExitedRef.current?.();
    };

    const el = overlayRef.current;
    if (el) void window.getComputedStyle(el).opacity;
    const animations = el && typeof el.getAnimations === 'function' ? el.getAnimations() : [];
    const isReduced = reducedMotionRef.current;
    const fallbackMs = isReduced ? 220 : 680;

    if (animations.length > 0) {
      Promise.race([
        Promise.allSettled(animations.map((a) => a.finished)),
        new Promise((resolve) => {
          failsafeTimer = setTimeout(resolve, fallbackMs);
        }),
      ]).then(finishExit);
    } else {
      failsafeTimer = setTimeout(finishExit, isReduced ? 160 : 560);
    }

    return () => {
      cancelled = true;
      if (failsafeTimer) clearTimeout(failsafeTimer);
    };
  }, [isClosing]);

  return (
    <div
      ref={overlayRef}
      role="status"
      aria-live="polite"
      aria-label="Loading Examia workspace"
      data-closing={isClosing ? '' : undefined}
      className="examia-loader-overlay fixed inset-0 w-full h-dvh max-w-full z-[100] overflow-hidden select-none flex items-center justify-center bg-[#F4E6EA]"
    >
      {webglUnavailable ? (
        <div className="flex flex-col items-center justify-center px-6 text-center">
          <div
            className={`w-20 h-20 rounded-3xl bg-[#642F43] border border-[#C58E9B]/55 flex items-center justify-center shadow-[0_18px_36px_-8px_rgba(74,31,48,0.32)] mb-6 ${
              prefersReducedMotion ? '' : 'examia-fallback-breathe'
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#FDF8FA"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              <circle cx="8" cy="15" r="1.5" fill="#FDF8FA" stroke="none" />
              <circle cx="12" cy="17" r="1.5" fill="#C58E9B" stroke="none" />
              <circle cx="16" cy="14" r="1.5" fill="#E8CBD3" stroke="none" />
            </svg>
          </div>
          <p className="font-serif font-bold text-2xl sm:text-3xl tracking-tight text-[#642F43]">
            examia.
          </p>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#6F4253]">
            Preparing Algorithm Workspace
          </p>
        </div>
      ) : (
        <>
          <HammerStrike
            background="#F4E6EA"
            baseColor="#642F43"
            accentColor="#E5BFC9"
            speed={50}
            distance={18}
            hammer={{ swing: 46, size: 109, tilt: 0 }}
            reducedMotion={prefersReducedMotion}
            onUnavailable={() => setWebglUnavailable(true)}
            style={{
              minWidth: 0,
              minHeight: 0,
              width: '100%',
              height: '100%',
            }}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 flex flex-col items-center text-center px-4 sm:px-6"
            style={{ bottom: 'calc(clamp(1.25rem, 6dvh, 3.5rem) + env(safe-area-inset-bottom, 0px))' }}
          >
            <span className="font-serif font-bold text-xl sm:text-2xl tracking-tight text-[#642F43]">
              examia.
            </span>
            <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6F4253]">
              Intelligent Examination Scheduler
            </span>
          </div>
        </>
      )}
    </div>
  );
}
