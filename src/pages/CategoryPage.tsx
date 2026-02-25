import { useParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, useCategories, DbProduct, getProductPrice } from "@/hooks/useSupabaseData";

type SortOption = "price-asc" | "price-desc" | "best-sellers";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts({ categorySlug: slug });
  const [sort, setSort] = useState<SortOption>("best-sellers");

  const category = categories.find((c) => c.slug === slug);

  const sorted = useMemo(() => {
    const arr = [...products];
    if (sort === "price-asc") arr.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    else if (sort === "price-desc") arr.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    else arr.sort((a, b) => b.sold_count - a.sold_count);
    return arr;
  }, [products, sort]);

  if (!isLoading && !category) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Categoria não encontrada</h1>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{category?.name || "..."}</h1>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="text-sm bg-card border rounded-lg px-3 py-2 text-foreground">
          <option value="best-sellers">Mais vendidos</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
        </select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-card rounded-lg overflow-hidden animate-pulse">
              <div className="aspect-[3/4] bg-secondary" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-secondary rounded w-1/3" />
                <div className="h-4 bg-secondary rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-muted-foreground text-center py-20">Nenhum produto disponível nesta categoria.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {sorted.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
