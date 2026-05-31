"use client";

import * as React from "react";
import {
  Activity,
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  Gauge,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackageCheck,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Table2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { InsightsSidebar } from "@/components/dashboard/insights-sidebar";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { KpiHero } from "@/components/dashboard/kpi-hero";
import { OrdersTable } from "@/components/dashboard/orders-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  computeMetrics,
  ordersByWarehouse,
  simulateRefresh,
  statusOrder,
  topCustomersByValue,
  uniqueWarehouses,
  warehouseColors,
} from "@/lib/data-utils";
import { formatCurrency, formatNumber, formatUtcTimestamp } from "@/lib/format";
import { appPath } from "@/lib/routing";
import { useOpsStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type {
  DataHealth,
  KpiMetric,
  OperationsPayload,
  OpsOrder,
  OrderStatus,
  RefreshCycle,
} from "@/lib/types";

type DashboardTab = "overview" | "orders" | "ready" | "pipeline" | "activities" | "settings";

const navItems = [
  { icon: Gauge, label: "Overview", value: "overview" },
  { icon: Table2, label: "Live Orders", value: "orders" },
  { icon: PackageCheck, label: "Ready Queue", value: "ready" },
  { icon: Activity, label: "Activities", value: "activities" },
  { icon: BarChart3, label: "Analytics", value: "pipeline" },
  { icon: Settings, label: "Settings", value: "settings" },
] satisfies Array<{ icon: LucideIcon; label: string; value: DashboardTab }>;

function mostSevereIssue(dataHealth: DataHealth) {
  return (
    dataHealth.issues.find((issue) => issue.severity === "error") ??
    dataHealth.issues.find((issue) => issue.severity === "warning") ??
    dataHealth.issues[0]
  );
}

function Sidebar({
  activeTab,
  collapsed,
  dataHealth,
  onCollapse,
  onTabChange,
}: {
  activeTab: DashboardTab;
  collapsed: boolean;
  dataHealth: DataHealth;
  onCollapse?: (value: boolean) => void;
  onTabChange: (value: DashboardTab) => void;
}) {
  const sourceLabel = dataHealth.isSample ? "Demo Safe" : "Local Excel";
  const sourceDetail = dataHealth.isSample
    ? "Sample rows are safe for public builds and demos."
    : "The workbook is read locally. Keep real data out of public repos.";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-white/10 bg-slate-950/82 text-white backdrop-blur-xl transition-[width] duration-300",
        collapsed ? "w-[76px]" : "w-[252px]"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-200 ring-1 ring-cyan-300/30">
            <Sparkles />
          </div>
          {!collapsed && (
            <div>
              <p className="font-semibold tracking-wide">OpsFlow</p>
              <p className="text-xs text-slate-500">Operations</p>
            </div>
          )}
        </div>
        {onCollapse && (
          <Button
            aria-label="Collapse sidebar"
            onClick={() => onCollapse(!collapsed)}
            size="icon-sm"
            variant="ghost"
          >
            {collapsed ? <ChevronsRight /> : <ChevronsLeft />}
          </Button>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.value === activeTab;
          return (
            <button
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-10 items-center gap-3 rounded-xl px-3 text-sm transition",
                active
                  ? "bg-cyan-300/12 text-cyan-100 ring-1 ring-cyan-300/20"
                  : "text-slate-400 hover:bg-white/[0.04] hover:text-white",
                collapsed && "justify-center px-0"
              )}
              key={item.label}
              onClick={() => onTabChange(item.value)}
              type="button"
            >
              <Icon />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-3">
        <div
          className={cn(
            "rounded-2xl border border-white/10 bg-white/[0.04] p-3",
            collapsed && "p-2"
          )}
        >
          <div className="flex items-center gap-2 text-cyan-200">
            <ShieldCheck />
            {!collapsed && <span className="text-sm font-medium">{sourceLabel}</span>}
          </div>
          {!collapsed && (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {sourceDetail}
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

function DataHealthStrip({
  dataHealth,
  sourceLabel,
}: {
  dataHealth: DataHealth;
  sourceLabel: string;
}) {
  const issue = mostSevereIssue(dataHealth);
  const issueTone =
    issue?.severity === "error"
      ? "border-rose-300/30 bg-rose-300/10 text-rose-100"
      : issue?.severity === "warning"
        ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
        : "border-cyan-300/25 bg-cyan-300/10 text-cyan-100";

  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <ShieldCheck className="size-4 text-cyan-300" />
          <span className="font-medium text-white">Data Health</span>
          <Badge
            className={
              dataHealth.isSample
                ? "border-amber-300/30 bg-amber-300/10 text-amber-100"
                : "border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
            }
          >
            {dataHealth.isSample ? "Sample Data" : "Excel Data"}
          </Badge>
          <span className="text-slate-500">{sourceLabel}</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs">
          <span>{formatNumber(dataHealth.loadedOrderCount)} loaded</span>
          <span>{formatNumber(dataHealth.rowCount)} source rows</span>
          <span>{formatNumber(dataHealth.droppedRows)} dropped</span>
          <span>{formatNumber(dataHealth.missingColumns.length)} missing columns</span>
        </div>
      </div>
      {issue && (
        <div className={cn("mt-3 rounded-xl border px-3 py-2 text-xs", issueTone)}>
          {issue.message}
        </div>
      )}
    </section>
  );
}

function PipelineView({ orders, extraMetrics }: { orders: OpsOrder[]; extraMetrics: KpiMetric[] }) {
  const customers = topCustomersByValue(orders, 8);
  const warehouses = ordersByWarehouse(orders);
  const maxCustomerValue = Math.max(...customers.map((c) => c.value), 1);
  const maxWarehouse = Math.max(...warehouses.map((w) => w.value), 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {extraMetrics.map((metric, index) => (
          <KpiCard index={index} key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-white">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <TrendingUp className="size-4 text-cyan-300" />
            Top Customers by Available Value
          </h3>
          <div className="mt-4 flex flex-col gap-3">
            {customers.map((customer, index) => (
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5" key={customer.name}>
                <span className="truncate text-sm text-slate-200">{customer.name}</span>
                <span className="text-right text-sm font-medium tabular-nums text-cyan-200">
                  {formatCurrency(customer.value, true)}
                </span>
                <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: warehouseColors[index % warehouseColors.length],
                      width: `${(customer.value / maxCustomerValue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-white">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <PackageCheck className="size-4 text-cyan-300" />
            Volume by Proposed Ship Warehouse
          </h3>
          <div className="mt-4 flex flex-col gap-3">
            {warehouses.map((warehouse) => (
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5" key={warehouse.name}>
                <span className="flex items-center gap-2 truncate text-sm text-slate-200">
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ background: warehouse.fill }}
                  />
                  {warehouse.name}
                </span>
                <span className="text-right text-sm font-medium tabular-nums text-white">
                  {formatNumber(warehouse.value)}
                </span>
                <div className="col-span-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      background: warehouse.fill,
                      width: `${(warehouse.value / maxWarehouse) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SettingsView({
  cycle,
  dataHealth,
  sourceLabel,
}: {
  cycle: RefreshCycle;
  dataHealth: DataHealth;
  sourceLabel: string;
}) {
  const issue = mostSevereIssue(dataHealth);

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {[
        [
          "Data Source",
          sourceLabel,
          dataHealth.isSample
            ? "Portfolio-safe sample rows are being displayed."
            : "Reads the configured workbook on the server.",
        ],
        ["Refresh Cycle", cycle, "Sample mode toggles between morning and midday snapshots."],
        [
          "Rows Loaded",
          formatNumber(dataHealth.loadedOrderCount),
          `${formatNumber(dataHealth.rowCount)} source rows, ${formatNumber(dataHealth.droppedRows)} dropped.`,
        ],
      ].map(([label, value, detail]) => (
        <div
          className="rounded-3xl border border-white/10 bg-white/[0.045] p-5 text-white"
          key={label}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-3 text-2xl font-semibold tracking-normal text-white">{value}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
        </div>
      ))}
      <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5 text-cyan-50 lg:col-span-3">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Settings className="size-4" />
          Workbook Configuration
        </h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-cyan-100/80">
          Override the local workbook with <span className="font-mono">OPSFLOW_EXCEL_PATH</span>.
          If no workbook is available, the dashboard uses portfolio-safe sample data and reports
          the reason above.
        </p>
        <div className="mt-4 grid gap-2 text-xs text-cyan-100/80 md:grid-cols-2">
          <span>Last refreshed: {formatUtcTimestamp(dataHealth.refreshedAt)}</span>
          <span>
            Missing columns:{" "}
            {dataHealth.missingColumns.length > 0
              ? dataHealth.missingColumns.join(", ")
              : "None"}
          </span>
          <span className="md:col-span-2">
            Health note: {issue?.message ?? "No data health issues detected."}
          </span>
        </div>
      </div>
    </section>
  );
}

export function DashboardShell({ initialData }: { initialData: OperationsPayload }) {
  const [orders, setOrders] = React.useState<OpsOrder[]>(initialData.orders);
  const [sourceLabel, setSourceLabel] = React.useState(initialData.sourceLabel);
  const [rowCount, setRowCount] = React.useState(initialData.rowCount);
  const [dataHealth, setDataHealth] = React.useState(initialData.dataHealth);
  const [refreshing, setRefreshing] = React.useState(false);
  const [lightMode, setLightMode] = React.useState(false);
  const [tab, setTab] = React.useState<DashboardTab>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const {
    collapsed,
    cycle,
    globalSearch,
    setCollapsed,
    setCycle,
    setGlobalSearch,
    setStatus,
    setWarehouse,
    status,
    warehouse,
  } = useOpsStore();

  const metrics = React.useMemo(() => computeMetrics(orders, dataHealth), [dataHealth, orders]);
  const extraMetrics = React.useMemo(
    () =>
      metrics.filter((metric) =>
        ["Warehouse Bottleneck", "Data Freshness"].includes(metric.label)
      ),
    [metrics]
  );
  const warehouses = React.useMemo(() => uniqueWarehouses(orders), [orders]);
  const readyOrders = React.useMemo(
    () => orders.filter((order) => order.status === "Ready"),
    [orders]
  );

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", !lightMode);
  }, [lightMode]);

  async function refreshData() {
    const nextCycle: RefreshCycle = cycle === "7:00 AM" ? "12:00 PM" : "7:00 AM";
    setRefreshing(true);
    try {
      const response = await fetch(appPath("/api/orders"), { cache: "no-store" });
      const payload = (await response.json()) as OperationsPayload;
      const nextOrders =
        payload.source === "sample" ? simulateRefresh(payload.orders, nextCycle) : payload.orders;
      setOrders(nextOrders);
      setSourceLabel(payload.sourceLabel);
      setRowCount(payload.rowCount);
      setDataHealth(payload.dataHealth);
      setCycle(nextCycle);
      toast.success("Refresh complete", {
        description: `Loaded ${nextOrders.length} order lines from ${payload.sourceLabel}.`,
      });
    } catch {
      toast.error("Refresh failed", {
        description: "The dashboard kept the last successful order snapshot.",
      });
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,#0f2b46_0,#020617_32%,#030712_100%)] text-white">
      <div className="fixed inset-0 pointer-events-none opacity-45">
        <div className="data-stream absolute inset-x-0 top-0 h-[360px]" />
      </div>

      <div className="relative flex min-h-dvh">
        <div className="hidden lg:block">
          <Sidebar
            activeTab={tab}
            collapsed={collapsed}
            dataHealth={dataHealth}
            onCollapse={setCollapsed}
            onTabChange={setTab}
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/78 px-4 py-3 backdrop-blur-xl sm:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button className="lg:hidden" size="icon" variant="outline">
                      <Menu />
                    </Button>
                  </SheetTrigger>
                  <SheetContent className="border-white/10 bg-slate-950 p-0" side="left">
                    <SheetHeader className="sr-only">
                      <SheetTitle>OpsFlow navigation</SheetTitle>
                      <SheetDescription>Mobile operations dashboard navigation.</SheetDescription>
                    </SheetHeader>
                    <Sidebar
                      activeTab={tab}
                      collapsed={false}
                      dataHealth={dataHealth}
                      onTabChange={setTab}
                    />
                  </SheetContent>
                </Sheet>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-semibold tracking-normal sm:text-xl">
                      Acme Global Supply - Operations Center
                    </h1>
                    <Badge
                      className={
                        dataHealth.isSample
                          ? "border-amber-300/25 bg-amber-300/10 text-amber-100"
                          : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
                      }
                    >
                      {dataHealth.isSample ? "Sample Data" : "Excel Data"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Last Refreshed: {formatUtcTimestamp(dataHealth.refreshedAt)} - {sourceLabel} -{" "}
                    {formatNumber(rowCount)} rows
                  </p>
                </div>
              </div>

              <div className="grid gap-2 md:grid-cols-[minmax(200px,1fr)_140px_130px_auto_auto_auto] xl:min-w-[760px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <Input
                    aria-label="Search orders"
                    className="h-9 border-white/10 bg-slate-950/70 pl-9 text-white placeholder:text-slate-500"
                    onChange={(event) => setGlobalSearch(event.target.value)}
                    placeholder="Search orders, SKUs, customers..."
                    value={globalSearch}
                  />
                </div>
                <Select onValueChange={setWarehouse} value={warehouse}>
                  <SelectTrigger className="h-9 border-white/10 bg-slate-950/70 text-white">
                    <SelectValue placeholder="Warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="All">All WH</SelectItem>
                      {warehouses.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <Select
                  onValueChange={(value) => setStatus(value as OrderStatus | "All")}
                  value={status}
                >
                  <SelectTrigger className="h-9 border-white/10 bg-slate-950/70 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="All">All status</SelectItem>
                      {statusOrder.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 md:contents">
                  <Button
                    className="h-9 flex-1 md:flex-none"
                    disabled={refreshing}
                    onClick={refreshData}
                    variant="outline"
                  >
                    <RefreshCcw data-icon="inline-start" />
                    Refresh
                  </Button>
                  <Button
                    aria-label={lightMode ? "Switch to dark mode" : "Switch to light mode"}
                    className="h-9"
                    onClick={() => setLightMode(!lightMode)}
                    size="icon"
                    variant="outline"
                  >
                    {lightMode ? <Moon /> : <Sun />}
                  </Button>
                  <Button aria-label="Sign out" className="h-9" size="icon" variant="ghost">
                    <LogOut />
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6">
            <DataHealthStrip dataHealth={dataHealth} sourceLabel={sourceLabel} />

            {/* Instant pulse-check: decision-focused headline KPIs */}
            {refreshing ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
                {Array.from({ length: 6 }, (_, index) => (
                  <Skeleton className="h-[150px] rounded-3xl bg-white/[0.06]" key={index} />
                ))}
              </div>
            ) : (
              <KpiHero metrics={metrics} />
            )}

            <Tabs
              onValueChange={(value) => setTab(value as DashboardTab)}
              value={tab}
            >
              <TabsList className="relative z-10 h-9 w-full max-w-full justify-start gap-1 overflow-x-auto overflow-y-hidden bg-slate-950/60 sm:w-fit">
                <TabsTrigger className="gap-1.5" value="overview">
                  <LayoutDashboard />
                  Overview
                </TabsTrigger>
                <TabsTrigger className="gap-1.5" value="orders">
                  <Table2 />
                  Live Orders
                </TabsTrigger>
                <TabsTrigger className="gap-1.5" value="ready">
                  <PackageCheck />
                  Ready to Release
                </TabsTrigger>
                <TabsTrigger className="gap-1.5" value="pipeline">
                  <BarChart3 />
                  Pipeline
                </TabsTrigger>
                <TabsTrigger className="gap-1.5" value="activities">
                  <Activity />
                  Activities
                </TabsTrigger>
                <TabsTrigger className="gap-1.5" value="settings">
                  <Settings />
                  Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent className="mt-4" value="overview">
                <DashboardCharts
                  orders={orders}
                  referenceDate={dataHealth.refreshedAt.slice(0, 10)}
                />
              </TabsContent>

              <TabsContent className="mt-4" value="orders">
                <div
                  className={cn(
                    "grid gap-4",
                    sidebarCollapsed
                      ? "xl:grid-cols-[1fr_72px]"
                      : "xl:grid-cols-[minmax(0,1fr)_360px]"
                  )}
                >
                  <OrdersTable orders={orders} previewRows={6} />
                  <InsightsSidebar
                    collapsed={sidebarCollapsed}
                    onCollapsedChange={setSidebarCollapsed}
                    orders={orders}
                  />
                </div>
              </TabsContent>

              <TabsContent className="mt-4" value="ready">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.06] px-4 py-3 text-sm text-emerald-100">
                    <PackageCheck className="size-4" />
                    {formatNumber(readyOrders.length)} lines are currently ready by status rules.
                    Generate the daily ops sheet to release them.
                  </div>
                  <OrdersTable orders={readyOrders} previewRows={8} />
                </div>
              </TabsContent>

              <TabsContent className="mt-4" value="pipeline">
                <PipelineView extraMetrics={extraMetrics} orders={orders} />
              </TabsContent>

              <TabsContent className="mt-4" value="activities">
                <div className="mx-auto w-full max-w-2xl">
                  <ActivityFeed orders={orders} />
                </div>
              </TabsContent>

              <TabsContent className="mt-4" value="settings">
                <SettingsView
                  cycle={cycle}
                  dataHealth={dataHealth}
                  sourceLabel={sourceLabel}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </main>
  );
}
