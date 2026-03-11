import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  initPixel, captureUTMs, trackPageView, trackViewHome, trackViewCategory,
  trackOpenWholesalePage, trackVisitorType, setupScrollTracking, setupTimeOnPage,
  setupProductPageEngagement, setupCheckoutEngagement,
  trackUserBecameWarm, trackUserBecameHot,
  getScoreState,
} from "@/lib/tracking";

/**
 * Global tracking hook — place in StoreLayout or App root.
 * Handles pixel init, PageView on real route change, scroll & time tracking,
 * and intent level transitions (warm/hot).
 *
 * ANTI-DUPLICATION:
 * - initGuard ref prevents Strict Mode double-mount from re-initializing
 * - prevPath ref prevents duplicate PageView on same route
 * - All downstream trackEvent calls have their own dedup layers
 */
export function useTracking() {
  const location = useLocation();
  const prevPath = useRef<string>("");
  const initGuard = useRef(false);

  // Init pixel + visitor type once (Strict Mode safe)
  useEffect(() => {
    if (initGuard.current) return;
    initGuard.current = true;

    initPixel();
    captureUTMs();
    trackVisitorType();
  }, []);

  // On every real route change
  useEffect(() => {
    const currentPath = location.pathname;

    // Skip if same path (SPA rerender without actual navigation)
    if (currentPath === prevPath.current) return;
    prevPath.current = currentPath;

    // Capture UTMs on every navigation (may have new query params)
    captureUTMs();

    // Fire PageView
    trackPageView(currentPath);

    // Page-specific events
    if (currentPath === "/") {
      trackViewHome();
    } else if (currentPath === "/atacado") {
      trackOpenWholesalePage({ page: "/atacado" });
    }

    // Check intent transitions after score updates
    const scoreState = getScoreState();
    if (scoreState.level === "warm_user" && scoreState.became_warm) {
      trackUserBecameWarm();
    }
    if (scoreState.level === "hot_user" && scoreState.became_hot) {
      trackUserBecameHot();
    }

    // Scroll & time tracking per page
    const cleanScroll = setupScrollTracking();
    const cleanTime = setupTimeOnPage();

    // Page-specific engagement timers
    const cleanups: (() => void)[] = [cleanScroll, cleanTime];

    if (currentPath.startsWith("/produto/")) {
      const slug = currentPath.replace("/produto/", "");
      cleanups.push(setupProductPageEngagement(slug));
    }

    if (currentPath === "/checkout") {
      cleanups.push(setupCheckoutEngagement());
    }

    return () => cleanups.forEach((fn) => fn());
  }, [location.pathname]);
}
