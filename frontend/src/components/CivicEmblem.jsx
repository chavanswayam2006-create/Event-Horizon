import React from 'react';

export default function CivicEmblem({ className = "h-11", showText = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="w-11 h-11 bg-[#123B66] text-white flex items-center justify-center rounded-lg border border-[#c3c6d0]/50 relative overflow-hidden flex-shrink-0 shadow-sm">
        {/* Subtle saffron top bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#ffddb8]" />
        
        {/* Central Emblem SVG */}
        <svg viewBox="0 0 44 44" className="w-9 h-9" fill="none">
          <circle cx="22" cy="22" r="16" stroke="#F59E0B" strokeWidth="1.8" strokeDasharray="3 3" />
          <circle cx="22" cy="22" r="11" stroke="#FFFFFF" strokeWidth="1.8" />
          <circle cx="22" cy="22" r="4.5" fill="#168A55" />
          <path d="M22 11V14M22 30V33M11 22H14M30 22H33" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col select-none">
          <div className="flex items-baseline gap-1.5">
            <span className="font-headline-md text-headline-md font-bold tracking-tight text-[#002548]">
              EVENT HORIZON
            </span>
            <span className="font-label-sm text-label-sm uppercase text-[#235eac] font-bold tracking-wider px-1.5 py-0.5 bg-[#d6e3ff] rounded">
              RTI Routing
            </span>
          </div>
          <span className="font-body-sm text-body-sm text-[#43474f] -mt-0.5">
            Helping RTI applications reach the appropriate authority
          </span>
        </div>
      )}
    </div>
  );
}
