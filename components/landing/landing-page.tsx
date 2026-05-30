"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  ArrowUpRight,
  BarChart3,
  Boxes,
  CalendarClock,
  CheckCircle2,
  DatabaseZap,
  FileSpreadsheet,
  GitBranch,
  LineChart,
  PackageCheck,
  Play,
  Rocket,
  ShipWheel,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { appPath } from "@/lib/routing";

const stats = [
  ["47", "Orders"],
  ["$284k", "Pipeline"],
  ["3", "Warehouses"],
  ["91%", "On-Time"],
];

const tech = [
  "Next.js 15",
  "React 19",
  "TypeScript",
  "Tailwind v4",
  "shadcn/ui",
  "Radix",
  "TanStack Table",
  "Recharts",
  "Framer Motion",
  "Zustand",
];

function launchDashboard() {
  window.open(appPath("/dashboard"), "_blank", "noopener,noreferrer");
}

function simulateMorningRefresh() {
  confetti({
    colors: ["#22d3ee", "#818cf8", "#34d399", "#f59e0b"],
    particleCount: 120,
    spread: 72,
    startVelocity: 38,
  });
  toast.success("Morning refresh simulated", {
    description: "7:00 AM and 12:00 PM ops snapshots are ready.",
  });
}

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,#0f2b46_0,#020617_34%,#030712_100%)] text-white">
      <section className="relative min-h-[84vh] px-4 py-5 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-24 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="data-stream absolute inset-x-0 top-16 h-[58vh] opacity-60" />
          {Array.from({ length: 18 }, (_, index) => {
            const icons = [PackageCheck, Boxes, ShipWheel, BarChart3, CalendarClock];
            const Icon = icons[index % icons.length];
            return (
              <motion.div
                animate={{ opacity: [0.18, 0.55, 0.18], y: [0, -18, 0] }}
                className="absolute text-cyan-200/40"
                key={index}
                style={{
                  left: `${8 + ((index * 17) % 82)}%`,
                  top: `${18 + ((index * 23) % 62)}%`,
                }}
                transition={{
                  delay: index * 0.25,
                  duration: 5 + (index % 4),
                  repeat: Infinity,
                }}
              >
                <Icon />
              </motion.div>
            );
          })}
        </div>

        <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-300/30">
              <DatabaseZap />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide">OpsFlow</p>
              <p className="text-xs text-slate-400">Operations Dashboard</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a className="transition hover:text-white" href="#problem">
              Problem
            </a>
            <a className="transition hover:text-white" href="#solution">
              Solution
            </a>
            <a className="transition hover:text-white" href="#stack">
              Stack
            </a>
          </nav>
          <Button onClick={launchDashboard} size="sm">
            <Rocket data-icon="inline-start" />
            Launch
          </Button>
        </header>

        <div className="relative z-10 mx-auto grid min-h-[calc(84vh-88px)] max-w-7xl items-center gap-10 py-10 lg:grid-cols-[0.94fr_1.06fr]">
          <div className="flex flex-col gap-8">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-6"
              initial={false}
              transition={{ duration: 0.7 }}
            >
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm text-cyan-100">
                <Sparkles />
                Demo Mode • 100% fake-safe display, Excel-powered locally
              </div>
              <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-normal text-white sm:text-6xl lg:text-7xl">
                From 2-Hour Excel Hell{" "}
                <span className="text-cyan-300">to Instant Ops Clarity</span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300">
                Simulated real daily workflow • Data refreshes at 7:00 AM &
                12:00 PM • Built for my portfolio.
              </p>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
              initial={false}
              transition={{ delay: 0.15, duration: 0.6 }}
            >
              {stats.map(([value, label]) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl"
                  key={label}
                >
                  <p className="text-2xl font-semibold text-white">{value}</p>
                  <p className="mt-1 text-xs uppercase text-slate-400">{label}</p>
                </div>
              ))}
            </motion.div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="h-11 px-5" onClick={launchDashboard}>
                <Play data-icon="inline-start" />
                Launch Interactive Dashboard
                <ArrowUpRight data-icon="inline-end" />
              </Button>
              <Button
                className="h-11 border-cyan-300/20 bg-white/[0.04] px-5 text-cyan-100 hover:bg-cyan-300/10"
                onClick={simulateMorningRefresh}
                variant="outline"
              >
                <Zap data-icon="inline-start" />
                Simulate My Morning Refresh
              </Button>
              <Button
                asChild
                className="h-11 border-white/10 bg-transparent px-5"
                variant="outline"
              >
                <a
                  href="https://github.com/Griffin-Hall/opsflow-dashboard"
                  rel="noreferrer"
                  target="_blank"
                >
                  <GitBranch data-icon="inline-start" />
                  View GitHub
                </a>
              </Button>
            </div>
          </div>

          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative"
            initial={false}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <div className="rounded-3xl border border-cyan-200/15 bg-slate-950/70 p-3 shadow-2xl shadow-cyan-950/30 backdrop-blur-xl">
              <Image
                alt="OpsFlow generated concept preview"
                className="rounded-2xl border border-white/10 object-cover"
                height={1080}
                priority
                src="/opsflow-concept.png"
                width={1920}
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section
        className="border-t border-white/10 bg-slate-950 px-4 py-20 sm:px-6 lg:px-8"
        id="problem"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-center gap-5">
            <Badge className="w-fit border-rose-400/30 bg-rose-400/10 text-rose-100">
              The old way
            </Badge>
            <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              One workbook. Hundreds of rows. Every morning starts with triage.
            </h2>
            <p className="max-w-2xl text-base leading-7 text-slate-400">
              SO numbers, customer POs, ATP dates, manual ETAs, cancel-by risk,
              proposed ship quantities, and notes all compete for attention.
              The signal is there, but Excel makes it expensive to see.
            </p>
          </div>
          <Card className="border-white/10 bg-white/[0.04] text-white">
            <CardContent className="p-4">
              <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-2">
                  <FileSpreadsheet />
                  Key_Account_OOG_FINAL_v17.xlsx
                </span>
                <span>27 columns • 777 rows</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-white/10">
                <div className="grid grid-cols-7 bg-slate-900 text-[10px] text-slate-400">
                  {["SO", "BP Name", "Order Date", "Qty", "Value", "ETA", "Notes"].map(
                    (header) => (
                      <div className="border-r border-white/10 px-2 py-2" key={header}>
                        {header}
                      </div>
                    )
                  )}
                </div>
                {Array.from({ length: 8 }, (_, row) => (
                  <div
                    className="grid grid-cols-7 border-t border-white/10 text-[10px] text-slate-300"
                    key={row}
                  >
                    {Array.from({ length: 7 }, (_, col) => (
                      <div
                        className={`border-r border-white/10 px-2 py-2 ${
                          (row + col) % 5 === 0
                            ? "bg-rose-500/20"
                            : (row + col) % 4 === 0
                              ? "bg-emerald-500/15"
                              : ""
                        }`}
                        key={`${row}-${col}`}
                      >
                        {col === 0
                          ? `10${row}4${col}`
                          : col === 4
                            ? "$24,800"
                            : col === 6
                              ? "Manual ETA..."
                              : "••••••"}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        className="bg-[linear-gradient(180deg,#020617,#07111f)] px-4 py-20 sm:px-6 lg:px-8"
        id="solution"
      >
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-3">
            <Image
              alt="Beautiful dashboard preview"
              className="rounded-2xl border border-white/10"
              height={1080}
              src="/opsflow-concept.png"
              width={1920}
            />
          </div>
          <div className="flex flex-col justify-center gap-5">
            <Badge className="w-fit border-cyan-400/30 bg-cyan-400/10 text-cyan-100">
              The OpsFlow way
            </Badge>
            <h2 className="text-3xl font-semibold tracking-normal text-white sm:text-4xl">
              Executive-grade visibility without losing operational detail.
            </h2>
            <div className="grid gap-3">
              {[
                ["Top 10 newest orders", "SO, customer name, and available value surfaced immediately."],
                ["Release-ready queue", "Warehouse and risk filters turn a messy sheet into action."],
                ["Daily ops sheet", "One click simulates the clean morning report workflow."],
              ].map(([title, body]) => (
                <div
                  className="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  key={title}
                >
                  <CheckCircle2 className="mt-0.5 text-cyan-300" />
                  <div>
                    <p className="font-medium text-white">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-slate-950 px-4 py-16 sm:px-6 lg:px-8" id="stack">
        <div className="mx-auto flex max-w-7xl flex-col gap-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-normal text-white">
                Built like a real product
              </h2>
              <p className="mt-3 max-w-2xl text-slate-400">
                Typed data model, server-side Excel parsing, derived metrics,
                responsive charting, and a fully interactive table.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-300">
              “This is exactly how my mornings feel now.”
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {tech.map((item) => (
              <Badge
                className="border-white/10 bg-white/[0.05] px-3 py-1.5 text-slate-200"
                key={item}
                variant="outline"
              >
                {item}
              </Badge>
            ))}
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-lg font-semibold text-white">
                Ready to see the interactive dashboard?
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Opens in a new tab so the portfolio story stays intact.
              </p>
            </div>
            <Button onClick={launchDashboard}>
              <LineChart data-icon="inline-start" />
              Launch Interactive Dashboard
              <ArrowUpRight data-icon="inline-end" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
