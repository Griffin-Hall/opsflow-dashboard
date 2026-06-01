"use client";

import * as React from "react";
import confetti from "canvas-confetti";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  CheckCircle2,
  ChevronUp,
  Columns3,
  Download,
  FileSpreadsheet,
  Filter,
  ListPlus,
  MoreHorizontal,
  NotebookPen,
  PackageCheck,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOpsStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { formatCurrency, formatLongDate, formatNumber, formatShortDate } from "@/lib/format";
import { statusOrder, uniqueWarehouses } from "@/lib/data-utils";
import type { OpsOrder, OrderStatus } from "@/lib/types";
import { StatusBadge } from "@/components/dashboard/status-badge";

type DaysFilter = "all" | "early" | "watch" | "late";

function HeaderButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      className="-ml-2 h-7 px-2 text-xs text-slate-400 hover:text-slate-100"
      onClick={onClick}
      variant="ghost"
    >
      {children}
      <ArrowUpDown data-icon="inline-end" />
    </Button>
  );
}

function downloadCsv(orders: OpsOrder[]) {
  const headers = [
    "SO No",
    "BP Name",
    "Product",
    "Proposed Ship Quantity",
    "Value Available",
    "ATP Date",
    "Proposed Ship Date",
    "Days Difference",
    "Warehouse",
    "Status",
    "Priority",
    "Priority Reason",
  ];
  const rows = orders.map((order) => [
    order.soNo,
    order.bpName,
    order.product,
    String(order.proposedShipQuantity),
    String(order.valueAvailable),
    order.atpDate ?? "",
    order.proposedShipDate ?? "",
    String(order.daysDifference),
    order.proposedShipWh || order.soWarehouse,
    order.status,
    String(order.priorityScore),
    order.priorityReason,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "opsflow-daily-ops-sheet.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function priorityClass(score: number) {
  if (score >= 70) {
    return "border-rose-300/30 bg-rose-300/10 text-rose-100";
  }

  if (score >= 40) {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }

  return "border-cyan-300/25 bg-cyan-300/10 text-cyan-100";
}

export function OrdersTable({
  orders,
  previewRows,
  expandedPageSize = 25,
}: {
  orders: OpsOrder[];
  /** When set, the table starts collapsed to this many rows behind a "View all" button. */
  previewRows?: number;
  /** Page size used once the table is expanded. */
  expandedPageSize?: number;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { desc: true, id: "soNo" },
  ]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [reportOpen, setReportOpen] = React.useState(false);
  const [expanded, setExpanded] = React.useState(previewRows === undefined);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: previewRows ?? expandedPageSize,
  });
  const {
    daysFilter,
    globalSearch,
    highValueOnly,
    readyOnly,
    setDaysFilter,
    setGlobalSearch,
    setHighValueOnly,
    setReadyOnly,
    setStatus,
    setWarehouse,
    status,
    warehouse,
  } = useOpsStore();

  const warehouses = React.useMemo(() => uniqueWarehouses(orders), [orders]);
  const filteredOrders = React.useMemo(() => {
    return orders.filter((order) => {
      const text = [
        order.soNo,
        order.bpNo,
        order.bpName,
        order.customerPo,
        order.product,
        order.itemDescription,
        order.atpDate,
        order.proposedShipDate,
        order.proposedShipWh,
        order.soWarehouse,
        order.status,
        order.activityNotes,
        order.priorityReason,
      ]
        .join(" ")
        .toLowerCase();
      const queryPass = text.includes(globalSearch.toLowerCase());
      const warehousePass =
        warehouse === "All" || (order.proposedShipWh || order.soWarehouse) === warehouse;
      const statusPass = status === "All" || order.status === status;
      const readyPass = !readyOnly || order.status === "Ready";
      const highValuePass = !highValueOnly || order.valueAvailable >= 50000;
      const daysPass =
        daysFilter === "all" ||
        (daysFilter === "early" && order.daysDifference <= 0) ||
        (daysFilter === "watch" &&
          order.daysDifference > 0 &&
          order.daysDifference <= 3) ||
        (daysFilter === "late" && order.daysDifference > 3);

      return (
        queryPass &&
        warehousePass &&
        statusPass &&
        readyPass &&
        highValuePass &&
        daysPass
      );
    });
  }, [daysFilter, globalSearch, highValueOnly, orders, readyOnly, status, warehouse]);

  React.useEffect(() => {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setRowSelection({});
  }, [daysFilter, globalSearch, highValueOnly, orders, readyOnly, status, warehouse]);

  const columns = React.useMemo<ColumnDef<OpsOrder>[]>(
    () => [
      {
        enableHiding: false,
        enableSorting: false,
        header: ({ table }) => (
          <Checkbox
            aria-label="Select all rows"
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
          />
        ),
        id: "select",
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Select SO ${row.original.soNo}`}
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
          />
        ),
      },
      {
        accessorKey: "soNo",
        header: ({ column }) => (
          <HeaderButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            SO #
          </HeaderButton>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-sm font-medium text-cyan-200">
              {row.original.soNo}
            </span>
            <span className="text-xs text-slate-500">{row.original.customerPo || "No PO"}</span>
          </div>
        ),
      },
      {
        accessorKey: "bpName",
        header: ({ column }) => (
          <HeaderButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Customer / BP Name
          </HeaderButton>
        ),
        cell: ({ row }) => (
          <div className="max-w-[240px]">
            <p className="truncate font-medium text-white">{row.original.bpName}</p>
            <p className="truncate text-xs text-slate-500">{row.original.shipTo}</p>
          </div>
        ),
      },
      {
        accessorKey: "product",
        header: "Product",
        cell: ({ row }) => (
          <div className="max-w-[220px]">
            <p className="truncate text-sm text-slate-200">{row.original.product || "Unassigned"}</p>
            <p className="truncate text-xs text-slate-500">{row.original.itemDescription}</p>
          </div>
        ),
      },
      {
        accessorKey: "valueAvailable",
        header: ({ column }) => (
          <HeaderButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Proposed Qty / Value
          </HeaderButton>
        ),
        cell: ({ row }) => (
          <div className="text-right">
            <p className="font-medium text-white">
              {formatNumber(row.original.proposedShipQuantity)} / {formatNumber(row.original.soQty)}
            </p>
            <p className="text-xs text-cyan-200">
              {formatCurrency(row.original.valueAvailable)}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "atpDate",
        header: ({ column }) => (
          <HeaderButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            ATP Date
          </HeaderButton>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-slate-100">
              {formatLongDate(row.original.atpDate)}
            </span>
            <span className="text-xs text-slate-500">
              Prop. {formatShortDate(row.original.proposedShipDate)}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "daysDifference",
        header: ({ column }) => (
          <HeaderButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Days Diff
          </HeaderButton>
        ),
        cell: ({ row }) => {
          const value = row.original.daysDifference;
          return (
            <Badge
              className={cn(
                "rounded-full border px-2.5 py-1",
                value <= 0
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : value <= 3
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                    : "border-rose-400/30 bg-rose-400/10 text-rose-200"
              )}
            >
              {value > 0 ? `+${value}` : value}
            </Badge>
          );
        },
      },
      {
        accessorKey: "proposedShipWh",
        header: "Warehouse",
        cell: ({ row }) => (
          <Badge className="border-white/10 bg-white/[0.05] text-slate-200" variant="outline">
            {row.original.proposedShipWh || row.original.soWarehouse || "TBD"}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: "priorityScore",
        header: ({ column }) => (
          <HeaderButton onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Priority
          </HeaderButton>
        ),
        cell: ({ row }) => (
          <Badge
            className={cn(
              "rounded-full border px-2.5 py-1",
              priorityClass(row.original.priorityScore)
            )}
            title={row.original.priorityReason}
          >
            {row.original.priorityScore}
          </Badge>
        ),
      },
      {
        enableHiding: false,
        id: "actions",
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-label="Open row actions" size="icon-sm" variant="ghost">
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>SO {row.original.soNo}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  toast.success("Release queued", {
                    description: `${row.original.soNo} moved to the release review queue.`,
                  })
                }
              >
                <Send />
                Release
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  toast("Note added", {
                    description: `Follow-up note created for ${row.original.bpName}.`,
                  })
                }
              >
                <NotebookPen />
                Note
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  const table = useReactTable({
    columns,
    data: filteredOrders,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    state: {
      columnFilters,
      columnVisibility,
      pagination,
      rowSelection,
      sorting,
    },
  });

  function expandTable() {
    setExpanded(true);
    setPagination({ pageIndex: 0, pageSize: expandedPageSize });
  }

  function collapseTable() {
    setExpanded(false);
    setPagination({ pageIndex: 0, pageSize: previewRows ?? expandedPageSize });
  }

  function generateReport() {
    setReportOpen(true);
    confetti({
      colors: ["#22d3ee", "#818cf8", "#34d399"],
      particleCount: 90,
      spread: 60,
    });
  }

  return (
    <section className="ops-surface min-w-0 rounded-xl p-4 text-white">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
          <div>
            <div className="flex items-center gap-2">
              <PackageCheck className="size-5 text-cyan-300" />
              <h2 className="text-base font-semibold tracking-normal text-slate-50">
                Live Orders
              </h2>
              <Badge className="rounded-md border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                {formatNumber(filteredOrders.length)} visible
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Search, filter, sort, select rows, toggle columns, and export the daily ops view.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={generateReport}>
              <FileSpreadsheet data-icon="inline-start" />
              Generate Daily Ops Sheet
            </Button>
            <Button onClick={() => downloadCsv(filteredOrders)} variant="outline">
              <Download data-icon="inline-start" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="grid gap-2 lg:grid-cols-[minmax(220px,1fr)_repeat(4,max-content)]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <Input
              className="ops-control h-9 pl-9 text-white placeholder:text-slate-500"
              onChange={(event) => setGlobalSearch(event.target.value)}
              placeholder="Search SO, BP, SKU, product, notes..."
              value={globalSearch}
            />
          </div>
          <Select onValueChange={setWarehouse} value={warehouse}>
            <SelectTrigger className="ops-control h-9 min-w-36 text-white">
              <SelectValue placeholder="Warehouse" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="All">All warehouses</SelectItem>
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
            <SelectTrigger className="ops-control h-9 min-w-32 text-white">
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
          <Select onValueChange={(value) => setDaysFilter(value as DaysFilter)} value={daysFilter}>
            <SelectTrigger className="ops-control h-9 min-w-32 text-white">
              <SelectValue placeholder="Days" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All days</SelectItem>
                <SelectItem value="early">Early / on time</SelectItem>
                <SelectItem value="watch">Watch +1 to +3</SelectItem>
                <SelectItem value="late">Late +4 days</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-9" variant="outline">
                <Columns3 data-icon="inline-start" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    checked={column.getIsVisible()}
                    key={column.id}
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            className={cn(readyOnly && "border-cyan-300/35 bg-cyan-300/10 text-cyan-100")}
            onClick={() => setReadyOnly(!readyOnly)}
            variant="outline"
          >
            <Filter data-icon="inline-start" />
            Show Only Ready
          </Button>
          <Button
            className={cn(highValueOnly && "border-indigo-300/35 bg-indigo-300/10 text-indigo-100")}
            onClick={() => setHighValueOnly(!highValueOnly)}
            variant="outline"
          >
            <Sparkles data-icon="inline-start" />
            High Value Only
          </Button>
          <span className="flex items-center text-sm text-slate-500">
            {table.getFilteredSelectedRowModel().rows.length} selected
          </span>
        </div>

        <div className="max-w-full overflow-hidden rounded-lg border border-white/[0.08] bg-[#070a12]/60">
          <Table className="min-w-[1080px]">
            <TableHeader className="bg-[#090d14]">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow className="border-white/[0.08] hover:bg-transparent" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className="h-10 text-[11px] font-semibold uppercase tracking-normal text-slate-500"
                      key={header.id}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    className="border-white/[0.07] transition-colors hover:bg-white/[0.035] data-[state=selected]:bg-cyan-300/[0.08]"
                    data-state={row.getIsSelected() && "selected"}
                    key={row.id}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell className="py-2.5" key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell className="h-24 text-center text-slate-400" colSpan={columns.length}>
                    No orders match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {previewRows !== undefined && !expanded ? (
          <div className="flex flex-col items-center justify-between gap-3 text-sm text-slate-400 sm:flex-row">
            <span>
              Showing {Math.min(previewRows, filteredOrders.length)} of{" "}
              {formatNumber(filteredOrders.length)} orders
            </span>
            <Button
              className="w-full sm:w-auto"
              disabled={filteredOrders.length <= previewRows}
              onClick={expandTable}
              variant="outline"
            >
              <ListPlus data-icon="inline-start" />
              View all {formatNumber(filteredOrders.length)} orders
            </Button>
          </div>
        ) : (
          <div className="flex flex-col justify-between gap-3 text-sm text-slate-400 sm:flex-row sm:items-center">
            <span>
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {Math.max(table.getPageCount(), 1)}
            </span>
            <div className="flex items-center gap-2">
              {previewRows !== undefined && (
                <Button onClick={collapseTable} variant="ghost">
                  <ChevronUp data-icon="inline-start" />
                  Show fewer
                </Button>
              )}
              <Button
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
                variant="outline"
              >
                Previous
              </Button>
              <Button
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
                variant="outline"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog onOpenChange={setReportOpen} open={reportOpen}>
        <DialogContent className="border-white/10 bg-[#080b12] text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle2 className="text-emerald-300" />
              Daily Ops Sheet Generated
            </DialogTitle>
            <DialogDescription>
              The clean executive report is ready. This simulation uses the
              filtered dashboard state, so it mirrors the morning workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Rows included</span>
              <span className="font-medium text-white">{formatNumber(filteredOrders.length)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Available value</span>
              <span className="font-medium text-cyan-200">
                {formatCurrency(
                  filteredOrders.reduce((total, order) => total + order.valueAvailable, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Ready queue</span>
              <span className="font-medium text-emerald-200">
                {filteredOrders.filter((order) => order.status === "Ready").length}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => downloadCsv(filteredOrders)}>
              <Download data-icon="inline-start" />
              Download CSV
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
