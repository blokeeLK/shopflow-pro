/**
 * ShopFlow Tracking — Storage & persistence utilities
 */
import type { UTMData, SessionData, AttributionData, QueuedEvent, DebugLogEntry } from "./types";

// ── Storage keys ──
const KEYS = {
  UTM: "sf_utm_data",
  FIRST_TOUCH: "sf_first_touch",
  ATTRIBUTION: "sf_attribution",
  SESSION: "sf_session",
  EVENT_QUEUE: "sf_event_queue",
  FIRED_SESSION: "sf_fired_events",
  DEBUG_LOG: "sf_tracking_debug_log",
  VISIT_COUNT: "sf_visit_count",
} as const;

const UTM_EXPIRY_DAYS = 30;
const MAX_DEBUG_ENTRIES = 300;
const MAX_QUEUE = 50;

// ── Safe storage helpers ──
function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch { /* quota */ }
}
function safeRemove(key: string) {
  try { localStorage.removeItem(key); } catch { /* */ }
}
function safeSessionGet(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}
function safeSessionSet(key: string, val: string) {
  try { sessionStorage.setItem(key, val); } catch { /* */ }
}

// ══════════════════════════════════════════════════════════════
// UTM PERSISTENCE
// ══════════════════════════════════════════════════════════════

export function captureUTMs(): Partial<UTMData> | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const utmKeys = ["utm_source", "utm_campaign", "utm_medium", "utm_content", "utm_term", "fbclid", "gclid"];
  const hasNew = utmKeys.some((k) => params.has(k));
  if (!hasNew) return null;

  const data: UTMData = { captured_at: Date.now() };
  utmKeys.forEach((k) => {
    const v = params.get(k);
    if (v) (data as any)[k] = v;
  });

  // Always update last touch
  safeSet(KEYS.UTM, JSON.stringify(data));

  // Set first touch only if not exists
  if (!safeGet(KEYS.FIRST_TOUCH)) {
    safeSet(KEYS.FIRST_TOUCH, JSON.stringify(data));
  }

  // Update attribution
  updateAttribution(data);

  return data;
}

export function getStoredUTMs(): Partial<UTMData> {
  const raw = safeGet(KEYS.UTM);
  if (!raw) return {};
  try {
    const data: UTMData = JSON.parse(raw);
    if (Date.now() - data.captured_at > UTM_EXPIRY_DAYS * 86400000) {
      safeRemove(KEYS.UTM);
      return {};
    }
    return data;
  } catch { return {}; }
}

export function getFirstTouch(): Partial<UTMData> {
  const raw = safeGet(KEYS.FIRST_TOUCH);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export function getLastTouch(): Partial<UTMData> {
  return getStoredUTMs();
}

function updateAttribution(newUtm: Partial<UTMData>) {
  const existing = getAttribution();
  const updated: AttributionData = {
    first_touch: existing.first_touch && Object.keys(existing.first_touch).length > 0 ? existing.first_touch : newUtm,
    first_touch_at: existing.first_touch_at || Date.now(),
    first_landing_page: existing.first_landing_page || window.location.pathname,
    last_touch: newUtm,
    last_touch_at: Date.now(),
  };
  safeSet(KEYS.ATTRIBUTION, JSON.stringify(updated));
}

export function getAttribution(): AttributionData {
  const raw = safeGet(KEYS.ATTRIBUTION);
  if (!raw) return {
    first_touch: {},
    first_touch_at: 0,
    first_landing_page: "",
    last_touch: {},
    last_touch_at: 0,
  };
  try { return JSON.parse(raw); } catch { return { first_touch: {}, first_touch_at: 0, first_landing_page: "", last_touch: {}, last_touch_at: 0 }; }
}

// ══════════════════════════════════════════════════════════════
// SESSION MANAGEMENT
// ══════════════════════════════════════════════════════════════

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateSession(): SessionData {
  const raw = safeSessionGet(KEYS.SESSION);
  if (raw) {
    try {
      const session: SessionData = JSON.parse(raw);
      session.last_activity = Date.now();
      safeSessionSet(KEYS.SESSION, JSON.stringify(session));
      return session;
    } catch { /* recreate */ }
  }

  const session: SessionData = {
    session_id: generateId(),
    started_at: Date.now(),
    landing_page: window.location.pathname + window.location.search,
    pages_viewed: 0,
    last_activity: Date.now(),
  };
  safeSessionSet(KEYS.SESSION, JSON.stringify(session));
  return session;
}

export function incrementPagesViewed() {
  const session = getOrCreateSession();
  session.pages_viewed++;
  safeSessionSet(KEYS.SESSION, JSON.stringify(session));
}

export function getSessionId(): string {
  return getOrCreateSession().session_id;
}

export function generateEventId(): string {
  return generateId();
}

// ══════════════════════════════════════════════════════════════
// DEDUPLICATION
// ══════════════════════════════════════════════════════════════

// In-memory dedup cache for rapid-fire protection
const recentEvents = new Map<string, number>();

export function isDuplicateRecent(key: string, windowMs = 3000): boolean {
  const last = recentEvents.get(key);
  if (last && Date.now() - last < windowMs) return true;
  recentEvents.set(key, Date.now());
  // Cleanup old entries periodically
  if (recentEvents.size > 200) {
    const now = Date.now();
    for (const [k, v] of recentEvents) {
      if (now - v > 30000) recentEvents.delete(k);
    }
  }
  return false;
}

export function hasSessionEventFired(event: string, dedupId?: string): boolean {
  const key = `${event}:${dedupId || "g"}`;
  const raw = safeSessionGet(KEYS.FIRED_SESSION);
  try {
    const fired = raw ? JSON.parse(raw) : {};
    return !!fired[key];
  } catch { return false; }
}

export function markSessionEventFired(event: string, dedupId?: string) {
  const key = `${event}:${dedupId || "g"}`;
  const raw = safeSessionGet(KEYS.FIRED_SESSION);
  try {
    const fired = raw ? JSON.parse(raw) : {};
    fired[key] = Date.now();
    safeSessionSet(KEYS.FIRED_SESSION, JSON.stringify(fired));
  } catch { /* */ }
}

export function hasPermanentEventFired(key: string): boolean {
  return safeGet(key) === "1";
}

export function markPermanentEventFired(key: string) {
  safeSet(key, "1");
}

// ══════════════════════════════════════════════════════════════
// EVENT QUEUE (offline resilience)
// ══════════════════════════════════════════════════════════════

export function enqueueEvent(evt: QueuedEvent) {
  const raw = safeGet(KEYS.EVENT_QUEUE);
  try {
    const queue: QueuedEvent[] = raw ? JSON.parse(raw) : [];
    queue.push(evt);
    if (queue.length > MAX_QUEUE) queue.shift();
    safeSet(KEYS.EVENT_QUEUE, JSON.stringify(queue));
  } catch { /* */ }
}

export function dequeueAll(): QueuedEvent[] {
  const raw = safeGet(KEYS.EVENT_QUEUE);
  safeRemove(KEYS.EVENT_QUEUE);
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

// ══════════════════════════════════════════════════════════════
// DEBUG LOG
// ══════════════════════════════════════════════════════════════

export function appendDebugLog(entry: DebugLogEntry) {
  const raw = safeGet(KEYS.DEBUG_LOG);
  try {
    const log: DebugLogEntry[] = raw ? JSON.parse(raw) : [];
    log.unshift(entry);
    if (log.length > MAX_DEBUG_ENTRIES) log.length = MAX_DEBUG_ENTRIES;
    safeSet(KEYS.DEBUG_LOG, JSON.stringify(log));
  } catch { /* quota */ }
}

export function getDebugLog(): DebugLogEntry[] {
  const raw = safeGet(KEYS.DEBUG_LOG);
  try { return raw ? JSON.parse(raw) : []; } catch { return []; }
}

export function clearDebugLog() {
  safeRemove(KEYS.DEBUG_LOG);
}

// ══════════════════════════════════════════════════════════════
// VISIT COUNTER
// ══════════════════════════════════════════════════════════════

export function incrementVisitCount(): number {
  const raw = safeGet(KEYS.VISIT_COUNT);
  const count = (parseInt(raw || "0", 10) || 0) + 1;
  safeSet(KEYS.VISIT_COUNT, String(count));
  return count;
}

export function getVisitCount(): number {
  return parseInt(safeGet(KEYS.VISIT_COUNT) || "0", 10);
}
