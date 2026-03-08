import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  initPixel,
  captureUTMs,
  trackPageView,
  setupScrollTracking,
  setupTimeOnPage,
  trackProductView,
} from "@/lib/tracking";

/**
 * Global tracking hook — place in StoreLayout or App root.
 * Handles pixel init, PageView on route change, scroll & time tracking.
 */
export function useTracking() {
  const location = useLocation();

  // Init pixel once
  useEffect(() => {
    initPixel();
  }, []);

  // On every route change
  useEffect(() => {
    captureUTMs();
    trackPageView();

    const cleanScroll = setupScrollTracking();
    const cleanTime = setupTimeOnPage();

    // Count product page views for engagement
    if (location.pathname.startsWith("/produto/")) {
      trackProductView();
    }

    return () => {
      cleanScroll();
      cleanTime();
    };
  }, [location.pathname]);
}
