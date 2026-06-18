import { Handle, Position, type NodeProps } from "@xyflow/react";

type CableNodeData = {
  label: string;
  side: string;
  role: string;
};

export function CableNode({ data }: NodeProps) {
  const d = data as CableNodeData;
  const right = d.side === "right";
  const handlePos = right ? Position.Left : Position.Right;

  return (
    <div className={`sdc-cablebox${right ? " sdc-cablebox--right" : ""}`} title={d.label}>
      <span className="sdc-cablebox__name">{d.label}</span>
      <Handle type="source" position={handlePos} id="out" />
      <Handle type="target" position={handlePos} id="in" />
    </div>
  );
}
