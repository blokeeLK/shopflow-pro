import { useState, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const LS_FIRST_VISIT = "sf_first_visit_shown";
const LS_SESSION_NUDGE = "sf_session_nudge_shown";

export function AccountTooltip() {
  const { user } = useAuth();
  const [showFirstVisit, setShowFirstVisit] = useState(false);
  const [showNudge, setShowNudge] = useState(false);

  // First visit tooltip — 1.5s delay, only once ever
  useEffect(() => {
    if (user) return;
    if (localStorage.getItem(LS_FIRST_VISIT) === "true") return;

    const timer = setTimeout(() => setShowFirstVisit(true), 1500);
    const autoClose = setTimeout(() => {
      setShowFirstVisit(false);
      localStorage.setItem(LS_FIRST_VISIT, "true");
    }, 9500); // 1.5s delay + 8s visible

    return () => {
      clearTimeout(timer);
      clearTimeout(autoClose);
    };
  }, [user]);

  // Session nudge — after scroll interaction, once per session
  useEffect(() => {
    if (user) return;
    if (sessionStorage.getItem(LS_SESSION_NUDGE) === "true") return;
    if (localStorage.getItem(LS_FIRST_VISIT) !== "true") return; // wait until first tooltip done

    const onScroll = () => {
      if (window.scrollY > 400) {
        setShowNudge(true);
        sessionStorage.setItem(LS_SESSION_NUDGE, "true");
        window.removeEventListener("scroll", onScroll);
        setTimeout(() => setShowNudge(false), 8000);
      }
    };

    // Delay listener to avoid immediate trigger
    const delay = setTimeout(() => window.addEventListener("scroll", onScroll, { passive: true }), 3000);
    return () => {
      clearTimeout(delay);
      window.removeEventListener("scroll", onScroll);
    };
  }, [user]);

  const dismissFirst = useCallback(() => {
    setShowFirstVisit(false);
    localStorage.setItem(LS_FIRST_VISIT, "true");
  }, []);

  const dismissNudge = useCallback(() => {
    setShowNudge(false);
  }, []);

  if (user) return null;

  return (
    <>
      {/* First visit tooltip */}
      {showFirstVisit && (
        <div className="absolute right-0 top-full mt-3 z-50 animate-fade-in">
          <div className="relative bg-card border border-border/40 rounded-xl shadow-[0_12px_40px_-8px_hsl(220_20%_12%/0.15)] px-4 py-3 max-w-[220px] md:max-w-[260px]">
            {/* Arrow */}
            <div className="absolute -top-2 right-4 w-4 h-4 bg-card border-l border-t border-border/40 rotate-45" />
            <button
              onClick={dismissFirst}
              className="absolute top-2 right-2 p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <p className="text-[12px] md:text-[13px] font-medium text-foreground leading-relaxed pr-4">
              Entre na sua conta e faça seu pedido agora!
            </p>
          </div>
        </div>
      )}

      {/* Session nudge */}
      {showNudge && (
        <div className="absolute right-0 top-full mt-3 z-50 animate-fade-in">
          <div className="relative bg-card border border-border/40 rounded-xl shadow-[0_12px_40px_-8px_hsl(220_20%_12%/0.15)] px-4 py-3 max-w-[240px] md:max-w-[280px]">
            <div className="absolute -top-2 right-4 w-4 h-4 bg-card border-l border-t border-border/40 rotate-45" />
            <button
              onClick={dismissNudge}
              className="absolute top-2 right-2 p-0.5 text-muted-foreground/60 hover:text-foreground transition-colors"
              aria-label="Fechar"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <p className="text-[12px] md:text-[13px] font-medium text-foreground leading-relaxed pr-4">
              Crie sua conta para comprar mais rápido e acompanhar seus pedidos!
            </p>
          </div>
        </div>
      )}
    </>
  );
}