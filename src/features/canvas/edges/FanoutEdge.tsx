import { BaseEdge, type EdgeProps } from "@xyflow/react";

import { SDC_DEFAULTS } from "@/features/layout/sdcDefaults";

type FanoutEdgeData = {
  path: string;
  color?: string;
  trunk?: boolean;
};

export function FanoutEdge(props: EdgeProps) {
  const data = props.data as FanoutEdgeData | undefined;
  const path = data?.path ?? "";
  if (!path) return null;

  const isTrunk = data?.trunk === true;
  const strokeWidth = isTrunk ? SDC_DEFAULTS.stroke.bufferTubePx + 2 : SDC_DEFAULTS.stroke.fiberStrandPx + 1;

  return (
    <BaseEdge
      {...props}
      path={path}
      style={{
        stroke: data?.color ?? "#888",
        strokeWidth,
        opacity: isTrunk ? 0.95 : 0.85,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      }}
    />
  );
}
