import { describe, expect, it } from "vitest";

import type { SpliceConnection } from "@/features/diagram/types";
import type { LaneBook, LaneSegment } from "@/features/grid/laneBook";
import type { RoutedConnection } from "@/features/routing/routeConnections";

import { buildSnapshotFromExample, buildSnapshotFromSp3254, emptySnapshot } from "../buildSnapshot";
import { runRule } from "../runRules";
import { isError, type DiagramSnapshot } from "../types";

import { sdcGrid001 } from "./ruleModule";

function connection(id: string): SpliceConnection {
  return { id, lineNumber: 1, fromFiberId: `${id}-a`, toFiberId: `${id}-b`, fromLegId: "A#from", toLegId: "B#to" };
}

function snapshotWithRouting(
  connections: SpliceConnection[],
  routes: RoutedConnection[],
  booked: LaneSegment[] = [],
): DiagramSnapshot {
  const base = emptySnapshot();
  return {
    ...base,
    connectionGraph: { ...base.connectionGraph, connections },
    routing: { laneBook: { booked } as unknown as LaneBook, routes },
  };
}

describe("sdc-grid-001", () => {
  it("passes the empty snapshot", () => {
    expect(runRule(sdcGrid001, emptySnapshot())).toEqual([]);
  });

  it("passes one clean route per connection", () => {
    const snapshot = snapshotWithRouting(
      [connection("c1")],
      [{ connectionId: "c1", path: "M 0 0 L 24 0" }],
    );
    expect(runRule(sdcGrid001, snapshot)).toEqual([]);
  });

  it("errors when route count does not match connection count", () => {
    const snapshot = snapshotWithRouting([connection("c1")], []);
    expect(runRule(sdcGrid001, snapshot).filter(isError).length).toBeGreaterThan(0);
  });

  it("warns (non-blocking) when a leg cannot be routed", () => {
    const snapshot = snapshotWithRouting(
      [connection("c1")],
      [{ connectionId: "c1", path: "", routeError: "lane conflict" }],
    );
    const violations = runRule(sdcGrid001, snapshot);
    expect(violations.filter(isError)).toEqual([]);
    expect(violations.some((v) => v.severity === "warning")).toBe(true);
  });

  it("errors when a route has no path and no error", () => {
    const snapshot = snapshotWithRouting(
      [connection("c1")],
      [{ connectionId: "c1", path: "" }],
    );
    expect(runRule(sdcGrid001, snapshot).filter(isError).length).toBeGreaterThan(0);
  });

  it("errors when two booked lane segments overlap", () => {
    const snapshot = snapshotWithRouting([], [], [
      { orientation: "vertical", track: 5, spanStart: 0, spanEnd: 10 },
      { orientation: "vertical", track: 5, spanStart: 4, spanEnd: 12 },
    ]);
    expect(runRule(sdcGrid001, snapshot).filter(isError).length).toBeGreaterThan(0);
  });

  it("reference passes Example #1 with no errors", async () => {
    const snapshot = await buildSnapshotFromExample(1);
    expect(runRule(sdcGrid001, snapshot).filter(isError)).toEqual([]);
  });

  it("reference passes SP-3254.5 with no errors", async () => {
    const snapshot = await buildSnapshotFromSp3254();
    expect(runRule(sdcGrid001, snapshot).filter(isError)).toEqual([]);
  });
});
