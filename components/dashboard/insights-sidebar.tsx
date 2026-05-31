"use client";

import * as React from "react";
import {
  ArrowRight,
  Clock3,
  Lightbulb,
  PanelRightClose,
  PanelRightOpen,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  activityFeed,
  smartInsights,
  topNewestOrders,
  type SmartInsightTone,
} from "@/lib/data-utils";
import { formatCurrency, formatShortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OpsOrder } from "@/lib/types";

const insightToneClasses: Record<SmartInsightTone, string> = {
  rose: "border-rose-400/25 bg-rose-400/[0.06]",
  amber: "border-amber-400/25 bg-amber-400/[0.06]",
  emerald: "border-emerald-400/25 bg-emerald-400/[0.06]",
  cyan: "border-cyan-400/25 bg-cyan-400/[0.06]",
};

const insightDotClasses: Record<SmartInsightTone, string> = {
  rose: "bg-rose-400",
  amber: "bg-amber-400",
  emerald: "bg-emerald-400",
  cyan: "bg-cyan-400",
};

function SmartInsightsPanel({ orders }: { orders: OpsOrder[] }) {
  const insights = smartInsights(orders);

  if (insights.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-slate-500">
        No signals to surface for the current view.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {insights.map((insight) => (
        <div
          className={cn(
            "rounded-xl border p-3",
            insightToneClasses[insight.tone]
          )}
          key={insight.id}
        >
          <div className="flex items-start gap-2.5">
            <span
              aria-hidden
              className={cn(
                "mt-1.5 size-2 shrink-0 rounded-full",
                insightDotClasses[insight.tone]
              )}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white">{insight.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{insight.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentActivityPanel({ orders }: { orders: OpsOrder[] }) {
  const feed = activityFeed(orders);

  if (feed.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-slate-500">
        No recent activity captured.
      </p>
    );
  }

  return (
    <ol className="relative flex flex-col gap-4 pl-4">
      <span aria-hidden className="absolute inset-y-1 left-[5px] w-px bg-white/10" />
      {feed.map((order) => (
        <li className="relative" key={order.id}>
          <span
            aria-hidden
            className="absolute -left-4 top-1.5 size-2.5 rounded-full border border-cyan-300/40 bg-slate-950"
          />
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-white">
              {order.activitySubject || "Ops update"}
            </p>
            <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
              <Clock3 className="size-3" />
              {formatShortDate(order.activityDate)}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {order.soNo} • {order.bpName}
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-400">
            {order.activityNotes || "No activity notes captured."}
          </p>
        </li>
      ))}
    </ol>
  );
}

function NewestOrdersPanel({ orders }: { orders: OpsOrder[] }) {
  const newest = topNewestOrders(orders, 8);

  if (newest.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-slate-500">
        No orders to show yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {newest.map((order) => (
        <div
          className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.025] p-3"
          key={order.id}
        >
          <span className="font-mono text-xs text-cyan-200">{order.soNo}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{order.bpName}</p>
            <p className="truncate text-xs text-slate-500">
              {formatShortDate(order.orderDate)} • {order.product || "No product"}
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-white">
            {formatCurrency(order.valueAvailable, true)}
            <ArrowRight className="size-3.5 text-slate-500" />
          </span>
        </div>
      ))}
    </div>
  );
}

export function InsightsSidebar({
  orders,
  collapsed,
  onCollapsedChange,
}: {
  orders: OpsOrder[];
  collapsed: boolean;
  onCollapsedChange: (value: boolean) => void;
}) {
  const insightCount = smartInsights(orders).length;

  if (collapsed) {
    return (
      <aside className="ops-surface flex flex-col items-center gap-3 rounded-xl p-2 text-white">
        <Button
          aria-label="Expand insights panel"
          onClick={() => onCollapsedChange(false)}
          size="icon-sm"
          variant="ghost"
        >
          <PanelRightOpen />
        </Button>
        <div className="relative">
          <Lightbulb className="size-5 text-cyan-300" />
          {insightCount > 0 && (
            <span className="absolute -right-2 -top-2 flex size-4 items-center justify-center rounded-full bg-cyan-400 text-[10px] font-semibold text-slate-950">
              {insightCount}
            </span>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside className="ops-surface flex flex-col rounded-xl p-4 text-white">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-50">
          <Sparkles className="size-4 text-cyan-300" />
          Insights
        </span>
        <Button
          aria-label="Collapse insights panel"
          onClick={() => onCollapsedChange(true)}
          size="icon-sm"
          variant="ghost"
        >
          <PanelRightClose />
        </Button>
      </div>

      <Tabs className="gap-3" defaultValue="smart">
        <TabsList className="ops-surface-flat h-9 w-full rounded-lg p-1">
          <TabsTrigger value="smart">Smart</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="newest">Newest</TabsTrigger>
        </TabsList>
        <ScrollArea className="h-[560px] pr-3">
          <TabsContent value="smart">
            <SmartInsightsPanel orders={orders} />
          </TabsContent>
          <TabsContent value="activity">
            <RecentActivityPanel orders={orders} />
          </TabsContent>
          <TabsContent value="newest">
            <NewestOrdersPanel orders={orders} />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </aside>
  );
}
