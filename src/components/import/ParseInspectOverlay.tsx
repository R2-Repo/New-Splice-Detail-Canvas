import { formatInspectReport, type InspectReport } from "@/features/import/inspectBentleyCsv";
import { formatValidation } from "@/features/rules/validateImport";
import type { RunRulesResult } from "@/features/rules/types";

type ParseInspectOverlayProps = {
  open: boolean;
  report: InspectReport | null;
  validation?: RunRulesResult | null;
  error?: string;
  onClose: () => void;
};

export function ParseInspectOverlay({ open, report, validation, error, onClose }: ParseInspectOverlayProps) {
  if (!open) return null;

  const reportBody = report ? formatInspectReport(report) : error ?? "No import report available.";
  const validationBody = validation ? formatValidation(validation) : null;

  return (
    <div className="parse-inspect-overlay" role="dialog" aria-label="CSV parse report">
      <div className="parse-inspect-overlay__backdrop" onClick={onClose} />
      <div className="parse-inspect-overlay__panel">
        <header className="parse-inspect-overlay__header">
          <h2>CSV parse report</h2>
          <button type="button" className="parse-inspect-overlay__close" onClick={onClose}>
            Close
          </button>
        </header>
        <pre className="parse-inspect-overlay__body">{reportBody}</pre>
        {validationBody ? (
          <pre className="parse-inspect-overlay__body">{validationBody}</pre>
        ) : null}
      </div>
    </div>
  );
}
