import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, getProductPrice } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckSquare, Square, Tag, Flame, X } from "lucide-react";

export default function AdminPromotions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products-promo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(name), product_images(id, url, position)")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const togglePromo = useMutation({
    mutationFn: async ({ id, is_promo }: { id: string; is_promo: boolean }) => {
      const { error } = await supabase.from("products").update({ is_promo, is_featured: is_promo }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({
        admin_id: user!.id,
        action: is_promo ? "add_promo" : "remove_promo",
        entity: "product",
        entity_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products-promo"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Promoção atualizada" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const promoProducts = filtered.filter((p: any) => p.is_promo && p.promo_price != null);
  const availableProducts = filtered.filter((p: any) => !p.is_promo || p.promo_price == null);

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Flame className="h-6 w-6 text-accent" />
        <h1 className="font-display text-2xl font-bold text-foreground">Promoções da Semana</h1>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto..." className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg text-sm text-foreground" />
      </div>

      {/* Current promotions */}
      <div className="mb-8">
        <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-accent" /> Produtos em Promoção ({promoProducts.length})
        </h2>
        {promoProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card border rounded-lg p-6 text-center">Nenhum produto em promoção. Selecione abaixo para adicionar.</p>
        ) : (
          <div className="grid gap-2">
            {promoProducts.map((p: any) => {
              const img = (p.product_images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0]?.url;
              return (
                <div key={p.id} className="flex items-center gap-3 bg-card border border-accent/20 rounded-lg p-3">
                  <div className="w-10 h-10 bg-secondary rounded overflow-hidden flex-shrink-0">
                    {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span className="line-through">{formatCurrency(p.price)}</span>
                      <span className="text-accent font-semibold">{formatCurrency(p.promo_price)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => togglePromo.mutate({ id: p.id, is_promo: false })}
                    className="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary"
                    title="Remover da promoção"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Available products */}
      <div>
        <h2 className="font-display font-semibold text-foreground mb-3">Adicionar à Promoção</h2>
        <p className="text-xs text-muted-foreground mb-3">Produtos precisam ter um preço promocional definido para serem adicionados.</p>
        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-card border rounded-lg animate-pulse" />)}</div>
        ) : (
          <div className="grid gap-2">
            {availableProducts.map((p: any) => {
              const img = (p.product_images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0]?.url;
              const hasPromoPrice = p.promo_price != null && p.promo_price > 0 && p.promo_price < p.price;
              return (
                <div key={p.id} className={`flex items-center gap-3 bg-card border rounded-lg p-3 ${!hasPromoPrice ? "opacity-50" : ""}`}>
                  <div className="w-10 h-10 bg-secondary rounded overflow-hidden flex-shrink-0">
                    {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>{formatCurrency(p.price)}</span>
                      {hasPromoPrice && <span className="text-accent">→ {formatCurrency(p.promo_price)}</span>}
                      {!hasPromoPrice && <span className="text-destructive">Sem preço promo</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => hasPromoPrice && togglePromo.mutate({ id: p.id, is_promo: true })}
                    disabled={!hasPromoPrice || togglePromo.isPending}
                    className="text-xs px-3 py-1.5 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    Adicionar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
