import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { DbProduct, formatCurrency, getInstallments, getTotalStock, getProductPrice, getDiscount } from "@/hooks/useSupabaseData";

interface ProductCardProps {
  product: DbProduct;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const totalStock = getTotalStock(product.product_variants);
  if (totalStock <= 0) return null;

  const currentPrice = getProductPrice(product);
  const discount = getDiscount(product);
  const image = product.product_images?.sort((a, b) => (a.position || 0) - (b.position || 0))[0]?.url || "/placeholder.svg";
  const categoryName = (product.category as any)?.name || "";

  return (
    <Link
      to={`/produto/${product.slug}`}
      className="group block bg-card rounded-lg overflow-hidden shadow-product hover:shadow-elevated transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
        <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm">-{discount}%</span>
          )}
          {totalStock <= 5 && (
            <span className="bg-warning text-warning-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm">Últimas unidades</span>
          )}
        </div>
        {product.sold_count > 0 && (
          <span className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-sm backdrop-blur-sm">
            {product.sold_count} vendidos
          </span>
        )}
      </div>

      <div className="p-3 md:p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{categoryName}</p>
        <h3 className="font-display font-semibold text-sm md:text-base text-foreground line-clamp-2 mb-2 leading-tight">{product.name}</h3>

        <div className="space-y-0.5">
          {product.is_promo && product.promo_price && (
            <p className="text-xs text-muted-foreground line-through">{formatCurrency(product.price)}</p>
          )}
          <p className="text-lg font-display font-bold text-foreground">{formatCurrency(currentPrice)}</p>
          <p className="text-xs text-muted-foreground">{getInstallments(currentPrice, product.installment_count || 3)}</p>
        </div>
      </div>
    </Link>
  );
}
