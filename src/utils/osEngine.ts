/**
 * Operating System Simulation Engine
 * Core scheduling, state transitions, PCB management, and metric calculations
 */

import { Process, ProcessControlBlock, SchedulingAlgorithm, GanttSegment, SimulationLog } from '../types/os';

const PROCESS_COLORS = [
  '#0284C7', // Sky Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
];

export function createPCB(pid: number, ppid: number, name: string, priority: number): ProcessControlBlock {
  const baseHex = (0x10000000 + pid * 0x00100000).toString(16).toUpperCase();
  const limitHex = (0x10000000 + pid * 0x00100000 + 0x00080000).toString(16).toUpperCase();
  const startPc = 0x00401000 + pid * 0x100;

  return {
    pid,
    ppid,
    processName: name,
    state: 'NEW',
    programCounter: startPc,
    registers: {
      rax: Math.floor(Math.random() * 255),
      rbx: Math.floor(Math.random() * 255),
      rcx: 0,
      rdx: Math.floor(Math.random() * 1024),
      rsp: `0x7FFF${(0x5000 + pid * 0x200).toString(16).toUpperCase()}`,
      rbp: `0x7FFF${(0x5100 + pid * 0x200).toString(16).toUpperCase()}`,
    },
    priority,
    memoryBase: `0x${baseHex}`,
    memoryLimit: `0x${limitHex} (512 KB)`,
    openFileDescriptors: ['fd 0: /dev/stdin', 'fd 1: /dev/stdout', 'fd 2: /dev/stderr', `fd 3: /var/log/${name}.log`],
    cpuTimeUsed: 0,
    timeQuantumRemaining: 2,
  };
}

export function createProcess(
  pid: number,
  name: string,
  burstTime: number,
  arrivalTime: number = 0,
  priority: number = 2,
  ioDuration: number = 0,
  ioTriggerAt: number = 0,
  ppid: number = 1
): Process {
  const color = PROCESS_COLORS[(pid - 1) % PROCESS_COLORS.length];
  const pcb = createPCB(pid, ppid, name, priority);

  return {
    id: `proc-${pid}-${Date.now()}`,
    pid,
    ppid,
    name,
    state: 'NEW',
    arrivalTime,
    burstTime,
    remainingBurst: burstTime,
    priority,
    color,
    ioDuration,
    remainingIo: 0,
    ioTriggerAt: ioTriggerAt > 0 && ioTriggerAt < burstTime ? ioTriggerAt : 0,
    pcb,
    startTime: null,
    completionTime: null,
    turnaroundTime: null,
    waitingTime: null,
    responseTime: null,
    timeline: [],
  };
}

export const INITIAL_PRESET_PROCESSES: Process[] = [
  createProcess(1, 'init_daemon', 5, 0, 1, 2, 2, 0),
  createProcess(2, 'compiler_gcc', 8, 1, 3, 0, 0, 1),
  createProcess(3, 'browser_tab', 4, 2, 2, 3, 1, 1),
  createProcess(4, 'audio_player', 3, 3, 1, 0, 0, 1),
];

export interface EngineStepResult {
  nextProcesses: Process[];
  runningPid: number | null;
  gantt: GanttSegment[];
  logs: SimulationLog[];
  clock: number;
  isContextSwitching: boolean;
  contextSwitchProcess: { outgoing: number | null; incoming: number | null } | null;
}

export function pickNextProcess(
  readyQueue: Process[],
  algorithm: SchedulingAlgorithm,
  currentRunning: Process | null,
  timeQuantumElapsed: number,
  timeQuantum: number
): Process | null {
  if (readyQueue.length === 0) return null;

  switch (algorithm) {
    case 'FCFS':
      // First come, first served by arrival order (or queue order)
      return readyQueue[0];

    case 'SJF':
      // Non-preemptive shortest job first: if current is running, keep it unless done
      if (currentRunning && currentRunning.remainingBurst > 0) {
        return currentRunning;
      }
      return [...readyQueue].sort((a, b) => a.remainingBurst - b.remainingBurst)[0];

    case 'SRTF':
      // Preemptive shortest remaining time
      return [...readyQueue].sort((a, b) => a.remainingBurst - b.remainingBurst)[0];

    case 'PRIORITY_PREEMPTIVE':
      // Preemptive priority (lower number = higher priority)
      return [...readyQueue].sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime)[0];

    case 'PRIORITY_NON_PREEMPTIVE':
      if (currentRunning && currentRunning.remainingBurst > 0) {
        return currentRunning;
      }
      return [...readyQueue].sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime)[0];

    case 'RR':
    default:
      // Round robin: if quantum expired or no current, take next from head of ready queue
      if (currentRunning && timeQuantumElapsed < timeQuantum && currentRunning.remainingBurst > 0) {
        return currentRunning;
      }
      return readyQueue[0];
  }
}

/**
 * Executes a single discrete clock tick across all processes
 */
export function stepSimulation(
  processes: Process[],
  clock: number,
  algorithm: SchedulingAlgorithm,
  timeQuantum: number,
  timeQuantumElapsed: number,
  currentGantt: GanttSegment[]
): {
  processes: Process[];
  clock: number;
  timeQuantumElapsed: number;
  gantt: GanttSegment[];
  logs: SimulationLog[];
  contextSwitchEvent: { from: number | null; to: number | null } | null;
} {
  const nextClock = clock + 1;
  const newLogs: SimulationLog[] = [];
  let updatedProcesses = processes.map((p) => ({
    ...p,
    pcb: { ...p.pcb, registers: { ...p.pcb.registers } },
    timeline: [...p.timeline],
  }));

  // 1. Admit NEW processes arriving at or before nextClock
  updatedProcesses = updatedProcesses.map((p) => {
    if (p.state === 'NEW' && p.arrivalTime <= clock) {
      newLogs.push({
        id: `admit-${p.pid}-${clock}`,
        timestamp: clock,
        type: 'ADMIT',
        pid: p.pid,
        processName: p.name,
        message: `Long-Term Scheduler admitted PID ${p.pid} (${p.name}) into READY queue. Allocated PCB and 512KB Virtual Memory.`,
      });
      return {
        ...p,
        state: 'READY' as const,
        pcb: { ...p.pcb, state: 'READY' as const },
        timeline: [...p.timeline, { time: clock, state: 'READY' as const }],
      };
    }
    return p;
  });

  // 2. Decrement I/O waiting for BLOCKED/WAITING processes
  updatedProcesses = updatedProcesses.map((p) => {
    if (p.state === 'WAITING') {
      const nextRemaining = p.remainingIo - 1;
      if (nextRemaining <= 0) {
        newLogs.push({
          id: `iocomplete-${p.pid}-${clock}`,
          timestamp: clock,
          type: 'IO_COMPLETE',
          pid: p.pid,
          processName: p.name,
          message: `Hardware Interrupt: I/O operation completed for PID ${p.pid} (${p.name}). State shifted from WAITING to READY.`,
        });
        return {
          ...p,
          state: 'READY' as const,
          remainingIo: 0,
          pcb: { ...p.pcb, state: 'READY' as const },
          timeline: [...p.timeline, { time: clock, state: 'READY' as const }],
        };
      }
      return {
        ...p,
        remainingIo: nextRemaining,
        timeline: [...p.timeline, { time: clock, state: 'WAITING' as const }],
      };
    }
    return p;
  });

  // Find currently running process
  const currentRunning = updatedProcesses.find((p) => p.state === 'RUNNING') || null;

  // Check if current running process just triggered I/O or finished
  let readyList = updatedProcesses.filter((p) => p.state === 'READY');
  if (currentRunning) {
    readyList = [currentRunning, ...readyList.filter((p) => p.pid !== currentRunning.pid)];
  }

  // 3. Scheduler chooses next process
  const chosen = pickNextProcess(readyList, algorithm, currentRunning, timeQuantumElapsed, timeQuantum);
  let nextQuantumElapsed = currentRunning && chosen && chosen.pid === currentRunning.pid ? timeQuantumElapsed + 1 : 0;
  let contextSwitchEvent: { from: number | null; to: number | null } | null = null;

  // If process is being context switched
  if (currentRunning && (!chosen || chosen.pid !== currentRunning.pid)) {
    contextSwitchEvent = { from: currentRunning.pid, to: chosen ? chosen.pid : null };
    newLogs.push({
      id: `cs-${currentRunning.pid}-${clock}`,
      timestamp: clock,
      type: 'CONTEXT_SWITCH',
      pid: currentRunning.pid,
      processName: currentRunning.name,
      message: `Kernel Context Switch: Saved registers (PC=0x${currentRunning.pcb.programCounter.toString(16)}) of PID ${currentRunning.pid}. ${chosen ? `Restoring state for PID ${chosen.pid} (${chosen.name}).` : 'CPU is now IDLE.'}`,
    });

    // Move old running to READY if it didn't terminate or enter I/O
    updatedProcesses = updatedProcesses.map((p) => {
      if (p.pid === currentRunning.pid && p.state === 'RUNNING') {
        return {
          ...p,
          state: 'READY' as const,
          pcb: { ...p.pcb, state: 'READY' as const },
        };
      }
      return p;
    });
  }

  // 4. Execute tick on the chosen process
  const updatedGantt = [...currentGantt];

  if (chosen) {
    if (chosen.startTime === null) {
      chosen.startTime = clock;
      chosen.responseTime = clock - chosen.arrivalTime;
    }

    updatedProcesses = updatedProcesses.map((p) => {
      if (p.pid === chosen.pid) {
        const nextBurst = p.remainingBurst - 1;
        const newCpuTime = p.pcb.cpuTimeUsed + 1;
        const newPc = p.pcb.programCounter + 4;
        const newRax = (p.pcb.registers.rax + 7) % 256;

        // Check if process reaches I/O point
        const reachedIo = p.ioTriggerAt > 0 && p.burstTime - nextBurst === p.ioTriggerAt && p.ioDuration > 0;

        if (nextBurst <= 0) {
          // Process terminates!
          const tat = nextClock - p.arrivalTime;
          const wt = tat - p.burstTime;
          newLogs.push({
            id: `term-${p.pid}-${clock}`,
            timestamp: nextClock,
            type: 'TERMINATE',
            pid: p.pid,
            processName: p.name,
            message: `Process PID ${p.pid} (${p.name}) issued exit(0). PCB deallocated, resources freed. Turnaround Time: ${tat}s, Waiting Time: ${wt}s.`,
          });

          return {
            ...p,
            state: 'TERMINATED' as const,
            remainingBurst: 0,
            completionTime: nextClock,
            turnaroundTime: tat,
            waitingTime: Math.max(0, wt),
            pcb: {
              ...p.pcb,
              state: 'TERMINATED' as const,
              cpuTimeUsed: newCpuTime,
              programCounter: newPc,
              registers: { ...p.pcb.registers, rax: 0 },
            },
            timeline: [...p.timeline, { time: clock, state: 'RUNNING' as const }],
          };
        } else if (reachedIo) {
          // Process goes to WAITING for I/O
          newLogs.push({
            id: `io-${p.pid}-${clock}`,
            timestamp: nextClock,
            type: 'IO_WAIT',
            pid: p.pid,
            processName: p.name,
            message: `Trap/Syscall: PID ${p.pid} (${p.name}) requested I/O block. Moving to WAITING queue for ${p.ioDuration} cycles.`,
          });

          return {
            ...p,
            state: 'WAITING' as const,
            remainingBurst: nextBurst,
            remainingIo: p.ioDuration,
            pcb: {
              ...p.pcb,
              state: 'WAITING' as const,
              cpuTimeUsed: newCpuTime,
              programCounter: newPc,
              registers: { ...p.pcb.registers, rax: newRax },
            },
            timeline: [...p.timeline, { time: clock, state: 'RUNNING' as const }],
          };
        } else {
          // Normal running execution
          return {
            ...p,
            state: 'RUNNING' as const,
            remainingBurst: nextBurst,
            pcb: {
              ...p.pcb,
              state: 'RUNNING' as const,
              cpuTimeUsed: newCpuTime,
              programCounter: newPc,
              registers: { ...p.pcb.registers, rax: newRax },
            },
            timeline: [...p.timeline, { time: clock, state: 'RUNNING' as const }],
          };
        }
      } else if (p.state === 'READY') {
        // Record ready state in timeline
        return {
          ...p,
          timeline: [...p.timeline, { time: clock, state: 'READY' as const }],
        };
      }
      return p;
    });

    // Record into Gantt chart
    const lastGantt = updatedGantt[updatedGantt.length - 1];
    if (lastGantt && lastGantt.pid === chosen.pid && lastGantt.endTime === clock) {
      lastGantt.endTime = nextClock;
    } else {
      updatedGantt.push({
        pid: chosen.pid,
        processName: chosen.name,
        color: chosen.color,
        startTime: clock,
        endTime: nextClock,
      });
    }
  } else {
    // CPU was idle
    const lastGantt = updatedGantt[updatedGantt.length - 1];
    if (lastGantt && lastGantt.pid === 'IDLE' && lastGantt.endTime === clock) {
      lastGantt.endTime = nextClock;
    } else {
      updatedGantt.push({
        pid: 'IDLE',
        processName: 'IDLE',
        color: '#334155',
        startTime: clock,
        endTime: nextClock,
      });
    }

    // Keep READY or WAITING processes timeline up to date
    updatedProcesses = updatedProcesses.map((p) => {
      if (p.state === 'READY') {
        return {
          ...p,
          timeline: [...p.timeline, { time: clock, state: 'READY' as const }],
        };
      }
      return p;
    });
  }

  return {
    processes: updatedProcesses,
    clock: nextClock,
    timeQuantumElapsed: nextQuantumElapsed,
    gantt: updatedGantt,
    logs: newLogs,
    contextSwitchEvent,
  };
}

export function calculateSummaryMetrics(processes: Process[], clock: number, gantt: GanttSegment[]) {
  const terminated = processes.filter((p) => p.state === 'TERMINATED');
  const count = terminated.length;

  const totalWT = terminated.reduce((acc, p) => acc + (p.waitingTime || 0), 0);
  const totalTAT = terminated.reduce((acc, p) => acc + (p.turnaroundTime || 0), 0);

  const idleTicks = gantt.filter((g) => g.pid === 'IDLE').reduce((acc, g) => acc + (g.endTime - g.startTime), 0);
  const busyTicks = clock - idleTicks;
  const cpuUtilization = clock > 0 ? Math.min(100, Math.round((busyTicks / clock) * 100)) : 100;
  const throughput = clock > 0 ? Number(((count / clock) * 10).toFixed(2)) : 0;

  return {
    avgWaitingTime: count > 0 ? Number((totalWT / count).toFixed(2)) : 0,
    avgTurnaroundTime: count > 0 ? Number((totalTAT / count).toFixed(2)) : 0,
    cpuUtilization,
    throughput,
    completedCount: count,
    totalCount: processes.length,
  };
}
