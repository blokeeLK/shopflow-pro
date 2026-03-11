import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SESSION_KEY = "sf_exit_redirect_done";

/**
 * Exit-intent detection for /atacado.
 * Redirects to /oportunidade once per session when user tries to leave.
 */
export function useExitIntent() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirected = useRef(false);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (location.pathname !== "/atacado") return;
    if (sessionStorage.getItem(SESSION_KEY)) return;

    const doRedirect = () => {
      if (redirected.current) return;
      if (sessionStorage.getItem(SESSION_KEY)) return;
      redirected.current = true;
      sessionStorage.setItem(SESSION_KEY, "1");
      navigate("/oportunidade", { replace: true });
    };

    // Desktop: mouse leaves viewport at top
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) doRedirect();
    };

    // Visibility change (tab switch, minimize) — desktop & mobile
    const onVisibility = () => {
      if (document.visibilityState === "hidden") doRedirect();
    };

    // Back button (popstate)
    const onPopState = () => {
      doRedirect();
    };

    // Push a fake history entry so we can intercept back
    window.history.pushState({ sfGuard: true }, "", window.location.href);

    // Inactivity timer (20s)
    const resetInactivity = () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      inactivityTimer.current = setTimeout(doRedirect, 20000);
    };

    const activityEvents = ["mousemove", "touchstart", "scroll", "keydown", "click"];
    activityEvents.forEach((e) => window.addEventListener(e, resetInactivity, { passive: true }));
    resetInactivity();

    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("popstate", onPopState);

    return () => {
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("popstate", onPopState);
      activityEvents.forEach((e) => window.removeEventListener(e, resetInactivity));
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [location.pathname, navigate]);
}
