import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { HelpGuideOverlay } from "@/components/help/HelpGuideOverlay";
import { CsvImportButton } from "@/components/import/CsvImportButton";
import { ParseInspectOverlay } from "@/components/import/ParseInspectOverlay";
import { MapEmbedButton } from "@/components/maps/MapEmbedButton";
import { CalloutsToolbarControl } from "@/components/toolbar/CalloutsToolbarControl";
import {
  ExportConfigIcon,
  HelpIcon,
  HorizontalLayoutIcon,
  InspectIcon,
  MapIcon,
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
import { CABLE_BOX_HEIGHT_PX } from "@/features/canvas/nodes/CableNode";
import { nodeTypes } from "@/features/canvas/nodeTypes";
import type { ConnectionGraph } from "@/features/diagram/types";
import { GRID_PITCH, pxToGrid } from "@/features/grid";
import type { LaneBook } from "@/features/grid";
import type { HorizontalZoneLayout } from "@/features/grid/zones";
import type { QuadZoneLayout } from "@/features/grid/quadZones";
import type { InspectReport } from "@/features/import/inspectBentleyCsv";
import { runImport, type ImportResult } from "@/features/import/runImport";
import { serializeSdcJson, type SdcJsonDocument } from "@/features/import/parseSdcJson";
import {
  createManualLock,
  preserveLocksAfterImport,
  removeLocksForObjects,
  upsertManualLock,
  validLockObjectIds,
  rerunLayoutWithLocks,
  snapCableLockGeometry,
  snapSpliceLockGeometry,
  snapStrandLaneCol,
  type ManualLock,
} from "@/features/interaction";
import type { LayoutResult } from "@/features/layout/types";
import type { RoutingResult } from "@/features/routing/routeConnections";
import { validateImportResult } from "@/features/rules/validateImport";
import type { RunRulesResult } from "@/features/rules/types";

const CABLE_BOX_H = CABLE_BOX_HEIGHT_PX;

type ContextMenuState = {
  x: number;
  y: number;
  nodeIds: string[];
  edgeIds: string[];
};

function WorkflowCanvasInner() {
  const { getNodes, getEdges } = useReactFlow();
  const [hasDiagram, setHasDiagram] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [horizontalZone, setHorizontalZone] = useState<HorizontalZoneLayout | null>(null);
  const [quadZone, setQuadZone] = useState<QuadZoneLayout | null>(null);
  const [laneBook, setLaneBook] = useState<LaneBook | null>(null);
  const [layout, setLayout] = useState<LayoutResult | null>(null);
  const [routing, setRouting] = useState<RoutingResult | null>(null);
  const [manualLocks, setManualLocks] = useState<ManualLock[]>([]);
  const [manualWarning, setManualWarning] = useState<string | undefined>();
  const [gridDebug, setGridDebug] = useState(() => readGridDebugEnabled());
  const [inspectReport, setInspectReport] = useState<InspectReport | null>(null);
  const [importError, setImportError] = useState<string | undefined>();
  const [connectionGraph, setConnectionGraph] = useState<ConnectionGraph | null>(null);
  const [validation, setValidation] = useState<RunRulesResult | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const graphRef = useRef<ConnectionGraph | null>(null);

  const [collapseFullButtSplices, setCollapseFullButtSplices] = useState(true);
  const [calloutsVisible, setCalloutsVisible] = useState(true);
  const [calloutScale, setCalloutScale] = useState(CALLOUT_SCALE_DEFAULT);
  const [calloutAutoZoom, setCalloutAutoZoom] = useState(CALLOUT_AUTO_ZOOM_DEFAULT);
  const [circuitPanelOpen, setCircuitPanelOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useState<"horizontal" | "quad">("horizontal");
  const [helpOpen, setHelpOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [lastImport, setLastImport] = useState<{ text: string; fileName: string } | null>(null);

  const applyPipelineResult = useCallback(
    (result: ImportResult | Awaited<ReturnType<typeof rerunLayoutWithLocks>>, locks: ManualLock[]) => {
      setNodes(result.nodes);
      setEdges(result.edges);
      setLaneBook(result.laneBook);
      setLayout(result.layout);
      setRouting(result.routing);
      setManualLocks(locks);

      if ("inspectReport" in result) {
        setInspectReport(result.inspectReport ?? null);
        setImportError(result.error);
        if (result.connectionGraph) {
          setConnectionGraph(result.connectionGraph);
          graphRef.current = result.connectionGraph;
        }
      }

      const importResult: ImportResult = {
        nodes: result.nodes,
        edges: result.edges,
        zoneLayout: result.zoneLayout,
        zoneMode: result.zoneMode,
        laneBook: result.laneBook,
        connectionGraph: ("connectionGraph" in result && result.connectionGraph) || graphRef.current!,
        normalizedImport: "normalizedImport" in result ? result.normalizedImport : undefined,
        inspectReport: "inspectReport" in result ? result.inspectReport ?? null : inspectReport,
        layoutMode: "layoutMode" in result ? result.layoutMode : layoutMode,
        layout: result.layout,
        routing: result.routing,
        placementPlanId: result.placementPlanId,
        routeScore: result.routeScore,
        manualLocks: locks,
        error: "error" in result ? result.error : undefined,
      };

      setValidation(importResult.connectionGraph ? validateImportResult(importResult) : null);
      setHasDiagram(result.nodes.length > 0);

      if (result.zoneMode === "quad" && result.zoneLayout) {
        setQuadZone(result.zoneLayout as QuadZoneLayout);
        setHorizontalZone(null);
      } else if (result.zoneLayout) {
        setHorizontalZone(result.zoneLayout as HorizontalZoneLayout);
        setQuadZone(null);
      }

      const routeErrors = result.routing.routes.filter((r) => r.routeError).length;
      if (locks.length > 0 && routeErrors > 0) {
        setManualWarning(`${routeErrors} route(s) could not adjust cleanly around locked items.`);
      } else {
        setManualWarning(undefined);
      }
    },
    [inspectReport, layoutMode],
  );

  const rerunWithLocks = useCallback(
    async (graph: ConnectionGraph, locks: ManualLock[], mode = layoutMode) => {
      const result = await rerunLayoutWithLocks(graph, mode, locks);
      applyPipelineResult(result, locks);
    },
    [applyPipelineResult, layoutMode],
  );

  const applyImportResult = useCallback(
    (result: Awaited<ReturnType<typeof runImport>>, locks: ManualLock[]) => {
      applyPipelineResult(result, locks);
    },
    [applyPipelineResult],
  );

  const reloadLayout = useCallback(
    async (text: string, fileName: string, mode: "horizontal" | "quad", locks: ManualLock[] = []) => {
      const preserved = graphRef.current
        ? preserveLocksAfterImport(locks, validLockObjectIds(graphRef.current))
        : locks;
      const result = await runImport(text, fileName, {
        layoutMode: mode,
        manualLocks: preserved,
        preserveManualLocks: preserved,
        optimizeLayout: preserved.length === 0,
      });
      applyImportResult(result, preserved);
    },
    [applyImportResult],
  );

  const handleImport = useCallback(
    async (text: string, fileName: string) => {
      setLastImport({ text, fileName });
      await reloadLayout(text, fileName, layoutMode, []);
    },
    [layoutMode, reloadLayout],
  );

  useEffect(() => {
    if (!lastImport) return;
    void reloadLayout(lastImport.text, lastImport.fileName, layoutMode, manualLocks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutMode]);

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

  const handleResetLayout = useCallback(async () => {
    if (!lastImport) return;
    await reloadLayout(lastImport.text, lastImport.fileName, layoutMode, []);
  }, [lastImport, layoutMode, reloadLayout]);

  const handleUnlockAll = useCallback(async () => {
    const graph = graphRef.current;
    if (!graph) return;
    await rerunWithLocks(graph, []);
  }, [rerunWithLocks]);

  const commitLocks = useCallback(
    async (nextLocks: ManualLock[]) => {
      const graph = graphRef.current;
      if (!graph) return;
      await rerunWithLocks(graph, nextLocks);
    },
    [rerunWithLocks],
  );

  const onNodeDragStop = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      const graph = graphRef.current;
      if (!graph || layoutMode !== "horizontal") return;

      if (node.id.startsWith("cable-")) {
        const legId = node.id.slice("cable-".length);
        const side = (node.data as { side?: string }).side ?? "left";
        const geometry = snapCableLockGeometry(
          node.position.x,
          node.position.y,
          CABLE_BOX_H,
          side as "left" | "right",
          horizontalZone,
        );
        const lock = createManualLock("cable", legId, geometry);
        void commitLocks(upsertManualLock(manualLocks, lock));
        return;
      }

      if (node.id.startsWith("splice-")) {
        const connId = node.id.slice("splice-".length);
        const geometry = snapSpliceLockGeometry(node.position.x, node.position.y);
        const lock = createManualLock("spliceDot", connId, geometry);
        void commitLocks(upsertManualLock(manualLocks, lock));
        return;
      }

      if (node.id.startsWith("fiber-")) {
        const fiberId = node.id.slice("fiber-".length);
        const fiber = graph.fibers.find((f) => f.id === fiberId);
        if (!fiber) return;
        const tubeId = `${fiber.legId}::${fiber.tubeColor}`;
        const col = snapStrandLaneCol(node.position.x);
        const row = pxToGrid(node.position.y);
        const lock = createManualLock("fanout", tubeId, { col, row });
        void commitLocks(upsertManualLock(manualLocks, lock));
      }
    },
    [commitLocks, horizontalZone, layoutMode, manualLocks],
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      if (!edge.id.startsWith("edge-")) return;
      const connId = (edge.data as { connectionId?: string })?.connectionId ?? edge.id.slice(5);
      const midTrack = (edge.data as { midTrack?: number })?.midTrack ?? routing?.routes.find((r) => r.connectionId === connId)?.midTrack;
      const row = layout?.connectionRows.get(connId);
      if (midTrack === undefined || row === undefined) return;
      const lock = createManualLock("strandLane", connId, {
        orientation: "vertical",
        track: midTrack,
        spanStart: row - 2,
        spanEnd: row + 2,
      });
      void commitLocks(upsertManualLock(manualLocks, lock));
    },
    [commitLocks, layout, manualLocks, routing],
  );

  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      const selectedNodes = getNodes().filter((n) => n.selected).map((n) => n.id);
      const selectedEdges = getEdges().filter((e) => e.selected).map((e) => e.id);
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        nodeIds: selectedNodes,
        edgeIds: selectedEdges,
      });
    },
    [getEdges, getNodes],
  );

  const closeContextMenu = useCallback(() => setContextMenu(null), []);

  const unlockSelected = useCallback(async () => {
    if (!contextMenu) return;
    const objectIds = new Set<string>();
    for (const nodeId of contextMenu.nodeIds) {
      if (nodeId.startsWith("cable-")) objectIds.add(nodeId.slice(6));
      if (nodeId.startsWith("splice-")) objectIds.add(nodeId.slice(7));
    }
    for (const edgeId of contextMenu.edgeIds) {
      const edge = getEdges().find((e) => e.id === edgeId);
      const connId = (edge?.data as { connectionId?: string })?.connectionId;
      if (connId) objectIds.add(connId);
    }
    closeContextMenu();
    if (objectIds.size === 0) return;
    await commitLocks(removeLocksForObjects(manualLocks, objectIds));
  }, [closeContextMenu, commitLocks, contextMenu, getEdges, manualLocks]);

  const lockSelectedStrandLane = useCallback(async () => {
    if (!contextMenu || contextMenu.edgeIds.length === 0) return;
    const edge = getEdges().find((e) => e.id === contextMenu.edgeIds[0]);
    closeContextMenu();
    if (!edge) return;
    const connId = (edge.data as { connectionId?: string })?.connectionId ?? edge.id.slice(5);
    const midTrack = (edge.data as { midTrack?: number })?.midTrack ?? routing?.routes.find((r) => r.connectionId === connId)?.midTrack;
    const row = layout?.connectionRows.get(connId);
    if (midTrack === undefined || row === undefined) return;
    const lock = createManualLock("strandLane", connId, {
      orientation: "vertical",
      track: midTrack,
      spanStart: row - 2,
      spanEnd: row + 2,
    });
    await commitLocks(upsertManualLock(manualLocks, lock));
  }, [closeContextMenu, commitLocks, contextMenu, getEdges, layout, manualLocks, routing]);

  const handleExportConfig = useCallback(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const doc: SdcJsonDocument = {
      version: 1,
      spliceName: graph.spliceName,
      layoutMode,
      connectionGraph: graph,
      manualLocks,
    };
    const blob = new Blob([serializeSdcJson(doc)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${graph.spliceName.replace(/\s+/g, "_")}_splice-detail.sdc.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [layoutMode, manualLocks]);

  const validationSummary = validation
    ? validation.errors.length || validation.warnings.length
      ? ` · ${validation.errors.length} err / ${validation.warnings.length} warn`
      : " · checks passed"
    : "";

  const lockSummary = manualLocks.length > 0 ? ` · ${manualLocks.length} locked` : "";

  const hint = hasDiagram
    ? `${connectionGraph?.spliceName ?? "Diagram"} · ${connectionGraph?.connections.length ?? 0} splices${lockSummary}${validationSummary} · Shift+G grid debug`
    : "Import a Bentley CSV or .sdc.json";

  const flowProps = useMemo(
    () => ({
      nodesDraggable: layoutMode === "horizontal",
      nodesConnectable: false,
      elementsSelectable: true,
    }),
    [layoutMode],
  );

  return (
    <div className={`workflow-canvas${manualLocks.length > 0 ? " workflow-canvas--has-locks" : ""}`}>
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
          {hasDiagram ? (
            <>
              <ToolbarActionButton
                label="Reset to auto layout"
                icon={<ResetIcon />}
                onClick={() => void handleResetLayout()}
              />
              <ToolbarActionButton
                label="Unlock all"
                disabled={manualLocks.length === 0}
                icon={<ResetIcon />}
                onClick={() => void handleUnlockAll()}
              />
            </>
          ) : null}
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
        </div>
        <div className="workflow-canvas__toolbar-center">
          <span className="workflow-canvas__hint">{hint}</span>
          {manualWarning ? (
            <span className="workflow-canvas__hint workflow-canvas__manual-warning">{manualWarning}</span>
          ) : null}
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
            onClick={handleExportConfig}
          />
          <ToolbarActionButton label="Print diagram" icon={<PrintIcon />} disabled={!hasDiagram} onClick={() => {}} />
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
            onNodeDragStop={onNodeDragStop}
            onEdgeClick={onEdgeClick}
            onPaneContextMenu={onPaneContextMenu}
            onPaneClick={closeContextMenu}
            minZoom={0.05}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
            {...flowProps}
          >
            <Background variant={BackgroundVariant.Dots} gap={GRID_PITCH} size={1.5} />
            <Controls />
            {horizontalZone ? (
              <GridDebugOverlay zoneLayout={horizontalZone} laneBook={laneBook} enabled={gridDebug} />
            ) : null}
            {quadZone ? (
              <GridDebugOverlay quadZoneLayout={quadZone} laneBook={laneBook} enabled={gridDebug} />
            ) : null}
          </ReactFlow>
          {contextMenu ? (
            <div
              className="canvas-context-menu"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              role="menu"
            >
              <button type="button" className="canvas-context-menu__item" onClick={() => void unlockSelected()}>
                Unlock selected
              </button>
              <button
                type="button"
                className="canvas-context-menu__item"
                disabled={contextMenu.edgeIds.length === 0}
                onClick={() => void lockSelectedStrandLane()}
              >
                Lock strand lane
              </button>
              <button type="button" className="canvas-context-menu__item" onClick={() => void handleUnlockAll()}>
                Unlock all
              </button>
            </div>
          ) : null}
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
