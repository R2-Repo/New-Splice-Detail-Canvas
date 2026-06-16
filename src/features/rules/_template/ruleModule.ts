import type { DiagramSnapshot, RuleModule } from "../types";
import { ruleId } from "../types";

/**
 * Copy this folder when adding a new rule module.
 * 1. Duplicate `_template/` to `<your-rule-id>/`
 * 2. Implement `check()` and tests
 * 3. Register in `registry.ts`
 * 4. Add spec at `docs/agent/rules/<your-rule-id>.md`
 */
export const templateRuleModule: RuleModule = {
  id: ruleId("your-rule-id"),
  title: "Your rule title",
  stage: "full",
  check(_snapshot: DiagramSnapshot) {
    return [];
  },
};
