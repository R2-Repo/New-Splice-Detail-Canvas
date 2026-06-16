import { useEffect, useRef, useState, type ReactNode } from "react";

import { ToolbarActionButton } from "@/components/toolbar/ToolbarSegmentedControl";

type MapEmbedButtonProps = {
  location?: string;
  spliceLabel?: string;
  disabled?: boolean;
  icon: ReactNode;
};

export function MapEmbedButton({
  location,
  spliceLabel,
  disabled = false,
  icon,
}: MapEmbedButtonProps) {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (anchorRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  return (
    <div className="map-embed" ref={anchorRef}>
      <ToolbarActionButton
        label="Open map embed"
        icon={icon}
        disabled={disabled}
        pressed={open}
        expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      />
      {open ? (
        <section
          className="map-embed-popover"
          role="dialog"
          aria-label="Map embed"
        >
          <p className="map-embed-popover__placeholder">
            {location
              ? `Location: ${location}${spliceLabel ? ` (${spliceLabel})` : ""}`
              : "Map embed will be wired after import is rebuilt."}
          </p>
        </section>
      ) : null}
    </div>
  );
}
