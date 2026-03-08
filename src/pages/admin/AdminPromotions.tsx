import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Search, CheckSquare, Square, Tag, Flame, X, Shuffle, Trash2,
  DollarSign, CreditCard, AlertTriangle, RefreshCw,
} from "lucide-react";

const SIZE_DISTRIBUTION = { P: 2, M: 5, G: 2, GG: 2 } as const;
const MAX_BRAND_COUNT = 2;
const INSTALLMENT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Guess brand from product name — first word */
function guessBrand(name: string): string {
  return (name || "").trim().split(/\s+/)[0].toLowerCase();
}

/** Pick random items from array */
function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

type Product = any;

function generateRandomSelection(
  products: Product[]
): { selected: Product[]; warnings: string[] } {
  const warnings: string[] = [];
  const brandCounts: Record<string, number> = {};
  const selectedIds = new Set<string>();
  const result: Product[] = [];

  for (const [size, needed] of Object.entries(SIZE_DISTRIBUTION)) {
    // Products of this size with stock > 0
    const candidates = products.filter(
      (p) =>
        !selectedIds.has(p.id) &&
        p.product_variants?.some(
          (v: any) => v.size.toUpperCase() === size && v.stock > 0
        )
    );

    // Sort by brand diversity — prefer brands not yet used
    const sorted = [...candidates].sort(() => Math.random() - 0.5);

    let picked = 0;
    for (const p of sorted) {
      if (picked >= needed) break;
      const brand = guessBrand(p.name);
      if ((brandCounts[brand] || 0) >= MAX_BRAND_COUNT) continue;
      result.push(p);
      selectedIds.add(p.id);
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
      picked++;
    }

    if (picked < needed) {
      // Try again ignoring brand limit
      for (const p of sorted) {
        if (picked >= needed) break;
        if (selectedIds.has(p.id)) continue;
        result.push(p);
        selectedIds.add(p.id);
        const brand = guessBrand(p.name);
        brandCounts[brand] = (brandCounts[brand] || 0) + 1;
        picked++;
      }
      if (picked < needed) {
        warnings.push(
          `Tamanho ${size}: apenas ${picked} de ${needed} produtos disponíveis`
        );
      }
    }
  }

  return { selected: result, warnings };
}

export default function AdminPromotions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Bulk edit state
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkPromoPrice, setBulkPromoPrice] = useState("");
  const [bulkInstallments, setBulkInstallments] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products-promo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(
          "*, category:categories(name), product_images(id, url, position), product_variants(id, size, stock)"
        )
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-products-promo"] });
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  // Toggle single
  const toggleWeeklyPromo = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ weekly_promotion: value } as any)
        .eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({
        admin_id: user!.id,
        action: value ? "add_weekly_promo" : "remove_weekly_promo",
        entity: "product",
        entity_id: id,
      });
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Promoção da semana atualizada" });
    },
    onError: (err: any) =>
      toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  // Bulk toggle
  const bulkToggle = useMutation({
    mutationFn: async ({ ids, value }: { ids: string[]; value: boolean }) => {
      for (const id of ids) {
        const { error } = await supabase
          .from("products")
          .update({ weekly_promotion: value } as any)
          .eq("id", id);
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
      invalidateAll();
      setSelected(new Set());
      toast({
        title: vars.value
          ? `${vars.ids.length} produto(s) adicionado(s)`
          : `${vars.ids.length} produto(s) removido(s)`,
      });
    },
    onError: (err: any) =>
      toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  // Bulk price/installment update
  const bulkPriceUpdate = useMutation({
    mutationFn: async ({
      ids,
      price,
      promoPrice,
      installments,
    }: {
      ids: string[];
      price?: number;
      promoPrice?: number | null;
      installments?: number;
    }) => {
      const update: any = {};
      if (price !== undefined) update.price = price;
      if (promoPrice !== undefined) {
        update.promo_price = promoPrice;
        update.is_promo = promoPrice !== null && promoPrice > 0;
      }
      if (installments !== undefined) update.installment_count = installments;
      if (Object.keys(update).length === 0) return;
      for (const id of ids) {
        const { error } = await supabase
          .from("products")
          .update(update)
          .eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      invalidateAll();
      setShowBulkEdit(false);
      setBulkPrice("");
      setBulkPromoPrice("");
      setBulkInstallments("");
      toast({ title: "Preços atualizados com sucesso!" });
    },
    onError: (err: any) =>
      toast({ title: "Erro", description: err.message, variant: "destructive" }),
  });

  // Random generate
  const handleGenerate = useCallback(() => {
    const { selected: picks, warnings } = generateRandomSelection(products);
    if (warnings.length > 0) {
      toast({
        title: "Aviso na geração",
        description: warnings.join(". "),
        variant: "destructive",
      });
    }
    // First clear all existing weekly_promotion, then set new ones
    const currentPromo = products.filter((p: any) => p.weekly_promotion === true);
    const clearIds = currentPromo.map((p: any) => p.id);
    const setIds = picks.map((p) => p.id);

    (async () => {
      // Clear old
      for (const id of clearIds) {
        await supabase
          .from("products")
          .update({ weekly_promotion: false } as any)
          .eq("id", id);
      }
      // Set new
      for (const id of setIds) {
        await supabase
          .from("products")
          .update({ weekly_promotion: true } as any)
          .eq("id", id);
      }
      // Log
      for (const id of setIds) {
        await supabase.from("admin_logs").insert({
          admin_id: user!.id,
          action: "auto_weekly_promo",
          entity: "product",
          entity_id: id,
        });
      }
      invalidateAll();
      toast({
        title: `Promoção gerada: ${setIds.length} produtos selecionados`,
      });
    })();
  }, [products, user, toast]);

  // Clear all
  const handleClearAll = useCallback(() => {
    const promoIds = products
      .filter((p: any) => p.weekly_promotion === true)
      .map((p: any) => p.id);
    if (promoIds.length === 0) return;
    bulkToggle.mutate({ ids: promoIds, value: false });
  }, [products, bulkToggle]);

  // Bulk edit submit
  const handleBulkEditSubmit = () => {
    const promoIds = products
      .filter((p: any) => p.weekly_promotion === true)
      .map((p: any) => p.id);
    if (promoIds.length === 0) return;

    const price = bulkPrice ? parseFloat(bulkPrice) : undefined;
    const promoPrice = bulkPromoPrice
      ? parseFloat(bulkPromoPrice)
      : bulkPromoPrice === "0"
      ? null
      : undefined;
    const installments = bulkInstallments
      ? parseInt(bulkInstallments)
      : undefined;

    if (price === undefined && promoPrice === undefined && installments === undefined) {
      toast({ title: "Preencha pelo menos um campo", variant: "destructive" });
      return;
    }

    bulkPriceUpdate.mutate({ ids: promoIds, price, promoPrice, installments });
  };

  const filtered = useMemo(() => {
    return products.filter((p: any) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);

  const promoProducts = filtered.filter(
    (p: any) => p.weekly_promotion === true
  );
  const availableProducts = filtered.filter(
    (p: any) => p.weekly_promotion !== true
  );

  // Size counts in promo
  const promoCounts = useMemo(() => {
    const allPromo = products.filter((p: any) => p.weekly_promotion === true);
    const counts: Record<string, number> = { P: 0, M: 0, G: 0, GG: 0 };
    for (const p of allPromo) {
      for (const v of p.product_variants || []) {
        const s = (v as any).size?.toUpperCase();
        if (s in counts) counts[s]++;
      }
    }
    // Deduplicate: count each product once for each size it has
    const sizeMap: Record<string, Set<string>> = { P: new Set(), M: new Set(), G: new Set(), GG: new Set() };
    for (const p of allPromo) {
      for (const v of p.product_variants || []) {
        const s = (v as any).size?.toUpperCase();
        if (s in sizeMap) sizeMap[s].add(p.id);
      }
    }
    return Object.fromEntries(Object.entries(sizeMap).map(([k, v]) => [k, v.size]));
  }, [products]);

  const allAvailableSelected =
    availableProducts.length > 0 &&
    availableProducts.every((p: any) => selected.has(p.id));
  const allPromoSelected =
    promoProducts.length > 0 &&
    promoProducts.every((p: any) => selected.has(p.id));

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
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
  const selectedInAvailable = availableProducts.filter((p: any) =>
    selected.has(p.id)
  );

  const getSizeBadges = (p: any) => {
    const sizes = (p.product_variants || [])
      .filter((v: any) => v.stock > 0)
      .map((v: any) => v.size?.toUpperCase())
      .filter(Boolean);
    return [...new Set(sizes)].sort();
  };

  const renderProductRow = (p: any, showRemove: boolean) => {
    const img = (p.product_images || []).sort(
      (a: any, b: any) => (a.position || 0) - (b.position || 0)
    )[0]?.url;
    const isSelected = selected.has(p.id);
    const sizes = getSizeBadges(p);
    const brand = guessBrand(p.name);

    return (
      <div
        key={p.id}
        className={`flex items-center gap-3 bg-card border rounded-lg p-3 ${
          showRemove ? "border-accent/20" : ""
        } ${isSelected ? "ring-1 ring-accent/40" : ""}`}
      >
        <button
          onClick={() => toggleSelect(p.id)}
          className="text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-accent" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
        <div className="w-10 h-10 bg-secondary rounded overflow-hidden flex-shrink-0">
          {img && (
            <img src={img} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">
            {p.name}
          </p>
          <div className="flex flex-wrap gap-1.5 mt-1 items-center">
            <span className="text-xs text-muted-foreground">
              {formatCurrency(p.price)}
            </span>
            {p.promo_price != null && p.promo_price > 0 && (
              <span className="text-xs text-accent font-semibold">
                → {formatCurrency(p.promo_price)}
              </span>
            )}
            {p.installment_count > 1 && (
              <span className="text-xs text-muted-foreground">
                {p.installment_count}x
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              • {p.category?.name || "Sem cat."}
            </span>
            {sizes.map((s: string) => (
              <span
                key={s}
                className="text-[10px] px-1.5 py-0.5 bg-secondary rounded font-medium text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
        {showRemove ? (
          <button
            onClick={() =>
              toggleWeeklyPromo.mutate({ id: p.id, value: false })
            }
            className="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary flex-shrink-0"
            title="Remover da promoção"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() =>
              toggleWeeklyPromo.mutate({ id: p.id, value: true })
            }
            className="text-xs px-3 py-1.5 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 font-medium flex-shrink-0"
          >
            Adicionar
          </button>
        )}
      </div>
    );
  };

  const totalPromo = products.filter(
    (p: any) => p.weekly_promotion === true
  ).length;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Flame className="h-6 w-6 text-accent" />
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            Promoções da Semana
          </h1>
          <p className="text-sm text-muted-foreground">
            Geração automática ou seleção manual dos produtos em destaque
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2.5 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 font-medium text-sm transition-colors"
        >
          <Shuffle className="h-4 w-4" />
          Gerar Promoções da Semana
        </button>
        <button
          onClick={handleGenerate}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 font-medium text-sm transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Regerar
        </button>
        <button
          onClick={handleClearAll}
          disabled={totalPromo === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 font-medium text-sm disabled:opacity-50 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          Limpar Todas ({totalPromo})
        </button>
        <button
          onClick={() => setShowBulkEdit(!showBulkEdit)}
          disabled={totalPromo === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-card border text-foreground rounded-lg hover:bg-secondary font-medium text-sm disabled:opacity-50 transition-colors"
        >
          <DollarSign className="h-4 w-4" />
          Editar Preços em Massa
        </button>
      </div>

      {/* Size distribution info */}
      <div className="flex flex-wrap gap-3 mb-4 p-3 bg-secondary/30 border rounded-lg text-sm">
        <span className="text-muted-foreground font-medium">Distribuição:</span>
        {Object.entries(SIZE_DISTRIBUTION).map(([size, target]) => (
          <span key={size} className="flex items-center gap-1">
            <span className="font-semibold text-foreground">{size}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${
              (promoCounts[size] || 0) >= target
                ? "bg-accent/20 text-accent"
                : "bg-destructive/20 text-destructive"
            }`}>
              {promoCounts[size] || 0}/{target}
            </span>
          </span>
        ))}
        <span className="text-muted-foreground">
          Total: <strong className="text-foreground">{totalPromo}</strong>/11
        </span>
      </div>

      {/* Bulk price edit panel */}
      {showBulkEdit && totalPromo > 0 && (
        <div className="mb-6 p-4 bg-card border-2 border-accent/30 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-accent" />
            <h3 className="font-display font-semibold text-foreground">
              Editar Preços — {totalPromo} produto(s) na promoção
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Deixe campos vazios para não alterar. As alterações se aplicam a
            todos os produtos da Promoção da Semana.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Preço (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={bulkPrice}
                onChange={(e) => setBulkPrice(e.target.value)}
                placeholder="Ex: 59.90"
                className="w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Preço Promocional (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={bulkPromoPrice}
                onChange={(e) => setBulkPromoPrice(e.target.value)}
                placeholder="Ex: 39.90 (0 = remover)"
                className="w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Parcelas
              </label>
              <select
                value={bulkInstallments}
                onChange={(e) => setBulkInstallments(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-lg text-sm text-foreground"
              >
                <option value="">Não alterar</option>
                {INSTALLMENT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}x
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleBulkEditSubmit}
              disabled={bulkPriceUpdate.isPending}
              className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 font-medium text-sm disabled:opacity-50 flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              {bulkPriceUpdate.isPending
                ? "Salvando..."
                : `Aplicar a ${totalPromo} produto(s)`}
            </button>
            <button
              onClick={() => setShowBulkEdit(false)}
              className="px-4 py-2 text-muted-foreground hover:text-foreground text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg text-sm text-foreground"
        />
      </div>

      {/* Bulk selection actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-secondary/50 border rounded-lg flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {selected.size} selecionado(s)
          </span>
          {selectedInAvailable.length > 0 && (
            <button
              onClick={() =>
                bulkToggle.mutate({
                  ids: selectedInAvailable.map((p: any) => p.id),
                  value: true,
                })
              }
              disabled={bulkToggle.isPending}
              className="text-sm px-3 py-1.5 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Flame className="h-3.5 w-3.5" /> Adicionar à Promo (
              {selectedInAvailable.length})
            </button>
          )}
          {selectedInPromo.length > 0 && (
            <button
              onClick={() =>
                bulkToggle.mutate({
                  ids: selectedInPromo.map((p: any) => p.id),
                  value: false,
                })
              }
              disabled={bulkToggle.isPending}
              className="text-sm px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 flex items-center gap-1.5 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" /> Remover ({selectedInPromo.length})
            </button>
          )}
          <button
            onClick={() => setSelected(new Set())}
            className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground"
          >
            Limpar
          </button>
        </div>
      )}

      {/* Current weekly promotions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Tag className="h-4 w-4 text-accent" /> Na Promoção da Semana (
            {promoProducts.length})
          </h2>
          {promoProducts.length > 0 && (
            <button
              onClick={toggleSelectAllPromo}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {allPromoSelected ? (
                <CheckSquare className="h-3.5 w-3.5" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              Selecionar todos
            </button>
          )}
        </div>
        {promoProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card border rounded-lg p-6 text-center">
            Nenhum produto na promoção. Clique em "Gerar Promoções da Semana"
            ou adicione manualmente.
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
          <h2 className="font-display font-semibold text-foreground">
            Produtos Disponíveis ({availableProducts.length})
          </h2>
          {availableProducts.length > 0 && (
            <button
              onClick={toggleSelectAllAvailable}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              {allAvailableSelected ? (
                <CheckSquare className="h-3.5 w-3.5" />
              ) : (
                <Square className="h-3.5 w-3.5" />
              )}
              Selecionar todos
            </button>
          )}
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-card border rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : availableProducts.length === 0 ? (
          <p className="text-sm text-muted-foreground bg-card border rounded-lg p-6 text-center">
            Todos os produtos já estão na promoção da semana.
          </p>
        ) : (
          <div className="grid gap-2">
            {availableProducts.map((p: any) => renderProductRow(p, false))}
          </div>
        )}
      </div>
    </div>
  );
}
