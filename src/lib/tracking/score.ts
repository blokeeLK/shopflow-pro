/**
 * ShopFlow Tracking — Intent Score Engine
 * Tracks user behavior score per session to classify cold/warm/hot users.
 */

// ── Score thresholds (easily adjustable) ──
const THRESHOLDS = {
  WARM: 10,
  HOT: 25,
} as const;

export type IntentLevel = "cold_user" | "warm_user" | "hot_user";

export interface ScoreState {
  score: number;
  level: IntentLevel;
  pages_viewed: number;
  products_viewed: string[];
  last_product: string;
  last_strong_action: string;
  last_strong_action_at: number;
  became_warm: boolean;
  became_hot: boolean;
  is_paid_traffic: boolean;
  session_start: number;
  actions_log: string[];
}

// ── Score points ──
const POINTS = {
  // Light
  SITE_ENTRY: 1,
  VIEW_CATEGORY: 2,
  USE_FILTER: 2,
  CLICK_PRODUCT: 3,
  VIEW_PROMO_BANNER: 1,
  // Medium
  VIEW_PRODUCT_PAGE: 5,
  SELECT_SIZE: 5,
  BUY_NOW: 7,
  ADD_TO_CART: 8,
  CLICK_CTA: 4,
  // Strong
  CLICK_WHATSAPP: 10,
  CLICK_WHOLESALE: 10,
  INITIATE_CHECKOUT: 15,
  OPEN_PRIVATE_CATALOG: 12,
  CONTACT_SELLER: 12,
  GENERATE_LEAD: 15,
  // Extra
  RETURN_TO_PRODUCT: 8,
  MULTIPLE_PRODUCT_VIEWS: 8,
  LONG_ENGAGEMENT: 8,
  PAID_TRAFFIC_WHATSAPP: 10,
  PAID_TRAFFIC_CHECKOUT: 15,
} as const;

// ── In-memory score state (per session) ──
const SESSION_KEY = "sf_score_state";

// Anti-inflation: track recently scored actions with per-action cooldowns
const recentScoreActions = new Map<string, number>();
const DEFAULT_SCORE_COOLDOWN_MS = 10000; // 10 seconds default

// Stronger cooldowns for actions that can repeat
const ACTION_COOLDOWNS: Record<string, number> = {
  page_view: 5000,
  view_category: 15000,
  view_product: 30000,
  select_product: 10000,
  select_size: 5000,
  add_to_cart: 8000,
  buy_now: 10000,
  click_whatsapp: 15000,
  return_to_product: 60000,
  long_engagement_product: 60000,
  long_engagement_checkout: 60000,
  filter_products: 10000,
  banner_click: 10000,
  cta_click: 10000,
};

// Max times each action can score per session
const actionScoreCounts = new Map<string, number>();
const MAX_SCORE_PER_ACTION = 5;

function canScore(actionKey: string): boolean {
  // Check max per session
  const count = actionScoreCounts.get(actionKey) || 0;
  if (count >= MAX_SCORE_PER_ACTION) return false;

  // Check cooldown
  const cooldown = ACTION_COOLDOWNS[actionKey] || DEFAULT_SCORE_COOLDOWN_MS;
  const last = recentScoreActions.get(actionKey);
  if (last && Date.now() - last < cooldown) return false;

  recentScoreActions.set(actionKey, Date.now());
  actionScoreCounts.set(actionKey, count + 1);
  return true;
}

function getState(): ScoreState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return {
    score: 0,
    level: "cold_user",
    pages_viewed: 0,
    products_viewed: [],
    last_product: "",
    last_strong_action: "",
    last_strong_action_at: 0,
    became_warm: false,
    became_hot: false,
    is_paid_traffic: false,
    session_start: Date.now(),
    actions_log: [],
  };
}

function saveState(state: ScoreState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch { /* */ }
}

function updateLevel(state: ScoreState): ScoreState {
  if (state.score >= THRESHOLDS.HOT) {
    state.level = "hot_user";
  } else if (state.score >= THRESHOLDS.WARM) {
    state.level = "warm_user";
  } else {
    state.level = "cold_user";
  }
  return state;
}

// ── Public API ──

export function getScoreState(): ScoreState {
  return getState();
}

export function getIntentScore(): number {
  return getState().score;
}

export function getIntentLevel(): IntentLevel {
  return getState().level;
}

export function markPaidTraffic() {
  const state = getState();
  state.is_paid_traffic = true;
  saveState(state);
}

export function addScore(points: number, action: string, dedupKey?: string): {
  newScore: number;
  level: IntentLevel;
  becameWarm: boolean;
  becameHot: boolean;
} {
  const key = dedupKey || action;
  if (!canScore(key)) {
    const state = getState();
    return { newScore: state.score, level: state.level, becameWarm: false, becameHot: false };
  }

  const state = getState();
  const prevLevel = state.level;
  state.score += points;
  state.last_strong_action = action;
  state.last_strong_action_at = Date.now();
  state.actions_log.push(`${action}:+${points}`);
  if (state.actions_log.length > 50) state.actions_log = state.actions_log.slice(-50);

  updateLevel(state);

  let becameWarm = false;
  let becameHot = false;

  if (state.level === "warm_user" && !state.became_warm && prevLevel === "cold_user") {
    state.became_warm = true;
    becameWarm = true;
  }
  if (state.level === "hot_user" && !state.became_hot && prevLevel !== "hot_user") {
    state.became_hot = true;
    becameHot = true;
  }

  saveState(state);
  return { newScore: state.score, level: state.level, becameWarm, becameHot };
}

export function recordPageView() {
  const state = getState();
  state.pages_viewed++;
  saveState(state);
}

export function recordProductView(productId: string) {
  const state = getState();
  const isReturn = state.products_viewed.includes(productId);
  if (!state.products_viewed.includes(productId)) {
    state.products_viewed.push(productId);
  }
  state.last_product = productId;
  saveState(state);
  return {
    isReturn,
    totalProductsViewed: state.products_viewed.length,
  };
}

export { POINTS, THRESHOLDS };
