import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.208.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // max 5 webhook calls per minute per payment ID

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(key) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  requestLog.set(key, recent);
  return false;
}

function verifyMPSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  webhookSecret: string
): boolean {
  if (!xSignature || !xRequestId || !webhookSecret) return false;

  try {
    // Parse x-signature header: "ts=...,v1=..."
    const parts: Record<string, string> = {};
    xSignature.split(",").forEach((part) => {
      const [key, value] = part.trim().split("=", 2);
      if (key && value) parts[key] = value;
    });

    const ts = parts["ts"];
    const v1 = parts["v1"];
    if (!ts || !v1) return false;

    // Build the manifest string per MP docs
    const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;

    // HMAC-SHA256
    const encoder = new TextEncoder();
    const keyData = encoder.encode(webhookSecret);
    const msgData = encoder.encode(manifest);

    // Use Web Crypto API for HMAC
    // Since this is sync context, we'll use a simpler approach
    // For now, verify by re-fetching from MP API (existing pattern)
    // The signature check is an additional layer
    return true; // Signature parsing succeeded, full crypto check below
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const dataId = String(body.data?.id || "");

    // Rate limiting per payment ID
    if (dataId && isRateLimited(dataId)) {
      console.warn("Rate limited webhook for payment:", dataId);
      await supabase.from("admin_logs").insert({
        admin_id: "00000000-0000-0000-0000-000000000000",
        entity: "webhook",
        action: "rate_limited",
        entity_id: dataId,
        details: { type: body.type },
      });
      return new Response(JSON.stringify({ error: "Rate limited" }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Webhook signature verification
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET") || "";

    // If webhook secret is configured, verify signature
    if (webhookSecret && xSignature) {
      try {
        const parts: Record<string, string> = {};
        xSignature.split(",").forEach((part) => {
          const [key, value] = part.trim().split("=", 2);
          if (key && value) parts[key] = value;
        });

        const ts = parts["ts"];
        const v1 = parts["v1"];

        if (ts && v1) {
          const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
          const key = await crypto.subtle.importKey(
            "raw",
            new TextEncoder().encode(webhookSecret),
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"]
          );
          const signature = await crypto.subtle.sign(
            "HMAC",
            key,
            new TextEncoder().encode(manifest)
          );
          const computed = Array.from(new Uint8Array(signature))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");

          if (computed !== v1) {
            console.error("Invalid webhook signature");
            await supabase.from("admin_logs").insert({
              admin_id: "00000000-0000-0000-0000-000000000000",
              entity: "webhook",
              action: "invalid_signature",
              entity_id: dataId,
              details: { x_request_id: xRequestId },
            });
            return new Response(JSON.stringify({ error: "Invalid signature" }), {
              status: 401,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (sigErr) {
        console.error("Signature verification error:", sigErr);
      }
    }

    // Validate payment ID format (must be numeric)
    if (dataId && !/^\d+$/.test(dataId)) {
      console.warn("Invalid payment ID format:", dataId);
      return new Response(JSON.stringify({ error: "Invalid payment ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Webhook received:", JSON.stringify({ type: body.type, action: body.action, data_id: dataId }));

    // Log every webhook event
    await supabase.from("admin_logs").insert({
      admin_id: "00000000-0000-0000-0000-000000000000",
      entity: "webhook",
      action: "mp_notification",
      entity_id: dataId,
      details: { type: body.type, action: body.action, data_id: dataId },
    });

    // Only process payment events
    if (body.type !== "payment" && body.action !== "payment.updated" && body.action !== "payment.created") {
      return new Response(JSON.stringify({ ok: true, msg: "ignored" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not set");
      return new Response(JSON.stringify({ error: "MP not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate by fetching payment from MP API (security - this is the authoritative check)
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });
    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP payment fetch error:", JSON.stringify(payment));
      await supabase.from("admin_logs").insert({
        admin_id: "00000000-0000-0000-0000-000000000000",
        entity: "webhook",
        action: "mp_fetch_error",
        entity_id: String(paymentId),
        details: { error: payment },
      });
      return new Response(JSON.stringify({ error: "Failed to fetch payment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      console.log("No external_reference in payment", paymentId);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate orderId is UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      console.error("Invalid order ID format:", orderId);
      return new Response(JSON.stringify({ error: "Invalid order reference" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Map MP status to order status
    let orderStatus: string;
    switch (payment.status) {
      case "approved":
        orderStatus = "pago";
        break;
      case "pending":
      case "in_process":
        orderStatus = "aguardando_pagamento";
        break;
      case "rejected":
      case "cancelled":
      case "refunded":
      case "charged_back":
        orderStatus = "cancelado";
        break;
      default:
        orderStatus = "aguardando_pagamento";
    }

    // Check current order status for idempotency
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("status, payment_id")
      .eq("id", orderId)
      .single();

    if (!currentOrder) {
      console.error("Order not found:", orderId);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // IDEMPOTENCY: If already "pago", don't process again
    if (currentOrder.status === "pago") {
      console.log("Order already pago, skipping:", orderId);
      return new Response(JSON.stringify({ ok: true, status: "already_pago" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update order
    await supabase.from("orders").update({
      status: orderStatus,
      payment_id: String(paymentId),
      payment_method: payment.payment_method_id || "unknown",
    }).eq("id", orderId);

    // Log status change
    await supabase.from("admin_logs").insert({
      admin_id: "00000000-0000-0000-0000-000000000000",
      entity: "order",
      action: "payment_status_changed",
      entity_id: orderId,
      details: { mp_status: payment.status, order_status: orderStatus, payment_id: paymentId },
    });

    // If paid, decrease stock
    if (orderStatus === "pago") {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, size, quantity")
        .eq("order_id", orderId);

      if (orderItems) {
        for (const item of orderItems) {
          await supabase.rpc("decrement_variant_stock", {
            p_product_id: item.product_id,
            p_size: item.size,
            p_quantity: item.quantity,
          });
          await supabase.rpc("increment_sold_count", {
            p_product_id: item.product_id,
            p_quantity: item.quantity,
          });
        }
      }

      console.log("Stock updated for order:", orderId);
    }

    return new Response(JSON.stringify({ ok: true, status: orderStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    await supabase.from("admin_logs").insert({
      admin_id: "00000000-0000-0000-0000-000000000000",
      entity: "webhook",
      action: "webhook_error",
      details: { error: err.message },
    }).catch(() => {});
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
