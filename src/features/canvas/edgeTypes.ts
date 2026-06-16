import { DemoSpliceEdge } from "./edges/DemoSpliceEdge";
import { SpliceEdge } from "./edges/SpliceEdge";

export const edgeTypes = {
  demoSplice: DemoSpliceEdge,
  splice: SpliceEdge,
} as const;
