import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ShippingRequest {
  cep_destino: string;
  items: { product_id: string; quantity: number }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cep_destino, items } = (await req.json()) as ShippingRequest;

    if (!cep_destino || !items?.length) {
      return new Response(JSON.stringify({ error: "CEP e itens são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanCep = cep_destino.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      return new Response(JSON.stringify({ error: "CEP inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get product dimensions from database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const productIds = items.map((i) => i.product_id);
    const { data: products, error } = await supabase
      .from("products")
      .select("id, weight, width, height, length")
      .in("id", productIds);

    if (error) throw error;

    // Calculate total package dimensions
    let totalWeight = 0;
    let maxWidth = 11; // minimum 11cm
    let maxLength = 16; // minimum 16cm  
    let totalHeight = 2; // minimum 2cm

    for (const item of items) {
      const prod = products?.find((p: any) => p.id === item.product_id);
      if (!prod) continue;
      const qty = item.quantity || 1;
      totalWeight += (prod.weight || 0.3) * qty;
      maxWidth = Math.max(maxWidth, prod.width || 11);
      maxLength = Math.max(maxLength, prod.length || 16);
      totalHeight += (prod.height || 2) * qty;
    }

    totalWeight = Math.max(totalWeight, 0.3); // min 300g
    totalHeight = Math.min(totalHeight, 100); // max 100cm

    // CEP origin (São Paulo as default)
    const cepOrigem = "01310100";

    // Calculate shipping using Correios API (melhorenvio-style simulation)
    // Since direct Correios API requires contract, we use a formula-based approach
    const distanceFactor = getDistanceFactor(cleanCep);
    
    const pacPrice = calculateShipping(totalWeight, maxWidth, maxLength, totalHeight, distanceFactor, "PAC");
    const sedexPrice = calculateShipping(totalWeight, maxWidth, maxLength, totalHeight, distanceFactor, "SEDEX");

    // Check free shipping threshold
    const { data: settings } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "free_shipping_threshold")
      .maybeSingle();
    
    const freeThreshold = settings?.value ? parseFloat(settings.value) : 299;

    const result = {
      cep_destino: cleanCep,
      freeThreshold,
      options: [
        {
          service: "PAC",
          price: pacPrice,
          deadline: `${Math.round(8 + distanceFactor * 4)} dias úteis`,
        },
        {
          service: "SEDEX",
          price: sedexPrice,
          deadline: `${Math.round(3 + distanceFactor * 2)} dias úteis`,
        },
      ],
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getDistanceFactor(cep: string): number {
  const region = parseInt(cep.substring(0, 1));
  // Distance factor based on CEP region (0-1 scale, relative to SP)
  const factors: Record<number, number> = {
    0: 0.2, // SP capital area
    1: 0.1, // SP interior
    2: 0.4, // RJ/ES
    3: 0.5, // MG
    4: 0.6, // PR/SC
    5: 0.5, // RS/MS/MT
    6: 0.8, // GO/DF/TO
    7: 0.9, // BA/SE
    8: 0.7, // PR/SC
    9: 0.6, // RS
  };
  return factors[region] ?? 0.5;
}

function calculateShipping(
  weight: number,
  width: number,
  length: number,
  height: number,
  distanceFactor: number,
  service: "PAC" | "SEDEX"
): number {
  // Cubic weight (dimensional)
  const cubicWeight = (width * length * height) / 6000;
  const effectiveWeight = Math.max(weight, cubicWeight);

  // Base price
  const basePrice = service === "PAC" ? 12.0 : 22.0;
  const weightPrice = effectiveWeight * (service === "PAC" ? 8 : 14);
  const distancePrice = distanceFactor * (service === "PAC" ? 6 : 12);

  const total = basePrice + weightPrice + distancePrice;
  return Math.round(total * 100) / 100;
}
