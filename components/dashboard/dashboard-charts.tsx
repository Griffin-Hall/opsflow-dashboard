"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  daysDifferenceHeat,
  ordersByWarehouse,
  shipDateTrend,
  shipDateWindowLabel,
  statusBreakdown,
  topCustomersByValue,
  warehouseColors,
} from "@/lib/data-utils";
import { formatCurrency } from "@/lib/format";
import type { OpsOrder } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const valueConfig = {
  value: {
    color: "#22d3ee",
    label: "Value",
  },
} satisfies ChartConfig;

const trendConfig = {
  estimated: {
    color: "#818cf8",
    label: "Estimated",
  },
  proposed: {
    color: "#22d3ee",
    label: "Proposed",
  },
} satisfies ChartConfig;

export function DashboardCharts({
  orders,
  referenceDate,
}: {
  orders: OpsOrder[];
  referenceDate?: string;
}) {
  const [ready, setReady] = React.useState(false);
  const warehouseData = ordersByWarehouse(orders);
  const customerData = topCustomersByValue(orders);
  const trendData = shipDateTrend(orders, referenceDate);
  const trendWindow = shipDateWindowLabel(orders, referenceDate);
  const statusData = statusBreakdown(orders);
  const heatData = daysDifferenceHeat(orders);

  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!ready) {
    return (
      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.1fr_0.95fr]">
        {["Orders by Proposed Ship WH", "Top Customers by Available Value", "Status + Days Difference Heat"].map(
          (title) => (
            <Card className="border-white/10 bg-white/[0.045] text-white" key={title}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[270px] rounded-2xl bg-white/[0.06]" />
              </CardContent>
            </Card>
          )
        )}
        <Card className="border-white/10 bg-white/[0.045] text-white xl:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              Proposed vs Estimated Ship Dates ({trendWindow})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] rounded-2xl bg-white/[0.06]" />
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[0.95fr_1.1fr_0.95fr]">
      <Card className="border-white/10 bg-white/[0.045] text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Orders by Proposed Ship WH</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 lg:grid-cols-[1fr_0.9fr] xl:grid-cols-1 2xl:grid-cols-[1fr_0.9fr]">
          <ChartContainer
            className="mx-auto h-[220px] w-[220px] max-w-full"
            config={valueConfig}
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={warehouseData}
                dataKey="value"
                innerRadius={56}
                nameKey="name"
                outerRadius={86}
                paddingAngle={4}
              >
                {warehouseData.map((entry) => (
                  <Cell fill={entry.fill} key={entry.name} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="flex flex-col justify-center gap-2">
            {warehouseData.map((entry) => (
              <div className="flex items-center justify-between gap-3 text-sm" key={entry.name}>
                <span className="flex items-center gap-2 text-slate-300">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: entry.fill }}
                  />
                  {entry.name}
                </span>
                <span className="font-medium">{entry.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.045] text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Top Customers by Available Value</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[270px] w-full" config={valueConfig}>
            <BarChart accessibilityLayer data={customerData} layout="vertical">
              <CartesianGrid horizontal={false} stroke="rgba(148,163,184,0.16)" />
              <XAxis
                axisLine={false}
                dataKey="value"
                hide
                tickLine={false}
                type="number"
              />
              <YAxis
                axisLine={false}
                dataKey="name"
                tickLine={false}
                tickMargin={8}
                type="category"
                width={116}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value))}
                    hideLabel
                  />
                }
              />
              <Bar dataKey="value" radius={[0, 10, 10, 0]}>
                {customerData.map((entry, index) => (
                  <Cell
                    fill={warehouseColors[index % warehouseColors.length]}
                    key={entry.name}
                  />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.045] text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Status + Days Difference Heat</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            {statusData.map((entry) => (
              <div className="grid grid-cols-[82px_1fr_36px] items-center gap-2 text-sm" key={entry.name}>
                <span className="text-slate-400">{entry.name}</span>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-300"
                    style={{
                      width: `${Math.min(
                        100,
                        (entry.value / Math.max(orders.length, 1)) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-right text-slate-200">{entry.value}</span>
              </div>
            ))}
          </div>
          <ChartContainer className="h-[124px] w-full" config={valueConfig}>
            <BarChart accessibilityLayer data={heatData}>
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.16)" />
              <XAxis axisLine={false} dataKey="name" tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="value" fill="#818cf8" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/[0.045] text-white xl:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Proposed vs Estimated Ship Dates ({trendWindow})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer className="h-[250px] w-full" config={trendConfig}>
            <AreaChart accessibilityLayer data={trendData}>
              <defs>
                <linearGradient id="proposed" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.42} />
                  <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="estimated" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(148,163,184,0.16)" />
              <XAxis axisLine={false} dataKey="date" tickLine={false} />
              <YAxis axisLine={false} tickLine={false} width={28} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                dataKey="estimated"
                fill="url(#estimated)"
                stroke="#818cf8"
                strokeWidth={2}
                type="monotone"
              />
              <Area
                dataKey="proposed"
                fill="url(#proposed)"
                stroke="#22d3ee"
                strokeWidth={2}
                type="monotone"
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </section>
  );
}
