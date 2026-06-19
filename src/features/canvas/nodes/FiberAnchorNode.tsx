import { Handle, Position, type NodeProps } from "@xyflow/react";

type FiberAnchorData = {
  fiberNumber: number;
  tubeColor: string;
  fiberColor: string;
  color?: string;
  outline?: boolean;
  side?: string;
  os?: string;
  tubeHead?: boolean;
  tubeHex?: string;
  striped?: boolean;
};

export function FiberAnchorNode({ data }: NodeProps) {
  const d = data as FiberAnchorData;
  const right = d.side === "right";

  return (
    <div className="splice-node splice-node--fiber" title={`${d.tubeColor} #${d.fiberNumber} ${d.fiberColor}`}>
      {d.tubeHead ? (
        <span
          className={`sdc-tube-label${right ? " sdc-tube-label--right" : ""}`}
          style={{ color: d.tubeHex ?? "#333" }}
        >
          {d.tubeColor}
        </span>
      ) : null}
      <span
        className="splice-node__fiber-dot"
        style={{
          background: d.color ?? "#555",
          border: d.outline ? "1px solid #333" : undefined,
        }}
      />
      <div className={`sdc-fiber-label${right ? " sdc-fiber-label--right" : ""}`}>
        {right ? (
          <span className="sdc-fiber-label__line">
            <span className="sdc-fiber-label__code">{d.fiberColor}</span>
            {d.os ? <span className="sdc-fiber-label__os"> ({d.os})</span> : null}
          </span>
        ) : (
          <span className="sdc-fiber-label__line">
            {d.os ? <span className="sdc-fiber-label__os">({d.os}) </span> : null}
            <span className="sdc-fiber-label__code">{d.fiberColor}</span>
          </span>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="out" />
      <Handle type="target" position={Position.Left} id="in" />
    </div>
  );
}
