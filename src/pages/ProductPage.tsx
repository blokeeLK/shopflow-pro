import { useParams } from "react-router-dom";
import { useState } from "react";
import { Star, ShoppingBag, Minus, Plus, Clock } from "lucide-react";
import { getProductBySlug, formatCurrency, getInstallments, getTotalStock } from "@/data/store";
import { useCart } from "@/contexts/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/store";
import { useToast } from "@/hooks/use-toast";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const product = getProductBySlug(slug || "");
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Produto não encontrado</h1>
      </div>
    );
  }

  const totalStock = getTotalStock(product);
  const currentPrice = product.isPromo && product.promoPrice ? product.promoPrice : product.price;
  const discount = product.isPromo && product.promoPrice
    ? Math.round(((product.price - product.promoPrice) / product.price) * 100)
    : 0;

  const sizeStock = product.sizes.find((s) => s.size === selectedSize)?.stock || 0;

  const related = products
    .filter((p) => p.categorySlug === product.categorySlug && p.id !== product.id && getTotalStock(p) > 0)
    .slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({ title: "Selecione um tamanho", variant: "destructive" });
      return;
    }
    addItem(product, selectedSize, quantity);
    toast({ title: "Adicionado ao carrinho! 🛒" });
  };

  return (
    <div className="container py-6 md:py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* Image */}
        <div className="relative aspect-[3/4] bg-secondary rounded-lg overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          {discount > 0 && (
            <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-sm">
              -{discount}%
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{product.category}</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${star <= Math.round(product.rating) ? "fill-warning text-warning" : "text-border"}`}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviewCount} avaliações)
            </span>
          </div>

          {/* Sold badge */}
          {product.sold > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-4">
              🔥 {product.sold} vendidos
            </span>
          )}

          {/* Price */}
          <div className="mb-4">
            {product.isPromo && product.promoPrice && (
              <p className="text-sm text-muted-foreground line-through">{formatCurrency(product.price)}</p>
            )}
            <p className="text-3xl font-display font-bold text-foreground">{formatCurrency(currentPrice)}</p>
            <p className="text-sm text-muted-foreground mt-1">{getInstallments(currentPrice)}</p>
          </div>

          {/* Promo timer */}
          {product.isPromo && product.promoEndDate && (
            <div className="flex items-center gap-2 bg-accent/10 text-accent rounded-lg px-3 py-2 mb-4">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold">Promoção por tempo limitado!</span>
            </div>
          )}

          {/* Low stock warning */}
          {totalStock <= 5 && (
            <p className="text-xs text-warning font-semibold mb-4">⚡ Últimas {totalStock} unidades!</p>
          )}

          {/* Size selection */}
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground mb-2">Tamanho</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s.size}
                  disabled={s.stock <= 0}
                  onClick={() => { setSelectedSize(s.size); setQuantity(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedSize === s.size
                      ? "bg-primary text-primary-foreground border-primary"
                      : s.stock > 0
                        ? "bg-card text-foreground border-border hover:border-primary"
                        : "bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed line-through"
                  }`}
                >
                  {s.size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          {selectedSize && (
            <div className="flex items-center gap-3 mb-6">
              <p className="text-sm font-medium text-foreground">Quantidade</p>
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 text-sm font-medium text-foreground">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(sizeStock, quantity + 1))}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-xs text-muted-foreground">({sizeStock} disponíveis)</span>
            </div>
          )}

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-accent text-accent-foreground font-display font-semibold py-3.5 rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <ShoppingBag className="h-5 w-5" />
            Adicionar ao carrinho
          </button>

          {/* Description */}
          <div className="mt-8 pt-6 border-t">
            <h3 className="font-display font-semibold text-foreground mb-2">Descrição</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display font-bold text-xl text-foreground mb-6">Produtos relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
