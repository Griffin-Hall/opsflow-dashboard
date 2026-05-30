import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { fakeOrders } from "@/lib/fakeData";
import type { OperationsPayload, OpsOrder, OrderStatus } from "@/lib/types";

const DEFAULT_EXCEL_PATH = join(process.cwd(), "data", "operations.xlsx");

type CellValue = string | number | boolean | Date | null | undefined;
type ReadSheet = (path: string) => Promise<CellValue[][]>;
const nodeRequire = createRequire(import.meta.url);

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

function asIsoDate(value: CellValue) {
  if (!value) {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return format(value, "yyyy-MM-dd");
  }

  if (typeof value === "number") {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + value * 86400000);
    return Number.isNaN(date.getTime()) ? null : format(date, "yyyy-MM-dd");
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : format(date, "yyyy-MM-dd");
}

function deriveStatus(order: {
  daysDifference: number;
  proposedShipQuantity: number;
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
  const estimatedShipDate = asIsoDate(valueFor("Estimated Shipdate"));
  const requestedShipDate = asIsoDate(valueFor("Requested Shipdate"));
  const rawDaysDifference = asNumber(valueFor("Days difference"));
  const daysDifference = normalizedDaysDifference(
    rawDaysDifference,
    estimatedShipDate,
    requestedShipDate,
    proposedShipDate
  );
  const orderSeed = {
    daysDifference,
    proposedShipQuantity,
    shipComplete,
    soQty,
  };

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
    valueAvailable:
      soQty > 0 && proposedShipQuantity > 0
        ? Math.round((extendedPrice * proposedShipQuantity) / soQty)
        : proposedShipQuantity > 0
          ? extendedPrice
          : 0,
    soWarehouse: asString(valueFor("SO Warehouse")),
    proposedShipWh: asString(valueFor("Proposed Ship WH")),
    proposedShipDate,
    atpDate: asIsoDate(valueFor("ATP Date")),
    estimatedShipDate,
    requestedShipDate,
    cancelByDate: asIsoDate(valueFor("Cancel By Date")),
    manualEta: asIsoDate(valueFor("Manual ETA")) ?? asString(valueFor("Manual ETA")) ?? null,
    daysDifference,
    shippingMethod: asString(valueFor("Shipping Method")),
    shipComplete,
    activityType: asString(valueFor("Activity Type")),
    activitySubject: asString(valueFor("Activity Subject")),
    activityDate: asIsoDate(valueFor("Activity Date")),
    activityFollowUpDate: asIsoDate(valueFor("Activity Follow Up Date")),
    activityNotes: asString(valueFor("Activity Notes")),
    status: deriveStatus(orderSeed),
  };
}

export async function getOperationsData(): Promise<OperationsPayload> {
  const workbookPath = process.env.OPSFLOW_EXCEL_PATH ?? DEFAULT_EXCEL_PATH;
  const refreshedAt = new Date().toISOString();
  const useSampleData =
    process.env.GITHUB_PAGES === "true" ||
    process.env.OPSFLOW_USE_SAMPLE_DATA === "true";

  if (useSampleData || !existsSync(workbookPath)) {
    return {
      orders: fakeOrders,
      refreshedAt,
      rowCount: fakeOrders.length,
      source: "sample",
      sourceLabel: "Sample portfolio data",
    };
  }

  try {
    const { readSheet } = nodeRequire("read-excel-file/node") as {
      readSheet: ReadSheet;
    };
    const rows = await readSheet(workbookPath);
    const [headerRow, ...dataRows] = rows;
    const headers = (headerRow ?? []).map(normalizeHeader);
    const orders = dataRows
      .map((row, index) => buildOrder(row, headers, index + 2))
      .filter((order): order is OpsOrder => Boolean(order));

    return {
      orders: orders.length > 0 ? orders : fakeOrders,
      refreshedAt,
      rowCount: orders.length,
      source: orders.length > 0 ? "excel" : "sample",
      sourceLabel:
        orders.length > 0 ? "Local Excel workbook" : "Sample portfolio data",
    };
  } catch {
    return {
      orders: fakeOrders,
      refreshedAt,
      rowCount: fakeOrders.length,
      source: "sample",
      sourceLabel: "Sample portfolio data",
    };
  }
}
