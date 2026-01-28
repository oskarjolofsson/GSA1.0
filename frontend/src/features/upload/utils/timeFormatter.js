export function formatTime(seconds, digits = 2) {
  if (!Number.isFinite(seconds)) return "0.00";
  return seconds.toFixed(digits);
}
