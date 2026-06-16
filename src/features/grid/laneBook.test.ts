import { describe, expect, it } from "vitest";

import { LaneBook } from "./laneBook";

describe("LaneBook", () => {
  it("books non-overlapping segments on the same track", () => {
    const book = new LaneBook();
    expect(
      book.tryBook({ orientation: "vertical", track: 20, spanStart: 10, spanEnd: 14 }),
    ).toBe(true);
    expect(
      book.tryBook({ orientation: "vertical", track: 21, spanStart: 10, spanEnd: 14 }),
    ).toBe(true);
  });

  it("rejects overlapping segments on the same track", () => {
    const book = new LaneBook();
    book.tryBook({ orientation: "vertical", track: 20, spanStart: 10, spanEnd: 14 });
    expect(
      book.tryBook({ orientation: "vertical", track: 20, spanStart: 12, spanEnd: 16 }),
    ).toBe(false);
  });

  it("allows adjacent non-overlapping spans on same track", () => {
    const book = new LaneBook();
    book.tryBook({ orientation: "horizontal", track: 8, spanStart: 5, spanEnd: 10 });
    expect(
      book.tryBook({ orientation: "horizontal", track: 8, spanStart: 11, spanEnd: 15 }),
    ).toBe(true);
  });

  it("allows segments that meet at a shared endpoint", () => {
    const book = new LaneBook();
    book.tryBook({ orientation: "horizontal", track: 14, spanStart: 8, spanEnd: 13 });
    expect(
      book.tryBook({ orientation: "horizontal", track: 14, spanStart: 13, spanEnd: 32 }),
    ).toBe(true);
  });

  it("allows perpendicular segments at same grid location", () => {
    const book = new LaneBook();
    book.tryBook({ orientation: "vertical", track: 20, spanStart: 10, spanEnd: 14 });
    expect(
      book.tryBook({ orientation: "horizontal", track: 12, spanStart: 18, spanEnd: 22 }),
    ).toBe(true);
  });
});
