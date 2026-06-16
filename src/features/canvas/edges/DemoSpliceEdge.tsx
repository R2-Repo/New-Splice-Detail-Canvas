import { BaseEdge, type EdgeProps } from "@xyflow/react";

type DemoSpliceEdgeData = {
  path?: string;
  routeError?: string;
  midXCol?: number | null;
};

export function DemoSpliceEdge({
  id,
  data,
  style,
  markerEnd,
  interactionWidth,
}: EdgeProps) {
  const edgeData = (data ?? {}) as DemoSpliceEdgeData;
  const path = edgeData.path ?? "";

  if (!path) {
    return null;
  }

  return (
    <BaseEdge
      id={id}
      path={path}
      style={{
        stroke: "var(--neo-accent, #3b82f6)",
        strokeWidth: 2,
        ...style,
      }}
      markerEnd={markerEnd}
      interactionWidth={interactionWidth ?? 12}
    />
  );
}
