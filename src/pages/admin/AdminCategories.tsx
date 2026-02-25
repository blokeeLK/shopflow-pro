import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, GripVertical } from "lucide-react";

export default function AdminCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", image: "" });
  const [showNew, setShowNew] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("position");
      if (error) throw error;
      return data;
    },
  });

  const generateSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const saveMutation = useMutation({
    mutationFn: async ({ id, data }: { id?: string; data: any }) => {
      if (id) {
        const { error } = await supabase.from("categories").update(data).eq("id", id);
        if (error) throw error;
        await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "update", entity: "category", entity_id: id, details: data });
      } else {
        const { data: created, error } = await supabase.from("categories").insert({ ...data, position: categories.length }).select("id").single();
        if (error) throw error;
        await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "create", entity: "category", entity_id: created.id, details: data });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast({ title: "Categoria salva!" });
      setEditing(null);
      setShowNew(false);
      setForm({ name: "", slug: "", image: "" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("categories").update({ active }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({ admin_id: user!.id, action: active ? "activate" : "deactivate", entity: "category", entity_id: id });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "delete", entity: "category", entity_id: id });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-categories"] }); toast({ title: "Categoria excluída" }); },
  });

  const startEdit = (cat: any) => {
    setEditing(cat.id);
    setForm({ name: cat.name, slug: cat.slug, image: cat.image || "" });
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Categorias</h1>
        <button onClick={() => { setShowNew(true); setForm({ name: "", slug: "", image: "" }); }}
          className="bg-accent text-accent-foreground font-semibold text-sm px-4 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nova
        </button>
      </div>

      {showNew && (
        <div className="bg-card border rounded-lg p-4 mb-4 space-y-3">
          <h2 className="font-display font-semibold text-foreground text-sm">Nova Categoria</h2>
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })}
              className="bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
            <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
              className="bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => saveMutation.mutate({ data: { name: form.name, slug: form.slug, image: form.image } })}
              className="bg-accent text-accent-foreground text-sm px-4 py-2 rounded-lg font-semibold">Salvar</button>
            <button onClick={() => setShowNew(false)} className="text-sm text-muted-foreground px-4 py-2">Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-card border rounded-lg overflow-hidden">
        {categories.map((cat: any) => (
          <div key={cat.id} className={`flex items-center gap-3 p-3 border-b last:border-0 ${!cat.active ? "opacity-50" : ""}`}>
            <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0 cursor-grab" />
            {editing === cat.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-background border rounded px-2 py-1 text-sm text-foreground flex-1" />
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="bg-background border rounded px-2 py-1 text-sm text-foreground w-32" />
                <button onClick={() => saveMutation.mutate({ id: cat.id, data: { name: form.name, slug: form.slug } })}
                  className="text-xs text-accent font-semibold">Salvar</button>
                <button onClick={() => setEditing(null)} className="text-xs text-muted-foreground">Cancelar</button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{cat.name}</p>
                  <p className="text-xs text-muted-foreground">/{cat.slug}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive.mutate({ id: cat.id, active: !cat.active })} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                    {cat.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => startEdit(cat)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => { if (confirm("Excluir?")) deleteMutation.mutate(cat.id); }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {categories.length === 0 && !isLoading && <p className="text-center py-8 text-muted-foreground">Nenhuma categoria</p>}
      </div>
    </div>
  );
}
