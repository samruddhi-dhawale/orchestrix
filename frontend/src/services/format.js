export function formatTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  return isNaN(d.getTime()) ? String(value).slice(0, 19).replace("T", " ") : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function duration(start, end, totalMs) {
  if (totalMs && totalMs > 0) {
    return totalMs < 1000 ? `${totalMs} ms` : `${(totalMs / 1000).toFixed(1)} s`;
  }
  if (!start || !end) return "Running...";
  const ms = new Date(end) - new Date(start);
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
