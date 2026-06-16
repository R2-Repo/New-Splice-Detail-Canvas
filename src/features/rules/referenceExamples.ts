import { readFileSync } from "node:fs";
import { join } from "node:path";

import type { LayoutMode } from "@/features/diagram/types";

export type ReferenceExampleId = 1 | 2 | 3;

const EXAMPLE_PATHS: Record<ReferenceExampleId, string> = {
  1: join(
    process.cwd(),
    "docs/reference/examples/old csv examples/CSV Splice Detail Example #1.csv",
  ),
  2: join(
    process.cwd(),
    "docs/reference/examples/old csv examples/CSV Splice Detail Example #2.csv",
  ),
  3: join(
    process.cwd(),
    "docs/reference/examples/old csv examples/CSV Splice Detail Example #3.csv",
  ),
};

export const SP3254_CSV_PATH = join(
  process.cwd(),
  "docs/reference/examples/Left-SP-3254.5.csv",
);

export const SP3254_PDF_ORACLES = [
  "Left-SP-3254.5 (From old App 1).pdf",
  "Left-SP-3254.5 (From old App 2).pdf",
  "Left-SP-3254.5 (From old App 3).pdf",
] as const;

export function readReferenceExampleCsv(exampleId: ReferenceExampleId): string {
  return readFileSync(EXAMPLE_PATHS[exampleId], "utf8");
}

export function readSp3254TeachingCsv(): string {
  return readFileSync(SP3254_CSV_PATH, "utf8");
}

export function referenceExampleFileName(exampleId: ReferenceExampleId): string {
  return `CSV Splice Detail Example #${exampleId}.csv`;
}

export function sp3254TeachingFileName(): string {
  return "Left-SP-3254.5.csv";
}

export type BuildSnapshotOptions = {
  layoutMode?: LayoutMode;
  optimizeLayout?: boolean;
};

export const REFERENCE_EXAMPLE_IDS: ReferenceExampleId[] = [1, 2, 3];
