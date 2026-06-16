import { Handle, Position, type NodeProps } from "@xyflow/react";

type SplicePointData = {
  connectionId: string;
};

export function SplicePointNode({ data }: NodeProps) {
  const d = data as SplicePointData;

  return (
    <div className="splice-node splice-node--splice" title={d.connectionId}>
      <span className="splice-node__fusion-dot" />
      <Handle type="source" position={Position.Right} id="out" />
      <Handle type="target" position={Position.Left} id="in" />
    </div>
  );
}
