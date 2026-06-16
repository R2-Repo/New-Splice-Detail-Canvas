import { Handle, Position, type NodeProps } from "@xyflow/react";

type DemoAnchorData = {
  label?: string;
  gridCol?: number;
  gridRow?: number;
};

export function DemoAnchorNode({ data }: NodeProps) {
  const nodeData = data as DemoAnchorData;
  const label = nodeData.label ?? "Anchor";
  const col = nodeData.gridCol;
  const row = nodeData.gridRow;

  return (
    <div className="demo-anchor-node" title={`${label} (${col}, ${row})`}>
      <Handle type="source" position={Position.Right} className="demo-anchor-node__handle" />
      <Handle type="target" position={Position.Left} className="demo-anchor-node__handle" />
      <span className="demo-anchor-node__dot" aria-hidden />
      <span className="demo-anchor-node__label">{label}</span>
    </div>
  );
}
