import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { deriveOrderPriority } from "@/lib/data-utils";
import { fakeOrders } from "@/lib/fakeData";
import type { DataHealthIssue, OperationsPayload, OpsOrder, OrderStatus } from "@/lib/types";

const DEFAULT_EXCEL_PATH = join(process.cwd(), "data", "operations.xlsx");
const REQUIRED_COLUMNS = [
  "SO No",
  "BP Name",
  "SO Qty",
  "Proposed Ship Quantity",
  "Extended Price",
];
const DATE_COLUMN_NAMES = [
  "Order Date",
  "Proposed Ship Date",
  "ATP Date",
  "Estimated Shipdate",
  "Requested Shipdate",
  "Cancel By Date",
  "Activity Date",
  "Activity Follow Up Date",
];
const MIN_VALID_DATE_YEAR = 2000;
const MAX_VALID_DATE_YEAR = 2035;

type CellValue = string | number | boolean | Date | null | undefined;
type ReadSheet = (path: string) => Promise<CellValue[][]>;
const nodeRequire = createRequire(import.meta.url);

function samplePayload(
  refreshedAt: string,
  workbookPath: string,
  issues: DataHealthIssue[],
  options: {
    droppedRows?: number;
    missingColumns?: string[];
    rowCount?: number;
  } = {}
): OperationsPayload {
  return {
    orders: fakeOrders,
    refreshedAt,
    rowCount: fakeOrders.length,
    source: "sample",
    sourceLabel: "Sample portfolio data",
    dataHealth: {
      droppedRows: options.droppedRows ?? 0,
      isSample: true,
      issues,
      loadedOrderCount: fakeOrders.length,
      missingColumns: options.missingColumns ?? [],
      mode: "sample",
      refreshedAt,
      rowCount: options.rowCount ?? fakeOrders.length,
      workbookPath,
    },
  };
}

function normalizeHeader(value: CellValue) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function asString(value: CellValue) {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return format(value, "yyyy-MM-dd");
  }

  return String(value).trim();
}

function asNumber(value: CellValue) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[$,\s]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function asBoolean(value: CellValue) {
  const raw = asString(value).toLowerCase();
  return ["true", "yes", "y", "complete", "ship complete", "1"].includes(raw);
}

function isReasonableOpsDate(date: Date) {
  const year = date.getFullYear();
  return year >= MIN_VALID_DATE_YEAR && year <= MAX_VALID_DATE_YEAR;
}

function toIsoDate(date: Date) {
  if (Number.isNaN(date.getTime()) || !isReasonableOpsDate(date)) {
    return null;
  }

  return format(date, "yyyy-MM-dd");
}

function asIsoDate(value: CellValue) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return toIsoDate(value);
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return toIsoDate(date);
  }

  const date = new Date(String(value));
  return toIsoDate(date);
}

function asManualEta(value: CellValue) {
  const parsedDate = asIsoDate(value);
  if (parsedDate) {
    return parsedDate;
  }

  const raw = asString(value);
  if (!raw) {
    return null;
  }

  if (value instanceof Date || typeof value === "number") {
    return null;
  }

  const dateLike = new Date(raw);
  return Number.isNaN(dateLike.getTime()) ? raw : null;
}

function countUnusableDateCells(dataRows: CellValue[][], headers: string[]) {
  const dateIndexes = DATE_COLUMN_NAMES.map((name) => headers.indexOf(normalizeHeader(name)))
    .filter((index) => index >= 0);

  return dataRows.reduce((count, row) => {
    const unusableInRow = dateIndexes.filter((index) => {
      const value = row[index];
      return value !== null && value !== undefined && asString(value) !== "" && !asIsoDate(value);
    }).length;

    return count + unusableInRow;
  }, 0);
}

function deriveStatus(order: {
  daysDifference: number;
  proposedShipDate: string | null;
  proposedShipQuantity: number;
  proposedShipWh: string;
  shipComplete: boolean;
  soQty: number;
}): OrderStatus {
  if (order.shipComplete) {
    return "Complete";
  }

  if (order.proposedShipQuantity <= 0) {
    return "Backorder";
  }

  if (order.daysDifference > 4) {
    return "Delayed";
  }

  if (order.daysDifference > 1) {
    return "At Risk";
  }

  if (!order.proposedShipDate || !order.proposedShipWh) {
    return "At Risk";
  }

  if (order.proposedShipQuantity < order.soQty) {
    return "Partial";
  }

  return "Ready";
}

function normalizedDaysDifference(
  rawDays: number,
  estimatedShipDate: string | null,
  requestedShipDate: string | null,
  proposedShipDate: string | null
) {
  if (Math.abs(rawDays) <= 60) {
    return rawDays;
  }

  const target = estimatedShipDate ?? proposedShipDate;
  if (!target || !requestedShipDate) {
    return 0;
  }

  const targetDate = parseISO(target);
  const requestedDate = parseISO(requestedShipDate);
  if (Number.isNaN(targetDate.getTime()) || Number.isNaN(requestedDate.getTime())) {
    return 0;
  }

  return differenceInCalendarDays(targetDate, requestedDate);
}

function orderDateKeys(order: OpsOrder) {
  return [
    order.orderDate,
    order.proposedShipDate,
    order.atpDate,
    order.estimatedShipDate,
    order.requestedShipDate,
    order.cancelByDate,
    order.activityDate,
    order.activityFollowUpDate,
  ].filter((value): value is string => Boolean(value));
}

function operationalReferenceDate(orders: OpsOrder[], refreshedAt: string) {
  const todayKey = refreshedAt.slice(0, 10);
  const dateKeys = orders.flatMap(orderDateKeys).sort();
  if (dateKeys.some((value) => value >= todayKey)) {
    return parseISO(todayKey);
  }

  return parseISO(dateKeys[dateKeys.length - 1] ?? todayKey);
}

function buildOrder(
  row: CellValue[],
  headers: string[],
  rowIndex: number
): OpsOrder | null {
  const indexFor = (name: string) => headers.indexOf(normalizeHeader(name));
  const valueFor = (name: string) => {
    const index = indexFor(name);
    return index >= 0 ? row[index] : null;
  };

  const soNo = asString(valueFor("SO No"));
  const bpName = asString(valueFor("BP Name"));

  if (!soNo || !bpName) {
    return null;
  }

  const soQty = asNumber(valueFor("SO Qty"));
  const proposedShipQuantity = asNumber(valueFor("Proposed Ship Quantity"));
  const extendedPrice = asNumber(valueFor("Extended Price"));
  const shipComplete = asBoolean(valueFor("Ship Complete"));
  const proposedShipDate = asIsoDate(valueFor("Proposed Ship Date"));
  const proposedShipWh = asString(valueFor("Proposed Ship WH"));
  const estimatedShipDate = asIsoDate(valueFor("Estimated Shipdate"));
  const requestedShipDate = asIsoDate(valueFor("Requested Shipdate"));
  const rawDaysDifference = asNumber(valueFor("Days difference"));
  const daysDifference = normalizedDaysDifference(
    rawDaysDifference,
    estimatedShipDate,
    requestedShipDate,
    proposedShipDate
  );
  const cancelByDate = asIsoDate(valueFor("Cancel By Date"));
  const manualEta = asManualEta(valueFor("Manual ETA"));
  const valueAvailable =
    soQty > 0 && proposedShipQuantity > 0
      ? Math.round((extendedPrice * proposedShipQuantity) / soQty)
      : proposedShipQuantity > 0
        ? extendedPrice
        : 0;
  const orderSeed = {
    daysDifference,
    proposedShipDate,
    proposedShipQuantity,
    proposedShipWh,
    shipComplete,
    soQty,
  };
  const status = deriveStatus(orderSeed);
  const priority = deriveOrderPriority({
    cancelByDate,
    daysDifference,
    manualEta,
    proposedShipDate,
    proposedShipWh,
    status,
    valueAvailable,
  });

  return {
    id: `${soNo}-${rowIndex}`,
    soNo,
    customerPo: asString(valueFor("Customer PO")),
    bpNo: asString(valueFor("BP No")),
    bpName,
    shipTo: asString(valueFor("Ship To")),
    orderDate: asIsoDate(valueFor("Order Date")),
    product: asString(valueFor("Product")),
    itemDescription: asString(valueFor("Item Description")),
    soQty,
    proposedShipQuantity,
    extendedPrice,
    valueAvailable,
    soWarehouse: asString(valueFor("SO Warehouse")),
    proposedShipWh,
    proposedShipDate,
    atpDate: asIsoDate(valueFor("ATP Date")),
    estimatedShipDate,
    requestedShipDate,
    cancelByDate,
    manualEta,
    daysDifference,
    shippingMethod: asString(valueFor("Shipping Method")),
    shipComplete,
    activityType: asString(valueFor("Activity Type")),
    activitySubject: asString(valueFor("Activity Subject")),
    activityDate: asIsoDate(valueFor("Activity Date")),
    activityFollowUpDate: asIsoDate(valueFor("Activity Follow Up Date")),
    activityNotes: asString(valueFor("Activity Notes")),
    status,
    ...priority,
  };
}

export async function getOperationsData(): Promise<OperationsPayload> {
  const workbookPath = process.env.OPSFLOW_EXCEL_PATH ?? DEFAULT_EXCEL_PATH;
  const refreshedAt = new Date().toISOString();
  const useSampleData =
    process.env.GITHUB_PAGES === "true" ||
    process.env.OPSFLOW_USE_SAMPLE_DATA === "true";

  if (useSampleData) {
    return samplePayload(refreshedAt, workbookPath, [
      {
        severity: "info",
        message:
          process.env.GITHUB_PAGES === "true"
            ? "Public GitHub Pages build uses sample portfolio data."
            : "OPSFLOW_USE_SAMPLE_DATA is enabled.",
      },
    ]);
  }

  if (!existsSync(workbookPath)) {
    return samplePayload(refreshedAt, workbookPath, [
      {
        severity: "warning",
        message: `Workbook not found at ${workbookPath}; using sample data.`,
      },
    ]);
  }

  try {
    const { readSheet } = nodeRequire("read-excel-file/node") as {
      readSheet: ReadSheet;
    };
    const rows = await readSheet(workbookPath);
    const [headerRow, ...dataRows] = rows;
    const headers = (headerRow ?? []).map(normalizeHeader);
    const missingColumns = REQUIRED_COLUMNS.filter(
      (column) => !headers.includes(normalizeHeader(column))
    );
    const builtOrders = dataRows.map((row, index) => buildOrder(row, headers, index + 2));
    const orders = builtOrders.filter((order): order is OpsOrder => Boolean(order));
    const droppedRows = builtOrders.length - orders.length;
    const unusableDateCells = countUnusableDateCells(dataRows, headers);

    if (orders.length === 0) {
      return samplePayload(
        refreshedAt,
        workbookPath,
        [
          {
            severity: "error",
            message: "Workbook loaded, but no valid orders were parsed; using sample data.",
          },
        ],
        {
          droppedRows,
          missingColumns,
          rowCount: dataRows.length,
        }
      );
    }

    const issues: DataHealthIssue[] = [];
    if (missingColumns.length > 0) {
      issues.push({
        severity: "warning",
        message: `Missing expected columns: ${missingColumns.join(", ")}.`,
      });
    }

    if (droppedRows > 0) {
      issues.push({
        severity: "warning",
        message: `${droppedRows} workbook rows were skipped because SO No or BP Name was missing.`,
      });
    }

    if (unusableDateCells > 0) {
      issues.push({
        severity: "warning",
        message: `${unusableDateCells} date cells were ignored because they were invalid or outside ${MIN_VALID_DATE_YEAR}-${MAX_VALID_DATE_YEAR}.`,
      });
    }

    const referenceDate = operationalReferenceDate(orders, refreshedAt);
    const prioritizedOrders = orders.map((order) => ({
      ...order,
      ...deriveOrderPriority(order, referenceDate),
    }));

    return {
      orders: prioritizedOrders,
      refreshedAt,
      rowCount: prioritizedOrders.length,
      source: "excel",
      sourceLabel: "Local Excel workbook",
      dataHealth: {
        droppedRows,
        isSample: false,
        issues,
        loadedOrderCount: prioritizedOrders.length,
        missingColumns,
        mode: "excel",
        refreshedAt,
        rowCount: dataRows.length,
        workbookPath,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown workbook parse error";
    return samplePayload(refreshedAt, workbookPath, [
      { severity: "error", message: `Workbook parse failed: ${message}` },
    ]);
  }
}
