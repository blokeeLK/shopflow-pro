import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    console.log("Webhook received:", JSON.stringify({ type: body.type, action: body.action, data_id: body.data?.id }));

    // Log every webhook event
    await supabase.from("admin_logs").insert({
      admin_id: "00000000-0000-0000-0000-000000000000",
      entity: "webhook",
      action: "mp_notification",
      entity_id: String(body.data?.id || ""),
      details: { type: body.type, action: body.action, data_id: body.data?.id },
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

    // Validate by fetching payment from MP API (security)
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

    // IDEMPOTENCY: If already "pago", don't process again (prevents double stock deduction)
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

    // If paid, decrease stock (only once due to idempotency check above)
    if (orderStatus === "pago") {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, size, quantity")
        .eq("order_id", orderId);

      if (orderItems) {
        for (const item of orderItems) {
          // Atomic stock decrement — prevents race conditions
          await supabase.rpc("decrement_variant_stock", {
            p_product_id: item.product_id,
            p_size: item.size,
            p_quantity: item.quantity,
          });

          // Atomic sold_count increment
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
