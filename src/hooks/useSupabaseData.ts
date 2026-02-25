import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

// Types
export type DbProduct = Tables<"products"> & {
  category?: Tables<"categories"> | null;
  product_variants?: Tables<"product_variants">[];
  product_images?: Tables<"product_images">[];
};

export type DbCategory = Tables<"categories">;

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getInstallments(price: number, count = 3): string {
  const value = price / count;
  return `${count}x de ${formatCurrency(value)} sem juros`;
}

export function getTotalStock(variants?: Tables<"product_variants">[]): number {
  if (!variants) return 0;
  return variants.reduce((acc, v) => acc + v.stock, 0);
}

export function getProductPrice(p: Pick<Tables<"products">, "price" | "promo_price" | "is_promo">): number {
  return p.is_promo && p.promo_price ? p.promo_price : p.price;
}

export function getDiscount(p: Pick<Tables<"products">, "price" | "promo_price" | "is_promo">): number {
  if (!p.is_promo || !p.promo_price) return 0;
  return Math.round(((p.price - p.promo_price) / p.price) * 100);
}

// ---- Hooks ----

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("position");
      if (error) throw error;
      return data as DbCategory[];
    },
  });
}

export function useCategoriesWithStock() {
  return useQuery({
    queryKey: ["categories-with-stock"],
    queryFn: async () => {
      // Get categories that have at least one active product with stock
      const { data: cats, error: cErr } = await supabase
        .from("categories")
        .select("*")
        .eq("active", true)
        .order("position");
      if (cErr) throw cErr;
      if (!cats || cats.length === 0) return [];

      // Get products with stock for each category
      const { data: products, error: pErr } = await supabase
        .from("products")
        .select("category_id, product_variants(stock)")
        .eq("active", true);
      if (pErr) throw pErr;

      const catsWithStock = cats.filter((cat) => {
        const catProducts = products?.filter((p) => p.category_id === cat.id) || [];
        return catProducts.some((p) =>
          (p.product_variants as any[])?.some((v: any) => v.stock > 0)
        );
      });
      return catsWithStock as DbCategory[];
    },
  });
}

export function useProducts(options?: { featured?: boolean; categorySlug?: string; limit?: number }) {
  return useQuery({
    queryKey: ["products", options],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select("*, category:categories(*), product_variants(*), product_images(*)")
        .eq("active", true);

      if (options?.featured) {
        query = query.eq("is_featured", true);
      }

      if (options?.categorySlug) {
        // Need to get category id first
        const { data: cat } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", options.categorySlug)
          .single();
        if (cat) {
          query = query.eq("category_id", cat.id);
        } else {
          return [];
        }
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      query = query.order("sold_count", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      // Filter to only products with stock > 0
      return (data as DbProduct[]).filter((p) => getTotalStock(p.product_variants) > 0);
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(*), product_variants(*), product_images(*)")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data as DbProduct;
    },
    enabled: !!slug,
  });
}

export function useReviews(productId: string) {
  return useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profile:profiles(name)")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!productId,
  });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.key] = s.value || ""; });
      return map;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
