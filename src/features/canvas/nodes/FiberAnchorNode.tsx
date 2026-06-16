import { Handle, Position, type NodeProps } from "@xyflow/react";

type FiberAnchorData = {
  fiberNumber: number;
  tubeColor: string;
  fiberColor: string;
};

export function FiberAnchorNode({ data }: NodeProps) {
  const d = data as FiberAnchorData;

  return (
    <div className="splice-node splice-node--fiber" title={`${d.tubeColor} #${d.fiberNumber} ${d.fiberColor}`}>
      <span className="splice-node__fiber-dot" />
      <Handle type="source" position={Position.Right} id="out" />
      <Handle type="target" position={Position.Left} id="in" />
    </div>
  );
}
