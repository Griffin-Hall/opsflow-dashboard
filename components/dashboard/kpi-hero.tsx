"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Gauge,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KpiMetric } from "@/lib/types";

// The four headline KPIs that give an instant "pulse check" on landing.
// Ready to Release is featured; the rest are supporting context.
const HERO_LABELS = [
  "Ready to Release",
  "On-Time Potential",
  "Avg Days Diff",
  "Warehouses Active",
] as const;

const labelIcons: Record<string, LucideIcon> = {
  "Ready to Release": CheckCircle2,
  "On-Time Potential": Gauge,
  "Avg Days Diff": CalendarClock,
  "Warehouses Active": Warehouse,
};

const toneClasses: Record<KpiMetric["tone"], string> = {
  amber: "from-amber-400/16 to-transparent text-amber-200 ring-amber-300/25",
  cyan: "from-cyan-400/16 to-transparent text-cyan-200 ring-cyan-300/25",
  emerald: "from-emerald-400/16 to-transparent text-emerald-200 ring-emerald-300/25",
  indigo: "from-indigo-400/16 to-transparent text-indigo-200 ring-indigo-300/25",
  rose: "from-rose-400/16 to-transparent text-rose-200 ring-rose-300/25",
};

export function KpiHero({ metrics }: { metrics: KpiMetric[] }) {
  const reduceMotion = useReducedMotion();
  const hero = HERO_LABELS.map((label) =>
    metrics.find((metric) => metric.label === label)
  ).filter((metric): metric is KpiMetric => Boolean(metric));

  return (
    <section
      aria-label="Key operations metrics"
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      {hero.map((metric, index) => {
        const Icon = labelIcons[metric.label] ?? Gauge;
        const featured = metric.label === "Ready to Release";

        return (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            key={metric.label}
            transition={{ delay: index * 0.05, duration: 0.35 }}
          >
            <Card
              className={cn(
                "h-full overflow-hidden border-white/10 bg-white/[0.045] text-white shadow-xl shadow-black/20 transition-colors",
                featured && "border-emerald-300/30 bg-emerald-300/[0.06] ring-1 ring-emerald-300/20"
              )}
            >
              <CardContent className="relative p-5">
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-24 bg-gradient-to-b",
                    toneClasses[metric.tone]
                  )}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    {metric.label}
                  </p>
                  <span
                    className={cn(
                      "rounded-xl bg-white/[0.06] p-2 ring-1",
                      toneClasses[metric.tone]
                    )}
                  >
                    <Icon className="size-5" />
                  </span>
                </div>
                <p
                  className={cn(
                    "relative mt-3 font-semibold tabular-nums tracking-tight text-white",
                    featured ? "text-4xl" : "text-3xl"
                  )}
                >
                  {metric.value}
                </p>
                <div className="relative mt-3 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">{metric.detail}</span>
                  <span className={cn("inline-flex items-center gap-1", toneClasses[metric.tone])}>
                    {metric.trend}
                    <ArrowUpRight className="size-3.5" />
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </section>
  );
}
