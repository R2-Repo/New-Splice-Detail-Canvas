import {
  Background,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useState } from "react";

import { HelpGuideOverlay } from "@/components/help/HelpGuideOverlay";
import { CsvImportButton } from "@/components/import/CsvImportButton";
import { MapEmbedButton } from "@/components/maps/MapEmbedButton";
import { CalloutsToolbarControl } from "@/components/toolbar/CalloutsToolbarControl";
import {
  AutoIcon,
  ExportConfigIcon,
  HelpIcon,
  HorizontalLayoutIcon,
  InspectIcon,
  MapIcon,
  ManualIcon,
  PrintIcon,
  QuadLayoutIcon,
  ReportIcon,
  ResetIcon,
} from "@/components/toolbar/ToolbarIcon";
import { ToolbarPillToggle } from "@/components/toolbar/ToolbarPillToggle";
import {
  ToolbarActionButton,
  ToolbarSegmentedControl,
} from "@/components/toolbar/ToolbarSegmentedControl";
import {
  CALLOUT_AUTO_ZOOM_DEFAULT,
  CALLOUT_SCALE_DEFAULT,
} from "@/components/toolbar/calloutScale";

function WorkflowCanvasInner() {
  const hasDiagram = false;

  const [nodes, , onNodesChange] = useNodesState([]);
  const [edges, , onEdgesChange] = useEdgesState([]);

  const [collapseFullButtSplices, setCollapseFullButtSplices] = useState(true);
  const [calloutsVisible, setCalloutsVisible] = useState(true);
  const [calloutScale, setCalloutScale] = useState(CALLOUT_SCALE_DEFAULT);
  const [calloutAutoZoom, setCalloutAutoZoom] = useState(CALLOUT_AUTO_ZOOM_DEFAULT);
  const [circuitPanelOpen, setCircuitPanelOpen] = useState(false);
  const [autoAdjustEnabled, setAutoAdjustEnabled] = useState(true);
  const [layoutMode, setLayoutMode] = useState<"horizontal" | "quad">("horizontal");
  const [helpOpen, setHelpOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  const handleImport = useCallback((_text: string, _fileName: string) => {
    // Import pipeline removed — rebuild pending.
  }, []);

  const noop = useCallback(() => {}, []);

  return (
    <div className="workflow-canvas">
      <div className="workflow-canvas__toolbar">
        <div className="workflow-canvas__toolbar-left">
          <CsvImportButton onImport={handleImport} active={hasDiagram} />
          <div className="workflow-canvas__toolbar-toggles">
            <ToolbarPillToggle
              label="Buffer tubes"
              ariaLabel="Collapse full butt splices when on, expand when off"
              disabled={!hasDiagram}
              checked={collapseFullButtSplices}
              onChange={setCollapseFullButtSplices}
            />
            <CalloutsToolbarControl
              disabled={!hasDiagram}
              checked={calloutsVisible}
              onCheckedChange={setCalloutsVisible}
              userScale={calloutScale}
              onUserScaleChange={setCalloutScale}
              autoZoomCompensate={calloutAutoZoom}
              onAutoZoomChange={setCalloutAutoZoom}
            />
            <ToolbarPillToggle
              label="Circuits"
              ariaLabel="Show circuit panel when on, hide when off"
              disabled={!hasDiagram}
              checked={circuitPanelOpen}
              onChange={setCircuitPanelOpen}
            />
          </div>
          <ToolbarSegmentedControl
            className="toolbar-segment--large"
            ariaLabel="Adjust mode"
            disabled={!hasDiagram}
            value={autoAdjustEnabled ? "auto" : "manual"}
            onChange={(next) => setAutoAdjustEnabled(next === "auto")}
            options={[
              { value: "auto", label: "Auto adjust", icon: <AutoIcon /> },
              { value: "manual", label: "Manual adjust", icon: <ManualIcon /> },
            ]}
          />
          <ToolbarSegmentedControl
            className="toolbar-segment--large"
            ariaLabel="Layout mode"
            disabled={!hasDiagram}
            value={layoutMode}
            onChange={(value) => setLayoutMode(value as "horizontal" | "quad")}
            options={[
              {
                value: "horizontal",
                label: "Left / right layout",
                icon: <HorizontalLayoutIcon />,
              },
              {
                value: "quad",
                label: "4-side layout",
                icon: <QuadLayoutIcon />,
              },
            ]}
          />
          {!autoAdjustEnabled && hasDiagram ? (
            <ToolbarActionButton
              label="Reset to auto layout"
              icon={<ResetIcon />}
              onClick={noop}
            />
          ) : null}
        </div>
        <div className="workflow-canvas__toolbar-center">
          <span className="workflow-canvas__hint">
            Import a CSV splice report to begin
          </span>
        </div>
        <div className="workflow-canvas__toolbar-export">
          <MapEmbedButton disabled={!hasDiagram} icon={<MapIcon />} />
          <ToolbarActionButton
            label="View connection report"
            icon={<ReportIcon />}
            pressed={reportOpen}
            disabled={!hasDiagram}
            onClick={() => setReportOpen(true)}
          />
          <ToolbarActionButton
            label="Open connection inspector"
            icon={<InspectIcon />}
            pressed={inspectorOpen}
            disabled={!hasDiagram}
            onClick={() => setInspectorOpen(true)}
          />
          <ToolbarActionButton
            label="Export diagram config"
            icon={<ExportConfigIcon />}
            disabled={!hasDiagram}
            onClick={noop}
          />
          <ToolbarActionButton
            label="Print diagram"
            icon={<PrintIcon />}
            disabled={!hasDiagram}
            onClick={noop}
          />
          <ToolbarActionButton
            label="Help and guide"
            icon={<HelpIcon />}
            pressed={helpOpen}
            onClick={() => setHelpOpen(true)}
          />
        </div>
      </div>
      <div className="workflow-canvas__body">
        <div className="workflow-canvas__stage">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            minZoom={0.05}
            maxZoom={2}
            nodesDraggable
            elementsSelectable
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={16} />
            <Controls />
          </ReactFlow>
        </div>
      </div>
      <HelpGuideOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export function WorkflowCanvas() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvasInner />
    </ReactFlowProvider>
  );
}
