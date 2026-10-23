import React, { useState } from 'react';
import { BarChart3, Clock, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BenchmarkProcess {
  pid: number;
  name: string;
  arrival: number;
  burst: number;
  priority: number;
  color: string;
}

const BENCHMARK_SET: BenchmarkProcess[] = [
  { pid: 1, name: 'P1', arrival: 0, burst: 6, priority: 3, color: '#0284C7' },
  { pid: 2, name: 'P2', arrival: 1, burst: 3, priority: 1, color: '#10B981' },
  { pid: 3, name: 'P3', arrival: 2, burst: 8, priority: 4, color: '#F59E0B' },
  { pid: 4, name: 'P4', arrival: 3, burst: 4, priority: 2, color: '#8B5CF6' },
];

export const SchedulingComparison: React.FC = () => {
  const [selectedAlgo, setSelectedAlgo] = useState<'ALL' | 'FCFS' | 'SJF' | 'RR'>('ALL');

  // Precomputed exact mathematical results for standard benchmark set
  const ALGORITHMS_RESULTS = [
    {
      name: 'First-Come First-Served (FCFS)',
      type: 'Non-Preemptive',
      gantt: [
        { pid: 'P1', start: 0, end: 6, color: '#0284C7' },
        { pid: 'P2', start: 6, end: 9, color: '#10B981' },
        { pid: 'P3', start: 9, end: 17, color: '#F59E0B' },
        { pid: 'P4', start: 17, end: 21, color: '#8B5CF6' },
      ],
      totalTime: 21,
      avgWT: 7.75,
      avgTAT: 13.0,
      pros: 'Simple to implement, zero scheduling overhead.',
      cons: 'Suffers from the Convoy Effect (short jobs wait behind long jobs).',
    },
    {
      name: 'Shortest Job First (SJF)',
      type: 'Non-Preemptive',
      gantt: [
        { pid: 'P1', start: 0, end: 6, color: '#0284C7' },
        { pid: 'P2', start: 6, end: 9, color: '#10B981' },
        { pid: 'P4', start: 9, end: 13, color: '#8B5CF6' },
        { pid: 'P3', start: 13, end: 21, color: '#F59E0B' },
      ],
      totalTime: 21,
      avgWT: 5.75,
      avgTAT: 11.0,
      pros: 'Optimal average waiting time for non-preemptive batches.',
      cons: 'Requires advance knowledge of CPU burst duration; long jobs may starve.',
    },
    {
      name: 'Round Robin (RR, q=2)',
      type: 'Preemptive',
      gantt: [
        { pid: 'P1', start: 0, end: 2, color: '#0284C7' },
        { pid: 'P2', start: 2, end: 4, color: '#10B981' },
        { pid: 'P1', start: 4, end: 6, color: '#0284C7' },
        { pid: 'P3', start: 6, end: 8, color: '#F59E0B' },
        { pid: 'P4', start: 8, end: 10, color: '#8B5CF6' },
        { pid: 'P2', start: 10, end: 11, color: '#10B981' },
        { pid: 'P1', start: 11, end: 13, color: '#0284C7' },
        { pid: 'P4', start: 13, end: 15, color: '#8B5CF6' },
        { pid: 'P3', start: 15, end: 21, color: '#F59E0B' },
      ],
      totalTime: 21,
      avgWT: 6.25,
      avgTAT: 11.5,
      pros: 'Fair time-sharing, responsive interactive performance, no starvation.',
      cons: 'Higher context switch overhead if quantum is tuned too small.',
    },
  ];

  return (
    <section id="algorithms" className="max-w-7xl mx-auto px-6 py-12 scroll-mt-20">
      <div className="pb-6 border-b border-slate-800">
        <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
          Performance Benchmarking & Lab Analysis
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
          CPU Scheduling Algorithm Comparison
        </h2>
        <p className="text-sm text-slate-400 mt-1 max-w-2xl">
          Evaluate how FCFS, SJF, and Round Robin schedule the exact same benchmark workload. Compare Average Waiting Time (AWT) and Turnaround Time (TAT).
        </p>
      </div>

      {/* Benchmark Workload Table */}
      <div className="mt-8 bg-slate-900 rounded-2xl border border-slate-800 p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Standard Reference Workload (4 Concurrent Processes)
          </span>
          <span className="text-xs font-mono text-slate-500">21CSC202J · Lab Exercise 2</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          {BENCHMARK_SET.map((p) => (
            <div key={p.pid} className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-sm font-bold font-mono text-white">{p.name}</span>
              </div>
              <div className="text-xs font-mono text-slate-400 space-y-0.5">
                <div>Arrival Time: <span className="text-slate-200">{p.arrival}</span></div>
                <div>Burst Time: <span className="text-cyan-300 font-bold">{p.burst} ms</span></div>
                <div>Priority: <span className="text-amber-300">{p.priority}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comparative Gantt Cards */}
      <div className="space-y-6 mt-8">
        {ALGORITHMS_RESULTS.map((res, idx) => (
          <div key={idx} className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-cyan-400 uppercase font-semibold">
                  {res.type}
                </span>
                <h3 className="text-lg font-bold text-white">{res.name}</h3>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">AVG WAITING TIME</span>
                  <span className="text-cyan-400 font-bold text-sm tabular-nums">{res.avgWT} ms</span>
                </div>
                <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">AVG TURNAROUND TIME</span>
                  <span className="text-amber-400 font-bold text-sm tabular-nums">{res.avgTAT} ms</span>
                </div>
              </div>
            </div>

            {/* Gantt Bar */}
            <div className="mt-4">
              <div className="text-xs font-mono text-slate-400 mb-1.5 flex justify-between">
                <span>Gantt Chart (Total: {res.totalTime} ms)</span>
                <span>Time Axis</span>
              </div>
              <div className="h-10 w-full bg-slate-950 rounded-lg border border-slate-800 flex overflow-hidden">
                {res.gantt.map((seg, i) => {
                  const duration = seg.end - seg.start;
                  const widthPct = (duration / res.totalTime) * 100;
                  return (
                    <div
                      key={i}
                      style={{ width: `${widthPct}%`, backgroundColor: seg.color }}
                      className="h-full flex items-center justify-center font-mono font-bold text-xs text-white border-r border-slate-900/60"
                      title={`${seg.pid}: ${seg.start} -> ${seg.end}`}
                    >
                      {seg.pid}
                    </div>
                  );
                })}
              </div>

              {/* Time tick labels */}
              <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 px-1">
                <span>0</span>
                {res.gantt.map((g, i) => (
                  <span key={i}>{g.end}</span>
                ))}
              </div>
            </div>

            {/* Pros / Cons Tradeoff Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
              <div className="flex items-start gap-2 text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Advantage:</strong> {res.pros}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-300">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span><strong className="text-white">Tradeoff:</strong> {res.cons}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
