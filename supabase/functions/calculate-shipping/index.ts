import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ShippingRequest {
  cep_destino: string;
  items: { product_id: string; quantity: number }[];
  city?: string;
  state?: string;
  subtotal?: number;
}

function normalizeCity(city: string): string {
  return city.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function isFreeShippingCity(city?: string, state?: string): boolean {
  if (!city || !state) return false;
  return normalizeCity(city) === "para de minas" && state.toUpperCase().trim() === "MG";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cep_destino, items, city, state, subtotal } = (await req.json()) as ShippingRequest;

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

    let totalWeight = 0;
    let maxWidth = 11;
    let maxLength = 16;
    let totalHeight = 2;

    for (const item of items) {
      const prod = products?.find((p: any) => p.id === item.product_id);
      if (!prod) continue;
      const qty = item.quantity || 1;
      totalWeight += (prod.weight || 0.3) * qty;
      maxWidth = Math.max(maxWidth, prod.width || 11);
      maxLength = Math.max(maxLength, prod.length || 16);
      totalHeight += (prod.height || 2) * qty;
    }

    totalWeight = Math.max(totalWeight, 0.3);
    totalHeight = Math.min(totalHeight, 100);

    const distanceFactor = getDistanceFactor(cleanCep);
    const pacPrice = calculateShipping(totalWeight, maxWidth, maxLength, totalHeight, distanceFactor, "PAC");
    const sedexPrice = calculateShipping(totalWeight, maxWidth, maxLength, totalHeight, distanceFactor, "SEDEX");

    // Free shipping: Pará de Minas - MG OR subtotal >= 130
    const FREE_THRESHOLD = 130;
    const isCityFree = isFreeShippingCity(city, state);
    const isValueFree = (subtotal || 0) >= FREE_THRESHOLD;
    const freeShipping = isCityFree || isValueFree;

    const result = {
      cep_destino: cleanCep,
      freeShipping,
      freeThreshold: FREE_THRESHOLD,
      freeReason: isCityFree ? "city" : isValueFree ? "value" : null,
      options: [
        {
          service: "PAC",
          price: freeShipping ? 0 : pacPrice,
          deadline: `${Math.round(8 + distanceFactor * 4)} dias úteis`,
        },
        {
          service: "SEDEX",
          price: freeShipping ? 0 : sedexPrice,
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
  const factors: Record<number, number> = {
    0: 0.2, 1: 0.1, 2: 0.4, 3: 0.5, 4: 0.6, 5: 0.5, 6: 0.8, 7: 0.9, 8: 0.7, 9: 0.6,
  };
  return factors[region] ?? 0.5;
}

function calculateShipping(
  weight: number, width: number, length: number, height: number,
  distanceFactor: number, service: "PAC" | "SEDEX"
): number {
  const cubicWeight = (width * length * height) / 6000;
  const effectiveWeight = Math.max(weight, cubicWeight);
  const basePrice = service === "PAC" ? 12.0 : 22.0;
  const weightPrice = effectiveWeight * (service === "PAC" ? 8 : 14);
  const distancePrice = distanceFactor * (service === "PAC" ? 6 : 12);
  const total = basePrice + weightPrice + distancePrice;
  return Math.round(total * 100) / 100;
}
