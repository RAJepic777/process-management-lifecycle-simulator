# Operating System Process Management Lifecycle Simulator

A React + Vite interactive simulator for understanding how operating systems manage process lifecycles, scheduling, memory layout, and system calls.

This project was developed as an academic lab/demo for the course on Operating Systems at SRM Institute of Science and Technology, Ramapuram Campus, and is designed to help students visualize core concepts through an interactive, browser-based experience.

## Overview

The application demonstrates the full lifecycle of a process from creation to termination, while also covering:

- process states and transitions
- PCB and process metadata
- CPU scheduling algorithms
- context switching
- waiting and I/O behavior
- POSIX-style system calls
- comparative scheduling analysis
- short OS knowledge assessment

## Features

- Interactive process lifecycle state diagram
- Real-time CPU scheduler simulation with multiple algorithms
- Gantt chart and performance metrics tracking
- Process anatomy and memory layout visualization
- System call terminal with process-tree style interactions
- Scheduling comparison lab for FCFS, Round Robin, SJF, SRTF, and Priority
- Quiz section for OS knowledge reinforcement
- Responsive academic UI tailored for teaching and demo use

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Lucide React
- Motion

## Project Structure

```text
.
├── src/
│   ├── components/
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── public/
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── README.md
└── metadata.json
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 18 or later
- npm or Bun

## Installation

```bash
npm install
```

If you use Bun instead:

```bash
bun install
```

## Running the App

Start the development server:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

## Production Build

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Available Scripts

```bash
npm run dev      # start Vite dev server on port 3000
npm run build    # create production build
npm run preview  # preview built app locally
npm run lint     # TypeScript type check
```

## Environment Notes

A sample environment file is included as `.env.example` for compatibility with AI Studio / Gemini-based cloud hosting setups.

For the local web simulator, the main app does not require a runtime API key unless you extend the project with external AI or cloud features.

## Academic Context

This project supports understanding of:

- process states: New, Ready, Running, Waiting, Terminated
- scheduling disciplines and trade-offs
- context switching overhead
- PCB fields and memory allocation concepts
- OS system call behavior and control flow

## License

This project is intended for academic and educational use.

## Contributors

- Raj Shaw
- Mahesh Shing KC
- Goutham Y.

## Notes

The project is designed as an educational visualizer and not a production operating system kernel or scheduler implementation. It is best used as a teaching aid for OS concepts and classroom demonstrations.
