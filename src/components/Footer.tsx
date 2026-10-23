import React from 'react';

interface FooterProps {
  onNavigate: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 text-xs py-12 mt-16">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <div className="font-bold text-slate-200 text-sm">
            SRM Institute of Science and Technology
          </div>
          <div className="text-slate-400 mt-0.5">
            Ramapuram Campus, Chennai · Department of Computer Science & Engineering
          </div>
          <div className="text-slate-500 font-mono mt-1 text-[11px]">
            Operating Systems Interactive Laboratory · 21CSC202J
          </div>
          <div className="text-slate-400 font-mono text-[10px] mt-1">
            Prepared by: Raj Shaw [RA2511003020926], Mahesh Shing KC [RA2511003020943], Goutham Y. [RA2511003020464]
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
          <button onClick={() => onNavigate('diagram')} className="hover:text-cyan-400 transition-colors">
            State Diagram
          </button>
          <button onClick={() => onNavigate('simulator')} className="hover:text-cyan-400 transition-colors">
            Live Simulator
          </button>
          <button onClick={() => onNavigate('anatomy')} className="hover:text-cyan-400 transition-colors">
            Process Anatomy
          </button>
          <button onClick={() => onNavigate('syscalls')} className="hover:text-cyan-400 transition-colors">
            Syscall Terminal
          </button>
          <button onClick={() => onNavigate('algorithms')} className="hover:text-cyan-400 transition-colors">
            Scheduling Lab
          </button>
          <button onClick={() => onNavigate('quiz')} className="hover:text-cyan-400 transition-colors">
            Knowledge Quiz
          </button>
          <a
            href="/os-process-lifecycle-srmist.zip"
            download="os-process-lifecycle-srmist.zip"
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Download ZIP
          </a>
        </div>

        <div className="text-slate-500 text-[11px] font-mono text-center md:text-right">
          © {new Date().getFullYear()} SRMIST Ramapuram. Academic Project.
        </div>
      </div>
    </footer>
  );
};
