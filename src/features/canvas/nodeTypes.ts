import { CableNode } from "./nodes/CableNode";
import { DemoAnchorNode } from "./nodes/DemoAnchorNode";
import { FiberAnchorNode } from "./nodes/FiberAnchorNode";
import { SplicePointNode } from "./nodes/SplicePointNode";

export const nodeTypes = {
  demoAnchor: DemoAnchorNode,
  cable: CableNode,
  fiberAnchor: FiberAnchorNode,
  splicePoint: SplicePointNode,
} as const;
