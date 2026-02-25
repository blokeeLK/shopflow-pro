import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Eye, EyeOff, Upload } from "lucide-react";

export default function AdminBanners() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", link: "", image: "", start_date: "", end_date: "" });
  const [uploading, setUploading] = useState(false);

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("position");
      if (error) throw error;
      return data;
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast({ title: "Erro no upload", variant: "destructive" }); setUploading(false); return; }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm((f) => ({ ...f, image: data.publicUrl }));
    setUploading(false);
  };

  const createBanner = useMutation({
    mutationFn: async () => {
      if (!form.image) throw new Error("Imagem obrigatória");
      const { error } = await supabase.from("banners").insert({
        title: form.title, link: form.link, image: form.image,
        start_date: form.start_date || null, end_date: form.end_date || null,
        position: banners.length,
      });
      if (error) throw error;
      await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "create", entity: "banner", details: { title: form.title } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-banners"] }); toast({ title: "Banner criado!" }); setShowNew(false); setForm({ title: "", link: "", image: "", start_date: "", end_date: "" }); },
    onError: (e: any) => toast({ title: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("banners").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] }),
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "delete", entity: "banner", entity_id: id });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-banners"] }); toast({ title: "Banner excluído" }); },
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Banners</h1>
        <button onClick={() => setShowNew(true)} className="bg-accent text-accent-foreground font-semibold text-sm px-4 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Novo Banner
        </button>
      </div>

      {showNew && (
        <div className="bg-card border rounded-lg p-4 mb-6 space-y-3">
          <input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
          <input placeholder="Link (opcional)" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })}
            className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-muted-foreground">Início</label><input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" /></div>
            <div><label className="text-xs text-muted-foreground">Fim</label><input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" /></div>
          </div>
          <div className="flex items-center gap-3">
            {form.image && <img src={form.image} alt="" className="h-16 rounded" />}
            <label className="border border-dashed rounded-lg px-4 py-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-2">
              <Upload className="h-4 w-4" /> {uploading ? "Enviando..." : "Upload Imagem"}
              <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            </label>
          </div>
          <div className="flex gap-2">
            <button onClick={() => createBanner.mutate()} className="bg-accent text-accent-foreground text-sm px-4 py-2 rounded-lg font-semibold">Salvar</button>
            <button onClick={() => setShowNew(false)} className="text-sm text-muted-foreground px-4 py-2">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {banners.map((b: any) => (
          <div key={b.id} className={`bg-card border rounded-lg p-4 flex items-center gap-4 ${!b.active ? "opacity-50" : ""}`}>
            <img src={b.image} alt={b.title} className="w-24 h-14 object-cover rounded" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{b.title || "Sem título"}</p>
              {b.link && <p className="text-xs text-muted-foreground truncate">{b.link}</p>}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => toggleActive.mutate({ id: b.id, active: !b.active })} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                {b.active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => { if (confirm("Excluir?")) deleteBanner.mutate(b.id); }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        {banners.length === 0 && !isLoading && <p className="text-center py-10 text-muted-foreground">Nenhum banner cadastrado</p>}
      </div>
    </div>
  );
}
