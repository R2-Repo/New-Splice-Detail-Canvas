import { type NodeProps } from "@xyflow/react";

type TitleNodeData = {
  spliceName: string;
  location?: string;
  reportDate?: string;
};

export function TitleNode({ data }: NodeProps) {
  const d = data as TitleNodeData;
  return (
    <div className="sdc-title">
      <div className="sdc-title__row">
        <span className="sdc-title__field">Street:</span>
        <span className="sdc-title__field">City/St:</span>
        <span className="sdc-title__field">Pole #:</span>
        <span className="sdc-title__field">Splice#: {d.spliceName}</span>
      </div>
      {d.reportDate ? <div className="sdc-title__line">Report Date: {d.reportDate}</div> : null}
      <div className="sdc-title__line">Desc: {d.spliceName}</div>
      {d.location ? <div className="sdc-title__line">Location: {d.location}</div> : null}
    </div>
  );
}
