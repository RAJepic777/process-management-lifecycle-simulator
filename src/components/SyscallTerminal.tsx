import React, { useState, useRef, useEffect } from 'react';
import { Send, GitFork } from 'lucide-react';

interface ShellProcess {
  pid: number;
  ppid: number;
  name: string;
  state: 'RUNNING' | 'SLEEPING' | 'ZOMBIE';
  cpuPercent: number;
}

export const SyscallTerminal: React.FC = () => {
  const [inputCmd, setInputCmd] = useState<string>('');
  const [history, setHistory] = useState<string[]>([
    'SRM IST Ramapuram OS Terminal [Kernel v6.8.0-posix-x86_64]',
    'Type "help" for a list of OS process management commands.',
    'System ready. Type "fork", "ps", "exec ls", "kill <pid>", or "wait".',
  ]);

  const [processes, setProcesses] = useState<ShellProcess[]>([
    { pid: 1, ppid: 0, name: 'systemd', state: 'RUNNING', cpuPercent: 0.1 },
    { pid: 100, ppid: 1, name: 'bash', state: 'RUNNING', cpuPercent: 0.3 },
    { pid: 104, ppid: 100, name: 'worker_daemon', state: 'SLEEPING', cpuPercent: 1.2 },
  ]);

  const [nextPid, setNextPid] = useState<number>(105);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const executeCommand = (command: string) => {
    const cmd = command.trim();
    if (!cmd) {
      setInputCmd('');
      return;
    }

    const newHistory = [...history, `$ ${cmd}`];
    const tokens = cmd.split(/\s+/);
    const op = tokens[0].toLowerCase();

    switch (op) {
      case 'help':
        newHistory.push(
          'Available POSIX Process Management Commands:',
          '  fork             - Duplicate current process; creates child process with unique PID',
          '  exec <name>      - Replace current process image with new program (e.g. exec nginx)',
          '  wait             - Parent reaps zombie child processes, collects exit status',
          '  kill -9 <pid>    - Send SIGKILL to immediately terminate process by PID',
          '  kill <pid>       - Send SIGTERM request to process',
          '  ps               - List active process snapshot (PID, PPID, State, Name)',
          '  top              - Display active processes with CPU consumption',
          '  clear            - Clear terminal buffer'
        );
        break;

      case 'clear':
        setHistory(['SRM IST Ramapuram OS Terminal buffer cleared.']);
        setInputCmd('');
        return;

      case 'fork': {
        const parentPid = 100; // current shell
        const childPid = nextPid;
        setNextPid((prev) => prev + 1);

        setProcesses((prev) => [
          ...prev,
          {
            pid: childPid,
            ppid: parentPid,
            name: `child_proc_${childPid}`,
            state: 'RUNNING',
            cpuPercent: 3.5,
          },
        ]);

        newHistory.push(
          `[SYS_fork] Returned: ${childPid} to Parent (PID ${parentPid}), 0 to Child.`,
          `Process Table updated: Created PID ${childPid} with PPID ${parentPid}. Address space duplicated via Copy-On-Write (COW).`
        );
        break;
      }

      case 'exec': {
        const program = tokens[1];
        if (!program) {
          newHistory.push('Usage: exec <name>');
          break;
        }

        setProcesses((prev) =>
          prev.map((p) => {
            if (p.pid === 100) {
              return { ...p, name: program };
            }
            return p;
          })
        );
        newHistory.push(
          `[SYS_execve] Replaced current address space with binary "${program}".`,
          `PID 100 maintained, text and data segments overwritten with new binary image.`
        );
        break;
      }

      case 'wait': {
        const zombie = processes.find((p) => p.ppid === 100 && p.state === 'ZOMBIE');
        if (zombie) {
          setProcesses((prev) => prev.filter((p) => p.pid !== zombie.pid));
          newHistory.push(
            `[SYS_wait] Parent reaped Zombie child PID ${zombie.pid}. Exit status code: 0 (EXIT_SUCCESS).`,
            `Kernel released PCB entry for PID ${zombie.pid} from process table.`
          );
        } else {
          newHistory.push('[SYS_wait] No zombie child processes to reap currently.');
        }
        break;
      }

      case 'kill': {
        const force = tokens[1] === '-9';
        const targetPidStr = force ? tokens[2] : tokens[1];
        const targetPid = Number(targetPidStr);

        if (!targetPidStr || !Number.isSafeInteger(targetPid) || targetPid <= 0) {
          newHistory.push('Usage: kill <pid> or kill -9 <pid>');
          break;
        }

        if (targetPid === 1 || targetPid === 100) {
          const protectedProcess = targetPid === 1 ? 'systemd/init' : 'the active shell';
          newHistory.push(`Operation denied: Cannot kill PID ${targetPid} (${protectedProcess}).`);
          break;
        }

        const targetProc = processes.find((p) => p.pid === targetPid);
        if (!targetProc) {
          newHistory.push(`kill: (${targetPid}) - No such process`);
          break;
        }

        if (targetProc.state === 'ZOMBIE') {
          newHistory.push(`kill: (${targetPid}) - Process is already terminated; call "wait" to reap it.`);
          break;
        }

        // Change target to ZOMBIE to simulate child awaiting wait() from parent
        setProcesses((prev) =>
          prev.map((p) => {
            if (p.pid === targetPid) {
              return { ...p, state: 'ZOMBIE', cpuPercent: 0 };
            }
            return p;
          })
        );

        newHistory.push(
          `[SYS_kill] Sent ${force ? 'SIGKILL' : 'SIGTERM'} to PID ${targetPid} (${targetProc.name}).`,
          `Process terminated and shifted into <defunct> ZOMBIE state. Call "wait" to reap its PCB.`
        );
        break;
      }

      case 'ps':
      case 'top': {
        newHistory.push('  PID   PPID   STAT   %CPU   COMMAND');
        processes.forEach((p) => {
          const statCode = p.state === 'RUNNING' ? 'R' : p.state === 'SLEEPING' ? 'S' : 'Z (defunct)';
          newHistory.push(
            `  ${p.pid.toString().padEnd(5)} ${p.ppid.toString().padEnd(6)} ${statCode.padEnd(6)} ${p.cpuPercent
              .toFixed(1)
              .padEnd(6)} ${p.name}`
          );
        });
        break;
      }

      default:
        newHistory.push(`bash: ${op}: command not found. Type "help" for available OS commands.`);
    }

    setHistory(newHistory);
    setInputCmd('');
  };

  const handleCommand = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    executeCommand(inputCmd);
  };

  return (
    <section id="syscalls" className="max-w-7xl mx-auto px-6 py-12 scroll-mt-20">
      {/* Header */}
      <div className="pb-6 border-b border-slate-800">
        <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
          POSIX Primitives & Process Hierarchy
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
          Unix Syscall Playground & Process Tree
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Simulate Unix system calls (fork, exec, wait, kill) to explore process management. Observe parent-child relationships and zombie process states.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Interactive Terminal (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-115">
          {/* Terminal Window Header */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono text-slate-400 ml-2">srm-os-terminal: /dev/pts/1</span>
            </div>
            <span className="text-xs text-slate-400">
              bash
            </span>
          </div>

          {/* Terminal Body */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-300 space-y-1 bg-slate-950/80">
            {history.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.startsWith('$')
                    ? 'text-cyan-400 font-bold'
                    : line.includes('SYS_')
                    ? 'text-amber-300'
                    : line.includes('ZOMBIE') || line.includes('defunct')
                    ? 'text-red-400'
                    : 'text-slate-300'
                }
              >
                {line}
              </div>
            ))}
            <div ref={terminalEndRef} />
          </div>

          {/* Terminal Input Prompt */}
          <form onSubmit={handleCommand} className="bg-slate-950 p-3 border-t border-slate-800 flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400">srm@os-lab:~$</span>
            <input
              type="text"
              value={inputCmd}
              onChange={(e) => setInputCmd(e.target.value)}
              placeholder="try: fork, ps, exec nginx, kill 104, wait, help..."
              className="flex-1 bg-transparent border-none text-xs font-mono text-white focus:outline-none"
              autoFocus
            />
            <button
              type="submit"
              className="p-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Right Column: Visual Process Tree Hierarchy (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <GitFork className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Process Tree Hierarchy (pstree)</h3>
              </div>
              <span className="text-xs font-mono text-slate-400">{processes.length} nodes</span>
            </div>

            <p className="text-xs text-slate-400 mt-2.5">
              Every Unix process originates from PID 1 (init/systemd). Watch new child nodes appear when you execute <code className="text-cyan-300">fork</code>.
            </p>

            {/* Tree Visualization Nodes */}
            <div className="mt-4 space-y-3 font-mono text-xs">
              {processes.map((p) => {
                const isZombie = p.state === 'ZOMBIE';
                const isRoot = p.pid === 1;
                const isShell = p.pid === 100;
                return (
                  <div
                    key={p.pid}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      isZombie
                        ? 'bg-red-950/40 border-red-800/80 text-red-300'
                        : isRoot
                        ? 'bg-slate-950 border-slate-700 text-white'
                        : isShell
                        ? 'bg-cyan-950/40 border-cyan-800 text-cyan-200'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 pl-6'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">{isRoot ? '●' : '└─'}</span>
                      <div>
                        <span className="font-bold">
                          PID {p.pid}: {p.name}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          Parent: PPID {p.ppid}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          isZombie
                            ? 'bg-red-900 text-red-200'
                            : p.state === 'RUNNING'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isZombie ? 'ZOMBIE (DEFUNCT)' : p.state}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Terminal Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block mb-2">Quick Syscall Triggers:</span>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <button
                onClick={() => executeCommand('fork')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-slate-700"
              >
                + fork()
              </button>
              <button
                onClick={() => executeCommand('wait')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 rounded border border-slate-700"
              >
                wait() (reap)
              </button>
              <button
                onClick={() => {
                  const target = processes.find((p) => p.pid > 100 && p.state !== 'ZOMBIE');
                  if (target) {
                    executeCommand(`kill -9 ${target.pid}`);
                  }
                }}
                className="px-2.5 py-1.5 bg-red-950/60 hover:bg-red-900 text-red-300 rounded border border-red-800"
              >
                kill child
              </button>
              <button
                onClick={() => executeCommand('ps')}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
              >
                ps -ef
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
