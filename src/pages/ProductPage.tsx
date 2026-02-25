import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { Star, ShoppingBag, Minus, Plus, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useProduct, useProducts, useReviews, formatCurrency, getInstallments, getTotalStock, getProductPrice, getDiscount } from "@/hooks/useSupabaseData";
import { useCart } from "@/contexts/CartContext";
import { ProductCard } from "@/components/ProductCard";
import { useToast } from "@/hooks/use-toast";

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useProduct(slug || "");
  const { addItem } = useCart();
  const { toast } = useToast();
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [currentImage, setCurrentImage] = useState(0);

  // Reset state when slug changes
  useEffect(() => { setSelectedSize(""); setQuantity(1); setCurrentImage(0); }, [slug]);

  const { data: reviews = [] } = useReviews(product?.id || "");
  const categorySlug = (product?.category as any)?.slug;
  const { data: related = [] } = useProducts({ categorySlug, limit: 4 });

  // Promo countdown
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    if (!product?.is_promo || !product.promo_end_date) return;
    const update = () => {
      const diff = new Date(product.promo_end_date!).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Encerrada"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${d > 0 ? d + "d " : ""}${h}h ${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [product?.promo_end_date, product?.is_promo]);

  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-[3/4] bg-secondary rounded-lg animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 bg-secondary rounded w-1/4" />
            <div className="h-8 bg-secondary rounded w-3/4" />
            <div className="h-10 bg-secondary rounded w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">Produto não encontrado</h1>
      </div>
    );
  }

  const totalStock = getTotalStock(product.product_variants);
  const currentPrice = getProductPrice(product);
  const discount = getDiscount(product);
  const variants = product.product_variants || [];
  const images = (product.product_images || []).sort((a, b) => (a.position || 0) - (b.position || 0));
  const imageUrl = images[currentImage]?.url || "/placeholder.svg";
  const sizeStock = variants.find((v) => v.size === selectedSize)?.stock || 0;
  const categoryName = (product.category as any)?.name || "";
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  const filteredRelated = related.filter((p) => p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast({ title: "Selecione um tamanho", variant: "destructive" });
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: images[0]?.url || "/placeholder.svg",
      price: currentPrice,
      originalPrice: product.price,
      isPromo: product.is_promo,
      size: selectedSize,
      maxStock: sizeStock,
      quantity,
    });
    toast({ title: "Adicionado ao carrinho! 🛒" });
  };

  return (
    <div className="container py-6 md:py-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* Image Gallery */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] bg-secondary rounded-lg overflow-hidden">
            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
            {discount > 0 && (
              <span className="absolute top-3 left-3 bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-sm">-{discount}%</span>
            )}
            {images.length > 1 && (
              <>
                <button onClick={() => setCurrentImage((p) => (p - 1 + images.length) % images.length)} className="absolute left-2 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm rounded-full p-1.5">
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
                <button onClick={() => setCurrentImage((p) => (p + 1) % images.length)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/80 backdrop-blur-sm rounded-full p-1.5">
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setCurrentImage(i)} className={`w-16 h-20 rounded-md overflow-hidden flex-shrink-0 border-2 ${currentImage === i ? "border-accent" : "border-transparent"}`}>
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{categoryName}</p>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">{product.name}</h1>

          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-4 w-4 ${star <= Math.round(avgRating) ? "fill-warning text-warning" : "text-border"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} ({reviews.length} avaliações)</span>
            </div>
          )}

          {product.sold_count > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mb-4">🔥 {product.sold_count} vendidos</span>
          )}

          <div className="mb-4">
            {product.is_promo && product.promo_price && (
              <p className="text-sm text-muted-foreground line-through">{formatCurrency(product.price)}</p>
            )}
            <p className="text-3xl font-display font-bold text-foreground">{formatCurrency(currentPrice)}</p>
            <p className="text-sm text-muted-foreground mt-1">{getInstallments(currentPrice, product.installment_count || 3)}</p>
          </div>

          {product.is_promo && product.promo_end_date && timeLeft && (
            <div className="flex items-center gap-2 bg-accent/10 text-accent rounded-lg px-3 py-2 mb-4">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold">{timeLeft === "Encerrada" ? "Promoção encerrada" : `Termina em ${timeLeft}`}</span>
            </div>
          )}

          {totalStock <= 5 && totalStock > 0 && (
            <p className="text-xs text-warning font-semibold mb-4">⚡ Últimas {totalStock} unidades!</p>
          )}

          <div className="mb-6">
            <p className="text-sm font-medium text-foreground mb-2">Tamanho</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button key={v.id} disabled={v.stock <= 0} onClick={() => { setSelectedSize(v.size); setQuantity(1); }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    selectedSize === v.size ? "bg-primary text-primary-foreground border-primary"
                      : v.stock > 0 ? "bg-card text-foreground border-border hover:border-primary"
                        : "bg-muted text-muted-foreground border-border opacity-50 cursor-not-allowed line-through"
                  }`}>
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {selectedSize && (
            <div className="flex items-center gap-3 mb-6">
              <p className="text-sm font-medium text-foreground">Quantidade</p>
              <div className="flex items-center border rounded-lg">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 text-muted-foreground hover:text-foreground"><Minus className="h-4 w-4" /></button>
                <span className="px-4 text-sm font-medium text-foreground">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(sizeStock, quantity + 1))} className="p-2 text-muted-foreground hover:text-foreground"><Plus className="h-4 w-4" /></button>
              </div>
              <span className="text-xs text-muted-foreground">({sizeStock} disponíveis)</span>
            </div>
          )}

          <button onClick={handleAddToCart} className="w-full bg-accent text-accent-foreground font-display font-semibold py-3.5 rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm">
            <ShoppingBag className="h-5 w-5" /> Adicionar ao carrinho
          </button>

          <div className="mt-8 pt-6 border-t">
            <h3 className="font-display font-semibold text-foreground mb-2">Descrição</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-display font-semibold text-foreground mb-4">Avaliações ({reviews.length})</h3>
              <div className="space-y-4">
                {reviews.slice(0, 5).map((r) => (
                  <div key={r.id} className="bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-warning text-warning" : "text-border"}`} />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">{(r as any).profile?.name || "Anônimo"}</span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {filteredRelated.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display font-bold text-xl text-foreground mb-6">Produtos relacionados</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {filteredRelated.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
