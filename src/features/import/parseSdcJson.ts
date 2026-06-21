import type { ConnectionGraph, LayoutMode, LayoutOverrides } from "@/features/diagram/types";
import type { ManualLock } from "@/features/interaction/manualLocks";

export const SDC_JSON_VERSION = 1;

export type SdcJsonDocument = {
  version: typeof SDC_JSON_VERSION;
  spliceName: string;
  layoutMode: LayoutMode;
  sourceCsv?: string;
  sourceFileName?: string;
  connectionGraph?: ConnectionGraph;
  layoutOverrides?: LayoutOverrides;
  nodePositions?: Record<string, { x: number; y: number }>;
  manualLocks?: ManualLock[];
};

export type ParseSdcJsonResult =
  | { ok: true; document: SdcJsonDocument }
  | { ok: false; error: string };

export function parseSdcJson(text: string): ParseSdcJsonResult {
  try {
    const raw = JSON.parse(text) as Partial<SdcJsonDocument>;
    if (raw.version !== SDC_JSON_VERSION) {
      return { ok: false, error: `Unsupported .sdc.json version: ${String(raw.version)}` };
    }
    if (!raw.spliceName || typeof raw.spliceName !== "string") {
      return { ok: false, error: "Missing spliceName" };
    }
    const layoutMode = raw.layoutMode === "quad" ? "quad" : "horizontal";
    return {
      ok: true,
      document: {
        version: SDC_JSON_VERSION,
        spliceName: raw.spliceName,
        layoutMode,
        sourceCsv: raw.sourceCsv,
        sourceFileName: raw.sourceFileName,
        connectionGraph: raw.connectionGraph,
        layoutOverrides: raw.layoutOverrides,
        nodePositions: raw.nodePositions,
        manualLocks: raw.manualLocks,
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

export function serializeSdcJson(document: SdcJsonDocument): string {
  return JSON.stringify(document, null, 2);
}
