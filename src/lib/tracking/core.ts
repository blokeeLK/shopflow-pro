/**
 * ShopFlow Tracking — Core engine
 * Handles pixel dispatch, deduplication, debug logging, queue flushing
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

// ── Constants ──
const PIXEL_ID = "69add314ca90986027a3c6c5";
const MAX_RETRIES = 3;

// ── Debug mode ──
let debugEnabled = false;
export function enableDebug(on: boolean) { debugEnabled = on; }

// ── Build common envelope ──
function buildEnvelope(eventName: string, data: Record<string, any>) {
  const sessionId = getSessionId();
  const eventId = generateEventId();
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
    ...data,
    // Merge UTMs into payload for pixel
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
    fbclid: getStoredUTMs().fbclid,
    blocked_reason: blockedReason,
  };
  appendDebugLog(entry);
  if (debugEnabled) {
    const icon = status === "sent" ? "✅" : status === "blocked" ? "🚫" : status === "error" ? "❌" : "📦";
    console.log(`[SF ${icon}] ${event}`, { eventId, status, blockedReason, data });
  }
}

// ── Send event via UTMify pixel ──
function sendPixelEvent(event: string, payload: Record<string, any>): boolean {
  try {
    if (typeof (window as any).utmify_event === "function") {
      (window as any).utmify_event(event, payload);
      return true;
    }
    // Fallback: push to dataLayer
    (window as any).__sfEvents = (window as any).__sfEvents || [];
    (window as any).__sfEvents.push({ event, ...payload, timestamp: Date.now() });
    return true;
  } catch {
    return false;
  }
}

// ══════════════════════════════════════════════════════════════
// PUBLIC: trackEvent — the single entry point
// ══════════════════════════════════════════════════════════════

/**
 * Central tracking dispatch with deduplication, envelope building, debug logging.
 * All specific track* functions call this.
 *
 * Future CAPI integration point:
 * - sendBrowserEvent() → current pixel dispatch
 * - sendServerEvent() → future edge function call with same event_id for dedup
 */
export function trackEvent(
  eventName: string,
  data: Record<string, any> = {},
  opts: TrackEventOptions = {},
) {
  if (typeof window === "undefined") return;

  const {
    dedupId,
    dedupWindowMs = 3000,
    oncePerSession = false,
    oncePermanent = false,
    permanentKey,
  } = opts;

  const dedupKey = dedupId ? `${eventName}:${dedupId}` : eventName;
  const eventId = generateEventId();

  // 1) Rapid-fire dedup (in-memory)
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

  // Build full envelope
  const envelope = buildEnvelope(eventName, { ...data, event_id: eventId });

  // Send via browser pixel (sendBrowserEvent)
  const success = sendPixelEvent(eventName, envelope);

  if (success) {
    logDebug(eventName, eventId, data, "sent");
  } else {
    logDebug(eventName, eventId, data, "queued");
    enqueueEvent({ event: eventName, data: envelope, event_id: eventId, timestamp: Date.now(), retries: 0 });
  }

  // Mark session fired
  if (oncePerSession) markSessionEventFired(eventName, dedupId);
}

// ══════════════════════════════════════════════════════════════
// QUEUE FLUSH
// ══════════════════════════════════════════════════════════════

export function flushEventQueue() {
  const queue = dequeueAll();
  queue.forEach((evt) => {
    if ((evt.retries || 0) < MAX_RETRIES) {
      const success = sendPixelEvent(evt.event, evt.data || {});
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

  (window as any).pixelId = PIXEL_ID;

  // UTMify pixel
  const pixelScript = document.createElement("script");
  pixelScript.async = true;
  pixelScript.defer = true;
  pixelScript.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
  document.head.appendChild(pixelScript);

  // UTMify UTM
  const utmScript = document.createElement("script");
  utmScript.async = true;
  utmScript.defer = true;
  utmScript.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
  utmScript.setAttribute("data-utmify-prevent-xcod-sck", "");
  utmScript.setAttribute("data-utmify-prevent-subids", "");
  document.head.appendChild(utmScript);

  // Online recovery
  window.addEventListener("online", flushEventQueue);
  setTimeout(flushEventQueue, 3000);

  logDebug("PixelInitialized", generateEventId(), { pixelId: PIXEL_ID }, "sent");
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
