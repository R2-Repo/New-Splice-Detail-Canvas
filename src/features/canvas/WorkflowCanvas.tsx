import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useState } from "react";

import { HelpGuideOverlay } from "@/components/help/HelpGuideOverlay";
import { CsvImportButton } from "@/components/import/CsvImportButton";
import { ParseInspectOverlay } from "@/components/import/ParseInspectOverlay";
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
import { edgeTypes } from "@/features/canvas/edgeTypes";
import {
  GridDebugOverlay,
  readGridDebugEnabled,
  toggleGridDebugStorage,
} from "@/features/canvas/GridDebugOverlay";
import { nodeTypes } from "@/features/canvas/nodeTypes";
import type { ConnectionGraph } from "@/features/diagram/types";
import { GRID_PITCH } from "@/features/grid";
import type { LaneBook } from "@/features/grid";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import type { QuadZoneLayout } from "@/features/grid/quadZones";
import type { InspectReport } from "@/features/import/inspectBentleyCsv";
import { runImport } from "@/features/import/runImport";
import { validateImportResult } from "@/features/rules/validateImport";
import type { RunRulesResult } from "@/features/rules/types";

function WorkflowCanvasInner() {
  const [hasDiagram, setHasDiagram] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [horizontalZone, setHorizontalZone] = useState<HorizontalZoneLayout | null>(null);
  const [quadZone, setQuadZone] = useState<QuadZoneLayout | null>(null);
  const [laneBook, setLaneBook] = useState<LaneBook | null>(null);
  const [gridDebug, setGridDebug] = useState(() => readGridDebugEnabled());
  const [inspectReport, setInspectReport] = useState<InspectReport | null>(null);
  const [importError, setImportError] = useState<string | undefined>();
  const [connectionGraph, setConnectionGraph] = useState<ConnectionGraph | null>(null);
  const [validation, setValidation] = useState<RunRulesResult | null>(null);

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
  const [lastImport, setLastImport] = useState<{ text: string; fileName: string } | null>(null);

  const applyImportResult = useCallback(
    (result: Awaited<ReturnType<typeof runImport>>) => {
      setNodes(result.nodes);
      setEdges(result.edges);
      setLaneBook(result.laneBook);
      setInspectReport(result.inspectReport);
      setImportError(result.error);
      setConnectionGraph(result.connectionGraph);
      setValidation(result.error ? null : validateImportResult(result));
      setHasDiagram(result.nodes.length > 0);

      if (result.zoneMode === "quad" && result.zoneLayout) {
        setQuadZone(result.zoneLayout as QuadZoneLayout);
        setHorizontalZone(null);
      } else if (result.zoneLayout) {
        setHorizontalZone(result.zoneLayout as HorizontalZoneLayout);
        setQuadZone(null);
      }
    },
    [setEdges, setNodes],
  );

  const reloadLayout = useCallback(
    async (text: string, fileName: string, mode: "horizontal" | "quad") => {
      const result = await runImport(text, fileName, { layoutMode: mode });
      applyImportResult(result);
    },
    [applyImportResult],
  );

  const handleImport = useCallback(
    async (text: string, fileName: string) => {
      setLastImport({ text, fileName });
      await reloadLayout(text, fileName, layoutMode);
    },
    [layoutMode, reloadLayout],
  );

  useEffect(() => {
    if (!lastImport) return;
    void reloadLayout(lastImport.text, lastImport.fileName, layoutMode);
  }, [layoutMode, lastImport, reloadLayout]);

  // Quick-load a bundled sample via `?sample=<name>` (e.g. ?sample=sp3254).
  useEffect(() => {
    const sample = new URLSearchParams(window.location.search).get("sample");
    if (!sample) return;
    const url = `${import.meta.env.BASE_URL}samples/${sample}.csv`;
    void fetch(url)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`sample ${sample} not found`))))
      .then((text) => void handleImport(text, `${sample}.csv`))
      .catch((err) => setImportError(String(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === "g") {
        setGridDebug(toggleGridDebugStorage());
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const noop = useCallback(() => {}, []);

  const validationSummary = validation
    ? validation.errors.length || validation.warnings.length
      ? ` · ${validation.errors.length} err / ${validation.warnings.length} warn`
      : " · checks passed"
    : "";

  const hint = hasDiagram
    ? `${connectionGraph?.spliceName ?? "Diagram"} · ${connectionGraph?.connections.length ?? 0} splices${validationSummary} · Shift+G grid debug`
    : "Import a Bentley CSV or .sdc.json";

  return (
    <div className="workflow-canvas">
      <div className="workflow-canvas__toolbar">
        <div className="workflow-canvas__toolbar-left">
          <CsvImportButton onImport={(text, fileName) => void handleImport(text, fileName)} active={hasDiagram} />
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
              onClick={() => {
                if (lastImport) void reloadLayout(lastImport.text, lastImport.fileName, layoutMode);
              }}
            />
          ) : null}
        </div>
        <div className="workflow-canvas__toolbar-center">
          <span className="workflow-canvas__hint">{hint}</span>
          {importError ? <span className="workflow-canvas__hint workflow-canvas__hint--error">{importError}</span> : null}
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
            disabled={!hasDiagram && !inspectReport}
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
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            minZoom={0.05}
            maxZoom={2}
            nodesDraggable
            elementsSelectable
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={GRID_PITCH} size={1.5} />
            <Controls />
            {horizontalZone ? (
              <GridDebugOverlay
                zoneLayout={horizontalZone}
                laneBook={laneBook}
                enabled={gridDebug}
              />
            ) : null}
            {quadZone ? (
              <GridDebugOverlay
                quadZoneLayout={quadZone}
                laneBook={laneBook}
                enabled={gridDebug}
              />
            ) : null}
          </ReactFlow>
        </div>
      </div>
      <HelpGuideOverlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <ParseInspectOverlay
        open={inspectorOpen}
        report={inspectReport}
        validation={validation}
        error={importError}
        onClose={() => setInspectorOpen(false)}
      />
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
