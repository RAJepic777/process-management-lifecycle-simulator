import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { StateDiagram } from './components/StateDiagram';
import { CpuSimulator } from './components/CpuSimulator';
import { ProcessAnatomy } from './components/ProcessAnatomy';
import { SyscallTerminal } from './components/SyscallTerminal';
import { SchedulingComparison } from './components/SchedulingComparison';
import { KnowledgeQuiz } from './components/KnowledgeQuiz';
import { Footer } from './components/Footer';

export default function App() {
  const [activeSection, setActiveSection] = useState<string>('home');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['quiz', 'algorithms', 'syscalls', 'anatomy', 'simulator', 'diagram'];
      const scrollPos = window.scrollY + 200;

      for (const id of sections) {
        const el = document.getElementById(id);
        if (el && el.offsetTop <= scrollPos) {
          setActiveSection(id);
          return;
        }
      }
      if (window.scrollY < 300) {
        setActiveSection('home');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navigation */}
      <Header onNavigate={scrollToSection} activeSection={activeSection} />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Front Hero Banner with SRM LOGO Ramapuram logo */}
        <HeroBanner
          onStartSimulation={() => scrollToSection('simulator')}
          onExploreDiagram={() => scrollToSection('diagram')}
          onOpenSyscalls={() => scrollToSection('syscalls')}
        />

        {/* 1. Interactive State Transition Diagram & Walkthrough */}
        <StateDiagram />

        {/* 2. Interactive Real-Time CPU Scheduler & Workbench */}
        <CpuSimulator />

        {/* 3. Deep Dive: Memory Layout & Process Control Block (PCB) */}
        <ProcessAnatomy />

        {/* 4. POSIX Syscall Terminal & Process Tree */}
        <SyscallTerminal />

        {/* 5. Algorithm Lab & Comparative Analysis */}
        <SchedulingComparison />

        {/* 6. OS Knowledge Evaluation Quiz */}
        <KnowledgeQuiz />
      </main>

      {/* Academic Institutional Footer */}
      <Footer onNavigate={scrollToSection} />
    </div>
  );
}
