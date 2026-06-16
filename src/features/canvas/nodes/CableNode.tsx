import { Handle, Position, type NodeProps } from "@xyflow/react";

type CableNodeData = {
  label: string;
  side: string;
  role: string;
};

export function CableNode({ data }: NodeProps) {
  const d = data as CableNodeData;
  const handlePos = d.side === "right" ? Position.Left : Position.Right;

  return (
    <div className="splice-node splice-node--cable">
      <div className="splice-node__sheath" />
      <div className="splice-node__label">{d.label}</div>
      <Handle type="source" position={handlePos} id="out" />
      <Handle type="target" position={handlePos} id="in" />
    </div>
  );
}
