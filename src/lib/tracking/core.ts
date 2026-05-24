/**
 * ShopFlow Tracking — Core engine (v2 Professional)
 * Handles pixel dispatch, deduplication, debug logging, queue flushing.
 * 
 * CAPI Integration Points:
 * - sendBrowserEvent() → current pixel dispatch (UTMify)
 * - sendServerEvent() → future edge function with same event_id for dedup
 */
import type {
  TrackEventOptions,
  DebugLogEntry,
  QueuedEvent,
} from "./types";
import {
  getStoredUTMs,
  getFirstTouch,
  getLastTouch,
  getSessionId,
  generateEventId,
  isDuplicateRecent,
  hasSessionEventFired,
  markSessionEventFired,
  hasPermanentEventFired,
  markPermanentEventFired,
  enqueueEvent,
  dequeueAll,
  appendDebugLog,
} from "./storage";
import { getIntentScore, getIntentLevel } from "./score";

// ── Constants ──
const META_PIXEL_ID = "1552926625784575";
const MAX_RETRIES = 3;

const META_STANDARD_EVENTS = new Set([
  "PageView","ViewContent","Search","AddToCart","AddToWishlist",
  "InitiateCheckout","AddPaymentInfo","Purchase","Lead","CompleteRegistration","Contact",
]);

// ── Debug mode ──
let debugEnabled = false;
export function enableDebug(on: boolean) { debugEnabled = on; }

// ── Build common envelope with score & UTMs ──
function buildEnvelope(eventName: string, data: Record<string, any>) {
  const sessionId = getSessionId();
  const eventId = data.event_id || generateEventId();
  const firstTouch = getFirstTouch();
  const lastTouch = getLastTouch();
  const utms = getStoredUTMs();

  return {
    event_name: eventName,
    event_id: eventId,
    session_id: sessionId,
    timestamp: Date.now(),
    page_url: window.location.href,
    path: window.location.pathname,
    referrer: document.referrer,
    user_agent: navigator.userAgent,
    source: "browser" as const,
    first_touch_utm: firstTouch,
    last_touch_utm: lastTouch,
    fbclid: utms.fbclid || "",
    gclid: utms.gclid || "",
    intent_score: getIntentScore(),
    intent_level: getIntentLevel(),
    ...data,
    ...utms,
  };
}

// ── Log to debug store ──
function logDebug(
  event: string,
  eventId: string,
  data: Record<string, any> | undefined,
  status: DebugLogEntry["status"],
  blockedReason?: string,
) {
  const sessionId = getSessionId();
  const utms = getStoredUTMs();
  const entry: DebugLogEntry = {
    event,
    event_id: eventId,
    session_id: sessionId,
    data,
    status,
    timestamp: Date.now(),
    path: window.location.pathname,
    url: window.location.href,
    referrer: document.referrer,
    first_touch_utm: getFirstTouch(),
    last_touch_utm: getLastTouch(),
    fbclid: utms.fbclid,
    gclid: utms.gclid,
    intent_score: getIntentScore(),
    intent_level: getIntentLevel(),
    blocked_reason: blockedReason,
  };
  appendDebugLog(entry);
  if (debugEnabled) {
    const icon = status === "sent" ? "✅" : status === "blocked" ? "🚫" : status === "error" ? "❌" : "📦";
    console.log(`[SF ${icon}] ${event}`, { eventId, status, blockedReason, data });
  }
}

// ── Send event via Meta Pixel (fbq) ──
function sendBrowserEvent(event: string, payload: Record<string, any>): boolean {
  try {
    const fbq = (window as any).fbq;
    if (typeof fbq === "function") {
      if (META_STANDARD_EVENTS.has(event)) {
        fbq("track", event, payload);
      } else {
        fbq("trackCustom", event, payload);
      }
      return true;
    }
    // Fallback: queue until fbq loads
    (window as any).__sfEvents = (window as any).__sfEvents || [];
    (window as any).__sfEvents.push({ event, ...payload, timestamp: Date.now() });
    return false;
  } catch {
    return false;
  }
}

/**
 * Future CAPI integration point.
 * Will call an edge function with the same event_id for server-side dedup.
 */
// export async function sendServerEvent(event: string, payload: Record<string, any>): Promise<boolean> {
//   // TODO: POST to edge function /functions/v1/track-event
//   // payload should include event_id for dedup with browser event
//   return false;
// }

// ══════════════════════════════════════════════════════════════
// PUBLIC: trackEvent — the single entry point
// ══════════════════════════════════════════════════════════════

export function trackEvent(
  eventName: string,
  data: Record<string, any> = {},
  opts: TrackEventOptions = {},
) {
  if (typeof window === "undefined") return;

  try {
    const {
      dedupId,
      dedupWindowMs = 3000,
      oncePerSession = false,
      oncePermanent = false,
      permanentKey,
    } = opts;

    const dedupKey = dedupId ? `${eventName}:${dedupId}` : eventName;
    const eventId = generateEventId();

    // 1) Rapid-fire dedup
    if (isDuplicateRecent(dedupKey, dedupWindowMs)) {
      logDebug(eventName, eventId, data, "blocked", "rapid_fire_duplicate");
      return;
    }

    // 2) Session dedup
    if (oncePerSession && hasSessionEventFired(eventName, dedupId)) {
      logDebug(eventName, eventId, data, "blocked", "once_per_session");
      return;
    }

    // 3) Permanent dedup
    if (oncePermanent) {
      const pKey = permanentKey || `sf_perm_${eventName}_${dedupId || "g"}`;
      if (hasPermanentEventFired(pKey)) {
        logDebug(eventName, eventId, data, "blocked", "permanent_duplicate");
        return;
      }
      markPermanentEventFired(pKey);
    }

    // Build envelope
    const envelope = buildEnvelope(eventName, { ...data, event_id: eventId });

    // Send via browser pixel
    const success = sendBrowserEvent(eventName, envelope);

    if (success) {
      logDebug(eventName, eventId, data, "sent");
    } else {
      logDebug(eventName, eventId, data, "queued");
      enqueueEvent({ event: eventName, data: envelope, event_id: eventId, timestamp: Date.now(), retries: 0 });
    }

    // Mark session fired
    if (oncePerSession) markSessionEventFired(eventName, dedupId);
  } catch (err) {
    // Tracking should NEVER break the site
    if (debugEnabled) console.error("[SF] trackEvent error:", err);
  }
}

// ══════════════════════════════════════════════════════════════
// QUEUE FLUSH
// ══════════════════════════════════════════════════════════════

export function flushEventQueue() {
  const queue = dequeueAll();
  queue.forEach((evt) => {
    if ((evt.retries || 0) < MAX_RETRIES) {
      const success = sendBrowserEvent(evt.event, evt.data || {});
      if (!success) {
        enqueueEvent({ ...evt, retries: (evt.retries || 0) + 1 });
      }
    }
  });
}

// ══════════════════════════════════════════════════════════════
// PIXEL INIT
// ══════════════════════════════════════════════════════════════

let pixelInitialized = false;

export function initPixel() {
  if (pixelInitialized) return;
  pixelInitialized = true;

  // Meta Pixel bootstrap
  const w = window as any;
  if (!w.fbq) {
    const n: any = function (...args: any[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    };
    if (!w._fbq) w._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    w.fbq = n;
    const fbScript = document.createElement("script");
    fbScript.async = true;
    fbScript.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(fbScript);
  }
  w.fbq("init", META_PIXEL_ID);
  w.fbq("track", "PageView");

  // UTMify UTM capture (no pixel.js)
  if (!document.querySelector('script[src*="utms/latest.js"]')) {
    const utmScript = document.createElement("script");
    utmScript.async = true;
    utmScript.defer = true;
    utmScript.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
    utmScript.setAttribute("data-utmify-prevent-xcod-sck", "");
    utmScript.setAttribute("data-utmify-prevent-subids", "");
    document.head.appendChild(utmScript);
  }

  window.addEventListener("online", flushEventQueue);
  setTimeout(flushEventQueue, 3000);

  logDebug("PixelInitialized", generateEventId(), { pixelId: META_PIXEL_ID }, "sent");
}

// ── Advanced matching ──
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
