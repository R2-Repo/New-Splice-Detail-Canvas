import { BaseEdge, type EdgeProps } from "@xyflow/react";

type SpliceEdgeData = {
  path: string;
  routeError?: string;
  connectionId?: string;
};

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

  return <BaseEdge {...props} path={path} style={{ stroke: "var(--sdc-edge, #555)", strokeWidth: 2 }} />;
}
