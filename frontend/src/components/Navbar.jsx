import React from 'react';
import CivicEmblem from './CivicEmblem';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenGuidance,
  onOpenAudit,
  selectedLang,
  setSelectedLang,
  fontSizeModifier,
  setFontSizeModifier,
  historyCount = 0
}) {
  const navItems = [
    { id: 'home-analyzer', label: 'Home / Analyzer' },
    { id: 'star-map', label: 'Star Map' },
    { id: 'escape-velocity-engine', label: 'Escape Velocity Engine' },
    { id: 'how-it-works', label: 'How It Works' },
  ];

  return (
    <header className="fixed top-0 w-full z-50 bg-[#ffffff] border-b border-[#c3c6d0] shadow-[0_2px_8px_rgba(18,59,102,0.06)]">
      {/* Top Statutory Notification Ribbon */}
      <div className="bg-[#002548] text-[#ffffff] border-b border-[#c3c6d0]/30">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-9 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#ffddb8]" />
            <span className="font-label-sm text-label-sm tracking-wider uppercase text-white/90 truncate">
              Government Information Assistance Portal • Citizen &amp; Public Officer Desk
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-1.5 font-label-sm text-label-sm">
              <button
                type="button"
                onClick={() => setSelectedLang('EN')}
                className={`transition-colors cursor-pointer ${
                  selectedLang === 'EN' ? 'text-white font-bold underline' : 'text-white/80 hover:text-white'
                }`}
              >
                English
              </button>
              <span className="text-white/40">|</span>
              <button
                type="button"
                onClick={() => setSelectedLang('MR')}
                className={`transition-colors cursor-pointer ${
                  selectedLang === 'MR' ? 'text-white font-bold underline' : 'text-white/80 hover:text-white'
                }`}
              >
                मराठी
              </button>
              <span className="text-white/40">|</span>
              <button
                type="button"
                onClick={() => setSelectedLang('HI')}
                className={`transition-colors cursor-pointer ${
                  selectedLang === 'HI' ? 'text-white font-bold underline' : 'text-white/80 hover:text-white'
                }`}
              >
                हिंदी
              </button>
            </div>

            {/* Accessibility Font Size */}
            <div className="hidden sm:flex items-center gap-1 pl-3 border-l border-[#c3c6d0]/30 font-label-sm text-label-sm">
              <button
                type="button"
                onClick={() => setFontSizeModifier('sm')}
                aria-label="Decrease Font Size"
                className={`px-1.5 py-0.5 rounded ${fontSizeModifier === 'sm' ? 'bg-white/20 font-bold' : 'text-white/80 hover:text-white'}`}
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSizeModifier('base')}
                aria-label="Standard Font Size"
                className={`px-1.5 py-0.5 rounded ${fontSizeModifier === 'base' ? 'bg-white/20 font-bold' : 'text-white/80 hover:text-white'}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSizeModifier('lg')}
                aria-label="Increase Font Size"
                className={`px-1.5 py-0.5 rounded ${fontSizeModifier === 'lg' ? 'bg-white/20 font-bold' : 'text-white/80 hover:text-white'}`}
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Masthead Navigation Bar */}
      <div className="h-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('home-analyzer')}
          className="text-left focus:outline-none"
        >
          <CivicEmblem />
        </button>

        {/* Primary Desktop Nav */}
        <nav className="hidden xl:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 font-label-md text-label-md transition-colors rounded ${
                  isActive
                    ? 'bg-[#e9edff] text-[#002548] font-bold shadow-xs'
                    : 'text-[#43474f] hover:text-[#121b2e] hover:bg-[#f1f3ff]'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={onOpenGuidance}
            className="px-3 py-1.5 font-label-md text-label-md text-[#43474f] hover:text-[#121b2e] hover:bg-[#f1f3ff] rounded flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">menu_book</span>
            <span>RTI Guidance</span>
          </button>

          <button
            type="button"
            onClick={onOpenAudit}
            className="px-3 py-1.5 font-label-md text-label-md text-[#43474f] hover:text-[#121b2e] hover:bg-[#f1f3ff] rounded flex items-center gap-1 relative"
          >
            <span className="material-symbols-outlined text-[16px]">history</span>
            <span>Audit &amp; History</span>
            {historyCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#235eac] text-white text-[10px] font-bold rounded-full">
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Actions Cluster */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('home-analyzer');
              const el = document.getElementById('analyzer-workbench');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="relative inline-flex items-center px-4 py-2 bg-[#123b66] hover:bg-[#002548] text-white font-label-md text-label-md rounded shadow-xs border border-[#c3c6d0]/40 transition-colors overflow-hidden group"
          >
            <span className="w-1.5 h-full bg-[#ffddb8] absolute left-0 top-0" />
            <span className="pl-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">bolt</span>
              <span>Analyze RTI</span>
            </span>
          </button>

          {/* Quick Mobile Menu Button */}
          <div className="xl:hidden flex items-center gap-1">
            <button
              type="button"
              onClick={onOpenGuidance}
              title="RTI Guidance"
              className="p-2 rounded-lg bg-[#f1f3ff] text-[#002548] hover:bg-[#e9edff]"
            >
              <span className="material-symbols-outlined text-[20px]">menu_book</span>
            </button>
            <button
              type="button"
              onClick={onOpenAudit}
              title="Audit & History"
              className="p-2 rounded-lg bg-[#f1f3ff] text-[#002548] hover:bg-[#e9edff]"
            >
              <span className="material-symbols-outlined text-[20px]">history</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Scroller */}
      <div className="xl:hidden border-t border-[#c3c6d0]/30 bg-[#f9f9ff] px-4 py-2 flex items-center gap-2 overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1 font-label-sm text-label-sm whitespace-nowrap rounded ${
                isActive
                  ? 'bg-[#123b66] text-white font-bold'
                  : 'bg-white border border-[#c3c6d0] text-[#43474f]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
