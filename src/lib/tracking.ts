/**
 * ShopFlow Advanced Tracking System
 * UTMify pixel + UTM persistence + event queue + remarketing
 */

// ── Types ──────────────────────────────────────────────────────────
interface TrackingEvent {
  event: string;
  data?: Record<string, any>;
  timestamp: number;
  retries?: number;
}

interface UTMData {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  captured_at: number;
}

// ── Constants ──────────────────────────────────────────────────────
const PIXEL_ID = "69add314ca90986027a3c6c5";
const UTM_STORAGE_KEY = "sf_utm_data";
const EVENT_QUEUE_KEY = "sf_event_queue";
const FIRED_EVENTS_KEY = "sf_fired_events";
const UTM_EXPIRY_DAYS = 30;
const MAX_RETRIES = 3;
const DEBUG_LOG_KEY = "sf_tracking_debug_log";
const MAX_DEBUG_ENTRIES = 200;

// ── Debug logging ──────────────────────────────────────────────────
let debugEnabled = false;

export function enableDebug(enabled: boolean) {
  debugEnabled = enabled;
}

function debugLog(event: string, data?: any, status = "sent") {
  if (!debugEnabled && typeof window !== "undefined") {
    // Always store for admin panel
  }
  const entry = { event, data, status, timestamp: Date.now() };
  try {
    const log = JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || "[]");
    log.unshift(entry);
    if (log.length > MAX_DEBUG_ENTRIES) log.length = MAX_DEBUG_ENTRIES;
    localStorage.setItem(DEBUG_LOG_KEY, JSON.stringify(log));
  } catch { /* quota */ }
  if (debugEnabled) {
    console.log(`[SF Tracking] ${status}: ${event}`, data);
  }
}

export function getDebugLog(): any[] {
  try {
    return JSON.parse(localStorage.getItem(DEBUG_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearDebugLog() {
  localStorage.removeItem(DEBUG_LOG_KEY);
}

// ── UTM persistence (30 days) ──────────────────────────────────────
export function captureUTMs() {
  try {
    const params = new URLSearchParams(window.location.search);
    const keys = ["utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term", "fbclid", "gclid"];
    const hasNew = keys.some((k) => params.has(k));
    if (!hasNew) return;

    const data: UTMData = { captured_at: Date.now() };
    keys.forEach((k) => {
      const v = params.get(k);
      if (v) (data as any)[k] = v;
    });

    localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(data));
    debugLog("UTM_Captured", data, "captured");
  } catch { /* private browsing */ }
}

export function getStoredUTMs(): Partial<UTMData> {
  try {
    const raw = localStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    const data: UTMData = JSON.parse(raw);
    const age = Date.now() - data.captured_at;
    if (age > UTM_EXPIRY_DAYS * 86400000) {
      localStorage.removeItem(UTM_STORAGE_KEY);
      return {};
    }
    return data;
  } catch {
    return {};
  }
}

// ── Event deduplication ────────────────────────────────────────────
function getFiredKey(event: string, uniqueId?: string): string {
  return `${event}:${uniqueId || "global"}`;
}

function hasEventFired(event: string, uniqueId?: string): boolean {
  try {
    const fired = JSON.parse(sessionStorage.getItem(FIRED_EVENTS_KEY) || "{}");
    return !!fired[getFiredKey(event, uniqueId)];
  } catch {
    return false;
  }
}

function markEventFired(event: string, uniqueId?: string) {
  try {
    const fired = JSON.parse(sessionStorage.getItem(FIRED_EVENTS_KEY) || "{}");
    fired[getFiredKey(event, uniqueId)] = Date.now();
    sessionStorage.setItem(FIRED_EVENTS_KEY, JSON.stringify(fired));
  } catch { /* */ }
}

// Purchase dedup is permanent (per order)
function hasPurchaseFired(orderId: string): boolean {
  try {
    return localStorage.getItem(`sf_purchase_${orderId}`) === "1";
  } catch {
    return false;
  }
}

function markPurchaseFired(orderId: string) {
  try {
    localStorage.setItem(`sf_purchase_${orderId}`, "1");
  } catch { /* */ }
}

// ── Event queue (offline resilience) ───────────────────────────────
function enqueueEvent(evt: TrackingEvent) {
  try {
    const queue: TrackingEvent[] = JSON.parse(localStorage.getItem(EVENT_QUEUE_KEY) || "[]");
    queue.push(evt);
    localStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(queue));
  } catch { /* */ }
}

function dequeueAll(): TrackingEvent[] {
  try {
    const queue: TrackingEvent[] = JSON.parse(localStorage.getItem(EVENT_QUEUE_KEY) || "[]");
    localStorage.removeItem(EVENT_QUEUE_KEY);
    return queue;
  } catch {
    return [];
  }
}

// ── Send event via UTMify pixel ────────────────────────────────────
function sendPixelEvent(event: string, data?: Record<string, any>) {
  const utms = getStoredUTMs();
  const payload = { ...data, ...utms };

  try {
    // UTMify uses window.pixelId + custom events
    if (typeof (window as any).utmify_event === "function") {
      (window as any).utmify_event(event, payload);
      debugLog(event, payload, "sent");
      return true;
    }

    // Fallback: push to dataLayer-style array
    (window as any).__sfEvents = (window as any).__sfEvents || [];
    (window as any).__sfEvents.push({ event, ...payload, timestamp: Date.now() });
    debugLog(event, payload, "queued_datalayer");
    return true;
  } catch (err) {
    debugLog(event, payload, "error");
    return false;
  }
}

// ── Public tracking API ────────────────────────────────────────────
export function trackEvent(event: string, data?: Record<string, any>, opts?: { dedupId?: string; once?: boolean }) {
  const dedupId = opts?.dedupId;
  
  if (opts?.once && hasEventFired(event, dedupId)) return;

  const success = sendPixelEvent(event, data);
  if (!success) {
    enqueueEvent({ event, data, timestamp: Date.now(), retries: 0 });
  }

  if (opts?.once) markEventFired(event, dedupId);
}

// ── Specific e-commerce events ─────────────────────────────────────
export function trackPageView() {
  trackEvent("PageView", { url: window.location.pathname, referrer: document.referrer });
}

export function trackViewContent(product: {
  id: string; name: string; price: number; category?: string;
}) {
  trackEvent("ViewContent", {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    category: product.category || "",
    currency: "BRL",
  }, { dedupId: product.id, once: true });

  // Remarketing: visitor de produto
  trackEvent("ProdutoVisualizado", { product_id: product.id, product_name: product.name }, { dedupId: `pv_${product.id}`, once: true });
}

export function trackAddToCart(item: {
  id: string; name: string; price: number; quantity: number; size?: string;
}) {
  trackEvent("AddToCart", {
    product_id: item.id,
    product_name: item.name,
    price: item.price,
    quantity: item.quantity,
    size: item.size || "",
    currency: "BRL",
  });
  trackEvent("CarrinhoCriado", { product_id: item.id });
}

export function trackInitiateCheckout(cart: {
  value: number; items: Array<{ id: string; name: string; quantity: number; price: number }>;
}) {
  trackEvent("InitiateCheckout", {
    value: cart.value,
    num_items: cart.items.length,
    products: cart.items,
    currency: "BRL",
  }, { once: true });
  trackEvent("CheckoutIniciado", { value: cart.value }, { once: true });
}

export function trackAddPaymentInfo(method: string) {
  trackEvent("AddPaymentInfo", { payment_method: method }, { once: true });
}

export function trackPurchase(order: {
  orderId: string; value: number; items: Array<{ id: string; name: string; quantity: number; price: number }>;
  email?: string; city?: string; state?: string;
}) {
  if (hasPurchaseFired(order.orderId)) return;

  trackEvent("Purchase", {
    order_id: order.orderId,
    value: order.value,
    currency: "BRL",
    products: order.items,
    quantity: order.items.reduce((a, i) => a + i.quantity, 0),
    customer_email: order.email || "",
    city: order.city || "",
    state: order.state || "",
  });
  trackEvent("CompraConfirmada", { order_id: order.orderId, value: order.value });
  
  markPurchaseFired(order.orderId);
}

// ── Behavioral tracking ────────────────────────────────────────────
export function setupScrollTracking() {
  const thresholds = [25, 50, 75, 90];
  const fired = new Set<number>();

  const onScroll = () => {
    const scrollPct = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    thresholds.forEach((t) => {
      if (scrollPct >= t && !fired.has(t)) {
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
      trackEvent("TimeOnPage", { seconds: s, url: window.location.pathname }, { dedupId: `top_${s}`, once: true });
    }, s * 1000)
  );
  return () => timers.forEach(clearTimeout);
}

// Product engagement tracker
let productViewCount = 0;
let productClickCount = 0;

export function trackProductView() {
  productViewCount++;
  if (productViewCount === 4) {
    trackEvent("ProductEngagement", { type: "viewed_3plus_products", count: productViewCount }, { once: true });
  }
}

export function trackProductClick() {
  productClickCount++;
  if (productClickCount === 3) {
    trackEvent("ProductEngagement", { type: "clicked_2plus_products", count: productClickCount }, { once: true });
  }
}

export function setupProductPageEngagement(productId: string) {
  const timer = setTimeout(() => {
    trackEvent("ProductEngagement", { type: "40s_on_product", product_id: productId }, { dedupId: `pe40_${productId}`, once: true });
    trackEvent("ProdutoEngajado", { product_id: productId }, { dedupId: `peng_${productId}`, once: true });
  }, 40000);
  return () => clearTimeout(timer);
}

// ── Remarketing audience events ────────────────────────────────────
export function trackVisitorType() {
  const visitKey = "sf_visit_count";
  try {
    const count = parseInt(localStorage.getItem(visitKey) || "0", 10) + 1;
    localStorage.setItem(visitKey, String(count));
    if (count > 1) {
      trackEvent("VisitanteRecorrente", { visit_count: count }, { once: true });
    }
    trackEvent("VisitanteLoja", {}, { once: true });
  } catch { /* */ }
}

export function trackCartAbandonment() {
  trackEvent("AbandonoCarrinho", {}, { dedupId: "cart_abandon", once: true });
}

// ── Advanced matching (hashed user data) ───────────────────────────
async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sendAdvancedMatching(userData: {
  email?: string; phone?: string; city?: string; state?: string; cep?: string;
}) {
  const hashed: Record<string, string> = {};
  if (userData.email) hashed.em = await sha256(userData.email);
  if (userData.phone) hashed.ph = await sha256(userData.phone);
  if (userData.city) hashed.ct = await sha256(userData.city);
  if (userData.state) hashed.st = await sha256(userData.state);
  if (userData.cep) hashed.zp = await sha256(userData.cep);
  hashed.ua = navigator.userAgent;

  trackEvent("AdvancedMatching", hashed);
}

// ── Event queue flush (retry + online recovery) ────────────────────
export function flushEventQueue() {
  const queue = dequeueAll();
  queue.forEach((evt) => {
    if ((evt.retries || 0) < MAX_RETRIES) {
      const success = sendPixelEvent(evt.event, evt.data);
      if (!success) {
        enqueueEvent({ ...evt, retries: (evt.retries || 0) + 1 });
      }
    }
  });
}

// ── Pixel initialization ───────────────────────────────────────────
let pixelInitialized = false;

export function initPixel() {
  if (pixelInitialized) return;
  pixelInitialized = true;

  // Set pixel ID
  (window as any).pixelId = PIXEL_ID;

  // Load UTMify pixel script
  const pixelScript = document.createElement("script");
  pixelScript.async = true;
  pixelScript.defer = true;
  pixelScript.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
  document.head.appendChild(pixelScript);

  // Load UTMify UTM script
  const utmScript = document.createElement("script");
  utmScript.async = true;
  utmScript.defer = true;
  utmScript.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
  utmScript.setAttribute("data-utmify-prevent-xcod-sck", "");
  utmScript.setAttribute("data-utmify-prevent-subids", "");
  document.head.appendChild(utmScript);

  // Capture UTMs from current URL
  captureUTMs();

  // Track visitor type
  trackVisitorType();

  // Flush queued events when online
  window.addEventListener("online", flushEventQueue);
  
  // Flush on load
  setTimeout(flushEventQueue, 3000);

  debugLog("PixelInitialized", { pixelId: PIXEL_ID }, "init");
}
