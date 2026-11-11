import React, { useEffect, useRef } from 'react';
import { Avatar } from '@originkit/avatars/react';

/**
 * Interactive topbar doodle avatar powered by @originkit/avatars.
 * Uses @originkit/avatars' built-in pointer gaze tracking alongside a gentle
 * compositor-only magnetic lean toward the cursor while respecting reduced motion.
 */
export function UserAvatar({ name = 'Kiko', size = 42 }) {
  const badgeRef = useRef(null);

  useEffect(() => {
    const el = badgeRef.current;
    if (!el || typeof window === 'undefined') return undefined;

    const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    if (coarsePointer) return undefined;

    let rafId = 0;

    const resetTransform = () => {
      el.style.transform = 'perspective(260px) translate3d(0px, 0px, 0px) rotateX(0deg) rotateY(0deg) rotate(0deg)';
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
        const reach = Math.min(1, dist / 200);

        const shiftX = (dx / dist) * 5 * reach;
        const shiftY = (dy / dist) * 4.5 * reach;
        const tiltX = -(dy / dist) * 14 * reach;
        const tiltY = (dx / dist) * 16 * reach;
        const tiltZ = (dx / dist) * 12 * reach;

        el.style.transform = `perspective(260px) translate3d(${shiftX.toFixed(2)}px, ${shiftY.toFixed(2)}px, 0px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) rotate(${tiltZ.toFixed(2)}deg)`;
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
    <div className="no-print shrink-0 flex items-center">
      <div
        ref={badgeRef}
        className="examia-corner-avatar p-1 rounded-[15px] bg-[#642F43] border border-[#C58E9B]/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_6px_14px_-4px_rgba(74,31,48,0.28)] flex items-center justify-center"
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
