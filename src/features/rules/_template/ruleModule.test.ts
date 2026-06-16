import { describe, expect, it } from "vitest";

import { emptySnapshot } from "../buildSnapshot";
import { buildSnapshotFromExample } from "../buildSnapshot";
import { runRule } from "../runRules";

import { templateRuleModule } from "./ruleModule";

describe("your-rule-id", () => {
  it("passes minimal valid fixture", () => {
    expect(runRule(templateRuleModule, emptySnapshot())).toEqual([]);
  });

  it("reference passes Example #1 horizontal", async () => {
    const snapshot = await buildSnapshotFromExample(1);
    expect(runRule(templateRuleModule, snapshot)).toEqual([]);
  });
});
