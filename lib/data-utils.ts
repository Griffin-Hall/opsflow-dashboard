import { addDays, format, parseISO } from "date-fns";
import type { KpiMetric, OpsOrder, OrderStatus, RefreshCycle } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/format";

export const statusOrder: OrderStatus[] = [
  "Ready",
  "At Risk",
  "Delayed",
  "Partial",
  "Backorder",
  "Complete",
];

export const statusStyles: Record<OrderStatus, string> = {
  Ready: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  "At Risk": "border-amber-400/30 bg-amber-400/10 text-amber-200",
  Delayed: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  Partial: "border-indigo-400/30 bg-indigo-400/10 text-indigo-200",
  Backorder: "border-orange-400/30 bg-orange-400/10 text-orange-200",
  Complete: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
};

export const warehouseColors = [
  "#22d3ee",
  "#818cf8",
  "#34d399",
  "#fbbf24",
  "#fb7185",
  "#a78bfa",
];

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function safeDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = parseISO(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function computeMetrics(orders: OpsOrder[]): KpiMetric[] {
  const totalSos = new Set(orders.map((order) => order.soNo)).size;
  const pipeline = sum(orders.map((order) => order.valueAvailable || order.extendedPrice));
  const ready = orders.filter((order) => order.status === "Ready").length;
  const avgDays =
    orders.length === 0
      ? 0
      : sum(orders.map((order) => order.daysDifference)) / orders.length;
  const warehouses = new Set(
    orders
      .map((order) => order.proposedShipWh || order.soWarehouse)
      .filter(Boolean)
  ).size;
  const onTime =
    orders.length === 0
      ? 0
      : (orders.filter((order) => order.daysDifference <= 0 || order.status === "Complete")
          .length /
          orders.length) *
        100;

  return [
    {
      label: "Total SOs",
      value: formatNumber(totalSos),
      detail: `${formatNumber(orders.length)} order lines visible`,
      tone: "cyan",
      trend: "+12 since 7 AM",
    },
    {
      label: "Pipeline Value",
      value: formatCurrency(pipeline, true),
      detail: `${formatCurrency(pipeline)} available value`,
      tone: "indigo",
      trend: "+8.6% vs morning",
    },
    {
      label: "Ready to Release",
      value: formatNumber(ready),
      detail: `${formatPercent((ready / Math.max(orders.length, 1)) * 100)} of visible orders`,
      tone: "emerald",
      trend: "highest impact queue",
    },
    {
      label: "Avg Days Diff",
      value: avgDays.toFixed(1),
      detail: avgDays <= 0 ? "ahead of request" : "needs attention",
      tone: avgDays <= 0 ? "emerald" : avgDays > 3 ? "rose" : "amber",
      trend: avgDays <= 0 ? "green" : "watch",
    },
    {
      label: "Warehouses Active",
      value: formatNumber(warehouses),
      detail: "proposed ship WH count",
      tone: "cyan",
      trend: "EAST / WEST / SOUTH",
    },
    {
      label: "On-Time Potential",
      value: formatPercent(onTime),
      detail: "based on days difference",
      tone: onTime >= 90 ? "emerald" : onTime >= 75 ? "amber" : "rose",
      trend: "+2.7 pp",
    },
  ];
}

export function ordersByWarehouse(orders: OpsOrder[]) {
  const grouped = new Map<string, number>();
  for (const order of orders) {
    const warehouse = order.proposedShipWh || order.soWarehouse || "UNASSIGNED";
    grouped.set(warehouse, (grouped.get(warehouse) ?? 0) + 1);
  }

  return Array.from(grouped.entries())
    .map(([name, value], index) => ({
      fill: warehouseColors[index % warehouseColors.length],
      name,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

export function topCustomersByValue(orders: OpsOrder[], limit = 6) {
  const grouped = new Map<string, number>();
  for (const order of orders) {
    grouped.set(order.bpName, (grouped.get(order.bpName) ?? 0) + order.valueAvailable);
  }

  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function statusBreakdown(orders: OpsOrder[]) {
  return statusOrder.map((status) => ({
    name: status,
    value: orders.filter((order) => order.status === status).length,
  }));
}

export function daysDifferenceHeat(orders: OpsOrder[]) {
  const buckets = [
    { name: "Early", test: (value: number) => value < 0 },
    { name: "On time", test: (value: number) => value === 0 },
    { name: "+1 to +3", test: (value: number) => value > 0 && value <= 3 },
    { name: "+4 days", test: (value: number) => value > 3 },
  ];

  return buckets.map((bucket) => ({
    name: bucket.name,
    value: orders.filter((order) => bucket.test(order.daysDifference)).length,
  }));
}

export function shipDateTrend(orders: OpsOrder[]) {
  const anchor =
    orders
      .map((order) => safeDate(order.proposedShipDate) ?? safeDate(order.estimatedShipDate))
      .find(Boolean) ?? new Date("2026-05-30T12:00:00");

  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(anchor, index);
    const key = format(day, "yyyy-MM-dd");

    return {
      date: format(day, "MMM d"),
      estimated: orders.filter((order) => order.estimatedShipDate === key).length,
      proposed: orders.filter((order) => order.proposedShipDate === key).length,
    };
  });
}

export function topNewestOrders(orders: OpsOrder[], limit = 10) {
  return [...orders]
    .sort((a, b) => {
      const aTime = safeDate(a.orderDate)?.getTime() ?? 0;
      const bTime = safeDate(b.orderDate)?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

export function activityFeed(orders: OpsOrder[], limit = 8) {
  return [...orders]
    .filter((order) => order.activityNotes || order.activitySubject)
    .sort((a, b) => {
      const aTime = safeDate(a.activityDate)?.getTime() ?? 0;
      const bTime = safeDate(b.activityDate)?.getTime() ?? 0;
      return bTime - aTime;
    })
    .slice(0, limit);
}

export function simulateRefresh(orders: OpsOrder[], cycle: RefreshCycle) {
  const delta = cycle === "12:00 PM" ? 1 : -1;

  return orders.map((order, index) => {
    if (index % 7 === 0 && order.status !== "Complete") {
      return {
        ...order,
        daysDifference: Math.max(-5, order.daysDifference - delta),
        status: order.daysDifference - delta <= 0 ? "Ready" : order.status,
        valueAvailable: Math.round(order.valueAvailable * 1.015),
      };
    }

    if (index % 11 === 0 && order.status === "Backorder") {
      return {
        ...order,
        proposedShipQuantity: Math.max(1, Math.round(order.soQty * 0.42)),
        status: "Partial" as const,
        valueAvailable: Math.round(order.extendedPrice * 0.42),
      };
    }

    return order;
  });
}

export function uniqueWarehouses(orders: OpsOrder[]) {
  return Array.from(
    new Set(orders.map((order) => order.proposedShipWh || order.soWarehouse).filter(Boolean))
  ).sort();
}

export type SmartInsightTone = "rose" | "amber" | "emerald" | "cyan";

export type SmartInsight = {
  id: string;
  tone: SmartInsightTone;
  title: string;
  detail: string;
};

export function smartInsights(orders: OpsOrder[]): SmartInsight[] {
  if (orders.length === 0) {
    return [];
  }

  const late = orders.filter((order) => order.daysDifference > 3);
  const atRisk = orders.filter(
    (order) => order.status === "At Risk" || order.status === "Delayed"
  );
  const readyValue = sum(
    orders
      .filter((order) => order.status === "Ready")
      .map((order) => order.valueAvailable)
  );
  const warehouseLoad = ordersByWarehouse(orders);
  const topWarehouse = warehouseLoad[0];
  const backorders = orders.filter((order) => order.status === "Backorder");

  const insights: SmartInsight[] = [];

  if (atRisk.length > 0) {
    const atRiskValue = sum(atRisk.map((order) => order.valueAvailable));
    insights.push({
      id: "at-risk",
      tone: "rose",
      title: `${formatNumber(atRisk.length)} orders need attention today`,
      detail: `${formatCurrency(atRiskValue, true)} of value is At Risk or Delayed. Confirm manual ETAs first.`,
    });
  }

  if (readyValue > 0) {
    insights.push({
      id: "ready-release",
      tone: "emerald",
      title: `${formatCurrency(readyValue, true)} ready to release`,
      detail: "These lines pass all checks and can ship on the next cycle.",
    });
  }

  if (topWarehouse) {
    insights.push({
      id: "warehouse-load",
      tone: "cyan",
      title: `${topWarehouse.name} carries the heaviest load`,
      detail: `${formatNumber(topWarehouse.value)} order lines routed through this warehouse.`,
    });
  }

  if (late.length > 0) {
    insights.push({
      id: "late",
      tone: "amber",
      title: `${formatNumber(late.length)} lines are 4+ days behind request`,
      detail: "Prioritize these for expedite or customer communication.",
    });
  }

  if (backorders.length > 0) {
    insights.push({
      id: "backorder",
      tone: "amber",
      title: `${formatNumber(backorders.length)} lines on backorder`,
      detail: "No proposed quantity available yet — check inventory ATP.",
    });
  }

  return insights;
}
