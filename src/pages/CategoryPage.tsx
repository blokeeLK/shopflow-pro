import { useParams, useSearchParams } from "react-router-dom";
import { useState, useMemo } from "react";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, useCategories, DbProduct, getProductPrice } from "@/hooks/useSupabaseData";

type SortOption = "price-asc" | "price-desc" | "best-sellers";
const SIZES = ["P", "M", "G", "GG"] as const;

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: categories = [] } = useCategories();
  const { data: products = [], isLoading } = useProducts({ categorySlug: slug });
  const [sort, setSort] = useState<SortOption>("best-sellers");

  const sizeFilter = searchParams.get("tamanho")?.toUpperCase() || "";
  const category = categories.find((c) => c.slug === slug);

  // Available sizes in this category
  const availableSizes = useMemo(() => {
    const sizes = new Set<string>();
    products.forEach(p => {
      p.product_variants?.forEach(v => {
        if (v.stock > 0) sizes.add(v.size.toUpperCase());
      });
    });
    return SIZES.filter(s => sizes.has(s));
  }, [products]);

  const sorted = useMemo(() => {
    let arr = [...products];
    if (sizeFilter && SIZES.includes(sizeFilter as any)) {
      arr = arr.filter(p =>
        p.product_variants?.some(v => v.size.toUpperCase() === sizeFilter && v.stock > 0)
      );
    }
    if (sort === "price-asc") arr.sort((a, b) => getProductPrice(a) - getProductPrice(b));
    else if (sort === "price-desc") arr.sort((a, b) => getProductPrice(b) - getProductPrice(a));
    else arr.sort((a, b) => b.sold_count - a.sold_count);
    return arr;
  }, [products, sort, sizeFilter]);

  const handleSizeFilter = (size: string) => {
    if (size === sizeFilter) {
      searchParams.delete("tamanho");
    } else {
      searchParams.set("tamanho", size);
    }
    setSearchParams(searchParams);
  };

  if (!isLoading && !category) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Categoria não encontrada</h1>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{category?.name || "..."}</h1>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="text-sm bg-card border rounded-lg px-3 py-2 text-foreground">
          <option value="best-sellers">Mais vendidos</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
        </select>
      </div>

      {availableSizes.length > 0 && (
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground mr-1">Tamanho:</span>
          {availableSizes.map(size => (
            <button
              key={size}
              onClick={() => handleSizeFilter(size)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                sizeFilter === size
                  ? "bg-accent text-accent-foreground"
                  : "bg-card border text-foreground hover:bg-secondary"
              }`}
            >
              {size}
            </button>
          ))}
          {sizeFilter && (
            <button
              onClick={() => { searchParams.delete("tamanho"); setSearchParams(searchParams); }}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-1"
            >
              Limpar
            </button>
          )}
        </div>
      )}

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
