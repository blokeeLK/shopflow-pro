import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Mercado Pago sends different notification types
    if (body.type !== "payment" && body.action !== "payment.updated" && body.action !== "payment.created") {
      return new Response(JSON.stringify({ ok: true }), {
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
      return new Response(JSON.stringify({ error: "MP not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get payment details from MP
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${MP_TOKEN}` },
    });
    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error("MP payment fetch error:", payment);
      return new Response(JSON.stringify({ error: "Failed to fetch payment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const orderId = payment.external_reference;
    if (!orderId) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Map MP status to our order status
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
        orderStatus = "cancelado";
        break;
      default:
        orderStatus = "aguardando_pagamento";
    }

    // Update order
    await supabase.from("orders").update({
      status: orderStatus,
      payment_id: String(paymentId),
      payment_method: payment.payment_method_id || "unknown",
    }).eq("id", orderId);

    // If paid, decrease stock
    if (orderStatus === "pago") {
      const { data: orderItems } = await supabase
        .from("order_items")
        .select("product_id, size, quantity")
        .eq("order_id", orderId);

      if (orderItems) {
        for (const item of orderItems) {
          // Decrease stock
          const { data: variant } = await supabase
            .from("product_variants")
            .select("id, stock")
            .eq("product_id", item.product_id)
            .eq("size", item.size)
            .single();

          if (variant) {
            await supabase
              .from("product_variants")
              .update({ stock: Math.max(0, variant.stock - item.quantity) })
              .eq("id", variant.id);
          }

          // Increment sold_count
          const { data: product } = await supabase
            .from("products")
            .select("id, sold_count")
            .eq("id", item.product_id)
            .single();

          if (product) {
            await supabase
              .from("products")
              .update({ sold_count: product.sold_count + item.quantity })
              .eq("id", product.id);
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, status: orderStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
