import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const SESSION_KEY = "sf_exit_redirect_done";

/**
 * Exit-intent detection for /atacado.
 * Redirects to /oportunidade once per session ONLY on real exit attempts:
 * - Desktop: mouse leaves viewport at top (exit intent) or back button
 * - Mobile: back button only
 * NO redirects for: inactivity, scroll, visibility change, timers.
 */
export function useExitIntent() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirected = useRef(false);

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

    // Desktop only: mouse leaves viewport at top
    const isDesktop = window.matchMedia("(pointer: fine)").matches;
    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5) doRedirect();
    };

    // Back button (popstate) — works on both desktop and mobile
    const onPopState = () => {
      doRedirect();
    };

    // Push a fake history entry so we can intercept back
    window.history.pushState({ sfGuard: true }, "", window.location.href);

    if (isDesktop) {
      document.addEventListener("mouseleave", onMouseLeave);
    }
    window.addEventListener("popstate", onPopState);

    return () => {
      if (isDesktop) {
        document.removeEventListener("mouseleave", onMouseLeave);
      }
      window.removeEventListener("popstate", onPopState);
    };
  }, [location.pathname, navigate]);
}
