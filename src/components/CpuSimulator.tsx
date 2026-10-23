import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Plus,
  Cpu,
  Clock,
  Activity,
  Layers,
  CheckCircle,
  HelpCircle,
  Sliders,
  Settings,
} from 'lucide-react';
import {
  Process,
  SchedulingAlgorithm,
  GanttSegment,
  SimulationLog,
} from '../types/os';
import {
  INITIAL_PRESET_PROCESSES,
  createProcess,
  stepSimulation,
  calculateSummaryMetrics,
} from '../utils/osEngine';

export const CpuSimulator: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>(() =>
    INITIAL_PRESET_PROCESSES.map((p) => ({
      ...p,
      pcb: { ...p.pcb, registers: { ...p.pcb.registers } },
      timeline: [],
    }))
  );
  const [clock, setClock] = useState<number>(0);
  const [algorithm, setAlgorithm] = useState<SchedulingAlgorithm>('RR');
  const [timeQuantum, setTimeQuantum] = useState<number>(2);
  const [timeQuantumElapsed, setTimeQuantumElapsed] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 1 = 1000ms, 2 = 500ms, 4 = 250ms
  const [gantt, setGantt] = useState<GanttSegment[]>([]);
  const [contextSwitchNotice, setContextSwitchNotice] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  // New process modal form state
  const [newProcName, setNewProcName] = useState<string>('database_query');
  const [newBurst, setNewBurst] = useState<number>(5);
  const [newArrival, setNewArrival] = useState<number>(0);
  const [newPriority, setNewPriority] = useState<number>(2);
  const [newIoDuration, setNewIoDuration] = useState<number>(2);
  const [newIoTrigger, setNewIoTrigger] = useState<number>(2);

  // Auto-run loop
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const executeTick = () => {
    // Check if all processes are terminated
    const allTerminated = processes.length > 0 && processes.every((p) => p.state === 'TERMINATED');
    if (allTerminated) {
      setIsPlaying(false);
      return;
    }

    const res = stepSimulation(
      processes,
      clock,
      algorithm,
      timeQuantum,
      timeQuantumElapsed,
      gantt
    );

    setProcesses(res.processes);
    setClock(res.clock);
    setTimeQuantumElapsed(res.timeQuantumElapsed);
    setGantt(res.gantt);

    if (res.contextSwitchEvent && res.contextSwitchEvent.from !== null) {
      setContextSwitchNotice(
        `Context Switch: Saved PID ${res.contextSwitchEvent.from} PCB, dispatched ${
          res.contextSwitchEvent.to ? `PID ${res.contextSwitchEvent.to}` : 'IDLE'
        }`
      );
      setTimeout(() => setContextSwitchNotice(null), 1200);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(200, 1000 / speedMultiplier);
      timerRef.current = setInterval(executeTick, intervalMs);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speedMultiplier, processes, clock, algorithm, timeQuantum, timeQuantumElapsed, gantt]);

  const handleReset = () => {
    setIsPlaying(false);
    setClock(0);
    setTimeQuantumElapsed(0);
    setGantt([]);
    setContextSwitchNotice(null);
    setProcesses(
      INITIAL_PRESET_PROCESSES.map((p) => ({
        ...p,
        state: 'NEW',
        remainingBurst: p.burstTime,
        remainingIo: 0,
        startTime: null,
        completionTime: null,
        turnaroundTime: null,
        waitingTime: null,
        responseTime: null,
        pcb: { ...p.pcb, state: 'NEW', cpuTimeUsed: 0, registers: { ...p.pcb.registers } },
        timeline: [],
      }))
    );
  };

  const handleAddProcess = (e: React.FormEvent) => {
    e.preventDefault();
    const nextPid = processes.reduce((max, p) => Math.max(max, p.pid), 0) + 1;
    const newP = createProcess(
      nextPid,
      newProcName || `job_${nextPid}`,
      Number(newBurst) || 4,
      Number(newArrival) || 0,
      Number(newPriority) || 2,
      Number(newIoDuration) || 0,
      Number(newIoTrigger) || 0,
      1
    );

    setProcesses((prev) => [...prev, newP]);
    setIsAddModalOpen(false);
  };

  // Metrics
  const metrics = calculateSummaryMetrics(processes, clock, gantt);
  const runningProcess = processes.find((p) => p.state === 'RUNNING') || null;
  const readyProcesses = processes.filter((p) => p.state === 'READY');
  const waitingProcesses = processes.filter((p) => p.state === 'WAITING');
  const newProcesses = processes.filter((p) => p.state === 'NEW');
  const terminatedProcesses = processes.filter((p) => p.state === 'TERMINATED');

  return (
    <section id="simulator" className="max-w-7xl mx-auto px-6 py-12 scroll-mt-20">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
            Interactive Multiprogramming Workbench
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            Real-Time CPU Scheduler & Lifecycle Engine
          </h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Simulate how the Operating System coordinates concurrent jobs. Watch process queues, context switching, CPU core hardware registers, and dynamic Gantt chart generation.
          </p>
        </div>

        {/* Global Simulation Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Play/Pause */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg shadow-md transition-all ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'Pause' : 'Start Simulation'}</span>
          </button>

          {/* Step Clock */}
          <button
            onClick={executeTick}
            disabled={isPlaying}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-slate-700 transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span>Step (1 Tick)</span>
          </button>

          {/* Reset */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          {/* Add Process Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Process</span>
          </button>
        </div>
      </div>

      {/* Control Configuration Bar: Algorithm + Quantum + Clock Speed */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 p-4 bg-slate-900/90 rounded-xl border border-slate-800">
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Scheduling Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) => {
              setAlgorithm(e.target.value as SchedulingAlgorithm);
              setTimeQuantumElapsed(0);
            }}
            className="w-full bg-slate-950 text-slate-100 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-cyan-400"
          >
            <option value="RR">Round Robin (Preemptive)</option>
            <option value="FCFS">First-Come, First-Served (FCFS)</option>
            <option value="SJF">Shortest Job First (Non-preemptive)</option>
            <option value="SRTF">Shortest Remaining Time First (Preemptive)</option>
            <option value="PRIORITY_PREEMPTIVE">Priority (Preemptive)</option>
            <option value="PRIORITY_NON_PREEMPTIVE">Priority (Non-Preemptive)</option>
          </select>
        </div>

        {algorithm === 'RR' ? (
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Time Quantum (q)
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400">{timeQuantum} ticks</span>
            </div>
            <input
              type="range"
              min="1"
              max="6"
              value={timeQuantum}
              onChange={(e) => setTimeQuantum(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        ) : (
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Scheduler Mode
            </label>
            <div className="text-xs text-slate-300 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 font-mono">
              {algorithm.includes('PREEMPTIVE') ? 'Hardware Preemptive' : 'Cooperative / Non-Preemptive'}
            </div>
          </div>
        )}

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Clock Speed
            </label>
            <span className="text-xs font-mono font-bold text-cyan-400">{speedMultiplier}x</span>
          </div>
          <div className="flex items-center gap-1">
            {[0.5, 1, 2, 4].map((mult) => (
              <button
                key={mult}
                onClick={() => setSpeedMultiplier(mult)}
                className={`flex-1 py-1 text-xs font-mono rounded ${
                  speedMultiplier === mult ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
                }`}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Kernel Master Clock
          </div>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-extrabold font-mono text-cyan-300 tabular-nums">t = {clock}</span>
            <span className="text-xs text-slate-500">discrete cycles</span>
          </div>
        </div>
      </div>

      {/* Context Switch Toast Notice */}
      {contextSwitchNotice && (
        <div className="mt-4 p-3 bg-cyan-950/80 border border-cyan-500/50 rounded-xl text-xs font-mono text-cyan-200 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>{contextSwitchNotice}</span>
          </div>
          <span className="text-slate-400 text-[11px]">Context Switch Overhead: ~10μs</span>
        </div>
      )}

      {/* Main Execution Arena: CPU Core & Hardware Registers (Top) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left 6 cols: CPU Core Hardware Visualizer */}
        <div className="lg:col-span-6 bg-slate-900 rounded-2xl border border-slate-800 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
            <Cpu className="w-48 h-48 text-cyan-400" />
          </div>

          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${runningProcess ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                <h3 className="text-base font-bold text-white tracking-tight">CPU Core 0 (x86_64)</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                {runningProcess ? 'USER MODE (Ring 3)' : 'KERNEL IDLE (HLT)'}
              </span>
            </div>

            {/* Currently Active Process Card */}
            {runningProcess ? (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/90 border border-slate-700/80 relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: runningProcess.color }}
                    />
                    <div>
                      <div className="text-sm font-bold text-white font-mono">
                        PID {runningProcess.pid}: {runningProcess.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Priority: {runningProcess.priority} · Arrival: t={runningProcess.arrivalTime}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Remaining Burst</div>
                    <div className="text-base font-extrabold font-mono text-cyan-400 tabular-nums">
                      {runningProcess.remainingBurst} / {runningProcess.burstTime} cycles
                    </div>
                  </div>
                </div>

                {/* Burst Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${((runningProcess.burstTime - runningProcess.remainingBurst) / runningProcess.burstTime) * 100}%`,
                      backgroundColor: runningProcess.color,
                    }}
                  />
                </div>

                {/* Live CPU Registers Snapshot */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 font-mono text-xs">
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">PROGRAM COUNTER</span>
                    <span className="text-cyan-300 font-bold">0x{runningProcess.pcb.programCounter.toString(16).toUpperCase()}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">RAX (ACCUMULATOR)</span>
                    <span className="text-emerald-400 font-bold">0x{runningProcess.pcb.registers.rax.toString(16).padStart(4, '0')}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">STACK PTR (RSP)</span>
                    <span className="text-slate-300 font-bold">{runningProcess.pcb.registers.rsp}</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">CPU TIME USED</span>
                    <span className="text-amber-300 font-bold tabular-nums">{runningProcess.pcb.cpuTimeUsed} ticks</span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">QUANTUM REMAINING</span>
                    <span className="text-purple-300 font-bold tabular-nums">
                      {algorithm === 'RR' ? `${Math.max(0, timeQuantum - timeQuantumElapsed)} ticks` : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">MEM BASE</span>
                    <span className="text-slate-400 font-bold">{runningProcess.pcb.memoryBase}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 py-12 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-dashed border-slate-800">
                <Cpu className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <div className="text-sm font-semibold text-slate-400">CPU is Currently Idle</div>
                <div className="text-xs text-slate-600 mt-1">Waiting for jobs in Ready Queue...</div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Hardware Context: 64-bit ALU · TLB Enabled</span>
            <span className="font-mono">Timer Interrupt: 100 Hz</span>
          </div>
        </div>

        {/* Right 6 cols: Live Process Queues (Ready, Waiting, Terminated) */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Ready Queue (FIFO / Priority) */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">Ready Queue</span>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {readyProcesses.length} waiting
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">Head → Dispatch</span>
            </div>

            <div className="mt-3 flex gap-2.5 overflow-x-auto pb-2 min-h-[82px] items-center">
              {readyProcesses.length > 0 ? (
                readyProcesses.map((p, index) => (
                  <div
                    key={p.id}
                    className="shrink-0 w-36 bg-slate-950 p-2.5 rounded-xl border border-slate-700/80 hover:border-teal-500/50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-xs font-bold font-mono text-white truncate max-w-[70px]">
                          P{p.pid}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1 rounded">
                        #{index + 1}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{p.name}</div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-800/80 font-mono">
                      <span>Burst: {p.remainingBurst}</span>
                      <span>Pri: {p.priority}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic py-3 px-2">Ready queue is empty.</div>
              )}
            </div>
          </div>

          {/* Waiting / Blocked Queue (I/O) */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Device Wait Queue (I/O)</span>
                <span className="text-xs font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                  {waitingProcesses.length} blocked
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">Awaiting ISR</span>
            </div>

            <div className="mt-3 flex gap-2.5 overflow-x-auto pb-2 min-h-[76px] items-center">
              {waitingProcesses.length > 0 ? (
                waitingProcesses.map((p) => (
                  <div
                    key={p.id}
                    className="shrink-0 w-36 bg-slate-950 p-2.5 rounded-xl border border-amber-900/40"
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                      <span className="text-xs font-bold font-mono text-white truncate">PID {p.pid}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{p.name}</div>
                    <div className="text-[10px] text-amber-300 font-mono mt-1">
                      I/O Left: {p.remainingIo} cycles
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 italic py-2 px-2">No processes blocked on I/O.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Gantt Chart Generation */}
      <div className="mt-6 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Execution Timeline
            </span>
            <h3 className="text-lg font-bold text-white">Live CPU Gantt Chart</h3>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Total Elapsed: {clock} ticks
          </div>
        </div>

        {/* Gantt Bar Container */}
        <div className="mt-4">
          <div className="relative w-full h-12 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto flex items-center">
            {gantt.length > 0 ? (
              gantt.map((segment, index) => {
                const duration = segment.endTime - segment.startTime;
                // Calculate proportional width
                const widthPercent = clock > 0 ? (duration / clock) * 100 : 100;
                return (
                  <div
                    key={index}
                    style={{
                      width: `${Math.max(4, widthPercent)}%`,
                      backgroundColor: segment.color,
                    }}
                    className="h-full flex flex-col items-center justify-center border-r border-slate-900/60 text-white font-mono text-xs font-bold overflow-hidden px-1 group relative transition-all"
                    title={`${segment.processName} [PID ${segment.pid}]: ${segment.startTime} -> ${segment.endTime}`}
                  >
                    <span className="truncate text-[11px]">
                      {segment.pid === 'IDLE' ? 'IDLE' : `P${segment.pid}`}
                    </span>
                    <span className="text-[9px] opacity-80 font-normal">
                      {duration}t
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-xs text-slate-600 font-mono">
                Click "Start Simulation" or "Step" to record CPU timeline.
              </div>
            )}
          </div>

          {/* Time markers axis */}
          {gantt.length > 0 && (
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1 px-1">
              <span>0</span>
              {gantt.slice(-6).map((g, i) => (
                <span key={i}>t={g.endTime}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* KPI Performance Metrics Dashboard (60-30-10 & Tabular Numerals) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">CPU Utilization</span>
          <span className="text-2xl font-bold font-mono text-white tabular-nums mt-1 block">
            {metrics.cpuUtilization}%
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Active computing time</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">Average Waiting Time (AWT)</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums mt-1 block">
            {metrics.avgWaitingTime} cycles
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Time spent in ready queue</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">Avg Turnaround Time (TAT)</span>
          <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1 block">
            {metrics.avgTurnaroundTime} cycles
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Total time: arrival to exit</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium block">Throughput</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1 block">
            {metrics.completedCount} / {metrics.totalCount}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Jobs completely terminated</span>
        </div>
      </div>

      {/* Process Table & PCB Inspector */}
      <div className="mt-6 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div>
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Operating System Process Table
            </span>
            <h3 className="text-lg font-bold text-white">Active PCB Records</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">/proc table</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-3">PID</th>
                <th className="py-2.5 px-3">Process Name</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Arrival</th>
                <th className="py-2.5 px-3">Burst (Tot/Rem)</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Waiting (WT)</th>
                <th className="py-2.5 px-3">Turnaround (TAT)</th>
                <th className="py-2.5 px-3">Exit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {processes.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                      <span>{p.pid}</span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-200">{p.name}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.state === 'RUNNING'
                          ? 'bg-blue-950 text-blue-300 border border-blue-800'
                          : p.state === 'READY'
                          ? 'bg-teal-950 text-teal-300 border border-teal-800'
                          : p.state === 'WAITING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : p.state === 'TERMINATED'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {p.state}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">{p.arrivalTime}</td>
                  <td className="py-2.5 px-3 tabular-nums">
                    {p.burstTime} / {p.remainingBurst}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums">{p.priority}</td>
                  <td className="py-2.5 px-3 tabular-nums text-cyan-300">
                    {p.waitingTime !== null ? `${p.waitingTime}t` : '-'}
                  </td>
                  <td className="py-2.5 px-3 tabular-nums text-amber-300">
                    {p.turnaroundTime !== null ? `${p.turnaroundTime}t` : '-'}
                  </td>
                  <td className="py-2.5 px-3">
                    {p.state === 'TERMINATED' ? (
                      <span className="text-emerald-400">exit(0)</span>
                    ) : (
                      <span className="text-slate-500">running</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Process Modal Dialog */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Create New Process (fork)</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProcess} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Process Name</label>
                <input
                  type="text"
                  value={newProcName}
                  onChange={(e) => setNewProcName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">CPU Burst Time (cycles)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newBurst}
                    onChange={(e) => setNewBurst(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Arrival Time (t)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={newArrival}
                    onChange={(e) => setNewArrival(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Priority (1 = Highest)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newPriority}
                    onChange={(e) => setNewPriority(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">I/O Duration (cycles)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={newIoDuration}
                    onChange={(e) => setNewIoDuration(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold rounded-lg shadow-sm"
                >
                  Allocate & Admit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
