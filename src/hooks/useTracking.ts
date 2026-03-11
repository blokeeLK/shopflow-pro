import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import {
  initPixel,
  captureUTMs,
  trackPageView,
  trackViewHome,
  trackViewCategory,
  trackOpenWholesalePage,
  trackVisitorType,
  setupScrollTracking,
  setupTimeOnPage,
} from "@/lib/tracking";

/**
 * Global tracking hook — place in StoreLayout or App root.
 * Handles pixel init, PageView on real route change, scroll & time tracking.
 * Deduplication is handled by the tracking core.
 */
export function useTracking() {
  const location = useLocation();
  const prevPath = useRef<string>("");

  // Init pixel + visitor type once
  useEffect(() => {
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

    // Scroll & time tracking per page
    const cleanScroll = setupScrollTracking();
    const cleanTime = setupTimeOnPage();

    return () => {
      cleanScroll();
      cleanTime();
    };
  }, [location.pathname]);
}
