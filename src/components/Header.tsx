import React from 'react';

interface HeaderProps {
  onNavigate: (sectionId: string) => void;
  activeSection: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, activeSection }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-3.5">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onNavigate('home');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-cyan-400 transition-colors"
        >
          SRM IST Ramapuram · OS Lab
        </a>

        {/* Zone 2: Nav links (Single line, whitespace-nowrap) */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            onClick={() => onNavigate('diagram')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'diagram' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'
            }`}
          >
            State Diagram
          </button>
          <button
            onClick={() => onNavigate('simulator')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'simulator' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'
            }`}
          >
            Live Simulator
          </button>
          <button
            onClick={() => onNavigate('anatomy')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'anatomy' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'
            }`}
          >
            Process Anatomy
          </button>
          <button
            onClick={() => onNavigate('syscalls')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'syscalls' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'
            }`}
          >
            Syscall Terminal
          </button>
          <button
            onClick={() => onNavigate('algorithms')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'algorithms' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'
            }`}
          >
            Scheduling Lab
          </button>
          <button
            onClick={() => onNavigate('quiz')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeSection === 'quiz' ? 'text-cyan-400 border-b-2 border-cyan-400' : 'hover:text-white'
            }`}
          >
            Knowledge Quiz
          </button>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('simulator')}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            Launch Simulator
          </button>
        </div>
      </div>
    </header>
  );
};
