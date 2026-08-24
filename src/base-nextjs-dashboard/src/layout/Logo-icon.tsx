import React from 'react';

const LogoIcon: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Logo Graphic */}
      <div className="relative w-12 h-12 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
          <rect x="8" y="8" width="84" height="84" rx="22" fill="#465fff" />
          {/* Dashboard blocks */}
          <rect x="24" y="24" width="22" height="30" rx="5" fill="#ffffff" />
          <rect x="54" y="24" width="22" height="16" rx="5" fill="#ffffff" fillOpacity="0.6" />
          <rect x="24" y="62" width="22" height="14" rx="5" fill="#ffffff" fillOpacity="0.6" />
          <rect x="54" y="48" width="22" height="28" rx="5" fill="#ffffff" />
        </svg>
      </div>
    </div>
  );
};

export default LogoIcon;
