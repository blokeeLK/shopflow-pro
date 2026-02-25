import { Link } from "react-router-dom";
import { ShoppingBag, Menu, X, Search, User } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useCategoriesWithStock } from "@/hooks/useSupabaseData";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const { data: categories = [] } = useCategoriesWithStock();

  return (
    <>
      <div className="bg-primary text-primary-foreground text-center text-xs py-2 px-4 font-body">
        🔥 <span className="font-semibold">FRETE GRÁTIS</span> em compras acima de R$ 299
      </div>

      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b">
        <div className="container flex items-center justify-between h-14 md:h-16">
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 -ml-2 text-foreground" aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="font-display font-bold text-xl md:text-2xl tracking-tight text-foreground">
            LOJA<span className="text-accent">.</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {categories.map((cat) => (
              <Link key={cat.slug} to={`/categoria/${cat.slug}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Buscar">
              <Search className="h-5 w-5" />
            </button>
            <Link to="/conta" className="p-2 text-muted-foreground hover:text-foreground transition-colors hidden md:block" aria-label="Conta">
              <User className="h-5 w-5" />
            </Link>
            <Link to="/carrinho" className="relative p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Carrinho">
              <ShoppingBag className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {menuOpen && (
          <nav className="md:hidden bg-card border-t animate-fade-in-up">
            <div className="container py-4 flex flex-col gap-3">
              {categories.map((cat) => (
                <Link key={cat.slug} to={`/categoria/${cat.slug}`} onClick={() => setMenuOpen(false)} className="text-sm font-medium text-foreground py-2 border-b border-border last:border-0">
                  {cat.name}
                </Link>
              ))}
              <Link to="/conta" onClick={() => setMenuOpen(false)} className="text-sm font-medium text-foreground py-2 flex items-center gap-2">
                <User className="h-4 w-4" /> Minha Conta
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
