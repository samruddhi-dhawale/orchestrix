function normalizeUtcDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    // If it's an ISO timestamp from backend without UTC 'Z' or timezone offset (+HH:MM / -HH:MM)
    if (value.includes("T") && !value.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(value)) {
      return value + "Z";
    }
  }
  return value;
}

export function formatTime(value) {
  if (!value) return "—";

  // If already a time string without date like "10:00:01"
  if (typeof value === "string" && !value.includes("-") && value.includes(":")) {
    return value;
  }

  const normalized = normalizeUtcDate(value);
  const d = new Date(normalized);

  return isNaN(d.getTime())
    ? String(value).slice(0, 19).replace("T", " ")
    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function duration(start, end, totalMs) {
  if (totalMs && totalMs > 0) {
    return totalMs < 1000 ? `${totalMs} ms` : `${(totalMs / 1000).toFixed(1)} s`;
  }
  if (!start || !end) return "Running...";
  const startDate = new Date(normalizeUtcDate(start));
  const endDate = new Date(normalizeUtcDate(end));
  const ms = endDate - startDate;
  if (isNaN(ms) || ms < 0) return "—";
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export const statusClass = (s) => {
  const str = (s || "").toLowerCase();
  if (str === "success") return "success";
  if (str === "failed") return "failed";
  if (str === "running") return "running";
  return "";
};
