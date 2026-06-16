import { formatInspectReport, type InspectReport } from "@/features/import/inspectBentleyCsv";

type ParseInspectOverlayProps = {
  open: boolean;
  report: InspectReport | null;
  error?: string;
  onClose: () => void;
};

export function ParseInspectOverlay({ open, report, error, onClose }: ParseInspectOverlayProps) {
  if (!open) return null;

  const body = report ? formatInspectReport(report) : error ?? "No import report available.";

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
        <pre className="parse-inspect-overlay__body">{body}</pre>
      </div>
    </div>
  );
}
