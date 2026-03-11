/**
 * ShopFlow Tracking — All specific event functions
 * Each function wraps trackEvent with proper payload and dedup options.
 */
import { trackEvent } from "./core";
import { incrementVisitCount, incrementPagesViewed } from "./storage";
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
} from "./types";

// ══════════════════════════════════════════════════════════════
// PAGE VIEWS
// ══════════════════════════════════════════════════════════════

/** Track page view — call only on actual route change */
export function trackPageView(path: string) {
  incrementPagesViewed();
  trackEvent("PageView", {
    url: window.location.href,
    path,
    title: document.title,
  }, {
    dedupId: path,
    dedupWindowMs: 2000,
  });
}

export function trackViewHome() {
  trackEvent("ViewHome", {}, { oncePerSession: true });
}

export function trackViewCategory(category: { name: string; slug: string }) {
  trackEvent("ViewCategory", {
    category_name: category.name,
    category_slug: category.slug,
  }, {
    dedupId: `cat_${category.slug}`,
    dedupWindowMs: 5000,
  });
}

// ══════════════════════════════════════════════════════════════
// E-COMMERCE FUNNEL
// ══════════════════════════════════════════════════════════════

export function trackViewContent(product: TrackingProduct) {
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
  }, {
    dedupId: product.id,
    oncePerSession: true,
  });
}

export function trackSelectProduct(product: TrackingProduct) {
  trackEvent("SelectProduct", {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    category: product.category || "",
  }, {
    dedupId: `sel_${product.id}`,
    dedupWindowMs: 5000,
  });
}

export function trackSelectSize(payload: TrackingSizeSelect) {
  trackEvent("SelectSize", {
    product_id: payload.product_id,
    product_name: payload.product_name,
    size: payload.size,
  }, {
    dedupId: `size_${payload.product_id}_${payload.size}`,
    dedupWindowMs: 3000,
  });
}

export function trackAddToCart(item: TrackingCartItem & { size?: string; category?: string }) {
  trackEvent("AddToCart", {
    product_id: item.id,
    product_name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size || "",
    category: item.category || "",
    value: item.price * item.quantity,
    currency: "BRL",
  });
}

export function trackBuyNow(product: TrackingProduct) {
  trackEvent("BuyNow", {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    currency: "BRL",
  });
}

export function trackInitiateCheckout(checkout: TrackingCheckout) {
  trackEvent("InitiateCheckout", {
    value: checkout.value,
    num_items: checkout.items.length,
    products: checkout.items,
    currency: "BRL",
    coupon: checkout.coupon || "",
  }, {
    oncePerSession: true,
  });
}

export function trackAddPaymentInfo(method: string) {
  trackEvent("AddPaymentInfo", {
    payment_method: method,
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
    wholesale_entry_page: payload.wholesale_entry_page || "",
    wholesale_cta_type: payload.wholesale_cta_type || "",
    catalog_viewed: payload.catalog_viewed ?? false,
  };
}

/** Generic WhatsApp click — any button */
export function trackClickWhatsApp(payload: TrackingWhatsAppClick) {
  trackEvent("ClickWhatsApp", buildWhatsAppPayload(payload), {
    dedupId: `wa_${payload.position}_${payload.page}`,
    dedupWindowMs: 5000,
  });
}

/** WhatsApp lead — click with clear commercial intent */
export function trackWhatsAppLead(payload: TrackingWhatsAppClick) {
  trackClickWhatsApp(payload);
  trackLead({
    type: payload.is_wholesale ? "wholesale" : "whatsapp",
    page: payload.page,
    product_id: payload.product_id,
    value: payload.product_price,
  });
}

/** WhatsApp conversation start — strong intent to buy/negotiate */
export function trackWhatsAppConversationStart(payload: TrackingWhatsAppClick) {
  trackEvent("WhatsAppConversationStart", buildWhatsAppPayload(payload), {
    dedupId: `wa_conv_${payload.position}_${payload.page}`,
    dedupWindowMs: 10000,
  });
}

/** WhatsApp click from a product page — attaches product context */
export function trackWhatsAppProductIntent(payload: TrackingWhatsAppClick) {
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

/** WhatsApp click from wholesale context */
export function trackWhatsAppWholesaleIntent(payload: TrackingWhatsAppClick) {
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
  trackEvent("OpenWholesalePage", {
    page: payload?.page || window.location.pathname,
  }, {
    oncePerSession: true,
  });
}

export function trackWholesaleCTA(payload: TrackingWholesalePayload) {
  trackEvent("WholesaleCTA", {
    page: payload.page,
    cta_text: payload.cta_text || "",
    cta_position: payload.cta_position || "",
  }, {
    dedupId: `wcta_${payload.cta_position}`,
    dedupWindowMs: 5000,
  });
}

export function trackWholesaleLead(payload: TrackingWholesalePayload) {
  trackEvent("WholesaleLead", {
    page: payload.page,
    cta_text: payload.cta_text || "",
    cta_position: payload.cta_position || "",
  }, {
    dedupId: `wlead_${payload.cta_position}`,
    dedupWindowMs: 10000,
  });
  trackLead({ type: "wholesale", page: payload.page });
}

export function trackViewWholesaleCatalog() {
  trackEvent("ViewWholesaleCatalog", {}, { oncePerSession: true });
}

// ══════════════════════════════════════════════════════════════
// LEADS
// ══════════════════════════════════════════════════════════════

export function trackLead(payload: TrackingLead) {
  trackEvent("Lead", {
    lead_type: payload.type,
    page: payload.page,
    product_id: payload.product_id || "",
    value: payload.value || 0,
  }, {
    dedupId: `lead_${payload.type}_${payload.page}`,
    dedupWindowMs: 10000,
  });
}

// ══════════════════════════════════════════════════════════════
// BANNERS, CTAS, INTERACTIONS
// ══════════════════════════════════════════════════════════════

export function trackBannerClick(payload: TrackingBannerClick) {
  trackEvent("BannerClick", {
    banner_id: payload.banner_id || "",
    banner_title: payload.banner_title || "",
    banner_type: payload.banner_type || "other",
    link: payload.link || "",
    position: payload.position ?? 0,
  }, {
    dedupId: `banner_${payload.banner_id}`,
    dedupWindowMs: 5000,
  });
}

export function trackCTA(payload: TrackingCTAClick) {
  trackEvent("CTA_Click", {
    cta_text: payload.cta_text,
    cta_type: payload.cta_type,
    page: payload.page,
    product_id: payload.product_id || "",
  }, {
    dedupId: `cta_${payload.cta_type}_${payload.page}`,
    dedupWindowMs: 5000,
  });
}

export function trackSearch(payload: TrackingSearch) {
  trackEvent("Search", {
    query: payload.query,
    results_count: payload.results_count ?? 0,
  }, {
    dedupId: `search_${payload.query}`,
    dedupWindowMs: 3000,
  });
}

// ══════════════════════════════════════════════════════════════
// BEHAVIORAL
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

export function setupProductPageEngagement(productId: string) {
  const timer = setTimeout(() => {
    trackEvent("ProductEngagement", {
      type: "40s_on_product",
      product_id: productId,
    }, {
      dedupId: `pe40_${productId}`,
      oncePerSession: true,
    });
  }, 40000);
  return () => clearTimeout(timer);
}

export function trackCartAbandonment() {
  trackEvent("CartAbandonment", {}, {
    dedupId: "cart_abandon",
    oncePerSession: true,
  });
}

export function trackVisitorType() {
  const count = incrementVisitCount();
  if (count > 1) {
    trackEvent("ReturningVisitor", { visit_count: count }, { oncePerSession: true });
  }
  trackEvent("StoreVisitor", {}, { oncePerSession: true });
}

// ══════════════════════════════════════════════════════════════
// CUSTOM EVENTS — easy to extend
// ══════════════════════════════════════════════════════════════

export function trackCustomEvent(eventName: string, data: Record<string, any> = {}, opts?: {
  dedupId?: string;
  dedupWindowMs?: number;
  oncePerSession?: boolean;
}) {
  trackEvent(eventName, data, opts);
}
