import React, { useEffect, useId, useRef, memo } from 'react';
import { X } from 'lucide-react';

/**
 * Accessible native modal dialog wrapper using top-layer `showModal()` and CSS
 * `overscroll-behavior: contain` (no body scroll lock / layout shift).
 */
function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const isOpenRef = useRef(isOpen);
  const pressedOutsideRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    if (isOpen) {
      if (!dialog.open && typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [isOpen]);

  const isPointerOutsideDialog = (event, dialog) => {
    const rect = dialog.getBoundingClientRect();
    return (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    );
  };

  const handlePointerDown = (event) => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;
    pressedOutsideRef.current = isPointerOutsideDialog(event, dialog);
  };

  const handlePointerUp = (event) => {
    const dialog = dialogRef.current;
    if (!dialog || 'closedBy' in HTMLDialogElement.prototype) return;
    const wasPressedOutside = pressedOutsideRef.current;
    pressedOutsideRef.current = false;
    if (wasPressedOutside && isPointerOutsideDialog(event, dialog)) {
      onClose?.();
    }
  };

  const handleNativeCancel = (event) => {
    event.preventDefault();
    onClose?.();
  };

  const handleNativeClose = () => {
    const dialog = dialogRef.current;
    if (dialog) {
      dialog.returnValue = '';
    }
    if (isOpenRef.current) {
      onClose?.();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
      aria-labelledby={titleId}
      onCancel={handleNativeCancel}
      onClose={handleNativeClose}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      className={`examia-dialog p-0 m-auto border border-[#C58E9B]/55 rounded-[22px] sm:rounded-[24px] bg-[#FDF9FA] shadow-[0_24px_48px_-10px_rgba(74,31,48,0.30)] w-[calc(100dvw-1.5rem)] sm:w-[calc(100%-2rem)] ${maxWidth} overflow-hidden text-[#361522]`}
    >
      <div className="p-4 sm:p-6 pb-3.5 sm:pb-4 border-b border-[#C58E9B]/35 flex items-start justify-between gap-3 bg-[#642F43] shrink-0">
        <div className="min-w-0">
          <h3 id={titleId} className="text-base sm:text-lg font-serif font-bold text-[#FDF8FA] leading-snug">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs font-medium text-[#EBD6DC] mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="min-w-[40px] min-h-[40px] sm:min-w-[36px] sm:min-h-[36px] flex items-center justify-center rounded-xl text-[#EBD6DC] hover:text-[#FDF8FA] hover:bg-white/10 transition-colors shrink-0 -mr-1 -mt-0.5"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      <div className="p-4 sm:p-6 overflow-y-auto overscroll-contain text-[#361522] flex-1 min-h-0">
        {isOpen ? children : null}
      </div>
    </dialog>
  );
}

export default memo(Modal);
