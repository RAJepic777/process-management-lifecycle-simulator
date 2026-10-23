import React, { useState } from 'react';
import { Layers, Database, Cpu, Terminal, ArrowDown, ArrowUp, Shield, FileText } from 'lucide-react';

export const ProcessAnatomy: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState<string>('stack');
  const [csStep, setCsStep] = useState<number>(0);

  const CONTEXT_SWITCH_STEPS = [
    {
      title: 'Step 1: Hardware Timer Interrupt or Syscall Trap',
      desc: 'The CPU receives a timer interrupt (quantum expired) or the process invokes a system call (e.g. read()). The CPU hardware transitions from User Mode (Ring 3) to Kernel Mode (Ring 0).',
      cpuState: 'Privilege Level 0 (Kernel)',
    },
    {
      title: 'Step 2: Save Process A State to PCB A',
      desc: 'The OS Kernel saves all hardware registers (RAX, RBX, RCX, RSP, RBP, Program Counter RIP, EFLAGS) from the CPU into the Process Control Block of Process A.',
      cpuState: 'Saving Registers to Kernel Memory',
    },
    {
      title: 'Step 3: Scheduler Decides Next Process',
      desc: 'The Short-Term Scheduler algorithm (e.g. Round Robin or SJF) runs and picks Process B from the Ready Queue.',
      cpuState: 'Executing Scheduler Algorithm',
    },
    {
      title: 'Step 4: Switch Virtual Memory Page Table (CR3)',
      desc: 'The OS updates the CPU Memory Management Unit (MMU) register CR3 with the page table address of Process B. Translation Lookaside Buffer (TLB) is invalidated.',
      cpuState: 'CR3 Register Swapped · TLB Flushed',
    },
    {
      title: 'Step 5: Restore Process B Registers from PCB B',
      desc: 'The Kernel loads saved registers, Stack Pointer, and Program Counter from Process B\'s PCB into the physical CPU registers.',
      cpuState: 'Restoring Registers from PCB B',
    },
    {
      title: 'Step 6: Return to User Mode (iretq)',
      desc: 'The CPU executes the iretq instruction, dropping privilege back to User Mode (Ring 3). Process B continues running exactly where it was previously interrupted!',
      cpuState: 'Process B Resumed in User Mode',
    },
  ];

  const MEMORY_SEGMENTS = [
    {
      id: 'kernel',
      name: 'Kernel Space (High Memory)',
      address: '0xFFFFFFFF_FFFFFFFF to 0xFFFF8000_00000000',
      color: 'border-red-500/50 bg-red-950/30 text-red-300',
      badge: 'Ring 0 (Supervisor)',
      summary: 'Protected operating system memory housing the PCB, kernel stack, page tables, and device drivers. Inaccessible by user-space code.',
      cExample: '/* Managed exclusively by OS Kernel */\nstruct task_struct pcb;',
    },
    {
      id: 'stack',
      name: 'User Stack Segment (Grows ↓)',
      address: '0x7FFFFFFF_E000 to 0x7FFFFFFF_0000',
      color: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-300',
      badge: 'Read / Write',
      summary: 'Stores function call frames, local variables, function arguments, and return addresses. Grows downward toward lower memory addresses.',
      cExample: 'void compute() {\n  int x = 42; // Allocated on User Stack\n  char buffer[256];\n}',
    },
    {
      id: 'heap',
      name: 'Heap Segment (Grows ↑)',
      address: '0x00005555_55600000 to 0x00005555_55800000',
      color: 'border-amber-500/50 bg-amber-950/30 text-amber-300',
      badge: 'Read / Write',
      summary: 'Managed dynamically at runtime via malloc(), calloc(), realloc(), free() in C or new/delete in C++. Grows upward toward higher addresses.',
      cExample: 'int* arr = (int*)malloc(1024 * sizeof(int));\n/* Dynamic allocation on Heap */\nfree(arr);',
    },
    {
      id: 'bss',
      name: 'BSS Segment (Uninitialized Data)',
      address: '0x00005555_55502000 to 0x00005555_55504000',
      color: 'border-purple-500/50 bg-purple-950/30 text-purple-300',
      badge: 'Read / Write',
      summary: '"Block Started by Symbol". Holds global and static variables that are uninitialized or initialized to zero. Kernel zeroes this out upon process load.',
      cExample: 'static int global_counter; // In .bss\nlong int sensor_readings[100]; // In .bss',
    },
    {
      id: 'data',
      name: 'Data Segment (.data Initialized)',
      address: '0x00005555_55500000 to 0x00005555_55502000',
      color: 'border-emerald-500/50 bg-emerald-950/30 text-emerald-300',
      badge: 'Read / Write',
      summary: 'Contains global and static variables that have an explicit initial non-zero value specified by the programmer.',
      cExample: 'int max_users = 500; // In .data\nconst char* app_name = "SRM_OS";',
    },
    {
      id: 'text',
      name: 'Text Segment (.text / Code)',
      address: '0x00005555_55400000 to 0x00005555_55500000',
      color: 'border-blue-500/50 bg-blue-950/30 text-blue-300',
      badge: 'Read-Only / Executable (RX)',
      summary: 'The compiled binary machine code instructions. Marked read-only by the MMU to prevent accidental or malicious self-modification.',
      cExample: 'int main(int argc, char** argv) {\n  /* Machine instructions in .text */\n  return 0;\n}',
    },
  ];

  const activeSegmentData = MEMORY_SEGMENTS.find((s) => s.id === selectedSegment) || MEMORY_SEGMENTS[1];

  return (
    <section id="anatomy" className="max-w-7xl mx-auto px-6 py-12 scroll-mt-20">
      {/* Section Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
          Hardware & Virtual Memory Architecture
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
          Anatomy of a Process: RAM Layout & PCB Structure
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          When a process is born via fork(), the kernel reserves a Virtual Address Space and instantiates a Process Control Block. Explore how memory is segmented and how the OS switches contexts.
        </p>
      </div>

      {/* Grid: Virtual Memory Layout (Left 6) + PCB & Context Switch (Right 6) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Virtual Memory Space Stack Visualizer */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Virtual Address Space (64-bit)</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">Click segment to inspect</span>
            </div>

            {/* Vertical Stack representation of Memory Segments */}
            <div className="mt-4 space-y-2 font-mono text-xs">
              <div className="text-[10px] text-slate-500 flex justify-between px-1">
                <span>0xFFFFFFFF_FFFFFFFF (High Address)</span>
                <span>Protected Kernel</span>
              </div>

              {MEMORY_SEGMENTS.map((seg) => {
                const isSelected = selectedSegment === seg.id;
                return (
                  <button
                    key={seg.id}
                    onClick={() => setSelectedSegment(seg.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col justify-between ${seg.color} ${
                      isSelected ? 'ring-2 ring-cyan-400 shadow-md scale-[1.01]' : 'hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm tracking-tight">{seg.name}</span>
                      <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700/60 font-sans font-medium">
                        {seg.badge}
                      </span>
                    </div>
                    <span className="text-[11px] opacity-75 mt-1 font-mono">{seg.address}</span>
                  </button>
                );
              })}

              <div className="text-[10px] text-slate-500 flex justify-between px-1 pt-1">
                <span>0x00000000_00000000 (Low Address)</span>
                <span>NULL Pointer Trap</span>
              </div>
            </div>
          </div>

          {/* Segment Details Card */}
          <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-lg">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white uppercase tracking-wider">{activeSegmentData.name}</span>
              <span className="text-xs font-mono text-cyan-400">{activeSegmentData.badge}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2.5">
              {activeSegmentData.summary}
            </p>
            <div className="mt-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1">C Code Analogy:</span>
              <pre className="font-mono text-xs text-amber-300 overflow-x-auto whitespace-pre">
                {activeSegmentData.cExample}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Column: PCB Anatomy & Context Switching Visualizer */}
        <div className="lg:col-span-6 space-y-6">
          {/* PCB Structure Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-bold text-white">Process Control Block (PCB) Structure</h3>
              </div>
              <span className="text-xs font-mono text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                Linux task_struct
              </span>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              The PCB is the kernel's identification card for a process. When a process transitions from Running to Waiting or Ready, the OS snapshots these exact fields:
            </p>

            <div className="grid grid-cols-2 gap-2.5 mt-4 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PROCESS ID</span>
                <span className="text-white font-bold">PID / PPID / TGID</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PROCESS STATE</span>
                <span className="text-teal-400 font-bold">TASK_RUNNING, TASK_INTERRUPTIBLE</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">PROGRAM COUNTER</span>
                <span className="text-cyan-400 font-bold">RIP (Next Instruction Address)</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">CPU REGISTERS</span>
                <span className="text-purple-300 font-bold">RAX, RBX, RCX, RSP, RBP</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">CPU SCHEDULING</span>
                <span className="text-amber-300 font-bold">Priority, Nice, Virtual Runtime</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">MEMORY MANAGEMENT</span>
                <span className="text-emerald-400 font-bold">mm_struct, pgd (Page Table Ptr)</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">I/O STATUS & OPEN FILES</span>
                <span className="text-sky-300 font-bold">files_struct (FD Table: 0,1,2,...)</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ACCOUNTING</span>
                <span className="text-slate-300 font-bold">utime, stime, limits, signals</span>
              </div>
            </div>
          </div>

          {/* Interactive Context Switch Walkthrough */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Context Switch Mechanical Pipeline</h3>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                Step {csStep + 1} of {CONTEXT_SWITCH_STEPS.length}
              </span>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-mono text-amber-400 uppercase font-semibold">
                {CONTEXT_SWITCH_STEPS[csStep].cpuState}
              </div>
              <h4 className="text-sm font-bold text-white mt-1">
                {CONTEXT_SWITCH_STEPS[csStep].title}
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                {CONTEXT_SWITCH_STEPS[csStep].desc}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800">
              <button
                disabled={csStep === 0}
                onClick={() => setCsStep((prev) => Math.max(0, prev - 1))}
                className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg border border-slate-700 transition-colors"
              >
                Previous Step
              </button>
              <div className="flex gap-1">
                {CONTEXT_SWITCH_STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCsStep(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      csStep === i ? 'bg-cyan-400' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  />
                ))}
              </div>
              <button
                disabled={csStep === CONTEXT_SWITCH_STEPS.length - 1}
                onClick={() => setCsStep((prev) => Math.min(CONTEXT_SWITCH_STEPS.length - 1, prev + 1))}
                className="px-3 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
