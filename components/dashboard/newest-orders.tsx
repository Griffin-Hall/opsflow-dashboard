"use client";

import { ArrowRight, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { topNewestOrders } from "@/lib/data-utils";
import { formatCurrency, formatShortDate } from "@/lib/format";
import type { OpsOrder } from "@/lib/types";

export function NewestOrders({ orders }: { orders: OpsOrder[] }) {
  const newest = topNewestOrders(orders);

  return (
    <Card className="border-white/10 bg-white/[0.045] text-white">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarDays className="text-cyan-300" />
          Top 10 Newest Orders
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2">
        {newest.map((order) => (
          <div
            className="grid grid-cols-[74px_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/45 p-3"
            key={order.id}
          >
            <span className="font-mono text-sm text-cyan-200">{order.soNo}</span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{order.bpName}</p>
              <p className="truncate text-xs text-slate-500">
                {formatShortDate(order.orderDate)} • {order.product || "No product"}
              </p>
            </div>
            <span className="flex items-center gap-2 text-sm font-semibold text-white">
              {formatCurrency(order.valueAvailable, true)}
              <ArrowRight className="text-slate-500" />
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
