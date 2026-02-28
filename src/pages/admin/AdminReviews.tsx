import { useState } from "react";
import { Star, Pin, Award, Trash2, Check, X, Plus, Search, Edit2, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Camera } from "lucide-react";

interface Review {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  images: string[];
  status: string;
  is_pinned: boolean;
  is_featured: boolean;
  source: string;
  created_at: string;
  product?: { name: string; slug: string } | null;
}

function useAdminReviews(filters: { status?: string; productId?: string }) {
  return useQuery({
    queryKey: ["admin-reviews", filters],
    queryFn: async () => {
      let query = supabase
        .from("product_reviews")
        .select("*, product:products(name, slug)")
        .order("created_at", { ascending: false });
      if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
      if (filters.productId) query = query.eq("product_id", filters.productId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as Review[];
    },
  });
}

function useAdminProducts() {
  return useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name").eq("active", true).order("name");
      if (error) throw error;
      return data || [];
    },
  });
}

function StarSelect({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" onClick={() => onChange(s)}>
          <Star className={`h-5 w-5 ${s <= rating ? "fill-warning text-warning" : "text-border"}`} />
        </button>
      ))}
    </div>
  );
}

const statusLabels: Record<string, string> = { pending: "Pendente", approved: "Aprovada", rejected: "Reprovada" };
const statusColors: Record<string, string> = { pending: "bg-warning/20 text-warning", approved: "bg-green-500/20 text-green-600", rejected: "bg-destructive/20 text-destructive" };

export default function AdminReviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: reviews = [], isLoading } = useAdminReviews({ status: statusFilter, productId: productFilter || undefined });
  const { data: products = [] } = useAdminProducts();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReview, setEditReview] = useState<Review | null>(null);

  // Form state
  const [formProductId, setFormProductId] = useState("");
  const [formName, setFormName] = useState("");
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formPinned, setFormPinned] = useState(false);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formFiles, setFormFiles] = useState<File[]>([]);
  const [formExistingImages, setFormExistingImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));

  const filteredReviews = reviews.filter(r =>
    !searchTerm || r.author_name.toLowerCase().includes(searchTerm.toLowerCase()) || r.body.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("product_reviews").update({ status } as any).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Avaliação ${statusLabels[status]?.toLowerCase() || status}` });
    invalidate();
  };

  const togglePin = async (id: string, current: boolean) => {
    await supabase.from("product_reviews").update({ is_pinned: !current } as any).eq("id", id);
    invalidate();
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await supabase.from("product_reviews").update({ is_featured: !current } as any).eq("id", id);
    invalidate();
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Excluir esta avaliação?")) return;
    await supabase.from("product_reviews").delete().eq("id", id);
    toast({ title: "Avaliação excluída" });
    invalidate();
  };

  const openCreate = () => {
    setEditReview(null);
    setFormProductId("");
    setFormName("");
    setFormRating(5);
    setFormTitle("");
    setFormBody("");
    setFormPinned(false);
    setFormFeatured(false);
    setFormFiles([]);
    setFormExistingImages([]);
    setProductSearch("");
    setDialogOpen(true);
  };

  const openEdit = (r: Review) => {
    setEditReview(r);
    setFormProductId(r.product_id);
    setFormName(r.author_name);
    setFormRating(r.rating);
    setFormTitle(r.title || "");
    setFormBody(r.body);
    setFormPinned(r.is_pinned);
    setFormFeatured(r.is_featured);
    setFormFiles([]);
    setFormExistingImages(r.images || []);
    setProductSearch("");
    setDialogOpen(true);
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []).filter(f => ["image/jpeg", "image/png", "image/webp"].includes(f.type));
    setFormFiles(prev => [...prev, ...newFiles].slice(0, 5 - formExistingImages.length));
  };

  const handleSave = async () => {
    if (!formProductId) { toast({ title: "Selecione um produto", variant: "destructive" }); return; }
    if (!formName.trim()) { toast({ title: "Nome obrigatório", variant: "destructive" }); return; }
    if (!formBody.trim()) { toast({ title: "Texto obrigatório", variant: "destructive" }); return; }

    setSaving(true);
    try {
      // Upload new images
      const newUrls: string[] = [];
      for (const file of formFiles) {
        const ext = file.name.split(".").pop();
        const path = `${formProductId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("review-images").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("review-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }

      const allImages = [...formExistingImages, ...newUrls];

      if (editReview) {
        const { error } = await supabase.from("product_reviews").update({
          product_id: formProductId,
          author_name: formName.trim(),
          rating: formRating,
          title: formTitle.trim() || null,
          body: formBody.trim(),
          images: allImages,
          is_pinned: formPinned,
          is_featured: formFeatured,
        } as any).eq("id", editReview.id);
        if (error) throw error;
        toast({ title: "Avaliação atualizada ✅" });
      } else {
        const { error } = await supabase.from("product_reviews").insert({
          product_id: formProductId,
          author_name: formName.trim(),
          rating: formRating,
          title: formTitle.trim() || null,
          body: formBody.trim(),
          images: allImages,
          status: "approved",
          source: "admin",
          is_pinned: formPinned,
          is_featured: formFeatured,
        } as any);
        if (error) throw error;
        toast({ title: "Avaliação criada ✅" });
      }

      setDialogOpen(false);
      invalidate();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-foreground">Avaliações</h1>
        <button onClick={openCreate} className="bg-accent text-accent-foreground font-semibold py-2 px-4 rounded-lg text-sm hover:bg-accent/90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Criar avaliação
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar por nome ou texto..." className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="all">Todos status</option>
          <option value="pending">Pendente</option>
          <option value="approved">Aprovada</option>
          <option value="rejected">Reprovada</option>
        </select>
        <select value={productFilter} onChange={e => setProductFilter(e.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm max-w-[200px]">
          <option value="">Todos produtos</option>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 bg-secondary rounded-lg animate-pulse" />)}</div>
      ) : filteredReviews.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhuma avaliação encontrada.</p>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map((r) => (
            <div key={r.id} className="bg-card border rounded-lg p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-foreground">{r.author_name}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-warning text-warning" : "text-border"}`} />)}
                    </div>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${statusColors[r.status]}`}>{statusLabels[r.status]}</span>
                    {r.source === "admin" && <span className="text-[10px] bg-blue-500/20 text-blue-600 font-semibold px-1.5 py-0.5 rounded">Manual</span>}
                    {r.is_pinned && <span className="text-[10px] bg-warning/20 text-warning font-semibold px-1.5 py-0.5 rounded">Fixada</span>}
                    {r.is_featured && <span className="text-[10px] bg-accent/20 text-accent font-semibold px-1.5 py-0.5 rounded">Verificada</span>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Produto: {(r.product as any)?.name || "—"} · {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </p>
                  {r.title && <p className="font-medium text-sm text-foreground mt-1">{r.title}</p>}
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.body}</p>
                  {r.images && r.images.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {r.images.map((img, i) => (
                        <img key={i} src={img} alt="" className="w-10 h-10 rounded object-cover border" />
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {r.status === "pending" && (
                    <>
                      <button onClick={() => updateStatus(r.id, "approved")} title="Aprovar" className="p-1.5 rounded hover:bg-green-500/10 text-green-600"><Check className="h-4 w-4" /></button>
                      <button onClick={() => updateStatus(r.id, "rejected")} title="Reprovar" className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><X className="h-4 w-4" /></button>
                    </>
                  )}
                  {r.status === "rejected" && (
                    <button onClick={() => updateStatus(r.id, "approved")} title="Aprovar" className="p-1.5 rounded hover:bg-green-500/10 text-green-600"><Check className="h-4 w-4" /></button>
                  )}
                  {r.status === "approved" && (
                    <button onClick={() => updateStatus(r.id, "rejected")} title="Reprovar" className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><X className="h-4 w-4" /></button>
                  )}
                  <button onClick={() => togglePin(r.id, r.is_pinned)} title="Fixar" className={`p-1.5 rounded hover:bg-warning/10 ${r.is_pinned ? "text-warning" : "text-muted-foreground"}`}><Pin className="h-4 w-4" /></button>
                  <button onClick={() => toggleFeatured(r.id, r.is_featured)} title="Destacar" className={`p-1.5 rounded hover:bg-accent/10 ${r.is_featured ? "text-accent" : "text-muted-foreground"}`}><Award className="h-4 w-4" /></button>
                  <button onClick={() => openEdit(r)} title="Editar" className="p-1.5 rounded hover:bg-secondary text-muted-foreground"><Edit2 className="h-4 w-4" /></button>
                  <button onClick={() => deleteReview(r.id)} title="Excluir" className="p-1.5 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editReview ? "Editar avaliação" : "Criar avaliação manual"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Produto *</label>
              <input value={productSearch} onChange={e => setProductSearch(e.target.value)} placeholder="Buscar produto..." className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              {productSearch && !formProductId && (
                <div className="mt-1 max-h-32 overflow-y-auto border rounded-md bg-card">
                  {filteredProducts.map(p => (
                    <button key={p.id} onClick={() => { setFormProductId(p.id); setProductSearch(p.name); }} className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary">
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
              {formProductId && <p className="text-xs text-muted-foreground mt-1">Selecionado: {products.find(p => p.id === formProductId)?.name}</p>}
            </div>
            <div>
              <label className="text-sm font-medium">Nome do cliente *</label>
              <input value={formName} onChange={e => setFormName(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Nota *</label>
              <div className="mt-1"><StarSelect rating={formRating} onChange={setFormRating} /></div>
            </div>
            <div>
              <label className="text-sm font-medium">Título (opcional)</label>
              <input value={formTitle} onChange={e => setFormTitle(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-sm font-medium">Texto da avaliação *</label>
              <textarea value={formBody} onChange={e => setFormBody(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" />
            </div>
            <div>
              <label className="text-sm font-medium">Fotos</label>
              <div className="mt-1 flex flex-wrap gap-2">
                {formExistingImages.map((img, i) => (
                  <div key={i} className="relative w-14 h-14 rounded-md overflow-hidden border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormExistingImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                {formFiles.map((f, i) => (
                  <div key={`new-${i}`} className="relative w-14 h-14 rounded-md overflow-hidden border">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setFormFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                {(formExistingImages.length + formFiles.length) < 5 && (
                  <label className="w-14 h-14 rounded-md border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} className="hidden" />
                  </label>
                )}
              </div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formPinned} onChange={e => setFormPinned(e.target.checked)} className="rounded" /> Fixar no topo
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={formFeatured} onChange={e => setFormFeatured(e.target.checked)} className="rounded" /> Compra verificada
              </label>
            </div>
            <button onClick={handleSave} disabled={saving} className="w-full bg-accent text-accent-foreground font-semibold py-2.5 rounded-lg text-sm hover:bg-accent/90 disabled:opacity-50">
              {saving ? "Salvando..." : editReview ? "Salvar alterações" : "Criar avaliação"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
