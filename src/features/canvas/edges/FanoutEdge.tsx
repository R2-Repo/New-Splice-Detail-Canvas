import { BaseEdge, type EdgeProps } from "@xyflow/react";

type FanoutEdgeData = {
  path: string;
  color?: string;
};

export function FanoutEdge(props: EdgeProps) {
  const data = props.data as FanoutEdgeData | undefined;
  const path = data?.path ?? "";
  if (!path) return null;
  return (
    <BaseEdge
      {...props}
      path={path}
      style={{ stroke: data?.color ?? "#888", strokeWidth: 3, opacity: 0.85 }}
    />
  );
}
