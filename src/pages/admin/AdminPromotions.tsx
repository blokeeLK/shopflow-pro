import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Search, CheckSquare, Square, Tag, Flame, X, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

export default function AdminPromotions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

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

  const toggleWeeklyPromo = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("products").update({ weekly_promotion: value } as any).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({
        admin_id: user!.id,
        action: value ? "add_weekly_promo" : "remove_weekly_promo",
        entity: "product",
        entity_id: id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products-promo"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Promoção da semana atualizada" });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const bulkToggleWeeklyPromo = useMutation({
    mutationFn: async ({ ids, value }: { ids: string[]; value: boolean }) => {
      for (const id of ids) {
        const { error } = await supabase.from("products").update({ weekly_promotion: value } as any).eq("id", id);
        if (error) throw error;
      }
      for (const id of ids) {
        await supabase.from("admin_logs").insert({
          admin_id: user!.id,
          action: value ? "add_weekly_promo" : "remove_weekly_promo",
          entity: "product",
          entity_id: id,
        });
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products-promo"] });
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setSelected(new Set());
      toast({ title: vars.value ? `${vars.ids.length} produto(s) adicionado(s) à Promo da Semana` : `${vars.ids.length} produto(s) removido(s)` });
    },
    onError: (err: any) => toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [products, search]);

  const promoProducts = filtered.filter((p: any) => (p as any).weekly_promotion === true);
  const availableProducts = filtered.filter((p: any) => (p as any).weekly_promotion !== true);

  const allAvailableSelected = availableProducts.length > 0 && availableProducts.every((p: any) => selected.has(p.id));
  const allPromoSelected = promoProducts.length > 0 && promoProducts.every((p: any) => selected.has(p.id));

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAllAvailable = () => {
    if (allAvailableSelected) {
      const next = new Set(selected);
      availableProducts.forEach((p: any) => next.delete(p.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      availableProducts.forEach((p: any) => next.add(p.id));
      setSelected(next);
    }
  };

  const toggleSelectAllPromo = () => {
    if (allPromoSelected) {
      const next = new Set(selected);
      promoProducts.forEach((p: any) => next.delete(p.id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      promoProducts.forEach((p: any) => next.add(p.id));
      setSelected(next);
    }
  };

  const selectedInPromo = promoProducts.filter((p: any) => selected.has(p.id));
  const selectedInAvailable = availableProducts.filter((p: any) => selected.has(p.id));

  const renderProductRow = (p: any, showRemove: boolean) => {
    const img = (p.product_images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0]?.url;
    const isSelected = selected.has(p.id);
    return (
      <div key={p.id} className={`flex items-center gap-3 bg-card border rounded-lg p-3 ${showRemove ? "border-accent/20" : ""} ${isSelected ? "ring-1 ring-accent/40" : ""}`}>
        <button onClick={() => toggleSelect(p.id)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
          {isSelected ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
        </button>
        <div className="w-10 h-10 bg-secondary rounded overflow-hidden flex-shrink-0">
          {img && <img src={img} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{formatCurrency(p.price)}</span>
            {p.promo_price != null && p.promo_price > 0 && (
              <span className="text-accent font-semibold">→ {formatCurrency(p.promo_price)}</span>
            )}
            <span className="text-muted-foreground">• {p.category?.name || "Sem categoria"}</span>
          </div>
        </div>
        {showRemove ? (
          <button
            onClick={() => toggleWeeklyPromo.mutate({ id: p.id, value: false })}
            className="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary flex-shrink-0"
            title="Remover da promoção"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => toggleWeeklyPromo.mutate({ id: p.id, value: true })}
            className="text-xs px-3 py-1.5 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 font-medium flex-shrink-0"
          >
            Adicionar
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Flame className="h-6 w-6 text-accent" />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Promoções da Semana</h1>
          <p className="text-sm text-muted-foreground">Selecione quais produtos aparecerão na seção de promoções da homepage</p>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto..." className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg text-sm text-foreground" />
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-secondary/50 border rounded-lg flex-wrap">
          <span className="text-sm font-medium text-foreground">{selected.size} selecionado(s)</span>
          {selectedInAvailable.length > 0 && (
            <button
              onClick={() => bulkToggleWeeklyPromo.mutate({ ids: selectedInAvailable.map((p: any) => p.id), value: true })}
              disabled={bulkToggleWeeklyPromo.isPending}
              className="text-sm px-3 py-1.5 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Flame className="h-3.5 w-3.5" /> Adicionar à Promo ({selectedInAvailable.length})
            </button>
          )}
          {selectedInPromo.length > 0 && (
            <button
              onClick={() => bulkToggleWeeklyPromo.mutate({ ids: selectedInPromo.map((p: any) => p.id), value: false })}
              disabled={bulkToggleWeeklyPromo.isPending}
              className="text-sm px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Remover da Promo ({selectedInPromo.length})
            </button>
          )}
          <button onClick={() => setSelected(new Set())} className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground">
            Limpar
          </button>
        </div>
      )}

      {/* Current weekly promotions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-accent" /> Na Promoção da Semana ({promoProducts.length})
          </h2>
          {promoProducts.length > 0 && (
            <button onClick={toggleSelectAllPromo} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              {allPromoSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              Selecionar todos
            </button>
          )}
        </div>
        {promoProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card border rounded-lg p-6 text-center">
            Nenhum produto na promoção da semana. Use os checkboxes abaixo para adicionar.
          </p>
        ) : (
          <div className="grid gap-2">
            {promoProducts.map((p: any) => renderProductRow(p, true))}
          </div>
        )}
      </div>

      {/* Available products */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-foreground">Produtos Disponíveis ({availableProducts.length})</h2>
          {availableProducts.length > 0 && (
            <button onClick={toggleSelectAllAvailable} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              {allAvailableSelected ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
              Selecionar todos
            </button>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-card border rounded-lg animate-pulse" />)}</div>
        ) : availableProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card border rounded-lg p-6 text-center">Todos os produtos já estão na promoção da semana.</p>
        ) : (
          <div className="grid gap-2">
            {availableProducts.map((p: any) => renderProductRow(p, false))}
          </div>
        )}
      </div>
    </div>
  );
}
