import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "" }) => {
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

      {/* Text. No `font-sans` here: `--font-*: initial` in globals.css wipes
          Tailwind's default families and only `--font-serif` is defined, so the
          class emitted nothing and the wordmark has always rendered in the panel
          serif. Removing it makes the code say what actually happens. Restoring a
          sans wordmark means defining a `--font-sans` token and loading a face. */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold leading-none tracking-tight text-slate-900 dark:text-white">
          Base
        </h1>
        <div className="h-0.5 w-full bg-brand-500 my-0.5"></div>
        <span className="text-[10px] font-bold tracking-[0.2em] text-brand-500 dark:text-brand-400 uppercase">
          DASHBOARD
        </span>
      </div>
    </div>
  );
};

export default Logo;
