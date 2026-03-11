/**
 * ShopFlow Tracking — Public API (v2 Professional)
 */

// Core
export { initPixel, trackEvent, flushEventQueue, enableDebug, sendAdvancedMatching } from "./core";

// Storage
export {
  captureUTMs, getStoredUTMs, getFirstTouch, getLastTouch, getAttribution,
  getOrCreateSession, getSessionId, getDebugLog, clearDebugLog, getVisitCount,
} from "./storage";

// Score engine
export { getScoreState, getIntentScore, getIntentLevel, addScore, markPaidTraffic, POINTS, THRESHOLDS } from "./score";
export type { IntentLevel, ScoreState } from "./score";

// UTM parser
export { parseUTMCampaign, getParsedCampaignFromStorage } from "./utm-parser";
export type { ParsedCampaign } from "./utm-parser";

// All events
export {
  trackPageView, trackViewHome, trackViewCategory, trackViewContent,
  trackSelectProduct, trackSelectSize, trackAddToCart, trackBuyNow,
  trackInitiateCheckout, trackAddPaymentInfo, trackPurchase,
  trackClickWhatsApp, trackWhatsAppLead, trackWhatsAppConversationStart,
  trackWhatsAppProductIntent, trackWhatsAppWholesaleIntent,
  trackOpenWholesalePage, trackWholesaleCTA, trackWholesaleLead, trackViewWholesaleCatalog,
  trackLead, trackBannerClick, trackCTA, trackSearch, trackFilterProducts,
  trackCartAbandonment, trackVisitorType, trackCustomEvent,
  setupScrollTracking, setupTimeOnPage, setupProductPageEngagement, setupCheckoutEngagement,
  trackUserBecameWarm, trackUserBecameHot, trackHighIntentAction,
  trackOpenCart, trackOpenLogin, trackApplyCoupon,
} from "./events";

// Types
export type {
  TrackingProduct, TrackingCartItem, TrackingPurchase, TrackingCheckout,
  TrackingWhatsAppClick, TrackingWholesalePayload, TrackingBannerClick,
  TrackingCTAClick, TrackingSearch, TrackingSizeSelect, TrackingLead,
  TrackingFilterProducts, WhatsAppIntentLevel, WhatsAppButtonPosition,
  DebugLogEntry, UTMData, SessionData, AttributionData,
} from "./types";
