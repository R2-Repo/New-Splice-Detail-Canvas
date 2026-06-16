export type LaneOrientation = "horizontal" | "vertical";

/** Reserved segment on a grid track (col for vertical, row for horizontal). */
export type LaneSegment = {
  orientation: LaneOrientation;
  track: number;
  spanStart: number;
  spanEnd: number;
};

export type LaneConflict = {
  existing: LaneSegment;
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

export class LaneBook {
  private readonly segments: LaneSegment[] = [];

  get booked(): readonly LaneSegment[] {
    return this.segments;
  }

  isBooked(segment: LaneSegment): LaneConflict | null {
    const req = {
      ...segment,
      ...normalizeSpan(segment.spanStart, segment.spanEnd),
    };

    for (const existing of this.segments) {
      if (existing.orientation !== req.orientation) continue;
      if (existing.track !== req.track) continue;
      if (spansOverlap(existing.spanStart, existing.spanEnd, req.spanStart, req.spanEnd)) {
        return { existing, requested: req };
      }
    }

    return null;
  }

  tryBook(segment: LaneSegment): boolean {
    const conflict = this.isBooked(segment);
    if (conflict) return false;

    const normalized = normalizeSpan(segment.spanStart, segment.spanEnd);
    this.segments.push({ ...segment, ...normalized });
    return true;
  }

  bookOrThrow(segment: LaneSegment): void {
    if (!this.tryBook(segment)) {
      throw new Error(
        `Lane conflict on ${segment.orientation} track ${segment.track}: ` +
          `[${segment.spanStart}, ${segment.spanEnd}]`,
      );
    }
  }
}
