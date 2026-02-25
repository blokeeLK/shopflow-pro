import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub as string;

    const { order_id, payment_method } = await req.json();

    if (!order_id || !payment_method) {
      return new Response(JSON.stringify({ error: "order_id e payment_method são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get order details
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", order_id)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: "Pedido não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user email
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, name")
      .eq("id", userId)
      .single();

    const MP_TOKEN = Deno.env.get("MERCADOPAGO_ACCESS_TOKEN");
    if (!MP_TOKEN) {
      return new Response(JSON.stringify({ error: "Mercado Pago não configurado" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const notificationUrl = `${supabaseUrl}/functions/v1/mp-webhook`;

    // Build items for MP
    const mpItems = (order.order_items || []).map((item: any) => ({
      title: item.product_name,
      quantity: item.quantity,
      unit_price: Number(item.unit_price),
      currency_id: "BRL",
    }));

    // Add shipping as item if > 0
    if (Number(order.shipping_cost) > 0) {
      mpItems.push({
        title: `Frete (${order.shipping_service || "PAC"})`,
        quantity: 1,
        unit_price: Number(order.shipping_cost),
        currency_id: "BRL",
      });
    }

    if (payment_method === "pix") {
      // Create Pix payment
      const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_TOKEN}`,
          "X-Idempotency-Key": `order-${order_id}-pix`,
        },
        body: JSON.stringify({
          transaction_amount: Number(order.total),
          description: `Pedido #${order_id.slice(0, 8)}`,
          payment_method_id: "pix",
          payer: {
            email: profile?.email || "cliente@loja.com",
            first_name: profile?.name?.split(" ")[0] || "Cliente",
          },
          notification_url: notificationUrl,
          external_reference: order_id,
        }),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error("MP Pix error:", mpData);
        return new Response(JSON.stringify({ error: "Erro ao criar pagamento Pix", details: mpData }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update order with payment info
      await supabaseAdmin.from("orders").update({
        payment_id: String(mpData.id),
        payment_method: "pix",
        status: "aguardando_pagamento",
      }).eq("id", order_id);

      return new Response(JSON.stringify({
        payment_id: mpData.id,
        status: mpData.status,
        pix_qr_code: mpData.point_of_interaction?.transaction_data?.qr_code,
        pix_qr_code_base64: mpData.point_of_interaction?.transaction_data?.qr_code_base64,
        pix_copy_paste: mpData.point_of_interaction?.transaction_data?.qr_code,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (payment_method === "card") {
      // Create checkout preference for card payment
      const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${MP_TOKEN}`,
        },
        body: JSON.stringify({
          items: mpItems,
          payer: {
            email: profile?.email || "cliente@loja.com",
            name: profile?.name || "Cliente",
          },
          external_reference: order_id,
          notification_url: notificationUrl,
          back_urls: {
            success: `${req.headers.get("origin") || "https://loja.com"}/conta`,
            failure: `${req.headers.get("origin") || "https://loja.com"}/conta`,
            pending: `${req.headers.get("origin") || "https://loja.com"}/conta`,
          },
          auto_return: "approved",
          payment_methods: {
            excluded_payment_types: [{ id: "ticket" }],
            installments: 3,
          },
        }),
      });

      const mpData = await mpResponse.json();

      if (!mpResponse.ok) {
        console.error("MP Preference error:", mpData);
        return new Response(JSON.stringify({ error: "Erro ao criar pagamento", details: mpData }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update order
      await supabaseAdmin.from("orders").update({
        payment_method: "card",
        status: "aguardando_pagamento",
      }).eq("id", order_id);

      return new Response(JSON.stringify({
        checkout_url: mpData.init_point,
        sandbox_url: mpData.sandbox_init_point,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Método de pagamento inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Payment error:", err);
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
