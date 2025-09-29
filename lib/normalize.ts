export function normalizeStatus(s: any) {
  if (s == null) return "";
  return String(s).trim().toLowerCase().replace(/\s+/g, "_");
}
