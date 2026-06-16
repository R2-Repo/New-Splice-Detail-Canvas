export type FibersPerTube = 6 | 12;

export type CableLegRole = "through" | "drop";

export type DiagramSide = "left" | "right" | "top" | "bottom";

export type CableLeg = {
  id: string;
  cableName: string;
  role: CableLegRole;
  fibersPerTube: FibersPerTube;
  side?: DiagramSide;
  stackIndex?: number;
};

export type BufferTube = {
  id: string;
  legId: string;
  tubeColor: string;
  sortIndex: number;
};

export type FiberStrand = {
  id: string;
  legId: string;
  tubeId: string;
  fiberNumber: number;
  fiberColor: string;
  tubeColor: string;
};

export type SpliceConnection = {
  id: string;
  lineNumber: number;
  fromFiberId: string;
  toFiberId: string;
  fromLegId: string;
  toLegId: string;
  osTag?: string;
};

export type ConnectionGraph = {
  spliceName: string;
  legs: CableLeg[];
  tubes: BufferTube[];
  fibers: FiberStrand[];
  connections: SpliceConnection[];
};

export type LayoutMode = "horizontal" | "quad";

export type LayoutOverrides = {
  layoutMode?: LayoutMode;
  nodePositions?: Record<string, { x: number; y: number }>;
  callouts?: unknown[];
};
