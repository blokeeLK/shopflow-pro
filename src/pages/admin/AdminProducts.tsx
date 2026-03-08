import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Star, Copy, CheckSquare, Square, XSquare, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const SIZES = ["P", "M", "G", "GG"] as const;

export default function AdminProducts() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sizeTab, setSizeTab] = useState("todos");
  // Inline edits: { [productId]: { price?, promo_price?, installment_count? } }
  const [edits, setEdits] = useState<Record<string, { price?: string; promo_price?: string; installment_count?: string }>>({});

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(name), product_variants(id, size, stock), product_images(id, url, position)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("products").update({ active }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({ admin_id: user!.id, action: active ? "activate" : "deactivate", entity: "product", entity_id: id });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); toast({ title: "Produto atualizado" }); },
  });

  const toggleFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase.from("products").update({ is_featured }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({ admin_id: user!.id, action: is_featured ? "feature" : "unfeature", entity: "product", entity_id: id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const deleteOneProduct = async (id: string) => {
    await supabase.from("order_items").delete().eq("product_id", id);
    await supabase.from("product_images").delete().eq("product_id", id);
    await supabase.from("product_variants").delete().eq("product_id", id);
    await supabase.from("product_reviews").delete().eq("product_id", id);
    await supabase.from("reviews").delete().eq("product_id", id);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
    await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "delete", entity: "product", entity_id: id });
  };

  const deleteProduct = useMutation({
    mutationFn: deleteOneProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); toast({ title: "Produto excluído" }); },
    onError: (err: any) => { toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" }); },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await deleteOneProduct(id); },
    onSuccess: () => {
      const count = selected.size;
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: `${count} produto(s) excluído(s)` });
    },
    onError: (err: any) => { toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" }); },
  });

  const duplicateOneProduct = async (productId: string) => {
    const product = products.find((p: any) => p.id === productId);
    if (!product) return;
    const { data: newProduct, error } = await supabase.from("products").insert({
      name: `${product.name} (cópia)`,
      slug: `${product.slug}-copia-${Date.now()}`,
      description: product.description,
      price: product.price,
      promo_price: product.promo_price,
      is_promo: product.is_promo,
      is_featured: false,
      active: false,
      category_id: product.category_id,
      installment_count: product.installment_count,
      weight: product.weight,
      width: product.width,
      height: product.height,
      length: product.length,
      image_fit_mode: product.image_fit_mode,
      image_position_x: product.image_position_x,
      image_position_y: product.image_position_y,
      image_zoom: product.image_zoom,
    }).select("id").single();
    if (error) throw error;
    const images = (product.product_images || []) as any[];
    if (images.length > 0) {
      await supabase.from("product_images").insert(images.map((img: any) => ({ product_id: newProduct.id, url: img.url, position: img.position })));
    }
    const variants = (product.product_variants || []) as any[];
    if (variants.length > 0) {
      await supabase.from("product_variants").insert(variants.map((v: any) => ({ product_id: newProduct.id, size: v.size, stock: v.stock })));
    }
    await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "duplicate", entity: "product", entity_id: newProduct.id });
  };

  const duplicateProduct = useMutation({
    mutationFn: duplicateOneProduct,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); toast({ title: "Produto duplicado" }); },
    onError: (err: any) => { toast({ title: "Erro ao duplicar", description: err.message, variant: "destructive" }); },
  });

  const bulkDuplicate = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await duplicateOneProduct(id); },
    onSuccess: () => {
      const count = selected.size;
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: `${count} produto(s) duplicado(s)` });
    },
    onError: (err: any) => { toast({ title: "Erro ao duplicar", description: err.message, variant: "destructive" }); },
  });

  const inlineUpdate = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: { price?: number; promo_price?: number | null; installment_count?: number } }) => {
      const { error } = await supabase.from("products").update(data).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      setEdits(prev => { const next = { ...prev }; delete next[vars.id]; return next; });
      toast({ title: "Valor atualizado" });
    },
    onError: (err: any) => { toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" }); },
  });

  // Filter by search
  const searchFiltered = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

  // Filter by size tab
  const filtered = sizeTab === "todos"
    ? searchFiltered
    : searchFiltered.filter((p: any) =>
        (p.product_variants || []).some((v: any) => v.size.toUpperCase() === sizeTab && v.stock > 0)
      );

  const allSelected = filtered.length > 0 && filtered.every((p: any) => selected.has(p.id));

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((p: any) => p.id)));
  };

  const getEdit = (id: string) => edits[id] || {};
  const setEdit = (id: string, field: string, value: string) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const saveInlineEdit = (p: any) => {
    const e = getEdit(p.id);
    const data: any = {};
    if (e.price !== undefined) data.price = parseFloat(e.price) || p.price;
    if (e.promo_price !== undefined) {
      const val = parseFloat(e.promo_price);
      data.promo_price = isNaN(val) || val <= 0 ? null : val;
    }
    if (e.installment_count !== undefined) data.installment_count = parseInt(e.installment_count) || 3;
    if (Object.keys(data).length > 0) inlineUpdate.mutate({ id: p.id, data });
  };

  const getStockForSize = (p: any, size: string) => {
    return (p.product_variants || [])
      .filter((v: any) => v.size.toUpperCase() === size)
      .reduce((a: number, v: any) => a + v.stock, 0);
  };

  const getSizeCount = (size: string) => {
    return searchFiltered.filter((p: any) =>
      (p.product_variants || []).some((v: any) => v.size.toUpperCase() === size && v.stock > 0)
    ).length;
  };

  const renderTable = () => (
    <div className="bg-card border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-secondary/50">
              <th className="p-3 w-10">
                <button onClick={toggleSelectAll} className="text-muted-foreground hover:text-foreground">
                  {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              <th className="text-left p-3 font-medium text-muted-foreground">Produto</th>
              <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
              <th className="text-right p-3 font-medium text-muted-foreground">Preço</th>
              <th className="text-right p-3 font-medium text-muted-foreground hidden lg:table-cell">Promo</th>
              <th className="text-center p-3 font-medium text-muted-foreground hidden lg:table-cell">Parcelas</th>
              {sizeTab !== "todos" ? (
                <th className="text-right p-3 font-medium text-muted-foreground hidden md:table-cell">Estoque {sizeTab}</th>
              ) : (
                <>
                  <th className="text-right p-3 font-medium text-muted-foreground hidden md:table-cell">Estoque</th>
                  <th className="text-center p-3 font-medium text-muted-foreground hidden xl:table-cell">P / M / G / GG</th>
                </>
              )}
              <th className="text-right p-3 font-medium text-muted-foreground hidden md:table-cell">Vendidos</th>
              <th className="text-center p-3 font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any) => {
              const totalStock = (p.product_variants || []).reduce((a: number, v: any) => a + v.stock, 0);
              const img = (p.product_images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0]?.url;
              const isSelected = selected.has(p.id);
              const edit = getEdit(p.id);
              const hasEdits = Object.keys(edit).length > 0;
              const displayPrice = p.is_promo && p.promo_price ? p.promo_price : p.price;
              return (
                <tr key={p.id} className={`border-b last:border-0 hover:bg-secondary/30 ${!p.active ? "opacity-50" : ""} ${isSelected ? "bg-accent/5" : ""}`}>
                  <td className="p-3">
                    <button onClick={() => toggleSelect(p.id)} className="text-muted-foreground hover:text-foreground">
                      {isSelected ? <CheckSquare className="h-4 w-4 text-accent" /> : <Square className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary rounded overflow-hidden flex-shrink-0">
                        {img && <img src={img} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <p className="font-medium text-foreground line-clamp-1">{p.name}</p>
                        {p.is_promo && <span className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">PROMO</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{p.category?.name || "—"}</td>
                  {/* Inline editable price */}
                  <td className="p-3 text-right">
                    <input
                      type="number"
                      step="0.01"
                      className="w-24 text-right bg-transparent border border-transparent hover:border-border focus:border-accent rounded px-1.5 py-1 text-sm font-medium text-foreground focus:outline-none"
                      value={edit.price !== undefined ? edit.price : String(p.price)}
                      onChange={(e) => setEdit(p.id, "price", e.target.value)}
                    />
                  </td>
                  {/* Inline editable promo price */}
                  <td className="p-3 text-right hidden lg:table-cell">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="—"
                      className="w-24 text-right bg-transparent border border-transparent hover:border-border focus:border-accent rounded px-1.5 py-1 text-sm text-muted-foreground focus:outline-none"
                      value={edit.promo_price !== undefined ? edit.promo_price : (p.promo_price ? String(p.promo_price) : "")}
                      onChange={(e) => setEdit(p.id, "promo_price", e.target.value)}
                    />
                  </td>
                  {/* Inline editable installments */}
                  <td className="p-3 text-center hidden lg:table-cell">
                    <select
                      className="bg-transparent border border-transparent hover:border-border focus:border-accent rounded px-1.5 py-1 text-sm text-foreground focus:outline-none cursor-pointer"
                      value={edit.installment_count !== undefined ? edit.installment_count : String(p.installment_count || 3)}
                      onChange={(e) => setEdit(p.id, "installment_count", e.target.value)}
                    >
                      {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                        <option key={n} value={n}>{n}x</option>
                      ))}
                    </select>
                  </td>
                  {sizeTab !== "todos" ? (
                    <td className={`p-3 text-right hidden md:table-cell font-medium ${getStockForSize(p, sizeTab) <= 5 ? "text-warning" : "text-foreground"}`}>
                      {getStockForSize(p, sizeTab)}
                    </td>
                  ) : (
                    <>
                      <td className={`p-3 text-right hidden md:table-cell font-medium ${totalStock <= 5 ? "text-warning" : "text-foreground"}`}>{totalStock}</td>
                      <td className="p-3 text-center hidden xl:table-cell">
                        <div className="flex items-center justify-center gap-1.5 text-xs">
                          {SIZES.map(s => {
                            const stock = getStockForSize(p, s);
                            return (
                              <span key={s} className={`px-1.5 py-0.5 rounded ${stock > 0 ? "bg-secondary text-foreground" : "bg-muted text-muted-foreground"}`}>
                                {s}:{stock}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    </>
                  )}
                  <td className="p-3 text-right text-muted-foreground hidden md:table-cell">{p.sold_count}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1">
                      {hasEdits && (
                        <button onClick={() => saveInlineEdit(p)} className="p-1.5 rounded hover:bg-secondary text-accent" title="Salvar alterações">
                          <Save className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={() => toggleFeatured.mutate({ id: p.id, is_featured: !p.is_featured })} className={`p-1.5 rounded hover:bg-secondary ${p.is_featured ? "text-warning" : "text-muted-foreground"}`} title="Destaque">
                        <Star className="h-3.5 w-3.5" fill={p.is_featured ? "currentColor" : "none"} />
                      </button>
                      <button onClick={() => toggleActive.mutate({ id: p.id, active: !p.active })} className="p-1.5 rounded hover:bg-secondary text-muted-foreground" title={p.active ? "Desativar" : "Ativar"}>
                        {p.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </button>
                      <button onClick={() => duplicateProduct.mutate(p.id)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground" title="Duplicar">
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => navigate(`/admin/produtos/${p.id}`)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground" title="Editar">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { if (confirm("Excluir este produto?")) deleteProduct.mutate(p.id); }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive" title="Excluir">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</p>}
    </div>
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Produtos</h1>
        <button onClick={() => navigate("/admin/produtos/novo")} className="bg-accent text-accent-foreground font-semibold text-sm px-4 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo Produto
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto..." className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg text-sm text-foreground" />
      </div>

      {/* Size filter tabs */}
      <Tabs value={sizeTab} onValueChange={(v) => { setSizeTab(v); setSelected(new Set()); }} className="mb-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="todos">Todos ({searchFiltered.length})</TabsTrigger>
          {SIZES.map(s => (
            <TabsTrigger key={s} value={s}>{s} ({getSizeCount(s)})</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-secondary/50 border rounded-lg">
          <span className="text-sm font-medium text-foreground">{selected.size} selecionado(s)</span>
          <button
            onClick={() => { if (confirm(`Excluir ${selected.size} produto(s)?`)) bulkDelete.mutate(Array.from(selected)); }}
            disabled={bulkDelete.isPending}
            className="text-sm px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </button>
          <button
            onClick={() => bulkDuplicate.mutate(Array.from(selected))}
            disabled={bulkDuplicate.isPending}
            className="text-sm px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" /> Duplicar
          </button>
          <button onClick={() => setSelected(new Set())} className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground flex items-center gap-1.5">
            <XSquare className="h-3.5 w-3.5" /> Limpar
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : renderTable()}
    </div>
  );
}
