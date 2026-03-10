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
        .select("id, name, slug, image_fit_mode, image_position_x, image_position_y, image_zoom, product_images(url, position), product_variants(size, stock)")
        .eq("active", true);
      if (error) throw error;
      return data as unknown as DbProduct[];
    },
  });
}

function CatalogCard({ product }: { product: DbProduct }) {
  const image = product.product_images?.sort((a, b) => (a.position || 0) - (b.position || 0))[0]?.url || "/placeholder.svg";

  const fitMode = product.image_fit_mode || "contain";
  const posX = product.image_position_x ?? 50;
  const posY = product.image_position_y ?? 50;
  const zoom = product.image_zoom ?? 1;
  const isContain = fitMode === "contain";

  const imageStyle: React.CSSProperties = isContain
    ? { objectFit: "contain", objectPosition: "center" }
    : { objectFit: "cover", objectPosition: `${posX}% ${posY}%`, transform: `scale(${zoom})` };

  return (
    <div className="bg-card rounded-lg overflow-hidden shadow-product">
      <div className="relative aspect-[4/5] bg-secondary overflow-hidden flex items-center justify-center">
        <img
          src={image}
          alt={product.name}
          className={`w-full h-full ${isContain ? "p-2" : ""}`}
          style={imageStyle}
          loading="lazy"
        />
      </div>
      <div className="p-2 md:p-3">
        <h3 className="font-display font-semibold text-xs md:text-sm text-foreground line-clamp-2 mb-1.5 leading-tight">
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
      p.product_variants?.some((v) => v.size === size)
    );
    return acc;
  }, {} as Record<string, DbProduct[]>);

  // Products without any variant go into a separate "Outros" section
  const productsWithoutVariants = (products || []).filter(
    (p) => !p.product_variants || p.product_variants.length === 0
  );

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

          {productsWithoutVariants.length > 0 && (
            <section className="mb-12">
              <h2 className="font-display text-lg md:text-xl font-bold text-foreground mb-4 border-b border-border pb-2">
                Outros
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {productsWithoutVariants.map((product) => (
                  <CatalogCard key={product.id} product={product} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
