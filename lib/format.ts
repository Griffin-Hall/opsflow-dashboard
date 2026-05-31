import { format, parseISO } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
});

const utcTimestampFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  hour12: true,
  minute: "2-digit",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

const utcTimeFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  hour12: true,
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatCurrency(value: number, compact = false) {
  const safeValue = Number.isFinite(value) ? value : 0;

  if (!compact) {
    return currencyFormatter.format(safeValue);
  }

  const abs = Math.abs(safeValue);
  if (abs >= 1_000_000) {
    return `$${trimTrailingZero(safeValue / 1_000_000)}M`;
  }

  if (abs >= 1_000) {
    return `$${trimTrailingZero(safeValue / 1_000)}k`;
  }

  return currencyFormatter.format(safeValue);
}

function trimTrailingZero(value: number) {
  return value.toFixed(Math.abs(value) >= 10 ? 0 : 1).replace(/\.0$/, "");
}

export function formatNumber(value: number) {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}

export function formatUtcTimestamp(value: string | null) {
  if (!value) {
    return "Unknown refresh time";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown refresh time";
  }

  return `${utcTimestampFormatter.format(date)} UTC`;
}

export function formatUtcTime(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return `${utcTimeFormatter.format(date)} UTC`;
}

export function formatShortDate(value: string | null) {
  if (!value) {
    return "TBD";
  }

  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return format(date, "MMM d");
}

export function formatLongDate(value: string | null) {
  if (!value) {
    return "TBD";
  }

  const date = parseISO(value);
  if (Number.isNaN(date.getTime())) {
    return "TBD";
  }

  return format(date, "MMM d, yyyy");
}
