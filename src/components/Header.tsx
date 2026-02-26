import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, Search, User, Package } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import { useCategoriesWithStock } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, getProductPrice } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  promo_price: number | null;
  is_promo: boolean;
  image?: string;
}

interface OrderResult {
  id: string;
  status: string;
  tracking_code: string | null;
  created_at: string;
  total: number;
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [orderResults, setOrderResults] = useState<OrderResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTab, setSearchTab] = useState<"products" | "orders">("products");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const { totalItems } = useCart();
  const { data: categories = [] } = useCategoriesWithStock();

  // Close search on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Focus input when search opens
  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setOrderResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);

      if (searchTab === "products") {
        const { data } = await supabase
          .from("products")
          .select("id, name, slug, price, promo_price, is_promo, product_images(url, position)")
          .eq("active", true)
          .ilike("name", `%${searchQuery.trim()}%`)
          .limit(6);

        if (data) {
          setSearchResults(
            data.map((p: any) => ({
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              promo_price: p.promo_price,
              is_promo: p.is_promo,
              image: p.product_images?.sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0]?.url,
            }))
          );
        }
      } else if (searchTab === "orders" && user) {
        const query = searchQuery.trim();
        const { data } = await supabase
          .from("orders")
          .select("id, status, tracking_code, created_at, total")
          .or(`tracking_code.ilike.%${query}%,id.ilike.%${query}%`)
          .order("created_at", { ascending: false })
          .limit(5);

        setOrderResults(data || []);
      }

      setSearching(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchTab, user]);

  const handleResultClick = (slug: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    navigate(`/produto/${slug}`);
  };

  return (
    <>
      <div className="bg-destructive text-destructive-foreground text-center text-xs py-2 px-4 font-semibold">
        🔥 FRETE GRÁTIS para Pará de Minas - MG · Compra 100% segura · Parcele em até 3x
      </div>

      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b">
        <div className="container flex items-center justify-between h-14 md:h-16">
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 -ml-2 text-foreground" aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex items-center">
            <img src="/images/logo-shopflow.png" alt="ShopFlow" className="h-9 md:h-11 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {categories.map((cat) => (
              <Link key={cat.slug} to={`/categoria/${cat.slug}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {cat.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div ref={searchRef} className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" />
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-card border rounded-lg shadow-xl z-50 overflow-hidden">
                  {user && (
                    <div className="flex border-b">
                      <button
                        onClick={() => { setSearchTab("products"); setSearchQuery(""); }}
                        className={`flex-1 text-xs font-medium py-2.5 transition-colors ${searchTab === "products" ? "text-accent border-b-2 border-accent" : "text-muted-foreground"}`}
                      >
                        Produtos
                      </button>
                      <button
                        onClick={() => { setSearchTab("orders"); setSearchQuery(""); }}
                        className={`flex-1 text-xs font-medium py-2.5 transition-colors flex items-center justify-center gap-1 ${searchTab === "orders" ? "text-accent border-b-2 border-accent" : "text-muted-foreground"}`}
                      >
                        <Package className="h-3.5 w-3.5" /> Rastrear Pedido
                      </button>
                    </div>
                  )}
                  <div className="p-3 border-b">
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={searchTab === "products" ? "Buscar produtos..." : "Código de rastreio ou nº do pedido..."}
                      className="w-full bg-secondary rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setSearchOpen(false);
                      }}
                    />
                  </div>

                  {searching && (
                    <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
                  )}

                  {/* Products tab */}
                  {searchTab === "products" && !searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">Nenhum produto encontrado</div>
                  )}

                  {searchTab === "products" && searchResults.length > 0 && (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => handleResultClick(r.slug)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-secondary/50 transition-colors text-left"
                        >
                          <img
                            src={r.image || "/placeholder.svg"}
                            alt={r.name}
                            className="w-12 h-14 object-cover rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                            <p className="text-sm font-display font-bold text-foreground">
                              {formatCurrency(getProductPrice(r))}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Orders tab */}
                  {searchTab === "orders" && !searching && searchQuery.trim().length >= 2 && orderResults.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">Nenhum pedido encontrado</div>
                  )}

                  {searchTab === "orders" && orderResults.length > 0 && (
                    <div className="max-h-80 overflow-y-auto">
                      {orderResults.map((o) => {
                        const statusLabels: Record<string, string> = {
                          criado: "Criado", aguardando_pagamento: "Aguardando", pago: "Pago",
                          separando: "Separando", enviado: "Enviado", entregue: "Entregue", cancelado: "Cancelado",
                        };
                        const statusColors: Record<string, string> = {
                          criado: "bg-muted text-muted-foreground", pago: "bg-green-100 text-green-700",
                          enviado: "bg-blue-100 text-blue-700", entregue: "bg-green-200 text-green-800",
                          cancelado: "bg-destructive/10 text-destructive",
                        };
                        return (
                          <div key={o.id} className="p-3 border-b last:border-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-mono text-muted-foreground">#{o.id.slice(0, 8)}</p>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[o.status] || "bg-muted text-muted-foreground"}`}>
                                {statusLabels[o.status] || o.status}
                              </span>
                            </div>
                            <p className="text-sm font-display font-bold text-foreground">{formatCurrency(Number(o.total))}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                            {o.tracking_code && o.tracking_code.length > 1 && (
                              <a
                                href={`https://www.linkcorreios.com.br/?id=${o.tracking_code}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
                              >
                                <Package className="h-3 w-3" /> Rastrear: {o.tracking_code}
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Link to="/conta" className="p-2 text-muted-foreground hover:text-foreground transition-colors" aria-label="Conta">
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
