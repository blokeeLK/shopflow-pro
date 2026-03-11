/**
 * ShopFlow Tracking — Public API
 * Single import point for all tracking functionality.
 */

// Core
export { initPixel, trackEvent, flushEventQueue, enableDebug, sendAdvancedMatching } from "./core";

// Storage (for debug panel + hooks)
export {
  captureUTMs,
  getStoredUTMs,
  getFirstTouch,
  getLastTouch,
  getAttribution,
  getOrCreateSession,
  getSessionId,
  getDebugLog,
  clearDebugLog,
  getVisitCount,
} from "./storage";

// All events
export {
  trackPageView,
  trackViewHome,
  trackViewCategory,
  trackViewContent,
  trackSelectProduct,
  trackSelectSize,
  trackAddToCart,
  trackBuyNow,
  trackInitiateCheckout,
  trackAddPaymentInfo,
  trackPurchase,
  trackClickWhatsApp,
  trackWhatsAppLead,
  trackOpenWholesalePage,
  trackWholesaleCTA,
  trackWholesaleLead,
  trackViewWholesaleCatalog,
  trackLead,
  trackBannerClick,
  trackCTA,
  trackSearch,
  trackCartAbandonment,
  trackVisitorType,
  trackCustomEvent,
  setupScrollTracking,
  setupTimeOnPage,
  setupProductPageEngagement,
} from "./events";

// Types — re-export for consumers
export type {
  TrackingProduct,
  TrackingCartItem,
  TrackingPurchase,
  TrackingCheckout,
  TrackingWhatsAppClick,
  TrackingWholesalePayload,
  TrackingBannerClick,
  TrackingCTAClick,
  TrackingSearch,
  TrackingSizeSelect,
  TrackingLead,
  DebugLogEntry,
  UTMData,
  SessionData,
  AttributionData,
} from "./types";
