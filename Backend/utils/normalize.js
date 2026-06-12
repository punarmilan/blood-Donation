export function normalizeLocation(value) {
  if (!value) return "";
  const norm = value.trim().toLowerCase().replace(/\s+/g, " ");
  if (norm === "bangalore" || norm === "bengaluru") {
    return "bengaluru";
  }
  return norm;
}
