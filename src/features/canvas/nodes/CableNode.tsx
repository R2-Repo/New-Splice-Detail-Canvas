import { Handle, Position, type NodeProps } from "@xyflow/react";

type CableNodeData = {
  label: string;
  side: string;
  role: string;
  locked?: boolean;
};

export function CableNode({ data }: NodeProps) {
  const d = data as CableNodeData;
  const right = d.side === "right";
  const handlePos = right ? Position.Left : Position.Right;

  return (
    <div
      className={`sdc-cablebox${right ? " sdc-cablebox--right" : ""}${d.locked ? " cable-node--locked" : ""}`}
      title={d.label}
    >
      <span className="sdc-cablebox__name">
        {d.label}
        {d.locked ? (
          <span className="cable-node__lock-badge" aria-label="Locked">
            🔒
          </span>
        ) : null}
      </span>
      <Handle type="source" position={handlePos} id="out" />
      <Handle type="target" position={handlePos} id="in" />
    </div>
  );
}

export const CABLE_BOX_HEIGHT_PX = 30;
