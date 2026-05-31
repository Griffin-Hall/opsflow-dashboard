"use client";

import { AlertTriangle, Clock3, MessageSquareText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { activityFeed } from "@/lib/data-utils";
import { formatShortDate } from "@/lib/format";
import type { OpsOrder } from "@/lib/types";

export function ActivityFeed({ orders }: { orders: OpsOrder[] }) {
  const feed = activityFeed(orders);
  const cancelRisk = orders.filter(
    (order) => order.status === "At Risk" || order.status === "Delayed"
  ).length;

  return (
    <aside className="flex flex-col gap-4">
      <button className="group rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] p-4 text-left transition hover:bg-cyan-300/[0.1]">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-cyan-100">
            <AlertTriangle className="size-4" />
            AI Insight
          </span>
          <Badge className="rounded-md border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
            Live
          </Badge>
        </div>
        <p className="mt-3 text-lg font-semibold tracking-normal text-white">
          {cancelRisk} orders risk Cancel By Date
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Prioritize delayed high-value accounts, then confirm manual ETAs with
          customer service.
        </p>
      </button>

      <Card className="ops-surface rounded-xl text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareText className="size-4 text-cyan-300" />
            Today&apos;s Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {feed.map((order) => (
            <div className="rounded-lg border border-white/[0.08] bg-white/[0.025] p-3" key={order.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-white">{order.activitySubject || "Ops update"}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {order.soNo} • {order.bpName}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                  <Clock3 className="size-3" />
                  {formatShortDate(order.activityDate)}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                {order.activityNotes || "No activity notes captured."}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
