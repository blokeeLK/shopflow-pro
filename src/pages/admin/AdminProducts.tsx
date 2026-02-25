import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Pencil, Trash2, Search, Eye, EyeOff, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function AdminProducts() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [search, setSearch] = useState("");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, category:categories(name), product_variants(size, stock), product_images(url, position)")
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

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "delete", entity: "product", entity_id: id });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-products"] }); toast({ title: "Produto excluído" }); },
  });

  const filtered = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()));

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

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Produto</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Preço</th>
                  <th className="text-right p-3 font-medium text-muted-foreground hidden md:table-cell">Estoque</th>
                  <th className="text-right p-3 font-medium text-muted-foreground hidden md:table-cell">Vendidos</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p: any) => {
                  const totalStock = (p.product_variants || []).reduce((a: number, v: any) => a + v.stock, 0);
                  const img = (p.product_images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0))[0]?.url;
                  return (
                    <tr key={p.id} className={`border-b last:border-0 hover:bg-secondary/30 ${!p.active ? "opacity-50" : ""}`}>
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
                      <td className="p-3 text-right font-medium text-foreground">
                        {p.is_promo && p.promo_price ? formatCurrency(p.promo_price) : formatCurrency(p.price)}
                      </td>
                      <td className={`p-3 text-right hidden md:table-cell font-medium ${totalStock <= 5 ? "text-warning" : "text-foreground"}`}>{totalStock}</td>
                      <td className="p-3 text-right text-muted-foreground hidden md:table-cell">{p.sold_count}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => toggleFeatured.mutate({ id: p.id, is_featured: !p.is_featured })} className={`p-1.5 rounded hover:bg-secondary ${p.is_featured ? "text-warning" : "text-muted-foreground"}`} title="Destaque">
                            <Star className="h-3.5 w-3.5" fill={p.is_featured ? "currentColor" : "none"} />
                          </button>
                          <button onClick={() => toggleActive.mutate({ id: p.id, active: !p.active })} className="p-1.5 rounded hover:bg-secondary text-muted-foreground" title={p.active ? "Desativar" : "Ativar"}>
                            {p.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
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
      )}
    </div>
  );
}
