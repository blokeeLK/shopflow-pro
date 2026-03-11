/**
 * ShopFlow Tracking — All event functions (v2 Professional)
 * Each function wraps trackEvent with proper payload, dedup, and score.
 */
import { trackEvent } from "./core";
import { incrementVisitCount, incrementPagesViewed } from "./storage";
import { addScore, recordPageView, recordProductView, getIntentScore, getIntentLevel, markPaidTraffic, getScoreState, POINTS } from "./score";
import { parseUTMCampaign } from "./utm-parser";
import { getStoredUTMs } from "./storage";
import type {
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
  TrackingFilterProducts,
} from "./types";

// ── Helper: get parsed campaign data for enriching events ──
function getCampaignData() {
  return parseUTMCampaign(getStoredUTMs());
}

function getScorePayload() {
  return {
    intent_score: getIntentScore(),
    intent_level: getIntentLevel(),
  };
}

// ── Helper: check if user came from paid traffic ──
function checkPaidTraffic() {
  const utms = getStoredUTMs();
  if (utms.utm_source || utms.fbclid || utms.gclid) {
    markPaidTraffic();
  }
}

// ══════════════════════════════════════════════════════════════
// PAGE VIEWS
// ══════════════════════════════════════════════════════════════

export function trackPageView(path: string) {
  incrementPagesViewed();
  recordPageView();
  addScore(POINTS.SITE_ENTRY, "page_view", `pv_${path}`);
  checkPaidTraffic();
  
  trackEvent("PageView", {
    url: window.location.href,
    path,
    title: document.title,
    ...getScorePayload(),
  }, {
    dedupId: path,
    dedupWindowMs: 2000,
  });
}

export function trackViewHome() {
  trackEvent("ViewHome", { ...getScorePayload() }, { oncePerSession: true });
}

export function trackViewCategory(category: { name: string; slug: string }) {
  addScore(POINTS.VIEW_CATEGORY, "view_category", `vcat_${category.slug}`);
  trackEvent("ViewCategory", {
    category_name: category.name,
    category_slug: category.slug,
    ...getScorePayload(),
    ...getCampaignData(),
  }, {
    dedupId: `cat_${category.slug}`,
    dedupWindowMs: 5000,
  });
}

// ══════════════════════════════════════════════════════════════
// E-COMMERCE FUNNEL
// ══════════════════════════════════════════════════════════════

export function trackViewContent(product: TrackingProduct) {
  const { isReturn, totalProductsViewed } = recordProductView(product.id);
  addScore(POINTS.VIEW_PRODUCT_PAGE, "view_product", `vprod_${product.id}`);

  // Check for return to product
  if (isReturn) {
    addScore(POINTS.RETURN_TO_PRODUCT, "return_to_product", `ret_${product.id}`);
    trackEvent("ReturnToProduct", {
      product_id: product.id,
      product_name: product.name,
      ...getScorePayload(),
    }, {
      dedupId: `ret_${product.id}`,
      dedupWindowMs: 30000,
    });
  }

  // Multiple product views
  if (totalProductsViewed >= 3) {
    addScore(POINTS.MULTIPLE_PRODUCT_VIEWS, "multiple_products", "multi_prod");
    trackEvent("MultipleProductViews", {
      total_products: totalProductsViewed,
      ...getScorePayload(),
    }, {
      dedupId: "multi_prod",
      oncePerSession: true,
    });
  }

  trackEvent("ViewContent", {
    content_ids: [product.id],
    content_name: product.name,
    content_type: "product",
    category: product.category || "",
    price: product.price,
    promotional_price: product.promo_price || null,
    currency: "BRL",
    image: product.image || "",
    size: product.size || "",
    variant: product.variant || "",
    available: product.available !== false,
    slug: product.slug || "",
    ...getScorePayload(),
    ...getCampaignData(),
  }, {
    dedupId: `vc_${product.id}`,
    dedupWindowMs: 30000,
  });
}

export function trackSelectProduct(product: TrackingProduct) {
  addScore(POINTS.CLICK_PRODUCT, "select_product", `sel_${product.id}`);
  trackEvent("SelectProduct", {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    category: product.category || "",
    ...getScorePayload(),
  }, {
    dedupId: `sel_${product.id}`,
    dedupWindowMs: 5000,
  });
}

export function trackSelectSize(payload: TrackingSizeSelect) {
  addScore(POINTS.SELECT_SIZE, "select_size", `size_${payload.product_id}_${payload.size}`);
  trackEvent("SelectSize", {
    product_id: payload.product_id,
    product_name: payload.product_name,
    size: payload.size,
    ...getScorePayload(),
  }, {
    dedupId: `size_${payload.product_id}_${payload.size}`,
    dedupWindowMs: 3000,
  });
}

export function trackAddToCart(item: TrackingCartItem & { size?: string; category?: string }) {
  addScore(POINTS.ADD_TO_CART, "add_to_cart", `atc_${item.id}`);
  trackEvent("AddToCart", {
    product_id: item.id,
    product_name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size || "",
    category: item.category || "",
    value: item.price * item.quantity,
    currency: "BRL",
    ...getScorePayload(),
    ...getCampaignData(),
  }, {
    dedupId: `atc_${item.id}_${item.size || ""}`,
    dedupWindowMs: 5000,
  });
}

export function trackBuyNow(product: TrackingProduct) {
  addScore(POINTS.BUY_NOW, "buy_now", `bn_${product.id}`);
  trackEvent("BuyNow", {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    currency: "BRL",
    ...getScorePayload(),
  }, {
    dedupId: `bn_${product.id}`,
    dedupWindowMs: 5000,
  });
}

export function trackInitiateCheckout(checkout: TrackingCheckout) {
  const scoreState = getScoreState();
  const extraPoints = scoreState.is_paid_traffic ? POINTS.PAID_TRAFFIC_CHECKOUT : 0;
  addScore(POINTS.INITIATE_CHECKOUT + extraPoints, "initiate_checkout", "checkout");

  trackEvent("InitiateCheckout", {
    value: checkout.value,
    num_items: checkout.items.length,
    products: checkout.items,
    currency: "BRL",
    coupon: checkout.coupon || "",
    ...getScorePayload(),
    ...getCampaignData(),
  }, {
    oncePerSession: true,
  });
}

export function trackAddPaymentInfo(method: string) {
  trackEvent("AddPaymentInfo", {
    payment_method: method,
    ...getScorePayload(),
  }, {
    oncePerSession: true,
  });
}

export function trackPurchase(order: TrackingPurchase) {
  const permanentKey = `sf_purchase_${order.orderId}`;
  trackEvent("Purchase", {
    order_id: order.orderId,
    value: order.value,
    currency: "BRL",
    items: order.items,
    num_items: order.items.reduce((a, i) => a + i.quantity, 0),
    coupon: order.coupon || "",
    customer_type: order.customer_type || "",
    payment_method: order.payment_method || "",
    shipping_type: order.shipping_type || "",
    customer_email: order.email || "",
    city: order.city || "",
    state: order.state || "",
    ...getScorePayload(),
    ...getCampaignData(),
  }, {
    oncePermanent: true,
    permanentKey,
    dedupId: order.orderId,
  });
}

// ══════════════════════════════════════════════════════════════
// WHATSAPP — Advanced tracking layer
// ══════════════════════════════════════════════════════════════

function buildWhatsAppPayload(payload: TrackingWhatsAppClick): Record<string, any> {
  return {
    phone: payload.phone || "",
    message_text: payload.message_text || "",
    prefilled_message: payload.prefilled_message || "",
    message_type: payload.message_type || "general",
    page: payload.page,
    product_id: payload.product_id || "",
    product_name: payload.product_name || "",
    product_price: payload.product_price ?? null,
    product_size: payload.product_size || "",
    product_variant: payload.product_variant || "",
    category: payload.category || "",
    context: payload.context,
    position: payload.position,
    button_text: payload.button_text || "",
    is_wholesale: payload.is_wholesale || false,
    intent_level: payload.intent_level,
    intent_click_level: payload.intent_level,
    wholesale_entry_page: payload.wholesale_entry_page || "",
    wholesale_cta_type: payload.wholesale_cta_type || "",
    catalog_viewed: payload.catalog_viewed ?? false,
    ...getScorePayload(),
    ...getCampaignData(),
  };
}

export function trackClickWhatsApp(payload: TrackingWhatsAppClick) {
  const scoreState = getScoreState();
  const extraPoints = scoreState.is_paid_traffic ? POINTS.PAID_TRAFFIC_WHATSAPP : 0;
  addScore(POINTS.CLICK_WHATSAPP + extraPoints, "click_whatsapp", `wa_${payload.position}`);

  trackEvent("ClickWhatsApp", buildWhatsAppPayload(payload), {
    dedupId: `wa_${payload.position}_${payload.page}`,
    dedupWindowMs: 5000,
  });
}

export function trackWhatsAppLead(payload: TrackingWhatsAppClick) {
  trackClickWhatsApp(payload);
  trackLead({
    type: payload.is_wholesale ? "wholesale" : "whatsapp",
    page: payload.page,
    product_id: payload.product_id,
    value: payload.product_price,
  });
}

export function trackWhatsAppConversationStart(payload: TrackingWhatsAppClick) {
  addScore(POINTS.CONTACT_SELLER, "wa_conversation", `wa_conv_${payload.position}`);
  trackEvent("WhatsAppConversationStart", buildWhatsAppPayload(payload), {
    dedupId: `wa_conv_${payload.position}_${payload.page}`,
    dedupWindowMs: 10000,
  });
}

export function trackWhatsAppProductIntent(payload: TrackingWhatsAppClick) {
  addScore(POINTS.CLICK_WHATSAPP, "wa_product_intent", `wa_prod_${payload.product_id}`);
  trackEvent("WhatsAppProductIntent", buildWhatsAppPayload(payload), {
    dedupId: `wa_prod_${payload.product_id}_${payload.page}`,
    dedupWindowMs: 5000,
  });
  trackLead({
    type: "whatsapp",
    page: payload.page,
    product_id: payload.product_id,
    value: payload.product_price,
  });
}

export function trackWhatsAppWholesaleIntent(payload: TrackingWhatsAppClick) {
  addScore(POINTS.CLICK_WHOLESALE, "wa_wholesale_intent", `wa_ws_${payload.position}`);
  trackEvent("WhatsAppWholesaleIntent", buildWhatsAppPayload(payload), {
    dedupId: `wa_wholesale_${payload.position}_${payload.page}`,
    dedupWindowMs: 5000,
  });
  trackLead({
    type: "wholesale",
    page: payload.page,
    product_id: payload.product_id,
  });
}

// ══════════════════════════════════════════════════════════════
// WHOLESALE / ATACADO
// ══════════════════════════════════════════════════════════════

export function trackOpenWholesalePage(payload?: TrackingWholesalePayload) {
  addScore(POINTS.CLICK_WHOLESALE, "open_wholesale", "open_ws");
  trackEvent("OpenWholesalePage", {
    page: payload?.page || window.location.pathname,
    ...getScorePayload(),
    ...getCampaignData(),
  }, {
    oncePerSession: true,
  });
}

export function trackWholesaleCTA(payload: TrackingWholesalePayload) {
  addScore(POINTS.CLICK_CTA, "wholesale_cta", `wcta_${payload.cta_position}`);
  trackEvent("WholesaleCTA", {
    page: payload.page,
    cta_text: payload.cta_text || "",
    cta_position: payload.cta_position || "",
    ...getScorePayload(),
    ...getCampaignData(),
  }, {
    dedupId: `wcta_${payload.cta_position}`,
    dedupWindowMs: 5000,
  });
}

export function trackWholesaleLead(payload: TrackingWholesalePayload) {
  addScore(POINTS.GENERATE_LEAD, "wholesale_lead", `wlead_${payload.cta_position}`);
  trackEvent("WholesaleLead", {
    page: payload.page,
    cta_text: payload.cta_text || "",
    cta_position: payload.cta_position || "",
    ...getScorePayload(),
    ...getCampaignData(),
  }, {
    dedupId: `wlead_${payload.cta_position}`,
    dedupWindowMs: 10000,
  });
  trackLead({ type: "wholesale", page: payload.page });
}

export function trackViewWholesaleCatalog() {
  addScore(POINTS.OPEN_PRIVATE_CATALOG, "view_wholesale_catalog", "vwc");
  trackEvent("ViewWholesaleCatalog", { ...getScorePayload() }, { oncePerSession: true });
}

// ══════════════════════════════════════════════════════════════
// LEADS
// ══════════════════════════════════════════════════════════════

export function trackLead(payload: TrackingLead) {
  addScore(POINTS.GENERATE_LEAD, "lead", `lead_${payload.type}_${payload.page}`);
  trackEvent("Lead", {
    lead_type: payload.type,
    page: payload.page,
    product_id: payload.product_id || "",
    value: payload.value || 0,
    ...getScorePayload(),
    ...getCampaignData(),
  }, {
    dedupId: `lead_${payload.type}_${payload.page}`,
    dedupWindowMs: 10000,
  });
}

// ══════════════════════════════════════════════════════════════
// BANNERS, CTAS, INTERACTIONS
// ══════════════════════════════════════════════════════════════

export function trackBannerClick(payload: TrackingBannerClick) {
  addScore(POINTS.VIEW_PROMO_BANNER, "banner_click", `banner_${payload.banner_id}`);
  trackEvent("BannerClick", {
    banner_id: payload.banner_id || "",
    banner_title: payload.banner_title || "",
    banner_type: payload.banner_type || "other",
    link: payload.link || "",
    position: payload.position ?? 0,
    ...getScorePayload(),
  }, {
    dedupId: `banner_${payload.banner_id}`,
    dedupWindowMs: 5000,
  });
}

export function trackCTA(payload: TrackingCTAClick) {
  addScore(POINTS.CLICK_CTA, "cta_click", `cta_${payload.cta_type}_${payload.page}`);
  trackEvent("CTA_Click", {
    cta_text: payload.cta_text,
    cta_type: payload.cta_type,
    page: payload.page,
    product_id: payload.product_id || "",
    ...getScorePayload(),
  }, {
    dedupId: `cta_${payload.cta_type}_${payload.page}`,
    dedupWindowMs: 5000,
  });
}

export function trackSearch(payload: TrackingSearch) {
  trackEvent("Search", {
    query: payload.query,
    results_count: payload.results_count ?? 0,
    ...getScorePayload(),
  }, {
    dedupId: `search_${payload.query}`,
    dedupWindowMs: 3000,
  });
}

export function trackFilterProducts(payload: TrackingFilterProducts) {
  addScore(POINTS.USE_FILTER, "filter_products", `filter_${JSON.stringify(payload.filters)}`);
  trackEvent("FilterProducts", {
    filters: payload.filters,
    category: payload.category || "",
    results_count: payload.results_count ?? 0,
    ...getScorePayload(),
  }, {
    dedupId: `filter_${JSON.stringify(payload.filters)}`,
    dedupWindowMs: 5000,
  });
}

// ══════════════════════════════════════════════════════════════
// BEHAVIORAL & ENGAGEMENT
// ══════════════════════════════════════════════════════════════

export function setupScrollTracking() {
  const thresholds = [25, 50, 75, 90];
  const fired = new Set<number>();
  const onScroll = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    if (total <= 0) return;
    const pct = Math.round((window.scrollY / total) * 100);
    thresholds.forEach((t) => {
      if (pct >= t && !fired.has(t)) {
        fired.add(t);
        trackEvent("ScrollDepth", { depth: t, url: window.location.pathname });
      }
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  return () => window.removeEventListener("scroll", onScroll);
}

export function setupTimeOnPage() {
  const milestones = [30, 60, 120];
  const timers = milestones.map((s) =>
    setTimeout(() => {
      trackEvent("TimeOnPage", { seconds: s, url: window.location.pathname }, {
        dedupId: `top_${s}`,
        oncePerSession: true,
      });
    }, s * 1000)
  );
  return () => timers.forEach(clearTimeout);
}

export function setupProductPageEngagement(productId: string, productName?: string) {
  // Long engagement: 25 seconds on product page
  const timer = setTimeout(() => {
    addScore(POINTS.LONG_ENGAGEMENT, "long_engagement_product", `lep_${productId}`);
    trackEvent("LongEngagementOnProduct", {
      product_id: productId,
      product_name: productName || "",
      seconds: 25,
      ...getScorePayload(),
    }, {
      dedupId: `lep_${productId}`,
      oncePerSession: true,
    });
  }, 25000);
  return () => clearTimeout(timer);
}

export function setupCheckoutEngagement() {
  // Long engagement: 18 seconds on checkout
  const timer = setTimeout(() => {
    addScore(POINTS.LONG_ENGAGEMENT, "long_engagement_checkout", "lec");
    trackEvent("LongEngagementOnCheckout", {
      seconds: 18,
      ...getScorePayload(),
    }, {
      dedupId: "lec",
      oncePerSession: true,
    });
  }, 18000);
  return () => clearTimeout(timer);
}

export function trackCartAbandonment() {
  trackEvent("CartAbandonment", { ...getScorePayload() }, {
    dedupId: "cart_abandon",
    oncePerSession: true,
  });
}

export function trackVisitorType() {
  const count = incrementVisitCount();
  if (count > 1) {
    trackEvent("ReturningVisitor", { visit_count: count, ...getScorePayload() }, { oncePerSession: true });
  }
  trackEvent("StoreVisitor", { ...getScorePayload() }, { oncePerSession: true });
}

// ══════════════════════════════════════════════════════════════
// INTENT EVENTS
// ══════════════════════════════════════════════════════════════

export function trackUserBecameWarm() {
  const scoreState = getScoreState();
  trackEvent("UserBecameWarm", {
    ...getScorePayload(),
    products_viewed: scoreState.products_viewed,
    last_product: scoreState.last_product,
    last_action: scoreState.last_strong_action,
    pages_viewed: scoreState.pages_viewed,
    is_paid_traffic: scoreState.is_paid_traffic,
    ...getCampaignData(),
  }, {
    oncePerSession: true,
    dedupId: "warm",
  });
}

export function trackUserBecameHot() {
  const scoreState = getScoreState();
  trackEvent("UserBecameHot", {
    ...getScorePayload(),
    products_viewed: scoreState.products_viewed,
    last_product: scoreState.last_product,
    last_action: scoreState.last_strong_action,
    pages_viewed: scoreState.pages_viewed,
    is_paid_traffic: scoreState.is_paid_traffic,
    ...getCampaignData(),
  }, {
    oncePerSession: true,
    dedupId: "hot",
  });
}

export function trackHighIntentAction(action: string, details?: Record<string, any>) {
  trackEvent("HighIntentAction", {
    action,
    ...getScorePayload(),
    ...getCampaignData(),
    ...details,
  }, {
    dedupId: `hia_${action}`,
    dedupWindowMs: 10000,
  });
}

// ══════════════════════════════════════════════════════════════
// ADDITIONAL INTERACTION EVENTS
// ══════════════════════════════════════════════════════════════

export function trackOpenCart() {
  trackEvent("OpenCart", { ...getScorePayload() }, { dedupId: "open_cart", dedupWindowMs: 5000 });
}

export function trackOpenLogin() {
  trackEvent("OpenLogin", { ...getScorePayload() }, { dedupId: "open_login", dedupWindowMs: 5000 });
}

export function trackApplyCoupon(coupon: string) {
  trackEvent("ApplyCoupon", { coupon, ...getScorePayload() }, { dedupId: `coupon_${coupon}`, dedupWindowMs: 5000 });
}

// ══════════════════════════════════════════════════════════════
// CUSTOM EVENTS
// ══════════════════════════════════════════════════════════════

export function trackCustomEvent(eventName: string, data: Record<string, any> = {}, opts?: {
  dedupId?: string;
  dedupWindowMs?: number;
  oncePerSession?: boolean;
}) {
  trackEvent(eventName, { ...data, ...getScorePayload() }, opts);
}
