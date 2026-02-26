import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2, Upload } from "lucide-react";

interface Variant { id?: string; size: string; stock: number; }
interface ImageItem { id?: string; url: string; position: number; file?: File; }

export default function AdminProductForm() {
  const { id } = useParams();
  const isNew = !id || id === "novo";
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: "", slug: "", description: "", category_id: "", price: 0, promo_price: null as number | null,
    is_promo: false, promo_end_date: "", is_featured: false, active: true,
    weight: 0, width: 0, height: 0, length: 0, installment_count: 3, sold_count: 0,
  });
  const [variants, setVariants] = useState<Variant[]>([{ size: "", stock: 0 }]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories-list"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id, name").order("name");
      return data || [];
    },
  });

  // Load existing product
  const { data: existing } = useQuery({
    queryKey: ["admin-product", id],
    queryFn: async () => {
      if (isNew) return null;
      const { data, error } = await supabase
        .from("products")
        .select("*, product_variants(*), product_images(*)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name, slug: existing.slug, description: existing.description || "",
        category_id: existing.category_id || "", price: existing.price, promo_price: existing.promo_price,
        is_promo: existing.is_promo, promo_end_date: existing.promo_end_date ? existing.promo_end_date.slice(0, 16) : "",
        is_featured: existing.is_featured, active: existing.active,
        weight: existing.weight || 0, width: existing.width || 0, height: existing.height || 0, length: existing.length || 0,
        installment_count: existing.installment_count || 3, sold_count: existing.sold_count || 0,
      });
      setVariants(
        (existing.product_variants || []).map((v: any) => ({ id: v.id, size: v.size, stock: v.stock }))
      );
      setImages(
        (existing.product_images || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)).map((img: any, i: number) => ({ id: img.id, url: img.url, position: i }))
      );
    }
  }, [existing]);

  const generateSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    for (const file of files) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast({ title: "Erro ao enviar imagem", variant: "destructive" }); continue; }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setImages((prev) => [...prev, { url: urlData.publicUrl, position: prev.length }]);
    }
  };

  const removeImage = async (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx).map((img, i) => ({ ...img, position: i })));
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || form.price <= 0) {
      toast({ title: "Preencha nome, slug e preço", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const productData = {
        name: form.name, slug: form.slug, description: form.description,
        category_id: form.category_id || null, price: form.price,
        promo_price: form.is_promo ? form.promo_price : null,
        is_promo: form.is_promo, promo_end_date: form.promo_end_date ? new Date(form.promo_end_date).toISOString() : null,
        is_featured: form.is_featured, active: form.active,
        weight: form.weight, width: form.width, height: form.height, length: form.length,
        installment_count: form.installment_count, sold_count: form.sold_count,
      };

      let productId: string;
      if (isNew) {
        const { data, error } = await supabase.from("products").insert(productData).select("id").single();
        if (error) throw error;
        productId = data.id;
        await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "create", entity: "product", entity_id: productId, details: { name: form.name } });
      } else {
        const { error } = await supabase.from("products").update(productData).eq("id", id!);
        if (error) throw error;
        productId = id!;
        await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "update", entity: "product", entity_id: productId, details: { name: form.name } });
      }

      // Variants: delete existing, insert fresh
      if (!isNew) {
        await supabase.from("product_variants").delete().eq("product_id", productId);
      }
      const validVariants = variants.filter((v) => v.size.trim());
      if (validVariants.length > 0) {
        await supabase.from("product_variants").insert(
          validVariants.map((v) => ({ product_id: productId, size: v.size, stock: v.stock }))
        );
      }

      // Images: delete existing, insert fresh
      if (!isNew) {
        await supabase.from("product_images").delete().eq("product_id", productId);
      }
      if (images.length > 0) {
        await supabase.from("product_images").insert(
          images.map((img, i) => ({ product_id: productId, url: img.url, position: i }))
        );
      }

      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({ title: isNew ? "Produto criado!" : "Produto atualizado!" });
      navigate("/admin/produtos");
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <button onClick={() => navigate("/admin/produtos")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">{isNew ? "Novo Produto" : "Editar Produto"}</h1>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <h2 className="font-display font-semibold text-foreground text-sm">Informações Básicas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Nome *</label>
              <input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value, slug: isNew ? generateSlug(e.target.value) : form.slug }); }}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Slug *</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Categoria</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="">Sem categoria</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Parcelas</label>
              <input type="number" value={form.installment_count} onChange={(e) => setForm({ ...form, installment_count: Number(e.target.value) })}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Descrição</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3}
              className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <h2 className="font-display font-semibold text-foreground text-sm">Preço e Promoção</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Preço (R$) *</label>
              <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input type="checkbox" checked={form.is_promo} onChange={(e) => setForm({ ...form, is_promo: e.target.checked })} className="rounded" />
                Promoção
              </label>
            </div>
            {form.is_promo && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground">Preço Promo (R$)</label>
                  <input type="number" step="0.01" value={form.promo_price || ""} onChange={(e) => setForm({ ...form, promo_price: Number(e.target.value) })}
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Fim da Promoção</label>
                  <input type="datetime-local" value={form.promo_end_date} onChange={(e) => setForm({ ...form, promo_end_date: e.target.value })}
                    className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Flags + Sold Count */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded" /> Destaque
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} className="rounded" /> Ativo
            </label>
          </div>
          <div className="max-w-[200px]">
            <label className="text-xs text-muted-foreground">Quantidade já vendida</label>
            <input type="number" min="0" step="1" value={form.sold_count} onChange={(e) => setForm({ ...form, sold_count: Math.max(0, Math.floor(Number(e.target.value))) })}
              className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
          </div>
        </div>

        {/* Dimensions */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <h2 className="font-display font-semibold text-foreground text-sm">Peso e Dimensões (para frete)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Peso (kg)", key: "weight" },
              { label: "Largura (cm)", key: "width" },
              { label: "Altura (cm)", key: "height" },
              { label: "Comprimento (cm)", key: "length" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-xs text-muted-foreground">{f.label}</label>
                <input type="number" step="0.01" value={(form as any)[f.key]} onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
              </div>
            ))}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-foreground text-sm">Variantes (Tamanhos)</h2>
            <button onClick={() => setVariants([...variants, { size: "", stock: 0 }])} className="text-xs text-accent hover:underline flex items-center gap-1">
              <Plus className="h-3 w-3" /> Adicionar
            </button>
          </div>
          {variants.map((v, i) => (
            <div key={i} className="flex items-center gap-2">
              <input placeholder="Tamanho" value={v.size} onChange={(e) => { const n = [...variants]; n[i].size = e.target.value; setVariants(n); }}
                className="w-24 bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
              <input type="number" placeholder="Estoque" value={v.stock} onChange={(e) => { const n = [...variants]; n[i].stock = Number(e.target.value); setVariants(n); }}
                className="w-24 bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
              <button onClick={() => setVariants(variants.filter((_, j) => j !== i))} className="p-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Images */}
        <div className="bg-card border rounded-lg p-4 space-y-3">
          <h2 className="font-display font-semibold text-foreground text-sm">Imagens</h2>
          <div className="flex flex-wrap gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative w-20 h-24 rounded-md overflow-hidden border group">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
                <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="w-20 h-24 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground hover:border-foreground transition-colors">
              <Upload className="h-5 w-5" />
              <span className="text-[10px] mt-1">Upload</span>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="w-full bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 text-sm disabled:opacity-50">
          {saving ? "Salvando..." : isNew ? "Criar Produto" : "Salvar Alterações"}
        </button>
      </div>
    </div>
  );
}
