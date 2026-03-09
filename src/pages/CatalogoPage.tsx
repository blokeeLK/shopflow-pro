import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DbProduct, formatCurrency } from "@/hooks/useSupabaseData";

const SIZES = ["P", "M", "G", "GG"] as const;
const WHOLESALE_PRICE = 19.99;

function useCatalogProducts() {
  return useQuery({
    queryKey: ["catalog-wholesale"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, product_images(url, position), product_variants(size, stock)")
        .eq("active", true);
      if (error) throw error;
      return data as unknown as DbProduct[];
    },
  });
}

function CatalogCard({ product }: { product: DbProduct }) {
  const image = product.product_images?.sort((a, b) => (a.position || 0) - (b.position || 0))[0]?.url || "/placeholder.svg";

  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-sm">
      <div className="aspect-[4/5] bg-secondary flex items-center justify-center overflow-hidden">
        <img
          src={image}
          alt={product.name}
          className="w-full h-full object-contain p-2"
          loading="lazy"
        />
      </div>
      <div className="p-3 text-center">
        <h3 className="font-display font-semibold text-xs md:text-sm text-foreground line-clamp-2 mb-1 leading-tight">
          {product.name}
        </h3>
        <p className="text-base font-display font-bold text-foreground">
          {formatCurrency(WHOLESALE_PRICE)}
        </p>
      </div>
    </div>
  );
}

export default function CatalogoPage() {
  const { data: products, isLoading } = useCatalogProducts();

  const productsBySize = SIZES.reduce((acc, size) => {
    acc[size] = (products || []).filter((p) =>
      p.product_variants?.some((v) => v.size === size && v.stock > 0)
    );
    return acc;
  }, {} as Record<string, DbProduct[]>);

  return (
    <>
      <meta name="robots" content="noindex, nofollow" />
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="text-center mb-10">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground tracking-wide uppercase">
              Catálogo Atacado ShopFlow
            </h1>
            <p className="text-muted-foreground mt-2 text-sm md:text-base">
              Todas as peças por {formatCurrency(WHOLESALE_PRICE)} no atacado
            </p>
          </div>

          {isLoading && (
            <p className="text-center text-muted-foreground">Carregando catálogo...</p>
          )}

          {SIZES.map((size) => {
            const items = productsBySize[size];
            if (!items || items.length === 0) return null;
            return (
              <section key={size} className="mb-12">
                <h2 className="font-display text-lg md:text-xl font-bold text-foreground mb-4 border-b border-border pb-2">
                  Tamanho {size}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                  {items.map((product) => (
                    <CatalogCard key={`${product.id}-${size}`} product={product} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
