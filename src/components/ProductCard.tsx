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
      <div className="relative aspect-[4/5] bg-secondary overflow-hidden">
        <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
          {discount > 0 && (
            <span className="bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm">-{discount}%</span>
          )}
          {totalStock <= 5 && (
            <span className="bg-warning text-warning-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm">Últimas un.</span>
          )}
        </div>
        <span className="absolute top-1.5 right-1.5 bg-accent text-accent-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
          {product.sold_count} Vendidos
        </span>
      </div>

      <div className="p-2 md:p-3">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{categoryName}</p>
        <h3 className="font-display font-semibold text-xs md:text-sm text-foreground line-clamp-2 mb-1.5 leading-tight">{product.name}</h3>

        <div className="space-y-0">
          {product.is_promo && product.promo_price && (
            <p className="text-[10px] text-muted-foreground line-through">{formatCurrency(product.price)}</p>
          )}
          <p className="text-base font-display font-bold text-foreground">{formatCurrency(currentPrice)}</p>
          <p className="text-[10px] text-muted-foreground">{getInstallments(currentPrice, product.installment_count || 3)}</p>
        </div>
      </div>
    </Link>
  );
}
