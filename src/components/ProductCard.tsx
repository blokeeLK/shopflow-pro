import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Product, formatCurrency, getInstallments, getTotalStock } from "@/data/store";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const totalStock = getTotalStock(product);
  if (totalStock <= 0) return null;

  const currentPrice = product.isPromo && product.promoPrice ? product.promoPrice : product.price;
  const discount = product.isPromo && product.promoPrice
    ? Math.round(((product.price - product.promoPrice) / product.price) * 100)
    : 0;

  return (
    <Link
      to={`/produto/${product.slug}`}
      className="group block bg-card rounded-lg overflow-hidden shadow-product hover:shadow-elevated transition-all duration-300"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Image */}
      <div className="relative aspect-[3/4] bg-secondary overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discount > 0 && (
            <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm">
              -{discount}%
            </span>
          )}
          {totalStock <= 5 && (
            <span className="bg-warning text-warning-foreground text-[10px] font-bold px-2 py-0.5 rounded-sm">
              Últimas unidades
            </span>
          )}
        </div>
        {product.sold > 0 && (
          <span className="absolute top-2 right-2 bg-primary/80 text-primary-foreground text-[10px] font-medium px-2 py-0.5 rounded-sm backdrop-blur-sm">
            {product.sold} vendidos
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 md:p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{product.category}</p>
        <h3 className="font-display font-semibold text-sm md:text-base text-foreground line-clamp-2 mb-2 leading-tight">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <Star className="h-3 w-3 fill-warning text-warning" />
          <span className="text-xs font-medium text-foreground">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviewCount})</span>
        </div>

        {/* Price */}
        <div className="space-y-0.5">
          {product.isPromo && product.promoPrice && (
            <p className="text-xs text-muted-foreground line-through">{formatCurrency(product.price)}</p>
          )}
          <p className="text-lg font-display font-bold text-foreground">
            {formatCurrency(currentPrice)}
          </p>
          <p className="text-xs text-muted-foreground">{getInstallments(currentPrice)}</p>
        </div>
      </div>
    </Link>
  );
}
