import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  accentColor = "lavender" // 'lavender' | 'sage' | 'peach' | 'rose'
}) {
  const getAccentStyles = () => {
    switch (accentColor) {
      case 'sage':
        return {
          bg: 'bg-[#FDF9FA]',
          iconBg: 'bg-[#642F43]',
          iconColor: 'text-[#FDF8FA]',
          iconBorder: 'border-[#4A1F30]',
          borderColor: 'border-[#C58E9B]/45'
        };
      case 'peach':
        return {
          bg: 'bg-[#FAF0F3]',
          iconBg: 'bg-[#EED8DF]',
          iconColor: 'text-[#642F43]',
          iconBorder: 'border-[#C58E9B]/60',
          borderColor: 'border-[#C58E9B]/55'
        };
      case 'rose':
        return {
          bg: 'bg-[#F8EAEF]',
          iconBg: 'bg-[#4A1F30]',
          iconColor: 'text-[#FDF8FA]',
          iconBorder: 'border-[#361522]',
          borderColor: 'border-[#642F43]/30'
        };
      case 'lavender':
      default:
        return {
          bg: 'bg-[#FDF9FA]',
          iconBg: 'bg-[#C58E9B]',
          iconColor: 'text-[#361522]',
          iconBorder: 'border-[#642F43]/25',
          borderColor: 'border-[#C58E9B]/50'
        };
    }
  };

  const styles = getAccentStyles();
  const isTextValue = typeof value === 'string' && value.length > 3;

  return (
    <div className={`h-full px-5 py-5 rounded-[20px] ${styles.bg} border ${styles.borderColor} shadow-[inset_0_1px_0_rgba(255,255,255,0.85),0_10px_24px_-6px_rgba(100,47,67,0.10)] hover:-translate-y-0.5 hover:border-[#C58E9B]/85 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_16px_30px_-6px_rgba(100,47,67,0.16)] transition-all duration-200 flex flex-col items-center justify-between text-center`}>
      <div className="w-full flex flex-col items-center">
        <div className={`w-10 h-10 rounded-2xl ${styles.iconBg} ${styles.iconColor} border ${styles.iconBorder} shadow-[0_4px_10px_-2px_rgba(100,47,67,0.18)] flex items-center justify-center mb-3`}>
          <Icon className="w-4 h-4" />
        </div>

        <p className="text-[11px] font-semibold text-[#6F4253] uppercase tracking-[0.08em] leading-snug">
          {title}
        </p>

        <div className="mt-1.5 min-h-[36px] flex items-center justify-center">
          <h3 className={`font-serif font-bold text-[#642F43] tracking-tight leading-none ${isTextValue ? 'text-2xl' : 'text-3xl'}`}>
            {value}
          </h3>
        </div>
      </div>

      <p className="w-full text-xs font-medium text-[#6F4253] leading-snug mt-3 pt-2.5 border-t border-[#C58E9B]/28 text-center">
        {subtitle}
      </p>
    </div>
  );
}

