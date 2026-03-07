import { Link } from "react-router-dom";
import { ArrowRight, Flame, Tag } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, useCategoriesWithStock, DbProduct } from "@/hooks/useSupabaseData";
import { HeroCarousel } from "@/components/HeroCarousel";
import { FadeInSection } from "@/components/FadeInSection";
import { useMemo } from "react";

/** Filter products that have stock in a given size */
function filterBySize(products: DbProduct[], size: string): DbProduct[] {
  return products.filter((p) =>
    p.product_variants?.some((v) => v.size.toUpperCase() === size.toUpperCase() && v.stock > 0)
  );
}

/** Filter products that are on promo */
function filterPromo(products: DbProduct[]): DbProduct[] {
  return products.filter((p) => p.is_promo && p.promo_price != null && p.promo_price < p.price);
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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

const SIZES = [
  { label: "Tamanho P", size: "P" },
  { label: "Tamanho M", size: "M" },
  { label: "Tamanho G", size: "G" },
  { label: "Tamanho GG", size: "GG" },
] as const;

const Index = () => {
  const { data: allProducts = [], isLoading } = useProducts();
  const { data: categoriesWithStock = [] } = useCategoriesWithStock();

  const promoProducts = useMemo(() => filterPromo(allProducts), [allProducts]);
  const sizeGroups = useMemo(
    () => SIZES.map((s) => ({ ...s, products: filterBySize(allProducts, s.size) })),
    [allProducts]
  );

  return (
    <div>
      {/* Hero Carousel */}
      <FadeInSection>
        <HeroCarousel />
      </FadeInSection>

      {/* Categories */}
      {categoriesWithStock.length > 0 && (
        <FadeInSection>
          <section className="container py-10 md:py-14">
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-6">Categorias</h2>
            <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              {categoriesWithStock.map((cat, i) => (
                <FadeInSection key={cat.slug} delay={i * 80}>
                  <Link
                    to={`/categoria/${cat.slug}`}
                    className="group flex items-center gap-2.5 bg-card rounded-xl px-5 py-3.5 md:px-6 md:py-4 shadow-product hover:shadow-elevated hover:scale-[1.03] transition-all duration-300 border border-border/50 hover:border-accent/40 min-w-[140px] justify-center"
                  >
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors shrink-0" />
                    <h3 className="font-display font-semibold text-sm md:text-base text-foreground group-hover:text-accent transition-colors whitespace-nowrap">
                      {cat.name}
                    </h3>
                  </Link>
                </FadeInSection>
              ))}
            </div>
          </section>
        </FadeInSection>
      )}

      {/* Promoções da semana */}
      <ProductSection
        title="Promoções da semana 🔥"
        icon={<Tag className="h-5 w-5 text-accent" />}
        products={promoProducts}
      />

      {/* Size sections */}
      {sizeGroups.map((group, gi) => (
        <ProductSection
          key={group.size}
          title={group.label}
          products={group.products}
          sectionDelay={0}
        />
      ))}

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
      {!isLoading && allProducts.length === 0 && (
        <section className="container pb-10 md:pb-14">
          <p className="text-muted-foreground text-center py-10">Nenhum produto disponível no momento.</p>
        </section>
      )}
    </div>
  );
};

export default Index;
