import { format, parseISO } from "date-fns";

const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
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
