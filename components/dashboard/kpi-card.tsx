"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CircleGauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KpiMetric } from "@/lib/types";

const toneClasses: Record<KpiMetric["tone"], string> = {
  amber: "border-amber-300/40 bg-amber-300/10 text-amber-200 ring-amber-300/20",
  cyan: "border-cyan-300/40 bg-cyan-300/10 text-cyan-200 ring-cyan-300/20",
  emerald: "border-emerald-300/40 bg-emerald-300/10 text-emerald-200 ring-emerald-300/20",
  indigo: "border-indigo-300/40 bg-indigo-300/10 text-indigo-200 ring-indigo-300/20",
  rose: "border-rose-300/40 bg-rose-300/10 text-rose-200 ring-rose-300/20",
};

export function KpiCard({ metric, index }: { metric: KpiMetric; index: number }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.04, duration: 0.38 }}
    >
      <Card className="ops-surface overflow-hidden rounded-xl text-white">
        <CardContent className="relative p-4">
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase text-slate-400">
                {metric.label}
              </p>
              <p className="text-2xl font-semibold leading-none tracking-normal text-white">
                {metric.value}
              </p>
            </div>
            <div
              className={cn(
                "rounded-lg border p-1.5 ring-1",
                toneClasses[metric.tone]
              )}
            >
              <CircleGauge className="size-4" />
            </div>
          </div>
          <div className="relative mt-4 flex items-center justify-between gap-2 text-xs">
            <span className="text-slate-400">{metric.detail}</span>
            <span className={cn("inline-flex items-center gap-1", toneClasses[metric.tone])}>
              {metric.trend}
              <ArrowUpRight />
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
