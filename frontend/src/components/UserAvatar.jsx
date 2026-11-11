import React, { useEffect, useRef } from 'react';
import { Avatar } from '@originkit/avatars/react';

/**
 * Floating bottom-right interactive doodle avatar powered by @originkit/avatars.
 * Uses @originkit/avatars' built-in pointer gaze tracking alongside a gentle
 * compositor-only magnetic lean toward the cursor while respecting reduced motion.
 */
export function UserAvatar({ name = 'Kiko', size = 56 }) {
  const badgeRef = useRef(null);

  useEffect(() => {
    const el = badgeRef.current;
    if (!el || typeof window === 'undefined') return undefined;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    if (coarsePointer) return undefined;

    let rafId = 0;

    const resetTransform = () => {
      el.style.transform = 'translate3d(0px, 0px, 0px) rotate(0deg)';
    };

    const handlePointerMove = (e) => {
      if (motionQuery?.matches) {
        resetTransform();
        return;
      }
      if (e.pointerType === 'touch') return;

      const x = e.clientX;
      const y = e.clientY;
      if (rafId) cancelAnimationFrame(rafId);

      rafId = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 280);

        const shiftX = (dx / dist) * 6 * reach;
        const shiftY = (dy / dist) * 6 * reach;
        const tiltDeg = (dx / dist) * 5 * reach;

        el.style.transform = `translate3d(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px, 0px) rotate(${tiltDeg.toFixed(2)}deg)`;
      });
    };

    const handleMouseLeave = () => {
      if (rafId) cancelAnimationFrame(rafId);
      resetTransform();
    };

    const handleMotionChange = () => {
      if (motionQuery?.matches) resetTransform();
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.documentElement.addEventListener('mouseleave', handleMouseLeave);
    motionQuery?.addEventListener?.('change', handleMotionChange);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave);
      motionQuery?.removeEventListener?.('change', handleMotionChange);
    };
  }, []);

  return (
    <div className="no-print fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 pointer-events-none">
      <div
        ref={badgeRef}
        className="examia-corner-avatar pointer-events-auto p-1.5 rounded-[22px] bg-[#642F43] border border-[#C58E9B]/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_14px_28px_-6px_rgba(74,31,48,0.34),0_4px_10px_-2px_rgba(74,31,48,0.18)] flex items-center justify-center"
      >
        <Avatar
          style="doodles"
          name={name}
          size={size}
          follow={true}
          animate={true}
          overrides={{ 'color:tile': 0xf9ecf0, 'color:ink': 0x642f43 }}
          label="Examia companion avatar"
        />
      </div>
    </div>
  );
}

export default UserAvatar;
