/**
 * Operating System Process Management Types
 * SRM Institute of Science and Technology, Ramapuram Campus
 */

export type ProcessState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED' | 'READY_SUSPENDED' | 'BLOCKED_SUSPENDED';

export interface ProcessControlBlock {
  pid: number;
  ppid: number;
  processName: string;
  state: ProcessState;
  programCounter: number; // e.g. 0x00401024
  registers: {
    rax: number;
    rbx: number;
    rcx: number;
    rdx: number;
    rsp: string; // Stack pointer
    rbp: string; // Base pointer
  };
  priority: number; // 1 (highest) to 10 (lowest)
  memoryBase: string; // e.g. 0x10000000
  memoryLimit: string; // e.g. 0x10080000 (512 KB)
  openFileDescriptors: string[];
  cpuTimeUsed: number;
  timeQuantumRemaining: number;
}

export interface Process {
  id: string;
  pid: number;
  ppid: number;
  name: string;
  state: ProcessState;
  arrivalTime: number;
  burstTime: number; // Total required burst
  remainingBurst: number;
  priority: number;
  color: string;
  ioDuration: number;
  remainingIo: number;
  ioTriggerAt: number; // Burst point where process asks for I/O
  pcb: ProcessControlBlock;
  
  // Metrics calculated at completion
  startTime: number | null;
  completionTime: number | null;
  turnaroundTime: number | null;
  waitingTime: number | null;
  responseTime: number | null;
  
  // Historical timeline for Gantt representation
  timeline: { time: number; state: ProcessState }[];
}

export type SchedulingAlgorithm = 'RR' | 'FCFS' | 'SJF' | 'SRTF' | 'PRIORITY_PREEMPTIVE' | 'PRIORITY_NON_PREEMPTIVE';

export interface GanttSegment {
  pid: number | 'IDLE';
  processName: string;
  color: string;
  startTime: number;
  endTime: number;
}

export interface SimulationLog {
  id: string;
  timestamp: number;
  type: 'ADMIT' | 'DISPATCH' | 'INTERRUPT' | 'IO_WAIT' | 'IO_COMPLETE' | 'TERMINATE' | 'CONTEXT_SWITCH' | 'SUSPEND' | 'RESUME';
  pid: number;
  processName: string;
  message: string;
}

export interface SimulationStats {
  clock: number;
  cpuUtilization: number;
  throughput: number;
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  contextSwitchCount: number;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topic: string;
}
