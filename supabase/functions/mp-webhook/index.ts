import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiter
const requestLog = new Map<string, number[]>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const timestamps = requestLog.get(key) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= RATE_LIMIT_MAX) return true;
  recent.push(now);
  requestLog.set(key, recent);
  return false;
}

async function safeLog(supabase: any, log: Record<string, any>) {
  try {
    await supabase.from("admin_logs").insert(log);
  } catch (e) {
    console.error("Failed to write log:", e);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Always respond 200 to MP
  const ok200 = (data: Record<string, unknown> = {}) =>
    new Response(JSON.stringify({ received: true, ...data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Parse body with tolerance
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      console.warn("Webhook: empty or invalid JSON body");
      return ok200({ msg: "no_body" });
    }

    const dataId = String(body.data?.id || "");

    console.log("Webhook received:", JSON.stringify({
      type: body.type,
      action: body.action,
      data_id: dataId,
    }));

    // Log every webhook event
    await safeLog(supabase, {
      admin_id: "00000000-0000-0000-0000-000000000000",
      entity: "webhook",
      action: "mp_notification",
      entity_id: dataId || "unknown",
      details: { type: body.type, action: body.action, data_id: dataId },
    });

    // Rate limiting per payment ID
    if (dataId && isRateLimited(dataId)) {
      console.warn("Rate limited webhook for payment:", dataId);
      return ok200({ msg: "rate_limited" });
    }

    // Webhook signature verification (optional)
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET") || "";

    if (webhookSecret && xSignature && xRequestId) {
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
            console.error("Invalid webhook signature for payment:", dataId);
            await safeLog(supabase, {
              admin_id: "00000000-0000-0000-0000-000000000000",
              entity: "webhook",
              action: "invalid_signature",
              entity_id: dataId,
              details: { x_request_id: xRequestId },
            });
            return ok200({ msg: "signature_invalid" });
          }
        }
      } catch (sigErr) {
        console.error("Signature verification error:", sigErr);
      }
    }

    // Only process payment events
    if (body.type !== "payment" && body.action !== "payment.updated" && body.action !== "payment.created") {
      return ok200({ msg: "ignored_event" });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      return ok200({ msg: "no_payment_id" });
    }

    // Validate payment ID format (must be numeric)
    if (!/^\d+$/.test(String(paymentId))) {
      console.warn("Invalid payment ID format:", paymentId);
      return ok200({ msg: "invalid_payment_id" });
    }

    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) {
      console.error("MERCADOPAGO_ACCESS_TOKEN not set");
      return ok200({ msg: "mp_not_configured" });
    }

    // Fetch payment from MP API
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });
    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      // Payment not found (test/fake ID) — log and return 200
      console.warn("MP payment not found (possibly test):", paymentId);
      await safeLog(supabase, {
        admin_id: "00000000-0000-0000-0000-000000000000",
        entity: "webhook",
        action: "mp_payment_not_found",
        entity_id: String(paymentId),
        details: { mp_status: mpResponse.status },
      });
      return ok200({ msg: "payment_not_found_in_mp" });
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      console.log("No external_reference in payment", paymentId);
      return ok200({ msg: "no_external_reference" });
    }

    // Validate orderId is UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(orderId)) {
      console.error("Invalid order ID format:", orderId);
      return ok200({ msg: "invalid_order_format" });
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

    // Check current order for idempotency
    const { data: currentOrder } = await supabase
      .from("orders")
      .select("status, payment_id")
      .eq("id", orderId)
      .single();

    if (!currentOrder) {
      console.error("Order not found in DB:", orderId);
      return ok200({ msg: "order_not_found" });
    }

    // IDEMPOTENCY: If already "pago", skip
    if (currentOrder.status === "pago") {
      console.log("Order already pago, skipping:", orderId);
      return ok200({ msg: "already_pago" });
    }

    // Update order
    await supabase.from("orders").update({
      status: orderStatus,
      payment_id: String(paymentId),
      payment_method: payment.payment_method_id || "unknown",
    }).eq("id", orderId);

    // Log status change
    await safeLog(supabase, {
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

    return ok200({ status: orderStatus });
  } catch (err: any) {
    console.error("Webhook error:", err);
    await safeLog(supabase, {
      admin_id: "00000000-0000-0000-0000-000000000000",
      entity: "webhook",
      action: "webhook_error",
      details: { error: err.message },
    });
    return ok200({ msg: "internal_error" });
  }
});
