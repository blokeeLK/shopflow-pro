import { useParams } from "react-router-dom";
import { useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { getProductsByCategory, categories } from "@/data/store";

type SortOption = "price-asc" | "price-desc" | "best-sellers";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const category = categories.find((c) => c.slug === slug);
  const [sort, setSort] = useState<SortOption>("best-sellers");

  if (!category) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Categoria não encontrada</h1>
      </div>
    );
  }

  let prods = getProductsByCategory(category.slug);

  if (sort === "price-asc") {
    prods = [...prods].sort((a, b) => (a.promoPrice || a.price) - (b.promoPrice || b.price));
  } else if (sort === "price-desc") {
    prods = [...prods].sort((a, b) => (b.promoPrice || b.price) - (a.promoPrice || a.price));
  } else {
    prods = [...prods].sort((a, b) => b.sold - a.sold);
  }

  return (
    <div className="container py-6 md:py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{category.name}</h1>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="text-sm bg-card border rounded-lg px-3 py-2 text-foreground"
        >
          <option value="best-sellers">Mais vendidos</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
        </select>
      </div>

      {prods.length === 0 ? (
        <p className="text-muted-foreground text-center py-20">Nenhum produto disponível nesta categoria.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {prods.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
