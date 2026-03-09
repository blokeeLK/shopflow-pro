import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, X, Search, User, Package, Truck, Shield, CreditCard, Zap, Tag, Heart, Star, Gift, Clock, MapPin, Phone, ChevronDown } from "lucide-react";
import { AccountTooltip } from "@/components/AccountTooltip";
import { useState, useEffect, useRef, useMemo } from "react";
import { useCart } from "@/contexts/CartContext";
import { useCategoriesWithStock, useSiteSettings } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, getProductPrice } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { usePendingPixCount } from "@/hooks/usePendingPixCount";
import { useQuery } from "@tanstack/react-query";

const TOPBAR_ICONS: Record<string, React.ComponentType<any>> = {
  truck: Truck, shield: Shield, "credit-card": CreditCard, zap: Zap,
  tag: Tag, heart: Heart, star: Star, gift: Gift, clock: Clock,
  "map-pin": MapPin, phone: Phone,
};

const SIZES = ["P", "M", "G", "GG"] as const;

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
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const pendingPixCount = usePendingPixCount();

  const { totalItems } = useCart();
  const { data: categories = [] } = useCategoriesWithStock();
  const { data: siteSettings } = useSiteSettings();
  const logoUrl = siteSettings?.site_logo_url || "/images/logo-shopflow.png";

  // Fetch available sizes per category
  const { data: categorySizes = {} } = useQuery({
    queryKey: ["category-sizes", categories.map(c => c.id).join(",")],
    queryFn: async () => {
      if (categories.length === 0) return {};
      const { data, error } = await supabase
        .from("products")
        .select("category_id, product_variants(size, stock)")
        .eq("active", true);
      if (error) throw error;

      const result: Record<string, string[]> = {};
      for (const cat of categories) {
        const catProducts = data?.filter((p: any) => p.category_id === cat.id) || [];
        const availableSizes = new Set<string>();
        catProducts.forEach((p: any) => {
          (p.product_variants as any[])?.forEach((v: any) => {
            if (v.stock > 0) availableSizes.add(v.size.toUpperCase());
          });
        });
        const ordered = SIZES.filter(s => availableSizes.has(s));
        if (ordered.length > 0) result[cat.slug] = ordered;
      }
      return result;
    },
    enabled: categories.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const topbarEnabled = siteSettings?.topbar_enabled !== "false";
  const topbarItems = useMemo(() => {
    try {
      const parsed = JSON.parse(siteSettings?.topbar_items || "[]");
      return (parsed as any[]).filter((i: any) => i.enabled).sort((a: any, b: any) => a.order - b.order);
    } catch { return []; }
  }, [siteSettings?.topbar_items]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

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

  const handleCategoryMouseEnter = (slug: string) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setHoveredCategory(slug);
  };

  const handleCategoryMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => setHoveredCategory(null), 150);
  };

  const handleMobileCategoryTap = (slug: string) => {
    if (expandedMobileCategory === slug) {
      setExpandedMobileCategory(null);
    } else {
      setExpandedMobileCategory(slug);
    }
  };

  return (
    <>
      {topbarEnabled && topbarItems.length > 0 && (
        <div className="bg-white text-black text-xs py-2 px-4 font-semibold">
          <div className="container flex items-center justify-center gap-4 md:gap-6 flex-wrap">
            {topbarItems.map((item: any) => {
              const IconComp = TOPBAR_ICONS[item.icon] || Zap;
              return (
                <span key={item.id} className="flex items-center gap-1.5 whitespace-nowrap">
                  <IconComp className="h-3.5 w-3.5" />
                  {item.text}
                </span>
              );
            })}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-50 bg-[#0a0a14] backdrop-blur-xl border-b border-white/[0.06]">
        <div className="container flex items-center justify-between h-14 md:h-16">
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2.5 -ml-2 text-white hover:text-white/80 transition-all duration-300" aria-label="Menu">
            {menuOpen ? <X className="h-5 w-5" strokeWidth={1.5} /> : <Menu className="h-5 w-5" strokeWidth={1.5} />}
          </button>

          <Link to="/" className="flex items-center">
            <img src={logoUrl} alt="ShopFlow" className="h-10 md:h-12 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-10">
            {categories.map((cat) => {
              const sizes = categorySizes[cat.slug];
              const isHovered = hoveredCategory === cat.slug;
              return (
                <div
                  key={cat.slug}
                  className="relative"
                  onMouseEnter={() => handleCategoryMouseEnter(cat.slug)}
                  onMouseLeave={handleCategoryMouseLeave}
                >
                  <Link
                    to={`/categoria/${cat.slug}`}
                    className="group relative text-[13px] font-semibold text-white hover:text-white/80 transition-all duration-300 flex items-center gap-1.5 tracking-[0.2em] uppercase py-1"
                  >
                    {cat.name}
                    {sizes && sizes.length > 0 && (
                      <ChevronDown className={`h-3 w-3 opacity-60 transition-all duration-300 ${isHovered ? "rotate-180 opacity-90" : ""}`} strokeWidth={1.5} />
                    )}
                    <span className={`absolute -bottom-px left-0 h-[1.5px] bg-white transition-all duration-300 ease-out ${isHovered ? "w-full" : "w-0"}`} />
                  </Link>

                  {/* Dropdown */}
                  {isHovered && sizes && sizes.length > 0 && (
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-full pt-4 z-50"
                      onMouseEnter={() => handleCategoryMouseEnter(cat.slug)}
                      onMouseLeave={handleCategoryMouseLeave}
                    >
                      <div className="bg-white border border-border/20 shadow-[0_20px_60px_-15px_hsl(220_20%_6%/0.25)] py-4 min-w-[200px] animate-in fade-in-0 slide-in-from-top-2 duration-300">
                        <Link
                          to={`/categoria/${cat.slug}`}
                          className="block px-8 py-2.5 text-[11px] font-semibold text-foreground/80 hover:text-foreground hover:bg-secondary/30 transition-all duration-300 tracking-[0.18em] uppercase"
                        >
                          Ver todos
                        </Link>
                        <div className="mx-6 border-t border-border/20 my-2" />
                        {sizes.map(size => (
                          <Link
                            key={size}
                            to={`/categoria/${cat.slug}?tamanho=${size}`}
                            className="block px-8 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-all duration-300 tracking-[0.18em] uppercase"
                          >
                            Tamanho {size}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <Link to="/atacado" className="relative group">
              <span className="absolute -top-2.5 -right-3 bg-yellow-400 text-[8px] font-bold text-black px-1.5 py-0.5 rounded-sm tracking-wide uppercase leading-none z-10 shadow-sm">
                PREÇO DE FÁBRICA
              </span>
              <span className="flex items-center gap-1.5 bg-[#25d366] text-white text-[12px] font-bold px-4 py-2 rounded-full tracking-[0.15em] uppercase shadow-md transition-all duration-300 hover:scale-105 hover:shadow-[0_0_16px_rgba(37,211,102,0.4)] animate-[atacado-pulse_7s_ease-in-out_infinite]">
                📦 ATACADO
              </span>
            </Link>
          </nav>

          <div className="flex items-center gap-1.5">
            <div ref={searchRef} className="relative">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 text-white hover:text-white/70 transition-all duration-300"
                aria-label="Buscar"
              >
                <Search className="h-5 w-5" strokeWidth={1.5} />
              </button>

              {searchOpen && (
                <div className="absolute right-0 top-full mt-3 w-80 md:w-96 bg-card/95 backdrop-blur-xl border border-border/40 rounded-xl shadow-[0_16px_48px_-12px_hsl(220_20%_6%/0.3)] z-50 overflow-hidden">
                  {user && (
                    <div className="flex border-b border-border/30">
                      <button
                        onClick={() => { setSearchTab("products"); setSearchQuery(""); }}
                        className={`flex-1 text-[11px] font-semibold py-3 transition-all duration-200 tracking-[0.1em] uppercase ${searchTab === "products" ? "text-accent border-b-2 border-accent" : "text-muted-foreground"}`}
                      >
                        Produtos
                      </button>
                      <button
                        onClick={() => { setSearchTab("orders"); setSearchQuery(""); }}
                        className={`flex-1 text-[11px] font-semibold py-3 transition-all duration-200 tracking-[0.1em] uppercase flex items-center justify-center gap-1.5 ${searchTab === "orders" ? "text-accent border-b-2 border-accent" : "text-muted-foreground"}`}
                      >
                        <Package className="h-3.5 w-3.5" strokeWidth={1.5} /> Rastrear
                      </button>
                    </div>
                  )}
                  <div className="p-3.5 border-b border-border/30">
                    <input
                      ref={inputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={searchTab === "products" ? "Buscar produtos..." : "Código de rastreio ou nº do pedido..."}
                      className="w-full bg-secondary/60 rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:bg-secondary"
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setSearchOpen(false);
                      }}
                    />
                  </div>

                  {searching && (
                    <div className="p-4 text-center text-sm text-muted-foreground">Buscando...</div>
                  )}

                  {searchTab === "products" && !searching && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                    <div className="p-4 text-center text-sm text-muted-foreground">Nenhum produto encontrado</div>
                  )}

                  {searchTab === "products" && searchResults.length > 0 && (
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((r) => (
                        <button
                          key={r.id}
                          onClick={() => handleResultClick(r.slug)}
                          className="w-full flex items-center gap-3 p-3.5 hover:bg-secondary/40 transition-all duration-200 text-left"
                        >
                          <img
                            src={r.image || "/placeholder.svg"}
                            alt={r.name}
                            className="w-12 h-14 object-cover rounded-lg"
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
                          <div key={o.id} className="p-3.5 border-b border-border/30 last:border-0">
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
                                <Package className="h-3 w-3" strokeWidth={1.5} /> Rastrear: {o.tracking_code}
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

            <div className="relative">
              <Link to="/conta" className="relative p-2.5 text-white hover:text-white/70 transition-all duration-300" aria-label="Conta">
                <User className="h-5 w-5" strokeWidth={1.5} />
                {pendingPixCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                    {pendingPixCount}
                  </span>
                )}
              </Link>
              <AccountTooltip />
            </div>
            <Link to="/carrinho" className="relative p-2.5 text-white hover:text-white/70 transition-all duration-300" aria-label="Carrinho">
              <ShoppingBag className="h-5 w-5" strokeWidth={1.5} />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[9px] font-bold rounded-full h-3.5 w-3.5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile menu — minimal luxury */}
        {menuOpen && (
          <nav className="md:hidden bg-white border-t border-border/10 animate-fade-in-up">
            <div className="container py-6 flex flex-col gap-0">
              {categories.map((cat) => {
                const sizes = categorySizes[cat.slug];
                const isExpanded = expandedMobileCategory === cat.slug;
                return (
                  <div key={cat.slug}>
                    <div className="flex items-center border-b border-border/10">
                      <Link
                        to={`/categoria/${cat.slug}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex-1 text-[11px] font-medium text-foreground/80 py-5 tracking-[0.25em] uppercase"
                      >
                        {cat.name}
                      </Link>
                      {sizes && sizes.length > 0 && (
                        <button
                          onClick={() => handleMobileCategoryTap(cat.slug)}
                          className="p-5 text-muted-foreground/40"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-500 ${isExpanded ? "rotate-180" : ""}`} strokeWidth={1.25} />
                        </button>
                      )}
                    </div>
                    {isExpanded && sizes && (
                      <div className="border-b border-border/10">
                        <Link
                          to={`/categoria/${cat.slug}`}
                          onClick={() => setMenuOpen(false)}
                          className="block pl-8 pr-4 py-4 text-[10px] font-medium text-foreground/70 transition-colors tracking-[0.2em] uppercase"
                        >
                          Ver todos
                        </Link>
                        {sizes.map(size => (
                          <Link
                            key={size}
                            to={`/categoria/${cat.slug}?tamanho=${size}`}
                            onClick={() => setMenuOpen(false)}
                            className="block pl-8 pr-4 py-4 text-[10px] font-normal text-muted-foreground hover:text-foreground transition-all duration-300 tracking-[0.18em] uppercase"
                          >
                            Tamanho {size}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <Link to="/atacado" onClick={() => setMenuOpen(false)} className="my-3 mx-auto">
                <span className="relative inline-flex items-center gap-2 bg-[#25d366] text-white text-[13px] font-bold px-8 py-3.5 rounded-full tracking-[0.15em] uppercase shadow-lg">
                  <span className="absolute -top-2 -right-2 bg-yellow-400 text-[8px] font-bold text-black px-1.5 py-0.5 rounded-sm tracking-wide uppercase leading-none shadow-sm">
                    PREÇO DE FÁBRICA
                  </span>
                  📦 ATACADO
                </span>
              </Link>
              <Link to="/conta" onClick={() => setMenuOpen(false)} className="text-[11px] font-medium text-foreground/80 py-5 flex items-center gap-3 tracking-[0.2em] uppercase">
                <User className="h-3.5 w-3.5" strokeWidth={1.25} /> Minha Conta
                {pendingPixCount > 0 && (
                  <span className="bg-accent text-accent-foreground text-[9px] font-bold rounded-full h-3.5 min-w-[0.875rem] px-0.5 flex items-center justify-center">
                    {pendingPixCount}
                  </span>
                )}
              </Link>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}
