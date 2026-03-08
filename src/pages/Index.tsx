import { useState, useMemo } from "react";
import { ArrowRight, Flame, Tag, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, DbProduct } from "@/hooks/useSupabaseData";
import { HeroCarousel } from "@/components/HeroCarousel";
import { FadeInSection } from "@/components/FadeInSection";

const SIZES = ["P", "M", "G", "GG"] as const;

type FilterKey = "todos" | "P" | "M" | "G" | "GG" | "promo";

function countBySize(products: DbProduct[], size: string): number {
  return products.filter((p) =>
    p.product_variants?.some((v) => v.size.toUpperCase() === size.toUpperCase() && v.stock > 0)
  ).length;
}

function filterBySize(products: DbProduct[], size: string): DbProduct[] {
  return products.filter((p) =>
    p.product_variants?.some((v) => v.size.toUpperCase() === size.toUpperCase() && v.stock > 0)
  );
}

function filterWeeklyPromo(products: DbProduct[]): DbProduct[] {
  return products.filter((p) => (p as any).weekly_promotion === true);
}

interface ProductSectionProps {
  title: string;
  icon?: React.ReactNode;
  products: DbProduct[];
  sectionDelay?: number;
}

function ProductSection({ title, icon, products, sectionDelay = 0 }: ProductSectionProps) {
  if (products.length === 0) return null;
  return (
    <FadeInSection delay={sectionDelay}>
      <section className="container pb-10 md:pb-14">
        <div className="flex items-center gap-2 mb-6">
          {icon}
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">{title}</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3">
          {products.map((product, i) => (
            <FadeInSection key={product.id} delay={i * 60} className="h-full">
              <ProductCard product={product} index={i} />
            </FadeInSection>
          ))}
        </div>
      </section>
    </FadeInSection>
  );
}

const Index = () => {
  const { data: allProducts = [], isLoading } = useProducts();
  const [activeFilter, setActiveFilter] = useState<FilterKey>("todos");

  const promoProducts = useMemo(() => filterWeeklyPromo(allProducts), [allProducts]);


  const filteredProducts = useMemo(() => {
    if (activeFilter === "todos") return allProducts;
    if (activeFilter === "promo") return promoProducts;
    return filterBySize(allProducts, activeFilter);
  }, [allProducts, promoProducts, activeFilter]);

  // Only show sizes that have actual products with stock
  const availableSizes = useMemo(() => {
    return SIZES.filter((s) =>
      allProducts.some((p) =>
        p.product_variants?.some((v) => v.size.toUpperCase() === s && v.stock > 0)
      )
    );
  }, [allProducts]);

  const filters: { key: FilterKey; label: string; icon?: React.ReactNode }[] = [
    { key: "todos", label: "Todos" },
    ...availableSizes.map((s) => ({ key: s as FilterKey, label: s })),
    ...(promoProducts.length > 0 ? [{ key: "promo" as FilterKey, label: "Promoções", icon: <Flame className="h-4 w-4" /> }] : []),
  ];

  // Check which sizes have promo products
  const sizesWithPromo = useMemo(() => {
    const set = new Set<string>();
    promoProducts.forEach((p) => {
      p.product_variants?.forEach((v) => {
        if (v.stock > 0) set.add(v.size.toUpperCase());
      });
    });
    return set;
  }, [promoProducts]);

  return (
    <div>
      {/* Hero Carousel */}
      <FadeInSection>
        <HeroCarousel />
      </FadeInSection>

      {/* Size / Promo Filter Buttons */}
      <FadeInSection>
        <section className="container py-10 md:py-14">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-7 tracking-tight">
            Filtrar por tamanho
          </h2>
          <div className="flex flex-wrap gap-3 md:gap-4">
            {filters.map((f) => {
              const isActive = activeFilter === f.key;
              const hasPromo = f.key !== "todos" && f.key !== "promo" && sizesWithPromo.has(f.key);
              return (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`group relative flex items-center justify-center gap-2.5 rounded-2xl text-base md:text-lg font-bold font-display tracking-wide transition-all duration-300 ease-out
                    ${f.key === "promo"
                      ? "px-7 py-4 md:px-9 md:py-5"
                      : "px-7 py-4 md:px-10 md:py-5 min-w-[4rem] md:min-w-[5rem]"
                    }
                    ${isActive
                      ? f.key === "promo"
                        ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25 scale-[1.02]"
                        : "bg-foreground text-background shadow-lg shadow-foreground/20 scale-[1.02]"
                      : "bg-card text-foreground border border-border/60 shadow-[var(--shadow-product)] hover:border-foreground/20 hover:shadow-[var(--shadow-md)] hover:scale-[1.03] active:scale-[0.98]"
                    }`}
                >
                  {f.icon}
                  <span>{f.label}</span>
                  {/* Subtle promo dot indicator */}
                  {hasPromo && !isActive && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-accent shadow-sm shadow-accent/40" />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </FadeInSection>

      {/* Promoções da Semana dedicated section (always visible if products exist) */}
      {activeFilter !== "promo" && promoProducts.length > 0 && (
        <ProductSection
          title="Promoções da Semana 🔥"
          icon={<Tag className="h-5 w-5 text-accent" />}
          products={promoProducts}
        />
      )}

      {/* Filtered Products */}
      {!isLoading && filteredProducts.length > 0 && (
        <FadeInSection>
          <section className="container pb-10 md:pb-14">
            <div className="flex items-center gap-2 mb-6">
              {activeFilter === "promo" ? (
                <Flame className="h-5 w-5 text-accent" />
              ) : activeFilter !== "todos" ? (
                <Sparkles className="h-5 w-5 text-accent" />
              ) : null}
              <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
                {activeFilter === "todos"
                  ? "Todos os Produtos"
                  : activeFilter === "promo"
                  ? "Promoções da Semana 🔥"
                  : `Tamanho ${activeFilter}`}
              </h2>
              <span className="text-sm text-muted-foreground">({filteredProducts.length})</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3">
              {filteredProducts.map((product, i) => (
                <FadeInSection key={product.id} delay={i * 40} className="h-full">
                  <ProductCard product={product} index={i} />
                </FadeInSection>
              ))}
            </div>
          </section>
        </FadeInSection>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <section className="container pb-10 md:pb-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-card rounded-lg overflow-hidden animate-pulse">
                <div className="aspect-[3/4] bg-secondary" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-secondary rounded w-1/3" />
                  <div className="h-4 bg-secondary rounded w-2/3" />
                  <div className="h-5 bg-secondary rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!isLoading && filteredProducts.length === 0 && (
        <section className="container pb-10 md:pb-14">
          <p className="text-muted-foreground text-center py-10">Nenhum produto disponível para este filtro.</p>
        </section>
      )}
    </div>
  );
};

export default Index;
