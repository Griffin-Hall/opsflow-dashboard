"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Database,
  Gauge,
  PackageX,
  Warehouse,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KpiMetric } from "@/lib/types";

const HERO_LABELS = [
  "Ready Value",
  "At-Risk Value",
  "Late / Cancel Risk",
  "Backorder Value",
  "Warehouse Bottleneck",
  "Data Freshness",
] as const;

const labelIcons: Record<string, LucideIcon> = {
  "Ready Value": CheckCircle2,
  "At-Risk Value": AlertTriangle,
  "Late / Cancel Risk": CalendarClock,
  "Backorder Value": PackageX,
  "Warehouse Bottleneck": Warehouse,
  "Data Freshness": Database,
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
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"
    >
      {hero.map((metric, index) => {
        const Icon = labelIcons[metric.label] ?? Gauge;
        const featured = metric.label === "Ready Value";

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
                    featured ? "text-3xl" : "text-2xl"
                  )}
                >
                  {metric.value}
                </p>
                <div className="relative mt-3 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">{metric.detail}</span>
                  <span className={cn("inline-flex items-center gap-1", toneClasses[metric.tone])}>
                    {metric.trend}
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
