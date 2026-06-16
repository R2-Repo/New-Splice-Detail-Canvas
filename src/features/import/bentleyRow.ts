import type { CsvEndpoint } from "./types";

const OS_PATTERN = /^(CH\s+\d+|EL-\d+|\[.+\])/i;

function trimFields(parts: string[]): string[] {
  return parts.map((p) => p.trim());
}

function dropTrailingEmpty(parts: string[]): string[] {
  const copy = [...parts];
  while (copy.length > 0 && copy[copy.length - 1] === "") {
    copy.pop();
  }
  return copy;
}

function looksLikeOs(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  if (/^\[/.test(v)) return true;
  if (/^CH\s+\d+/i.test(v)) return true;
  if (/^EL-\d+/i.test(v)) return true;
  return OS_PATTERN.test(v);
}

function parseFiberNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const n = Number.parseInt(trimmed, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function dropLeadingEmpty(parts: string[]): string[] {
  const copy = [...parts];
  while (copy.length > 0 && copy[0] === "") {
    copy.shift();
  }
  return copy;
}

function parseFromSide(left: string): Omit<CsvEndpoint, "csvColumn"> | null {
  const parts = dropTrailingEmpty(trimFields(left.split(",")));
  if (parts.length < 5) return null;

  const device = parts[0] ?? "";
  const fiberColor = parts[parts.length - 1] ?? "";
  const tubeColor = parts[parts.length - 2] ?? "";
  const fiberNumber = parseFiberNumber(parts[parts.length - 3] ?? "");
  const cableName = parts.slice(1, parts.length - 3).join(",").trim();

  if (!cableName || !tubeColor || !fiberColor) return null;
  if (fiberNumber === null) return null;

  return { device, cableName, fiberNumber, tubeColor, fiberColor };
}

function stripStrayTrailingCommas(parts: string[]): string[] {
  const copy = [...parts];
  while (copy.length > 5 && copy[copy.length - 1] === "") {
    copy.pop();
  }
  return copy;
}

function parseToSide(right: string): Omit<CsvEndpoint, "csvColumn"> | null {
  let parts = dropLeadingEmpty(trimFields(right.split(",")));

  let osTag: string | undefined;
  while (parts.length > 4 && looksLikeOs(parts[parts.length - 1] ?? "")) {
    osTag = parts.pop();
  }

  parts = stripStrayTrailingCommas(parts);

  if (parts.length < 4) return null;

  const device = parts[parts.length - 1] ?? "";
  const fiberColor = parts[parts.length - 2] ?? "";
  const tubeColor = parts[parts.length - 3] ?? "";
  const fiberNumber = parseFiberNumber(parts[parts.length - 4] ?? "");
  const cableName = parts.slice(0, parts.length - 4).join(",").trim();

  if (!cableName || !tubeColor || !fiberColor) return null;

  return {
    device,
    cableName,
    fiberNumber: fiberNumber ?? 0,
    tubeColor,
    fiberColor,
    osTag,
  };
}

function toCsvEndpoint(
  raw: Omit<CsvEndpoint, "csvColumn">,
  csvColumn: "from" | "to",
): CsvEndpoint {
  const { device: _device, ...rest } = raw;
  void _device;
  return { ...rest, csvColumn };
}

export function normalizeEndpoints(
  fromRaw: Omit<CsvEndpoint, "csvColumn">,
  toRaw: Omit<CsvEndpoint, "csvColumn">,
): { endpointA: CsvEndpoint; endpointB: CsvEndpoint } {
  let endpointB = toCsvEndpoint(toRaw, "to");
  const endpointA = toCsvEndpoint(fromRaw, "from");

  if (!endpointB.fiberNumber && endpointA.fiberNumber) {
    endpointB = { ...endpointB, fiberNumber: endpointA.fiberNumber };
  }

  if ("osTag" in toRaw && toRaw.osTag) {
    endpointB = { ...endpointB, osTag: toRaw.osTag };
  }

  return { endpointA, endpointB };
}

export function parseBentleyRow(line: string): {
  endpointA: CsvEndpoint;
  endpointB: CsvEndpoint;
} | null {
  const arrowIndex = line.indexOf("<->");
  if (arrowIndex < 0) return null;

  const left = line.slice(0, arrowIndex);
  const right = line.slice(arrowIndex + 3);

  const fromRaw = parseFromSide(left);
  const toRaw = parseToSide(right);
  if (!fromRaw || !toRaw) return null;

  const { endpointA, endpointB } = normalizeEndpoints(fromRaw, toRaw);
  if (!endpointA.fiberNumber && !endpointB.fiberNumber) return null;
  if (!endpointB.fiberNumber) return null;

  return { endpointA, endpointB };
}

export function endpointKey(endpoint: CsvEndpoint): string {
  return [
    endpoint.cableName,
    endpoint.legId ?? endpoint.csvColumn,
    endpoint.tubeColor,
    String(endpoint.fiberNumber),
    endpoint.fiberColor,
  ].join("|");
}

export function canonicalPairKey(a: CsvEndpoint, b: CsvEndpoint): string {
  const ka = endpointKey(a);
  const kb = endpointKey(b);
  return ka <= kb ? `${ka}::${kb}` : `${kb}::${ka}`;
}
