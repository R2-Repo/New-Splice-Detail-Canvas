import { Handle, Position, type NodeProps } from "@xyflow/react";

import { SDC_DEFAULTS } from "@/features/layout/sdcDefaults";

type SplicePointData = {
  connectionId: string;
  color?: string;
  locked?: boolean;
};

const DOT = SDC_DEFAULTS.dot.radiusPx * 2;

export function SplicePointNode({ data }: NodeProps) {
  const d = data as SplicePointData;

  return (
    <div
      className={`splice-node splice-node--splice${d.locked ? " splice-node--locked" : ""}`}
      title={d.connectionId}
    >
      <span
        className="splice-node__fusion-dot"
        style={{ width: DOT, height: DOT, background: d.color ?? "#222" }}
      />
      {d.locked ? (
        <span className="cable-node__lock-badge splice-node__lock-badge" aria-label="Locked">
          🔒
        </span>
      ) : null}
      <Handle type="source" position={Position.Right} id="out" />
      <Handle type="target" position={Position.Left} id="in" />
    </div>
  );
}
