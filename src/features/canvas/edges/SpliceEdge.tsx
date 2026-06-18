import { BaseEdge, type EdgeProps } from "@xyflow/react";

import { SDC_DEFAULTS } from "@/features/layout/sdcDefaults";

type SpliceEdgeData = {
  path: string;
  routeError?: string;
  connectionId?: string;
  color?: string;
  outline?: boolean;
};

const STRAND_STROKE = SDC_DEFAULTS.stroke.fiberStrandPx;

export function SpliceEdge(props: EdgeProps) {
  const data = props.data as SpliceEdgeData | undefined;
  const path = data?.path ?? "";

  if (!path || data?.routeError) {
    return (
      <BaseEdge
        {...props}
        path=""
        style={{ stroke: "var(--sdc-error, #c0392b)", strokeWidth: 1 }}
      />
    );
  }

  const stroke = data?.color ?? "var(--sdc-edge, #555)";

  // Light strands (white/yellow) get a thin dark casing so they stay visible.
  if (data?.outline) {
    return (
      <>
        <BaseEdge id={`${props.id}-casing`} path={path} style={{ stroke: "#333", strokeWidth: STRAND_STROKE + 1.5 }} />
        <BaseEdge {...props} path={path} style={{ stroke, strokeWidth: STRAND_STROKE }} />
      </>
    );
  }

  return <BaseEdge {...props} path={path} style={{ stroke, strokeWidth: STRAND_STROKE }} />;
}
