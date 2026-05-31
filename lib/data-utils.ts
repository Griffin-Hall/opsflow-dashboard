import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";
import type { DataHealth, KpiMetric, OpsOrder, OrderStatus, RefreshCycle } from "@/lib/types";
import { formatCurrency, formatNumber, formatUtcTime } from "@/lib/format";

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

type PriorityInput = Pick<
  OpsOrder,
  | "atpDate"
  | "cancelByDate"
  | "daysDifference"
  | "manualEta"
  | "proposedShipDate"
  | "proposedShipWh"
  | "proposedShipQuantity"
  | "soQty"
  | "status"
  | "valueAvailable"
>;

export function deriveOrderPriority(
  order: PriorityInput,
  referenceDate: Date = new Date()
) {
  const cancelDate = safeDate(order.cancelByDate);
  const daysUntilCancel = cancelDate
    ? differenceInCalendarDays(cancelDate, referenceDate)
    : null;
  const cancelRisk = daysUntilCancel !== null && daysUntilCancel <= 3;
  const valueScore = Math.min(30, Math.floor(order.valueAvailable / 10000));
  const latenessScore = Math.max(0, Math.min(35, order.daysDifference * 5));
  const statusScore =
    order.status === "Delayed"
      ? 25
      : order.status === "At Risk"
        ? 18
        : order.status === "Backorder"
          ? 14
          : 0;
  const missingAtp =
    order.status !== "Backorder" &&
    order.status !== "Complete" &&
    !order.atpDate;
  const incompleteProposedQty =
    order.status !== "Backorder" &&
    order.status !== "Complete" &&
    order.proposedShipQuantity < order.soQty;
  const scheduleScore = missingAtp || incompleteProposedQty ? 15 : 0;
  const etaScore =
    !order.manualEta && order.status !== "Ready" && order.status !== "Complete" ? 8 : 0;
  const cancelScore = cancelRisk ? 25 : 0;
  const priorityScore = Math.min(
    100,
    valueScore + latenessScore + statusScore + scheduleScore + etaScore + cancelScore
  );
  let priorityReason = "Normal release priority";
  if (daysUntilCancel !== null && daysUntilCancel < 0) {
    priorityReason = "Cancel-by date has passed";
  } else if (cancelRisk) {
    priorityReason = "Cancel-by date is within 3 days";
  } else if (missingAtp) {
    priorityReason = "Missing ATP date";
  } else if (incompleteProposedQty) {
    priorityReason = "Proposed quantity is below SO quantity";
  } else if (order.daysDifference > 0) {
    priorityReason = `${order.daysDifference} days behind requested date`;
  } else if (order.status === "Backorder") {
    priorityReason = "No available proposed quantity";
  }

  return { cancelRisk, priorityReason, priorityScore };
}

function freshnessTone(dataHealth?: DataHealth): KpiMetric["tone"] {
  if (!dataHealth) {
    return "cyan";
  }

  if (dataHealth.issues.some((issue) => issue.severity === "error")) {
    return "rose";
  }

  if (dataHealth.isSample || dataHealth.issues.length > 0) {
    return "amber";
  }

  return "emerald";
}

export function computeMetrics(orders: OpsOrder[], dataHealth?: DataHealth): KpiMetric[] {
  const readyOrders = orders.filter((order) => order.status === "Ready");
  const atRiskOrders = orders.filter(
    (order) => order.status === "At Risk" || order.status === "Delayed"
  );
  const lateOrCancelRisk = orders.filter(
    (order) => order.daysDifference > 3 || order.cancelRisk
  );
  const backorders = orders.filter((order) => order.status === "Backorder");
  const readyValue = sum(readyOrders.map((order) => order.valueAvailable));
  const atRiskValue = sum(atRiskOrders.map((order) => order.valueAvailable));
  const lateOrCancelRiskValue = sum(lateOrCancelRisk.map((order) => order.valueAvailable));
  const backorderValue = sum(backorders.map((order) => order.extendedPrice));
  const warehouseLoad = ordersByWarehouse(orders);
  const topWarehouse = warehouseLoad[0];

  return [
    {
      label: "Ready Value",
      value: formatCurrency(readyValue, true),
      detail: `${formatNumber(readyOrders.length)} lines full qty + ATP`,
      tone: "emerald",
      trend: "ATP confirmed",
    },
    {
      label: "At-Risk Value",
      value: formatCurrency(atRiskValue, true),
      detail: `${formatNumber(atRiskOrders.length)} lines at risk or delayed`,
      tone: atRiskOrders.length > 0 ? "amber" : "emerald",
      trend: "current snapshot",
    },
    {
      label: "Late / Cancel Risk",
      value: formatNumber(lateOrCancelRisk.length),
      detail: `${formatCurrency(lateOrCancelRiskValue, true)} exposed value`,
      tone: lateOrCancelRisk.length > 0 ? "rose" : "emerald",
      trend: "days diff + cancel date",
    },
    {
      label: "Backorder Value",
      value: formatCurrency(backorderValue, true),
      detail: `${formatNumber(backorders.length)} lines no proposed qty`,
      tone: backorders.length > 0 ? "amber" : "emerald",
      trend: "full order exposure",
    },
    {
      label: "Warehouse Bottleneck",
      value: topWarehouse?.name ?? "None",
      detail: topWarehouse
        ? `${formatNumber(topWarehouse.value)} visible lines routed`
        : "No warehouse load",
      tone: "cyan",
      trend: "highest line count",
    },
    {
      label: "Data Freshness",
      value: dataHealth ? formatUtcTime(dataHealth.refreshedAt) : "Unknown",
      detail: dataHealth
        ? `${formatNumber(dataHealth.loadedOrderCount)} loaded from ${dataHealth.mode}`
        : `${formatNumber(orders.length)} loaded`,
      tone: freshnessTone(dataHealth),
      trend: dataHealth?.isSample ? "sample mode" : "excel source",
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

function dateKey(value: string | null) {
  return safeDate(value) ? value : null;
}

function shipDateAnchorKey(orders: OpsOrder[], referenceDateKey?: string) {
  const fallback = referenceDateKey ?? new Date().toISOString().slice(0, 10);
  const dateKeys = orders
    .flatMap((order) => [dateKey(order.atpDate), dateKey(order.estimatedShipDate)])
    .filter((value): value is string => Boolean(value))
    .sort();
  const nextAvailableDate = dateKeys.find((value) => value >= fallback);
  if (nextAvailableDate) {
    return nextAvailableDate;
  }

  const latestAvailableDate = dateKeys[dateKeys.length - 1];
  return latestAvailableDate
    ? format(addDays(parseISO(latestAvailableDate), -6), "yyyy-MM-dd")
    : fallback;
}

export function shipDateTrend(orders: OpsOrder[], referenceDateKey?: string) {
  const anchor = parseISO(shipDateAnchorKey(orders, referenceDateKey));

  return Array.from({ length: 7 }, (_, index) => {
    const day = addDays(anchor, index);
    const key = format(day, "yyyy-MM-dd");

    return {
      date: format(day, "MMM d"),
      estimated: orders.filter((order) => order.estimatedShipDate === key).length,
      proposed: orders.filter((order) => order.atpDate === key).length,
    };
  });
}

export function shipDateWindowLabel(orders: OpsOrder[], referenceDateKey?: string) {
  const trend = shipDateTrend(orders, referenceDateKey);
  const first = trend[0]?.date ?? "Today";
  const last = trend[trend.length - 1]?.date ?? "Next 7 days";
  return `${first} - ${last}`;
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
      const nextOrder = {
        ...order,
        daysDifference: Math.max(-5, order.daysDifference - delta),
        status:
          order.proposedShipQuantity === order.soQty && order.atpDate
            ? ("Ready" as const)
            : order.status,
        valueAvailable: Math.round(order.valueAvailable * 1.015),
      };

      return { ...nextOrder, ...deriveOrderPriority(nextOrder) };
    }

    if (index % 11 === 0 && order.status === "Backorder") {
      const nextOrder = {
        ...order,
        proposedShipQuantity: Math.max(1, Math.round(order.soQty * 0.42)),
        status: "Partial" as const,
        valueAvailable: Math.round(order.extendedPrice * 0.42),
      };

      return { ...nextOrder, ...deriveOrderPriority(nextOrder) };
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
      detail: "No proposed quantity available yet - check inventory ATP.",
    });
  }

  return insights;
}
