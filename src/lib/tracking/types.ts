/**
 * ShopFlow Tracking — Type definitions (v2 Professional)
 */

// ── Base event structure ──
export interface TrackingEventBase {
  event_name: string;
  event_id: string;
  session_id: string;
  timestamp: number;
  page_url: string;
  path: string;
  referrer: string;
  user_agent: string;
  source: "browser";
  first_touch_utm: Partial<UTMData>;
  last_touch_utm: Partial<UTMData>;
  fbclid?: string;
  gclid?: string;
  intent_score: number;
  intent_level: string;
}

export interface TrackingEventPayload extends TrackingEventBase {
  data: Record<string, any>;
}

// ── UTM data ──
export interface UTMData {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  captured_at: number;
}

// ── Debug log entry ──
export interface DebugLogEntry {
  event: string;
  event_id: string;
  session_id: string;
  data?: Record<string, any>;
  status: "sent" | "error" | "blocked" | "queued";
  timestamp: number;
  path: string;
  url: string;
  referrer: string;
  first_touch_utm: Partial<UTMData>;
  last_touch_utm: Partial<UTMData>;
  fbclid?: string;
  gclid?: string;
  intent_score: number;
  intent_level: string;
  blocked_reason?: string;
}

// ── Product payload ──
export interface TrackingProduct {
  id: string;
  name: string;
  price: number;
  category?: string;
  promo_price?: number | null;
  image?: string;
  size?: string;
  variant?: string;
  slug?: string;
  available?: boolean;
}

// ── Cart item for tracking ──
export interface TrackingCartItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  size?: string;
  category?: string;
}

// ── Purchase payload ──
export interface TrackingPurchase {
  orderId: string;
  value: number;
  items: TrackingCartItem[];
  coupon?: string;
  customer_type?: string;
  payment_method?: string;
  shipping_type?: string;
  email?: string;
  city?: string;
  state?: string;
}

// ── Checkout payload ──
export interface TrackingCheckout {
  value: number;
  items: TrackingCartItem[];
  coupon?: string;
}

// ── WhatsApp intent level ──
export type WhatsAppIntentLevel = "curious" | "lead" | "strong_lead";

// ── WhatsApp button position ──
export type WhatsAppButtonPosition =
  | "floating"
  | "header"
  | "footer"
  | "product_page"
  | "category_page"
  | "banner"
  | "checkout"
  | "wholesale_page"
  | "oportunidade_hero"
  | "oportunidade_main"
  | "oportunidade_final"
  | "oportunidade_mobile_bar"
  | "oportunidade_popup"
  | "oportunidade_floating"
  | "wholesale_hero"
  | "wholesale_final"
  | "product_wholesale_block"
  | "other";

// ── WhatsApp click payload ──
export interface TrackingWhatsAppClick {
  phone?: string;
  message_text?: string;
  prefilled_message?: string;
  message_type?: "product" | "wholesale" | "general" | "support" | "catalog";
  page: string;
  product_id?: string;
  product_name?: string;
  product_price?: number;
  product_size?: string;
  product_variant?: string;
  category?: string;
  context: "header" | "floating" | "product" | "checkout" | "wholesale" | "oportunidade" | "footer" | "cta" | "other";
  position: WhatsAppButtonPosition;
  button_text?: string;
  is_wholesale?: boolean;
  intent_level: WhatsAppIntentLevel;
  wholesale_entry_page?: string;
  wholesale_cta_type?: "catalog" | "video_call" | "contact_seller" | "price_table" | "general";
  catalog_viewed?: boolean;
}

// ── Wholesale payload ──
export interface TrackingWholesalePayload {
  page: string;
  cta_text?: string;
  cta_position?: string;
  wholesale_cta_type?: "catalog" | "video_call" | "contact_seller" | "price_table" | "general";
}

// ── Banner click payload ──
export interface TrackingBannerClick {
  banner_id?: string;
  banner_title?: string;
  banner_type?: "hero" | "promo" | "wholesale" | "collection" | "other";
  link?: string;
  position?: number;
}

// ── CTA click payload ──
export interface TrackingCTAClick {
  cta_text: string;
  cta_type: string;
  page: string;
  product_id?: string;
}

// ── Search payload ──
export interface TrackingSearch {
  query: string;
  results_count?: number;
}

// ── Size select payload ──
export interface TrackingSizeSelect {
  product_id: string;
  product_name: string;
  size: string;
}

// ── Lead payload ──
export interface TrackingLead {
  type: "whatsapp" | "wholesale" | "checkout" | "contact" | "other";
  page: string;
  product_id?: string;
  value?: number;
}

// ── Filter products payload ──
export interface TrackingFilterProducts {
  filters: Record<string, string>;
  category?: string;
  results_count?: number;
}

// ── Session data ──
export interface SessionData {
  session_id: string;
  started_at: number;
  landing_page: string;
  pages_viewed: number;
  last_activity: number;
}

// ── Attribution data ──
export interface AttributionData {
  first_touch: Partial<UTMData>;
  first_touch_at: number;
  first_landing_page: string;
  last_touch: Partial<UTMData>;
  last_touch_at: number;
}

// ── Queued event for retry ──
export interface QueuedEvent {
  event: string;
  data?: Record<string, any>;
  event_id: string;
  timestamp: number;
  retries: number;
}

// ── Tracking options ──
export interface TrackEventOptions {
  dedupId?: string;
  dedupWindowMs?: number;
  oncePerSession?: boolean;
  oncePermanent?: boolean;
  permanentKey?: string;
}
