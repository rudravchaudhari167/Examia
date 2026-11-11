import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, subtitle, children, maxWidth = "max-w-xl" }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#361522]/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className={`relative bg-[#FDF9FA] border border-[#C58E9B]/55 rounded-[24px] shadow-[0_24px_48px_-10px_rgba(74,31,48,0.30)] w-full ${maxWidth} z-10 overflow-hidden animate-fade-in`}>
        {/* Header */}
        <div className="p-6 pb-4 border-b border-[#C58E9B]/35 flex items-start justify-between bg-[#642F43]">
          <div>
            <h3 className="font-serif text-xl font-bold text-[#FDF8FA]">{title}</h3>
            {subtitle && <p className="text-xs text-[#EED7DF] mt-1">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-white/25 bg-white/12 hover:bg-white/22 flex items-center justify-center text-[#FDF8FA] hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto text-[#361522]">
          {children}
        </div>
      </div>
    </div>
  );
}

