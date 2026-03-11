import { useState, useEffect } from "react";
import {
  getDebugLog,
  clearDebugLog,
  getStoredUTMs,
  getFirstTouch,
  getLastTouch,
  getOrCreateSession,
  enableDebug,
  trackEvent,
} from "@/lib/tracking";
import type { DebugLogEntry } from "@/lib/tracking";
import { X, Bug, Trash2, RefreshCw, ChevronDown, ChevronRight, Zap, Filter } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  sent: "bg-green-500/10 text-green-600",
  error: "bg-red-500/10 text-red-600",
  blocked: "bg-orange-500/10 text-orange-600",
  queued: "bg-yellow-500/10 text-yellow-600",
};

const STATUS_LABELS: Record<string, string> = {
  sent: "✅ Enviado",
  error: "❌ Erro",
  blocked: "🚫 Bloqueado",
  queued: "📦 Na fila",
};

function TestButtons() {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => trackEvent("PageView_TEST", { url: window.location.pathname })}
        className="text-[10px] bg-muted hover:bg-muted/80 px-2.5 py-1.5 rounded font-medium"
      >
        ▶ PageView
      </button>
      <button
        onClick={() => trackEvent("ClickWhatsApp_TEST", { context: "test", page: "/admin" })}
        className="text-[10px] bg-muted hover:bg-muted/80 px-2.5 py-1.5 rounded font-medium"
      >
        ▶ WhatsApp
      </button>
      <button
        onClick={() => trackEvent("Lead_TEST", { type: "test", page: "/admin" })}
        className="text-[10px] bg-muted hover:bg-muted/80 px-2.5 py-1.5 rounded font-medium"
      >
        ▶ Lead
      </button>
      <button
        onClick={() => trackEvent("AddToCart_TEST", { product_id: "test", quantity: 1, price: 19.99 })}
        className="text-[10px] bg-muted hover:bg-muted/80 px-2.5 py-1.5 rounded font-medium"
      >
        ▶ AddToCart
      </button>
      <button
        onClick={() => trackEvent("InitiateCheckout_TEST", { value: 99.99, num_items: 2 })}
        className="text-[10px] bg-muted hover:bg-muted/80 px-2.5 py-1.5 rounded font-medium"
      >
        ▶ Checkout
      </button>
    </div>
  );
}

function EventRow({ entry }: { entry: DebugLogEntry }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border-b border-border/20 py-2">
      <div
        className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/30 rounded px-1 py-0.5"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
        <span className={`shrink-0 px-1.5 py-0.5 rounded font-mono text-[10px] ${STATUS_STYLES[entry.status] || "bg-muted"}`}>
          {entry.status}
        </span>
        <span className="font-semibold shrink-0 text-foreground">{entry.event}</span>
        {entry.blocked_reason && (
          <span className="text-[10px] text-orange-500 shrink-0">({entry.blocked_reason})</span>
        )}
        <span className="text-muted-foreground/60 font-mono text-[10px] shrink-0 ml-auto">
          {new Date(entry.timestamp).toLocaleTimeString("pt-BR")}
        </span>
      </div>
      {expanded && (
        <div className="ml-6 mt-2 space-y-1.5 text-[11px] bg-muted/20 rounded p-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div><span className="text-muted-foreground">event_id:</span> <span className="font-mono text-foreground">{entry.event_id}</span></div>
            <div><span className="text-muted-foreground">session_id:</span> <span className="font-mono text-foreground">{entry.session_id}</span></div>
            <div><span className="text-muted-foreground">path:</span> <span className="font-mono text-foreground">{entry.path}</span></div>
            <div><span className="text-muted-foreground">url:</span> <span className="font-mono text-foreground truncate block">{entry.url}</span></div>
            <div><span className="text-muted-foreground">referrer:</span> <span className="font-mono text-foreground truncate block">{entry.referrer || "(vazio)"}</span></div>
            <div><span className="text-muted-foreground">fbclid:</span> <span className="font-mono text-foreground">{entry.fbclid || "(nenhum)"}</span></div>
          </div>
          {entry.first_touch_utm && Object.keys(entry.first_touch_utm).length > 0 && (
            <div>
              <span className="text-muted-foreground">first_touch:</span>
              <span className="font-mono text-foreground ml-1">{JSON.stringify(entry.first_touch_utm)}</span>
            </div>
          )}
          {entry.last_touch_utm && Object.keys(entry.last_touch_utm).length > 0 && (
            <div>
              <span className="text-muted-foreground">last_touch:</span>
              <span className="font-mono text-foreground ml-1">{JSON.stringify(entry.last_touch_utm)}</span>
            </div>
          )}
          {entry.data && Object.keys(entry.data).length > 0 && (
            <div>
              <span className="text-muted-foreground block mb-1">payload:</span>
              <pre className="font-mono text-foreground text-[10px] bg-background rounded p-2 overflow-x-auto max-h-40">
                {JSON.stringify(entry.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TrackingDebugPanel() {
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<DebugLogEntry[]>([]);
  const [utms, setUtms] = useState<Record<string, any>>({});
  const [firstTouch, setFirstTouch] = useState<Record<string, any>>({});
  const [lastTouch, setLastTouch] = useState<Record<string, any>>({});
  const [session, setSession] = useState<Record<string, any>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState("");

  useEffect(() => {
    enableDebug(true);
    return () => enableDebug(false);
  }, []);

  const refresh = () => {
    setLog(getDebugLog());
    setUtms(getStoredUTMs());
    setFirstTouch(getFirstTouch());
    setLastTouch(getLastTouch());
    setSession(getOrCreateSession());
  };

  useEffect(() => {
    if (open) refresh();
  }, [open]);

  // Auto-refresh every 3s when open
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, [open]);

  const filteredLog = log.filter((entry) => {
    if (statusFilter !== "all" && entry.status !== statusFilter) return false;
    if (eventFilter && !entry.event.toLowerCase().includes(eventFilter.toLowerCase())) return false;
    return true;
  });

  const sentCount = log.filter((e) => e.status === "sent").length;
  const blockedCount = log.filter((e) => e.status === "blocked").length;
  const errorCount = log.filter((e) => e.status === "error").length;

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
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Bug className="h-5 w-5" /> Tracking Debug Panel
          </h2>
          <div className="flex gap-2">
            <button onClick={refresh} className="p-2 rounded bg-muted hover:bg-muted/80" title="Atualizar">
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => { clearDebugLog(); refresh(); }}
              className="p-2 rounded bg-destructive/10 text-destructive hover:bg-destructive/20"
              title="Limpar logs"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button onClick={() => setOpen(false)} className="p-2 rounded bg-muted hover:bg-muted/80">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Pixel</p>
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${(window as any).pixelId ? "bg-green-500" : "bg-red-500"}`} />
              <span className="text-xs font-mono">{(window as any).pixelId ? "Ativo" : "Inativo"}</span>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Session</p>
            <p className="text-xs font-mono truncate">{session.session_id || "—"}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Enviados</p>
            <p className="text-lg font-bold text-green-600">{sentCount}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Bloqueados</p>
            <p className="text-lg font-bold text-orange-500">{blockedCount}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Erros</p>
            <p className="text-lg font-bold text-red-500">{errorCount}</p>
          </div>
        </div>

        {/* UTMs & Attribution */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wider">Last Touch UTMs</h3>
            {Object.keys(lastTouch).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma UTM</p>
            ) : (
              <div className="space-y-0.5 text-xs">
                {Object.entries(lastTouch).filter(([k]) => k !== "captured_at").map(([k, v]) => (
                  <div key={k}><span className="text-muted-foreground">{k}:</span> <span className="font-mono">{String(v)}</span></div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wider">First Touch UTMs</h3>
            {Object.keys(firstTouch).length === 0 ? (
              <p className="text-xs text-muted-foreground">Nenhuma UTM</p>
            ) : (
              <div className="space-y-0.5 text-xs">
                {Object.entries(firstTouch).filter(([k]) => k !== "captured_at").map(([k, v]) => (
                  <div key={k}><span className="text-muted-foreground">{k}:</span> <span className="font-mono">{String(v)}</span></div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wider">Sessão Atual</h3>
            <div className="space-y-0.5 text-xs">
              <div><span className="text-muted-foreground">Rota:</span> <span className="font-mono">{window.location.pathname}</span></div>
              <div><span className="text-muted-foreground">Páginas:</span> <span className="font-mono">{session.pages_viewed || 0}</span></div>
              <div><span className="text-muted-foreground">Início:</span> <span className="font-mono">{session.started_at ? new Date(session.started_at).toLocaleTimeString("pt-BR") : "—"}</span></div>
              <div><span className="text-muted-foreground">Landing:</span> <span className="font-mono text-[10px]">{session.landing_page || "—"}</span></div>
            </div>
          </div>
        </div>

        {/* Test buttons */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="font-semibold text-xs text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1">
            <Zap className="h-3 w-3" /> Testar Eventos
          </h3>
          <TestButtons />
        </div>

        {/* Filters + Event log */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              Eventos ({filteredLog.length}/{log.length})
            </h3>
            <div className="flex items-center gap-2">
              <Filter className="h-3 w-3 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar evento..."
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="bg-muted rounded px-2 py-1 text-[10px] w-32"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-muted rounded px-2 py-1 text-[10px]"
              >
                <option value="all">Todos</option>
                <option value="sent">Enviados</option>
                <option value="blocked">Bloqueados</option>
                <option value="error">Erros</option>
                <option value="queued">Na fila</option>
              </select>
            </div>
          </div>
          <div className="max-h-[50vh] overflow-auto">
            {filteredLog.length === 0 && (
              <p className="text-xs text-muted-foreground py-4 text-center">Nenhum evento registrado</p>
            )}
            {filteredLog.map((entry, i) => (
              <EventRow key={`${entry.event_id}-${i}`} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
