"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, CircleGauge } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { KpiMetric } from "@/lib/types";

const toneClasses: Record<KpiMetric["tone"], string> = {
  amber: "from-amber-400/16 to-transparent text-amber-200 ring-amber-300/20",
  cyan: "from-cyan-400/16 to-transparent text-cyan-200 ring-cyan-300/20",
  emerald: "from-emerald-400/16 to-transparent text-emerald-200 ring-emerald-300/20",
  indigo: "from-indigo-400/16 to-transparent text-indigo-200 ring-indigo-300/20",
  rose: "from-rose-400/16 to-transparent text-rose-200 ring-rose-300/20",
};

export function KpiCard({ metric, index }: { metric: KpiMetric; index: number }) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      initial={{ opacity: 0, y: 12 }}
      transition={{ delay: index * 0.04, duration: 0.38 }}
    >
      <Card className="overflow-hidden border-white/10 bg-white/[0.045] text-white shadow-xl shadow-black/20">
        <CardContent className="relative p-4">
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-20 bg-gradient-to-b",
              toneClasses[metric.tone]
            )}
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase text-slate-400">
                {metric.label}
              </p>
              <p className="text-2xl font-semibold tracking-normal text-white">
                {metric.value}
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl bg-white/[0.05] p-2 ring-1",
                toneClasses[metric.tone]
              )}
            >
              <CircleGauge />
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
