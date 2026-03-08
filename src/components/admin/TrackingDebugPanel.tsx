import { useState, useEffect } from "react";
import { getDebugLog, clearDebugLog, getStoredUTMs, enableDebug } from "@/lib/tracking";
import { X, Bug, Trash2, RefreshCw } from "lucide-react";

export function TrackingDebugPanel() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<any[]>([]);
  const [utms, setUtms] = useState<Record<string, any>>({});

  useEffect(() => {
    enableDebug(true);
    return () => enableDebug(false);
  }, []);

  const refresh = () => {
    setLog(getDebugLog());
    setUtms(getStoredUTMs());
  };

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] bg-accent text-accent-foreground p-3 rounded-full shadow-lg hover:scale-105 transition-transform"
        title="Debug Tracking"
      >
        <Bug className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background/95 overflow-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bug className="h-5 w-5" /> Tracking Debug Panel
          </h2>
          <div className="flex gap-2">
            <button onClick={refresh} className="p-2 rounded bg-muted hover:bg-muted/80">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => { clearDebugLog(); refresh(); }}
              className="p-2 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={() => setOpen(false)} className="p-2 rounded bg-muted hover:bg-muted/80">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Pixel status */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Pixel Status</h3>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${(window as any).pixelId ? "bg-green-500" : "bg-red-500"}`} />
            <span className="text-sm">Pixel ID: {(window as any).pixelId || "Not loaded"}</span>
          </div>
        </div>

        {/* UTMs */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">UTMs Capturadas</h3>
          {Object.keys(utms).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma UTM capturada</p>
          ) : (
            <div className="grid grid-cols-2 gap-1 text-sm">
              {Object.entries(utms).map(([k, v]) => (
                <div key={k}><span className="text-muted-foreground">{k}:</span> <span className="font-mono">{String(v)}</span></div>
              ))}
            </div>
          )}
        </div>

        {/* Event log */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">Eventos ({log.length})</h3>
          <div className="space-y-1 max-h-[60vh] overflow-auto">
            {log.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento registrado</p>}
            {log.map((entry, i) => (
              <div key={i} className="flex items-start gap-2 text-xs border-b border-border/30 py-1.5">
                <span className={`shrink-0 px-1.5 py-0.5 rounded font-mono ${
                  entry.status === "sent" ? "bg-green-500/10 text-green-600" :
                  entry.status === "error" ? "bg-red-500/10 text-red-600" :
                  "bg-yellow-500/10 text-yellow-600"
                }`}>{entry.status}</span>
                <span className="font-semibold shrink-0">{entry.event}</span>
                <span className="text-muted-foreground font-mono truncate">
                  {JSON.stringify(entry.data || {}).slice(0, 120)}
                </span>
                <span className="text-muted-foreground/50 shrink-0 ml-auto">
                  {new Date(entry.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
