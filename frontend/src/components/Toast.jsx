import React, { memo } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

function Toast({ message, type = "success", onClose }) {
  if (!message) return null;

  const getToastVisuals = () => {
    switch (type) {
      case 'error':
        return {
          icon: AlertCircle,
          border: 'border-[#642F43]',
          bg: 'bg-[#F8EAEF]',
          iconColor: 'text-[#642F43]'
        };
      case 'info':
        return {
          icon: Info,
          border: 'border-[#C58E9B]',
          bg: 'bg-[#FAF0F3]',
          iconColor: 'text-[#642F43]'
        };
      case 'success':
      default:
        return {
          icon: CheckCircle2,
          border: 'border-[#8F4B63]',
          bg: 'bg-[#FDF9FA]',
          iconColor: 'text-[#642F43]'
        };
    }
  };

  const visuals = getToastVisuals();
  const Icon = visuals.icon;

  return (
    <div
      className="no-print fixed inset-x-3 sm:inset-x-auto sm:right-6 z-50 animate-fade-in"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 ${visuals.border} ${visuals.bg} shadow-[0_14px_28px_-6px_rgba(74,31,48,0.22)] w-full sm:w-auto sm:max-w-md`}>
        <Icon className={`w-5 h-5 ${visuals.iconColor} shrink-0`} />
        <p className="text-xs font-semibold text-[#361522] flex-1">{message}</p>
        <button
          onClick={onClose}
          className="text-[#6F4253] hover:text-[#642F43] p-1 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default memo(Toast);

