export type ImportFormat = "csv" | "sdc-json" | "unknown";

export function detectImportFormat(text: string, fileName: string): ImportFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".sdc.json") || lower.endsWith(".json")) {
    const trimmed = text.trim();
    if (trimmed.startsWith("{")) return "sdc-json";
  }
  if (text.includes("Bentley Splice Report") || text.includes("Left ---")) return "csv";
  return "unknown";
}
