/**
 * ShopFlow Tracking System — Backward compatibility re-export
 * All logic lives in src/lib/tracking/ modules.
 */
export {
  initPixel, trackEvent, flushEventQueue, enableDebug, sendAdvancedMatching,
  captureUTMs, getStoredUTMs, getFirstTouch, getLastTouch, getAttribution,
  getOrCreateSession, getSessionId, getDebugLog, clearDebugLog, getVisitCount,
  getScoreState, getIntentScore, getIntentLevel, addScore, markPaidTraffic, POINTS, THRESHOLDS,
  parseUTMCampaign, getParsedCampaignFromStorage,
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
} from "./tracking/index";

export type {
  TrackingProduct, TrackingCartItem, TrackingPurchase, TrackingCheckout,
  TrackingWhatsAppClick, TrackingWholesalePayload, TrackingBannerClick,
  TrackingCTAClick, TrackingSearch, TrackingSizeSelect, TrackingLead,
  TrackingFilterProducts, WhatsAppIntentLevel, WhatsAppButtonPosition,
  DebugLogEntry, UTMData, SessionData, AttributionData,
  IntentLevel, ScoreState, ParsedCampaign,
} from "./tracking/index";
