import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";

const FREE_SHIPPING_THRESHOLD = 130;

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const remainingForFree = Math.max(FREE_SHIPPING_THRESHOLD - subtotal, 0);

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mb-6">Explore nossos produtos e encontre algo especial!</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-display font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors">
          Continuar comprando
        </Link>
      </div>
    );
  }

  const handleCheckout = () => {
    if (!user) {
      navigate("/login?redirect=/checkout");
    } else {
      navigate("/checkout");
    }
  };

  return (
    <div className="container py-6 md:py-10">
      <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6">Carrinho</h1>

      <div className="bg-card rounded-lg border p-4 mb-6">
        {remainingForFree > 0 ? (
          <p className="text-xs text-muted-foreground mb-2">
            Falta <span className="font-semibold text-foreground">{formatCurrency(remainingForFree)}</span> para frete grátis!
          </p>
        ) : (
          <p className="text-xs font-semibold mb-2" style={{color: 'hsl(var(--accent))'}}>🎉 Você ganhou frete grátis!</p>
        )}
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${shippingProgress}%` }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          🚚 Frete grátis acima de R$ 130 ou para Pará de Minas - MG
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          {items.map((item) => (
            <div key={`${item.productId}-${item.size}`} className="bg-card rounded-lg border p-4 flex gap-4">
              <Link to={`/produto/${item.slug}`} className="w-20 h-24 bg-secondary rounded-md overflow-hidden flex-shrink-0">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/produto/${item.slug}`} className="font-display font-semibold text-sm text-foreground line-clamp-1 hover:underline">
                  {item.name}
                </Link>
                <p className="text-xs text-muted-foreground mt-0.5">Tamanho: {item.size}</p>
                {item.isPromo && (
                  <p className="text-xs text-muted-foreground line-through">{formatCurrency(item.originalPrice)}</p>
                )}
                <p className="font-display font-bold text-foreground mt-1">{formatCurrency(item.price)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)} className="p-1.5 text-muted-foreground hover:text-foreground">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-xs font-medium text-foreground">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)} className="p-1.5 text-muted-foreground hover:text-foreground">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button onClick={() => removeItem(item.productId, item.size)} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-lg border p-6 h-fit sticky top-20">
          <h2 className="font-display font-bold text-foreground mb-4">Resumo</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Frete</span><span>{remainingForFree <= 0 ? "Grátis*" : "Calcular no checkout"}</span></div>
          </div>
          <div className="border-t mt-4 pt-4 flex justify-between font-display font-bold text-foreground">
            <span>Total</span><span>{formatCurrency(subtotal)}</span>
          </div>
          <button onClick={handleCheckout} className="w-full mt-4 bg-accent text-accent-foreground font-display font-semibold py-3.5 rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm">
            Finalizar compra <ArrowRight className="h-4 w-4" />
          </button>
          <Link to="/" className="block text-center text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors">Continuar comprando</Link>
        </div>
      </div>
    </div>
  );
}
