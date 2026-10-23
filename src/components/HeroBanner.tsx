import React from 'react';
import { Play, BookOpen, Layers, Cpu, Download } from 'lucide-react';

interface HeroBannerProps {
  onStartSimulation: () => void;
  onExploreDiagram: () => void;
  onOpenSyscalls: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onStartSimulation,
  onExploreDiagram,
  onOpenSyscalls,
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 pt-8 pb-12">
      {/* Subtle background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* SRM Institute of Science and Technology Front Header Lockup */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800/60 mb-10">
          <div className="flex items-center gap-5">
            {/* SRM Ramapuram Logo Image Asset from user upload */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 p-1.5 rounded-2xl bg-white shadow-lg shadow-cyan-950/40 border border-slate-700/60 shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src="/public/assets/aistudio/image_21618878.png"
                alt="SRM Institute of Science and Technology Chennai Ramapuram"
                className="w-full h-full object-contain rounded-xl"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith('/assets/aistudio/image_21618878.png')) {
                    target.src = '/assets/aistudio/image_21618878.png';
                  }
                }}
              />
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider font-semibold text-amber-400">
                Department of Computer Science & Engineering
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                SRM Institute of Science and Technology
              </h2>
              <div className="text-xs sm:text-sm text-slate-400 font-medium">
                Ramapuram Campus, Chennai · Operating Systems Interactive Laboratory
              </div>
            </div>
          </div>

          <div className="text-left md:text-right text-xs text-slate-400 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800/80 w-full md:w-auto">
            <div className="font-semibold text-slate-200">Course: 21CSC202J · Operating Systems</div>
            <div>Process Scheduling & Lifecycle Simulation Unit</div>
            <div className="text-slate-500 font-mono mt-0.5">Faculty of Engineering & Technology</div>
            
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 font-mono text-[11px] space-y-0.5">
              <span className="text-cyan-400 font-semibold block uppercase tracking-wider text-[10px]">
                Prepared by:
              </span>
              <div className="text-slate-200 font-medium">
                Raj Shaw <span className="text-slate-400 font-normal">[RA2511003020926]</span>
              </div>
              <div className="text-slate-200 font-medium">
                Mahesh Shing KC <span className="text-slate-400 font-normal">[RA2511003020943]</span>
              </div>
              <div className="text-slate-200 font-medium">
                Goutham Y. <span className="text-slate-400 font-normal">[RA2511003020464]</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Headline & Dual Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-3 py-1 rounded-md">
              <span>Interactive Kernel Simulation Engine</span>
              <span aria-hidden="true">·</span>
              <span>POSIX & 5-State / 7-State Models</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15] text-balance">
              Operating System <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">Process Management</span> Lifecycle
            </h1>

            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Visualize how processes transition across states inside modern operating systems. Inspect the Process Control Block (PCB), simulate CPU scheduling algorithms in real-time, witness hardware context switching, and execute real POSIX process system calls.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onStartSimulation}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm rounded-lg shadow-md shadow-cyan-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Simulate Process Lifecycle</span>
              </button>
              <button
                onClick={onExploreDiagram}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white font-medium text-sm rounded-lg border border-slate-700 transition-colors"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>State Transition Map</span>
              </button>
              <button
                onClick={onOpenSyscalls}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white font-medium text-sm rounded-lg border border-slate-700 transition-colors"
              >
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>POSIX Syscall Shell</span>
              </button>
              <a
                href="/os-process-lifecycle-srmist.zip"
                download="os-process-lifecycle-srmist.zip"
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-sm rounded-lg border border-emerald-500/60 shadow-md shadow-emerald-950/40 transition-colors"
                title="Download full project source code as ZIP"
              >
                <Download className="w-4 h-4 text-emerald-200" />
                <span>Download Project ZIP</span>
              </a>
            </div>

            {/* Quick Feature Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/60 text-xs text-slate-400">
              <div>
                <span className="font-semibold text-slate-200 block">State Transitions</span>
                <span>New, Ready, Running, Waiting, Terminated</span>
              </div>
              <div>
                <span className="font-semibold text-slate-200 block">PCB & Memory</span>
                <span>Virtual Address Space & Registers</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="font-semibold text-slate-200 block">CPU Schedulers</span>
                <span>Round Robin, SJF, SRTF, FCFS, Priority</span>
              </div>
            </div>
          </div>

          {/* Visual Showcase: Blueprint Graphic */}
          <div className="lg:col-span-5 relative group">
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-2xl shadow-cyan-950/30">
              <img
                src="/src/assets/images/os_process_banner_1792575654696.jpg"
                alt="Operating System Process Execution Pipeline and State Lifecycle Architecture"
                className="w-full h-auto object-cover aspect-[16/10]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent flex flex-col justify-end p-5">
                <div className="text-xs font-mono text-cyan-300 font-medium">KERNEL ARCHITECTURE BLUEPRINT</div>
                <div className="text-sm font-bold text-white mt-0.5">CPU Core Execution Pipeline & Memory Hierarchy</div>
                <div className="text-xs text-slate-300 mt-1">
                  Ready Queue · Context Switching · Memory Map · L1 Cache · Physical DRAM
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
