export type OrderStatus =
  | "Ready"
  | "At Risk"
  | "Delayed"
  | "Partial"
  | "Backorder"
  | "Complete";

export type RefreshCycle = "7:00 AM" | "12:00 PM";

export type DataHealthIssueSeverity = "info" | "warning" | "error";

export type DataHealthIssue = {
  severity: DataHealthIssueSeverity;
  message: string;
};

export type DataHealth = {
  mode: "excel" | "sample";
  isSample: boolean;
  rowCount: number;
  loadedOrderCount: number;
  refreshedAt: string;
  workbookPath?: string;
  missingColumns: string[];
  droppedRows: number;
  issues: DataHealthIssue[];
};

export type OpsOrder = {
  id: string;
  soNo: string;
  customerPo: string;
  bpNo: string;
  bpName: string;
  shipTo: string;
  orderDate: string | null;
  product: string;
  itemDescription: string;
  soQty: number;
  proposedShipQuantity: number;
  extendedPrice: number;
  valueAvailable: number;
  soWarehouse: string;
  proposedShipWh: string;
  proposedShipDate: string | null;
  atpDate: string | null;
  estimatedShipDate: string | null;
  requestedShipDate: string | null;
  cancelByDate: string | null;
  manualEta: string | null;
  daysDifference: number;
  shippingMethod: string;
  shipComplete: boolean;
  activityType: string;
  activitySubject: string;
  activityDate: string | null;
  activityFollowUpDate: string | null;
  activityNotes: string;
  status: OrderStatus;
  priorityScore: number;
  priorityReason: string;
  cancelRisk: boolean;
};

export type OperationsPayload = {
  orders: OpsOrder[];
  source: "excel" | "sample";
  sourceLabel: string;
  rowCount: number;
  refreshedAt: string;
  dataHealth: DataHealth;
};

export type KpiMetric = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  tone: "cyan" | "emerald" | "amber" | "rose" | "indigo";
};
