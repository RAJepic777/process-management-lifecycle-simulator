import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ArrowRight, Info, CheckCircle2, AlertTriangle, Layers, Cpu } from 'lucide-react';
import { ProcessState } from '../types/os';

interface TransitionAnimation {
  from: ProcessState;
  to: ProcessState;
  label: string;
  progress: number; // 0 to 1
  active: boolean;
}

interface StateInfo {
  title: string;
  scheduler: string;
  location: string;
  description: string;
  osOperations: string[];
  pcbStatus: string;
  syscalls: string[];
}

const STATE_DETAILS: Record<ProcessState, StateInfo> = {
  NEW: {
    title: 'New (Created) State',
    scheduler: 'Long-Term Scheduler (Job Scheduler)',
    location: 'Secondary Storage / Initial Kernel Memory Allocation',
    description: 'The process is in the stage of being created. The OS has received an instruction or system call (like fork() or CreateProcess()) to construct a new execution context.',
    osOperations: [
      'Kernel assigns a unique Process Identifier (PID)',
      'Allocates Process Control Block (PCB) in protected kernel space',
      'Defines initial memory map: Text (code), Data (.data, .bss), Heap, and User Stack',
      'Initializes Program Counter (PC) to the entry point address (e.g., main())',
      'Initializes default file descriptors (stdin: 0, stdout: 1, stderr: 2)',
    ],
    pcbStatus: 'Allocated, State = NEW, Registers initialized to default values.',
    syscalls: ['fork()', 'vfork()', 'CreateProcess()', 'clone()'],
  },
  READY: {
    title: 'Ready State',
    scheduler: 'Short-Term Scheduler (CPU Dispatcher)',
    location: 'Main Memory (RAM) — Ready Queue',
    description: 'The process is loaded in RAM with all required resources and is waiting in the Ready Queue to be assigned a CPU core by the Short-Term Scheduler.',
    osOperations: [
      'Placed into kernel Ready Queue (managed via FIFO, Priority heap, or Multilevel Feedback Queues)',
      'Awaits CPU time slice according to active scheduling algorithm (e.g. Round Robin, SJF, Priority)',
      'Short-term scheduler performs context switch to dispatch this process when CPU core becomes free',
    ],
    pcbStatus: 'State = READY. Saved CPU registers ready to be restored onto hardware registers.',
    syscalls: ['sched_yield()', 'nice()', 'setpriority()'],
  },
  RUNNING: {
    title: 'Running State',
    scheduler: 'Executing directly on Hardware CPU Core',
    location: 'CPU Registers + Cache (L1/L2) + RAM',
    description: 'The process is currently occupying a CPU core and executing instructions. The hardware Program Counter is incrementing, registers are updating, and the ALU is computing.',
    osOperations: [
      'CPU executes instructions in User Mode (Ring 3)',
      'Hardware timer interrupt monitors time quantum expiration',
      'Process may issue System Calls (Ring 0 trap) for I/O, memory allocation, or inter-process communication',
      'May be preempted if a higher-priority process arrives or quantum expires',
    ],
    pcbStatus: 'State = RUNNING. Dynamic registers (RAX, RBX, RSP, PC) updating on CPU hardware.',
    syscalls: ['All compute instructions', 'write()', 'read()', 'sleep()', 'malloc()'],
  },
  WAITING: {
    title: 'Waiting (Blocked) State',
    scheduler: 'Medium-Term Scheduler & Device Drivers',
    location: 'Main Memory (RAM) — Device / Event Wait Queue',
    description: 'The process cannot continue execution until some external event occurs, such as disk read, network packet arrival, keyboard input, or child process exit.',
    osOperations: [
      'Process releases CPU to prevent CPU idling during slow peripheral operations',
      'Moved from Ready Queue into appropriate Device Queue (e.g., Disk Request Queue)',
      'Hardware interrupt controller signals CPU when requested I/O is complete',
      'Device driver interrupt service routine (ISR) moves process back to Ready Queue',
    ],
    pcbStatus: 'State = WAITING. CPU time accumulator paused. I/O buffer descriptors attached.',
    syscalls: ['read()', 'write()', 'select()', 'wait()', 'waitpid()', 'nanosleep()'],
  },
  TERMINATED: {
    title: 'Terminated (Exit / Zombie) State',
    scheduler: 'Long-Term Scheduler / Process Cleanup Daemon',
    location: 'Kernel Process Table (until reaped by parent)',
    description: 'The process has completed execution via exit() or was forcibly killed by an unhandled signal (SIGKILL, SIGSEGV). Its resources are being released.',
    osOperations: [
      'Kernel closes all open file descriptors and frees virtual memory pages (heap, stack, data)',
      'Saves exit status code in PCB (e.g., 0 for success, non-zero for error)',
      'Enters "Zombie" state: memory is freed, but PCB remains so parent can read exit code via wait()',
      'Once parent calls wait(), kernel completely deallocates PCB and reclaims PID',
      'If parent terminated earlier without waiting, PID 1 (init/systemd) adopts the orphan process',
    ],
    pcbStatus: 'State = TERMINATED / ZOMBIE. Holds exit status until reaped by parent wait().',
    syscalls: ['exit()', '_exit()', 'abort()', 'kill(pid, SIGKILL)'],
  },
  READY_SUSPENDED: {
    title: 'Ready Suspended State (7-State Model)',
    scheduler: 'Medium-Term Scheduler (Swapper)',
    location: 'Secondary Storage (Swap Partition / Pagefile)',
    description: 'The process is ready to execute, but has been swapped out from main memory to secondary storage due to severe RAM pressure (degree of multiprogramming control).',
    osOperations: [
      'Medium-term scheduler swaps process virtual pages from RAM to swap disk',
      'Frees physical page frames for active high-priority workloads',
      'Swapped back into RAM (Ready state) once memory becomes available or priority elevates',
    ],
    pcbStatus: 'State = READY_SUSPENDED. Page table entries marked as swapped to disk.',
    syscalls: ['swapon()', 'madvise()', 'kswapd daemon'],
  },
  BLOCKED_SUSPENDED: {
    title: 'Blocked Suspended State (7-State Model)',
    scheduler: 'Medium-Term Scheduler',
    location: 'Secondary Storage (Swap Space)',
    description: 'The process is waiting for an I/O event AND has also been swapped out of physical memory to secondary storage.',
    osOperations: [
      'When the requested event or I/O completes while still swapped, moves to Ready Suspended',
      'Double wait condition: waiting for both physical memory allocation and event occurrence',
    ],
    pcbStatus: 'State = BLOCKED_SUSPENDED. Swapped to disk while attached to device queue.',
    syscalls: ['Virtual Memory Manager paging daemon'],
  },
};

export const StateDiagram: React.FC = () => {
  const [isSevenState, setIsSevenState] = useState<boolean>(false);
  const [selectedState, setSelectedState] = useState<ProcessState>('RUNNING');
  const [activeProcessState, setActiveProcessState] = useState<ProcessState>('NEW');
  const [activeTransition, setActiveTransition] = useState<string | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(0);
  const [logs, setLogs] = useState<{ id: string; time: string; text: string }[]>([
    { id: '1', time: '00:00:01', text: 'Kernel initialized Process Lifecycle State Machine.' },
    { id: '2', time: '00:00:02', text: 'Ready Queue and Device Wait Queues allocated in Kernel Memory.' },
  ]);

  const addLog = (text: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs((prev) => [{ id: Math.random().toString(), time, text }, ...prev.slice(0, 14)]);
  };

  // Manual Transition Triggers
  const triggerTransition = (from: ProcessState, to: ProcessState, label: string, logMsg: string) => {
    setActiveTransition(label);
    addLog(`[Transition: ${from} → ${to}] ${logMsg}`);
    setTimeout(() => {
      setActiveProcessState(to);
      setSelectedState(to);
      setActiveTransition(null);
    }, 600);
  };

  // Auto Walkthrough Steps
  const DEMO_STEPS = [
    {
      from: 'NEW' as ProcessState,
      to: 'READY' as ProcessState,
      label: 'Admit (fork completed)',
      msg: 'Long-term scheduler admits newly created process into Ready Queue.',
    },
    {
      from: 'READY' as ProcessState,
      to: 'RUNNING' as ProcessState,
      label: 'Dispatch (Short-term scheduler)',
      msg: 'Dispatcher performs context switch, loads registers, process runs on CPU Core 0.',
    },
    {
      from: 'RUNNING' as ProcessState,
      to: 'WAITING' as ProcessState,
      label: 'I/O or Event Wait (read() syscall)',
      msg: 'Process issues read() disk I/O syscall. Releases CPU and enters Device Wait Queue.',
    },
    {
      from: 'WAITING' as ProcessState,
      to: 'READY' as ProcessState,
      label: 'I/O Completion Interrupt',
      msg: 'Hardware interrupt: Disk data loaded into buffer cache. Process moved back to Ready Queue.',
    },
    {
      from: 'READY' as ProcessState,
      to: 'RUNNING' as ProcessState,
      label: 'Dispatch (Resumed)',
      msg: 'Scheduler picks process again. Context switch restores registers and program counter.',
    },
    {
      from: 'RUNNING' as ProcessState,
      to: 'READY' as ProcessState,
      label: 'Time Quantum Expired / Interrupt',
      msg: 'Timer interrupt fires (Quantum 4ms expired). Process preempted back to Ready Queue.',
    },
    {
      from: 'READY' as ProcessState,
      to: 'RUNNING' as ProcessState,
      label: 'Dispatch (Final Burst)',
      msg: 'Process dispatches for its final CPU burst.',
    },
    {
      from: 'RUNNING' as ProcessState,
      to: 'TERMINATED' as ProcessState,
      label: 'Exit (exit(0) syscall)',
      msg: 'Process calls exit(0). Virtual memory and file descriptors freed. Enters Zombie state awaiting parent reap.',
    },
  ];

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isAutoPlaying) {
      timer = setTimeout(() => {
        const step = DEMO_STEPS[demoStep];
        triggerTransition(step.from, step.to, step.label, step.msg);
        const nextStep = (demoStep + 1) % DEMO_STEPS.length;
        setDemoStep(nextStep);
      }, 2400);
    }
    return () => clearTimeout(timer);
  }, [isAutoPlaying, demoStep]);

  const resetLifecycle = () => {
    setIsAutoPlaying(false);
    setDemoStep(0);
    setActiveProcessState('NEW');
    setSelectedState('NEW');
    setActiveTransition(null);
    addLog('Reset state machine to initial NEW state.');
  };

  const details = STATE_DETAILS[selectedState];

  return (
    <section id="diagram" className="max-w-7xl mx-auto px-6 py-12 scroll-mt-20">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            Interactive State Machine Architecture
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Operating System Process State Transitions
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Click any state node to examine memory and PCB changes, or trigger real-world transitions to see process tokens traverse the OS state lifecycle.
          </p>
        </div>

        {/* Model Switcher & Auto Controls */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-lg">
            <button
              onClick={() => setIsSevenState(false)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                !isSevenState ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              5-State Standard
            </button>
            <button
              onClick={() => setIsSevenState(true)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                isSevenState ? 'bg-cyan-500 text-slate-950 font-semibold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              7-State (with Swapping)
            </button>
          </div>

          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              isAutoPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-cyan-950 text-cyan-300 border-cyan-800 hover:bg-cyan-900'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isAutoPlaying ? 'Pause Walkthrough' : 'Auto Walkthrough'}</span>
          </button>

          <button
            onClick={resetLifecycle}
            title="Reset to New State"
            className="p-1.5 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Stage (Left 7 cols) + State & Kernel Inspector (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        {/* Left Column: Visual SVG State Diagram Stage */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative bg-slate-900/90 rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl overflow-hidden min-h-[460px] flex flex-col justify-between">
            {/* SVG Interactive Canvas */}
            <div className="w-full h-full relative">
              <svg viewBox="0 0 760 440" className="w-full h-full select-none">
                <defs>
                  {/* Arrowhead markers */}
                  <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
                  </marker>
                  <marker id="arrow-slate" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
                  </marker>
                  <marker id="arrow-active" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                  </marker>

                  {/* Gradient filters */}
                  <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Transition Paths (Bezier Curves) */}
                
                {/* 1. NEW -> READY (Admission) */}
                <path
                  d="M 120 120 L 260 120"
                  stroke={activeTransition?.includes('Admit') ? '#38bdf8' : '#475569'}
                  strokeWidth={activeTransition?.includes('Admit') ? '3' : '2'}
                  strokeDasharray={activeTransition?.includes('Admit') ? '6 4' : 'none'}
                  markerEnd="url(#arrow-cyan)"
                  className="transition-all duration-300"
                />
                <text x="190" y="108" fill="#94a3b8" fontSize="11" textAnchor="middle" className="font-mono">
                  Admit (fork)
                </text>

                {/* 2. READY -> RUNNING (Dispatch) */}
                <path
                  d="M 360 105 L 500 105"
                  stroke={activeTransition?.includes('Dispatch') ? '#38bdf8' : '#475569'}
                  strokeWidth={activeTransition?.includes('Dispatch') ? '3' : '2'}
                  strokeDasharray={activeTransition?.includes('Dispatch') ? '6 4' : 'none'}
                  markerEnd="url(#arrow-cyan)"
                  className="transition-all duration-300"
                />
                <text x="430" y="95" fill="#94a3b8" fontSize="11" textAnchor="middle" className="font-mono">
                  Dispatch (Schedule)
                </text>

                {/* 3. RUNNING -> READY (Interrupt / Timeout curve up) */}
                <path
                  d="M 500 135 C 445 165, 415 165, 360 135"
                  fill="none"
                  stroke={activeTransition?.includes('Quantum') || activeTransition?.includes('Interrupt') ? '#f59e0b' : '#475569'}
                  strokeWidth={activeTransition?.includes('Quantum') ? '3' : '2'}
                  strokeDasharray={activeTransition?.includes('Quantum') ? '6 4' : 'none'}
                  markerEnd="url(#arrow-cyan)"
                  className="transition-all duration-300"
                />
                <text x="430" y="180" fill="#94a3b8" fontSize="10" textAnchor="middle" className="font-mono">
                  Interrupt / Quantum Expire
                </text>

                {/* 4. RUNNING -> WAITING (I/O or event wait) */}
                <path
                  d="M 545 160 L 415 285"
                  stroke={activeTransition?.includes('I/O or Event Wait') ? '#38bdf8' : '#475569'}
                  strokeWidth={activeTransition?.includes('I/O or Event Wait') ? '3' : '2'}
                  strokeDasharray={activeTransition?.includes('I/O or Event Wait') ? '6 4' : 'none'}
                  markerEnd="url(#arrow-cyan)"
                  className="transition-all duration-300"
                />
                <text x="500" y="235" fill="#94a3b8" fontSize="10" textAnchor="middle" className="font-mono">
                  I/O or Event Wait
                </text>

                {/* 5. WAITING -> READY (I/O Completion) */}
                <path
                  d="M 335 285 L 310 160"
                  stroke={activeTransition?.includes('I/O Completion') ? '#10b981' : '#475569'}
                  strokeWidth={activeTransition?.includes('I/O Completion') ? '3' : '2'}
                  strokeDasharray={activeTransition?.includes('I/O Completion') ? '6 4' : 'none'}
                  markerEnd="url(#arrow-cyan)"
                  className="transition-all duration-300"
                />
                <text x="290" y="235" fill="#94a3b8" fontSize="10" textAnchor="middle" className="font-mono">
                  I/O Complete
                </text>

                {/* 6. RUNNING -> TERMINATED (Exit / Kill) */}
                <path
                  d="M 600 120 L 660 120"
                  stroke={activeTransition?.includes('Exit') ? '#ef4444' : '#475569'}
                  strokeWidth={activeTransition?.includes('Exit') ? '3' : '2'}
                  strokeDasharray={activeTransition?.includes('Exit') ? '6 4' : 'none'}
                  markerEnd="url(#arrow-cyan)"
                  className="transition-all duration-300"
                />
                <text x="630" y="108" fill="#94a3b8" fontSize="10" textAnchor="middle" className="font-mono">
                  exit() / kill
                </text>

                {/* 7-State Extensions (if enabled) */}
                {isSevenState && (
                  <>
                    {/* WAITING -> BLOCKED_SUSPENDED */}
                    <path
                      d="M 360 350 L 360 395"
                      stroke="#64748b"
                      strokeWidth="2"
                      markerEnd="url(#arrow-cyan)"
                    />
                    <text x="400" y="375" fill="#94a3b8" fontSize="9" textAnchor="middle" className="font-mono">
                      Suspend (swap)
                    </text>

                    {/* BLOCKED_SUSPENDED -> READY_SUSPENDED */}
                    <path
                      d="M 310 405 L 180 405"
                      stroke="#64748b"
                      strokeWidth="2"
                      markerEnd="url(#arrow-cyan)"
                    />
                    <text x="245" y="395" fill="#94a3b8" fontSize="9" textAnchor="middle" className="font-mono">
                      Event Occurred
                    </text>

                    {/* READY_SUSPENDED -> READY (Activate / Swap In) */}
                    <path
                      d="M 140 375 L 280 160"
                      stroke="#64748b"
                      strokeWidth="2"
                      markerEnd="url(#arrow-cyan)"
                    />
                    <text x="180" y="270" fill="#94a3b8" fontSize="9" textAnchor="middle" className="font-mono">
                      Activate (swap in)
                    </text>
                  </>
                )}

                {/* NODES */}

                {/* 1. NEW Node */}
                <g
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setSelectedState('NEW')}
                >
                  <rect
                    x="30"
                    y="90"
                    width="90"
                    height="60"
                    rx="12"
                    fill={activeProcessState === 'NEW' ? '#0284c7' : '#1e293b'}
                    stroke={selectedState === 'NEW' ? '#38bdf8' : '#334155'}
                    strokeWidth={selectedState === 'NEW' ? '2.5' : '1.5'}
                    filter={activeProcessState === 'NEW' ? 'url(#glow)' : 'none'}
                  />
                  <text x="75" y="120" fill="#ffffff" fontWeight="bold" fontSize="13" textAnchor="middle">
                    NEW
                  </text>
                  <text x="75" y="136" fill={activeProcessState === 'NEW' ? '#e0f2fe' : '#94a3b8'} fontSize="9" textAnchor="middle">
                    Creation
                  </text>
                </g>

                {/* 2. READY Node */}
                <g
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setSelectedState('READY')}
                >
                  <rect
                    x="260"
                    y="90"
                    width="100"
                    height="60"
                    rx="12"
                    fill={activeProcessState === 'READY' ? '#0d9488' : '#1e293b'}
                    stroke={selectedState === 'READY' ? '#2dd4bf' : '#334155'}
                    strokeWidth={selectedState === 'READY' ? '2.5' : '1.5'}
                    filter={activeProcessState === 'READY' ? 'url(#glow)' : 'none'}
                  />
                  <text x="310" y="120" fill="#ffffff" fontWeight="bold" fontSize="13" textAnchor="middle">
                    READY
                  </text>
                  <text x="310" y="136" fill={activeProcessState === 'READY' ? '#ccfbf1' : '#94a3b8'} fontSize="9" textAnchor="middle">
                    Ready Queue
                  </text>
                </g>

                {/* 3. RUNNING Node (Center Hero) */}
                <g
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setSelectedState('RUNNING')}
                >
                  <rect
                    x="500"
                    y="85"
                    width="100"
                    height="70"
                    rx="12"
                    fill={activeProcessState === 'RUNNING' ? '#2563eb' : '#1e293b'}
                    stroke={selectedState === 'RUNNING' ? '#60a5fa' : '#334155'}
                    strokeWidth={selectedState === 'RUNNING' ? '2.5' : '1.5'}
                    filter={activeProcessState === 'RUNNING' ? 'url(#glow)' : 'none'}
                  />
                  <text x="550" y="118" fill="#ffffff" fontWeight="bold" fontSize="14" textAnchor="middle">
                    RUNNING
                  </text>
                  <text x="550" y="136" fill={activeProcessState === 'RUNNING' ? '#dbeafe' : '#94a3b8'} fontSize="9" textAnchor="middle">
                    CPU Executing
                  </text>
                </g>

                {/* 4. WAITING / BLOCKED Node */}
                <g
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setSelectedState('WAITING')}
                >
                  <rect
                    x="330"
                    y="285"
                    width="110"
                    height="65"
                    rx="12"
                    fill={activeProcessState === 'WAITING' ? '#d97706' : '#1e293b'}
                    stroke={selectedState === 'WAITING' ? '#fbbf24' : '#334155'}
                    strokeWidth={selectedState === 'WAITING' ? '2.5' : '1.5'}
                    filter={activeProcessState === 'WAITING' ? 'url(#glow)' : 'none'}
                  />
                  <text x="385" y="316" fill="#ffffff" fontWeight="bold" fontSize="13" textAnchor="middle">
                    WAITING
                  </text>
                  <text x="385" y="332" fill={activeProcessState === 'WAITING' ? '#fef3c7' : '#94a3b8'} fontSize="9" textAnchor="middle">
                    I/O / Blocked
                  </text>
                </g>

                {/* 5. TERMINATED Node */}
                <g
                  className="cursor-pointer transition-transform hover:scale-105"
                  onClick={() => setSelectedState('TERMINATED')}
                >
                  <rect
                    x="660"
                    y="90"
                    width="90"
                    height="60"
                    rx="12"
                    fill={activeProcessState === 'TERMINATED' ? '#dc2626' : '#1e293b'}
                    stroke={selectedState === 'TERMINATED' ? '#f87171' : '#334155'}
                    strokeWidth={selectedState === 'TERMINATED' ? '2.5' : '1.5'}
                    filter={activeProcessState === 'TERMINATED' ? 'url(#glow)' : 'none'}
                  />
                  <text x="705" y="120" fill="#ffffff" fontWeight="bold" fontSize="12" textAnchor="middle">
                    TERMINATED
                  </text>
                  <text x="705" y="136" fill={activeProcessState === 'TERMINATED' ? '#fee2e2' : '#94a3b8'} fontSize="9" textAnchor="middle">
                    Zombie / Exit
                  </text>
                </g>

                {/* 7-State Nodes */}
                {isSevenState && (
                  <>
                    <g
                      className="cursor-pointer"
                      onClick={() => setSelectedState('BLOCKED_SUSPENDED')}
                    >
                      <rect
                        x="310"
                        y="395"
                        width="140"
                        height="40"
                        rx="8"
                        fill={selectedState === 'BLOCKED_SUSPENDED' ? '#475569' : '#0f172a'}
                        stroke="#64748b"
                        strokeDasharray="4 2"
                      />
                      <text x="380" y="420" fill="#e2e8f0" fontSize="10" textAnchor="middle">
                        Blocked Suspended (Disk)
                      </text>
                    </g>

                    <g
                      className="cursor-pointer"
                      onClick={() => setSelectedState('READY_SUSPENDED')}
                    >
                      <rect
                        x="70"
                        y="395"
                        width="130"
                        height="40"
                        rx="8"
                        fill={selectedState === 'READY_SUSPENDED' ? '#475569' : '#0f172a'}
                        stroke="#64748b"
                        strokeDasharray="4 2"
                      />
                      <text x="135" y="420" fill="#e2e8f0" fontSize="10" textAnchor="middle">
                        Ready Suspended (Disk)
                      </text>
                    </g>
                  </>
                )}
              </svg>
            </div>

            {/* Manual Step Controls Bar */}
            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-300 mb-2">
                Manual Transition Triggers (Observe Token Movement):
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() =>
                    triggerTransition('NEW', 'READY', 'Admit (fork)', 'Long-term scheduler admits process to Ready queue.')
                  }
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
                >
                  1. Admit (fork)
                </button>
                <button
                  onClick={() =>
                    triggerTransition('READY', 'RUNNING', 'Dispatch (Schedule)', 'Dispatcher assigns CPU to Ready process.')
                  }
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
                >
                  2. Dispatch
                </button>
                <button
                  onClick={() =>
                    triggerTransition(
                      'RUNNING',
                      'WAITING',
                      'I/O or Event Wait (read() syscall)',
                      'Process issued I/O system call, yielding CPU.'
                    )
                  }
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
                >
                  3. I/O Block
                </button>
                <button
                  onClick={() =>
                    triggerTransition(
                      'WAITING',
                      'READY',
                      'I/O Completion Interrupt',
                      'Hardware interrupt moves process back to Ready Queue.'
                    )
                  }
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
                >
                  4. I/O Complete
                </button>
                <button
                  onClick={() =>
                    triggerTransition(
                      'RUNNING',
                      'READY',
                      'Time Quantum Expired / Interrupt',
                      'Timer interrupt preempts running process back to Ready queue.'
                    )
                  }
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-md border border-slate-700 transition-colors"
                >
                  5. Quantum Expire
                </button>
                <button
                  onClick={() =>
                    triggerTransition('RUNNING', 'TERMINATED', 'Exit (exit(0) syscall)', 'Process executed exit(0). Resources reclaimed.')
                  }
                  className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900/80 text-red-200 rounded-md border border-red-800/80 transition-colors"
                >
                  6. Terminate (exit)
                </button>
              </div>
            </div>
          </div>

          {/* Real-Time Kernel Event Log */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
              <span className="font-mono">KERNEL STATE TRANSITION LOG</span>
              <span className="text-slate-500 font-mono">/dev/klog</span>
            </div>
            <div className="mt-2.5 space-y-1.5 font-mono text-xs max-h-36 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-2 text-slate-400">
                  <span className="text-slate-600 shrink-0">{log.time}</span>
                  <span className="text-slate-300">{log.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: State & Kernel Inspector Panel */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs uppercase font-mono text-cyan-400 font-semibold">State Inspector</span>
                <h3 className="text-xl font-bold text-white">{details.title}</h3>
              </div>
              <div className="text-xs font-mono px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {selectedState}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Scheduler Responsible
              </div>
              <div className="text-sm font-medium text-cyan-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                {details.scheduler}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Physical Storage / Memory Location
              </div>
              <div className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800 font-mono">
                {details.location}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Conceptual Overview
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {details.description}
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Operating System Internal Operations
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {details.osOperations.map((op, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{op}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Associated POSIX System Calls
              </div>
              <div className="flex flex-wrap gap-1.5">
                {details.syscalls.map((sc, idx) => (
                  <span
                    key={idx}
                    className="font-mono text-xs bg-slate-950 text-amber-300 border border-slate-800 px-2 py-0.5 rounded"
                  >
                    {sc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">PCB Status: </span>
            <span className="font-mono text-slate-300">{details.pcbStatus}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
