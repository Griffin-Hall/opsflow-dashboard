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
  amber: "border-amber-300/45 bg-amber-300/10 text-amber-200 ring-amber-300/25",
  cyan: "border-cyan-300/45 bg-cyan-300/10 text-cyan-200 ring-cyan-300/25",
  emerald: "border-emerald-300/45 bg-emerald-300/10 text-emerald-200 ring-emerald-300/25",
  indigo: "border-indigo-300/45 bg-indigo-300/10 text-indigo-200 ring-indigo-300/25",
  rose: "border-rose-300/45 bg-rose-300/10 text-rose-200 ring-rose-300/25",
};

const toneBarClasses: Record<KpiMetric["tone"], string> = {
  amber: "bg-amber-300/70",
  cyan: "bg-cyan-300/70",
  emerald: "bg-emerald-300/70",
  indigo: "bg-indigo-300/70",
  rose: "bg-rose-300/70",
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
                "ops-surface h-full overflow-hidden rounded-xl text-white transition-colors",
                featured && "border-emerald-300/25 bg-emerald-300/[0.055]"
              )}
            >
              <CardContent className="relative p-4">
                <span
                  aria-hidden
                  className={cn("absolute inset-x-4 top-0 h-px", toneBarClasses[metric.tone])}
                />
                <div className="relative flex items-start justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-normal text-slate-400">
                    {metric.label}
                  </p>
                  <span
                    className={cn(
                      "rounded-lg border p-1.5 ring-1",
                      toneClasses[metric.tone]
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                </div>
                <p
                  className={cn(
                    "relative mt-3 font-semibold tabular-nums tracking-normal text-white",
                    featured ? "text-[1.9rem] leading-none" : "text-2xl leading-none"
                  )}
                >
                  {metric.value}
                </p>
                <div className="relative mt-3 flex items-end justify-between gap-2 text-xs">
                  <span className="text-slate-400">{metric.detail}</span>
                  <span className={cn("inline-flex shrink-0 items-center gap-1", toneClasses[metric.tone])}>
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
