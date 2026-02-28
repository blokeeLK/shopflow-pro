import { useEffect } from "react";

export function SecurityShield() {
  useEffect(() => {
    // Disable right-click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Block dev tools shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // F12
      if (e.key === "F12") {
        e.preventDefault();
        return;
      }

      if (ctrl) {
        // Ctrl+U (view source), Ctrl+S (save), Ctrl+P (print)
        if (["u", "s", "p"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          return;
        }
        // Ctrl+Shift+I/J/C (dev tools)
        if (shift && ["i", "j", "c"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          return;
        }
      }
    };

    document.addEventListener("contextmenu", handleContextMenu, { capture: true });
    document.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu, { capture: true } as any);
      document.removeEventListener("keydown", handleKeyDown, { capture: true } as any);
    };
  }, []);

  return null;
}
