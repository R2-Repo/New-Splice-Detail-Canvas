import type { ReactNode } from "react";

import {
  AutoIcon,
  CalloutIcon,
  CollapseIcon,
  ExportConfigIcon,
  FolderPlusIcon,
  HorizontalLayoutIcon,
  InspectIcon,
  ListIcon,
  ManualIcon,
  MapIcon,
  PrintIcon,
  QuadLayoutIcon,
  ReportIcon,
} from "@/components/toolbar/ToolbarIcon";
import {
  DropFileIllustration,
  ScrollZoomIllustration,
  ZoomControlsIllustration,
} from "@/components/help/HelpGuideIllustrations";

function HelpSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="help-guide-overlay__section">
      <h3 className="help-guide-overlay__section-title">{title}</h3>
      {children}
    </section>
  );
}

function ToolbarMapItem({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="help-guide-overlay__toolbar-item">
      <span className="help-guide-overlay__toolbar-icon">{icon}</span>
      <span className="help-guide-overlay__toolbar-label">{label}</span>
    </div>
  );
}

export function HelpGuideContent() {
  return (
    <div className="help-guide-overlay__content">
      <HelpSection title="Rebuild in progress">
        <p className="help-guide-overlay__toolbar-note">
          The splice diagram engine is being rebuilt from scratch. Import,
          layout, routing, and export controls will be documented here as each
          feature returns.
        </p>
      </HelpSection>

      <HelpSection title="Get started">
        <p className="help-guide-overlay__toolbar-note">
          Use <strong>Import file</strong> to load a Bentley splice CSV once
          import is wired. You can also drop a file on the canvas.
        </p>
        <div className="help-guide-overlay__card-grid help-guide-overlay__card-grid--compact">
          <div className="help-guide-overlay__card">
            <div className="help-guide-overlay__card-visual">
              <DropFileIllustration />
            </div>
            <span className="help-guide-overlay__card-caption">Drop file on canvas</span>
          </div>
        </div>
      </HelpSection>

      <HelpSection title="Toolbar">
        <div className="help-guide-overlay__toolbar-map">
          <ToolbarMapItem icon={<FolderPlusIcon />} label="Import" />
          <ToolbarMapItem icon={<CollapseIcon />} label="Tubes" />
          <ToolbarMapItem icon={<CalloutIcon />} label="Callouts" />
          <ToolbarMapItem icon={<ListIcon />} label="Circuits" />
          <ToolbarMapItem icon={<AutoIcon />} label="Auto" />
          <ToolbarMapItem icon={<ManualIcon />} label="Manual" />
          <ToolbarMapItem icon={<HorizontalLayoutIcon />} label="L/R" />
          <ToolbarMapItem icon={<QuadLayoutIcon />} label="4-side" />
          <ToolbarMapItem icon={<MapIcon />} label="Map" />
          <ToolbarMapItem icon={<ReportIcon />} label="Report" />
          <ToolbarMapItem icon={<InspectIcon />} label="Inspect" />
          <ToolbarMapItem icon={<ExportConfigIcon />} label="Export" />
          <ToolbarMapItem icon={<PrintIcon />} label="Print" />
        </div>
      </HelpSection>

      <HelpSection title="Canvas">
        <div className="help-guide-overlay__card-grid">
          <div className="help-guide-overlay__card">
            <div className="help-guide-overlay__card-visual">
              <ScrollZoomIllustration />
            </div>
            <span className="help-guide-overlay__card-caption">Scroll zoom</span>
          </div>
          <div className="help-guide-overlay__card">
            <div className="help-guide-overlay__card-visual">
              <ZoomControlsIllustration />
            </div>
            <span className="help-guide-overlay__card-caption">Corner controls</span>
          </div>
        </div>
      </HelpSection>
    </div>
  );
}
