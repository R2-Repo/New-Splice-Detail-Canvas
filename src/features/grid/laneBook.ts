import type { GridSegmentStatus } from "./segmentStatus";

export type LaneOrientation = "horizontal" | "vertical";

/** Reserved segment on a grid track (col for vertical, row for horizontal). */
export type LaneSegment = {
  orientation: LaneOrientation;
  track: number;
  spanStart: number;
  spanEnd: number;
};

export type BookedLaneSegment = LaneSegment & {
  status: GridSegmentStatus;
  /** Connection id, zone tag, or lock id. */
  owner?: string;
};

export type LaneConflict = {
  existing: BookedLaneSegment;
  requested: LaneSegment;
};

function normalizeSpan(start: number, end: number): { spanStart: number; spanEnd: number } {
  return start <= end ? { spanStart: start, spanEnd: end } : { spanStart: end, spanEnd: start };
}

function spansOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  const a = normalizeSpan(aStart, aEnd);
  const b = normalizeSpan(bStart, bEnd);
  // Touching at an endpoint is allowed (shared midX corner).
  return a.spanStart < b.spanEnd && b.spanStart < a.spanEnd;
}

function normalizeSegment(segment: LaneSegment): LaneSegment {
  return { ...segment, ...normalizeSpan(segment.spanStart, segment.spanEnd) };
}

export class LaneBook {
  private readonly segments: BookedLaneSegment[] = [];

  /** Occupied route segments — backward compatible with debug overlay. */
  get booked(): readonly LaneSegment[] {
    return this.segments
      .filter((s) => s.status === "occupied" || s.status === "manual-locked")
      .map(({ orientation, track, spanStart, spanEnd }) => ({
        orientation,
        track,
        spanStart,
        spanEnd,
      }));
  }

  get allSegments(): readonly BookedLaneSegment[] {
    return this.segments;
  }

  conflicts(segment: LaneSegment, forStatus: GridSegmentStatus = "occupied"): LaneConflict | null {
    const req = normalizeSegment(segment);

    for (const existing of this.segments) {
      if (existing.orientation !== req.orientation) continue;
      if (existing.track !== req.track) continue;
      if (!spansOverlap(existing.spanStart, existing.spanEnd, req.spanStart, req.spanEnd)) continue;

      if (forStatus === "blocked") {
        if (existing.status === "occupied" || existing.status === "manual-locked") {
          return { existing, requested: req };
        }
        continue;
      }

      if (
        existing.status === "occupied" ||
        existing.status === "manual-locked" ||
        existing.status === "blocked"
      ) {
        return { existing, requested: req };
      }
    }

    return null;
  }

  /** @deprecated Use conflicts() */
  isBooked(segment: LaneSegment): LaneConflict | null {
    return this.conflicts(segment);
  }

  /**
   * Reserve a segment with explicit status (blocked, manual-locked, occupied).
   * Returns false when the segment overlaps a blocking segment.
   */
  tryReserve(
    segment: LaneSegment,
    status: GridSegmentStatus = "occupied",
    owner?: string,
  ): boolean {
    const conflict = this.conflicts(segment, status);
    if (conflict) return false;

    const normalized = normalizeSegment(segment);
    this.segments.push({ ...normalized, status, owner });
    return true;
  }

  /** Mark a zone segment as blocked from general routing. */
  block(segment: LaneSegment, owner?: string): boolean {
    return this.tryReserve(segment, "blocked", owner);
  }

  /** Book an occupied route segment. */
  tryBook(segment: LaneSegment, owner?: string): boolean {
    return this.tryReserve(segment, "occupied", owner);
  }

  bookOrThrow(segment: LaneSegment, owner?: string): void {
    if (!this.tryBook(segment, owner)) {
      throw new Error(
        `Lane conflict on ${segment.orientation} track ${segment.track}: ` +
          `[${segment.spanStart}, ${segment.spanEnd}]`,
      );
    }
  }

  segmentsWithStatus(status: GridSegmentStatus): readonly BookedLaneSegment[] {
    return this.segments.filter((s) => s.status === status);
  }
}
