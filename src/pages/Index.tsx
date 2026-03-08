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

  const sizeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    SIZES.forEach((s) => {
      counts[s] = countBySize(allProducts, s);
    });
    return counts;
  }, [allProducts]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === "todos") return allProducts;
    if (activeFilter === "promo") return promoProducts;
    return filterBySize(allProducts, activeFilter);
  }, [allProducts, promoProducts, activeFilter]);

  const filters: { key: FilterKey; label: string; count: number; icon?: React.ReactNode }[] = [
    { key: "todos", label: "Todos", count: allProducts.length },
    ...SIZES.map((s) => ({ key: s as FilterKey, label: s, count: sizeCounts[s] || 0 })),
    { key: "promo", label: "Promoções", count: promoProducts.length, icon: <Flame className="h-3.5 w-3.5" /> },
  ];

  return (
    <div>
      {/* Hero Carousel */}
      <FadeInSection>
        <HeroCarousel />
      </FadeInSection>

      {/* Size / Promo Filter Buttons */}
      <FadeInSection>
        <section className="container py-8 md:py-12">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-5">Filtrar por tamanho</h2>
          <div className="flex flex-wrap gap-2 md:gap-3">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`group flex items-center gap-2 rounded-xl px-4 py-2.5 md:px-5 md:py-3 shadow-product hover:shadow-elevated hover:scale-[1.03] transition-all duration-300 border text-sm md:text-base font-semibold font-display ${
                  activeFilter === f.key
                    ? "bg-accent text-accent-foreground border-accent/60 shadow-elevated"
                    : "bg-card text-foreground border-border/50 hover:border-accent/40"
                }`}
              >
                {f.icon}
                <span>{f.label}</span>
                <span className={`text-xs font-normal rounded-full px-2 py-0.5 ${
                  activeFilter === f.key
                    ? "bg-accent-foreground/20 text-accent-foreground"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {f.count}
                </span>
              </button>
            ))}
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
