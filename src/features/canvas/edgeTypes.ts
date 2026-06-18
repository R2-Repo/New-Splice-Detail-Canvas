import { DemoSpliceEdge } from "./edges/DemoSpliceEdge";
import { FanoutEdge } from "./edges/FanoutEdge";
import { SpliceEdge } from "./edges/SpliceEdge";

export const edgeTypes = {
  demoSplice: DemoSpliceEdge,
  fanout: FanoutEdge,
  splice: SpliceEdge,
} as const;
