import { useState } from "react";
import { Star, Camera, X, CheckCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ProductReview {
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
}

function useProductReviews(productId: string) {
  return useQuery({
    queryKey: ["product-reviews", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("product_id", productId)
        .eq("status", "approved")
        .order("is_pinned", { ascending: false })
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProductReview[];
    },
    enabled: !!productId,
  });
}

function StarRating({ rating, onChange, size = "sm" }: { rating: number; onChange?: (r: number) => void; size?: "sm" | "md" }) {
  const cls = size === "md" ? "h-6 w-6" : "h-4 w-4";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star className={`${cls} ${s <= rating ? "fill-warning text-warning" : "text-border"}`} />
        </button>
      ))}
    </div>
  );
}

function ReviewForm({ productId, onSuccess }: { productId: string; onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const valid = newFiles.filter(f => ["image/jpeg", "image/png", "image/webp"].includes(f.type));
    setFiles(prev => [...prev, ...valid].slice(0, 5));
  };

  const removeFile = (i: number) => setFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    if (rating === 0) { toast({ title: "Selecione pelo menos 1 estrela", variant: "destructive" }); return; }
    if (!comment.trim()) { toast({ title: "Comentário é obrigatório", variant: "destructive" }); return; }

    setSubmitting(true);
    try {
      // Upload images
      const imageUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("review-images").upload(path, file);
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from("review-images").getPublicUrl(path);
        imageUrls.push(urlData.publicUrl);
      }

      const { error } = await supabase.from("product_reviews").insert({
        product_id: productId,
        author_name: name.trim(),
        rating,
        title: title.trim() || null,
        body: comment.trim(),
        images: imageUrls,
        status: "pending",
        source: "customer",
      } as any);
      if (error) throw error;

      toast({ title: "Avaliação enviada! ✅", description: "Ela será publicada após aprovação." });
      setName(""); setRating(0); setTitle(""); setComment(""); setFiles([]);
      onSuccess();
    } catch (err: any) {
      toast({ title: "Erro ao enviar avaliação", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-secondary/50 rounded-lg p-4 space-y-4">
      <h4 className="font-display font-semibold text-foreground">Deixar avaliação</h4>
      {!user && <p className="text-xs text-muted-foreground">Você precisa estar logado para avaliar.</p>}
      <div>
        <label className="text-sm font-medium text-foreground">Seu nome *</label>
        <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Seu nome" disabled={!user} />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Nota *</label>
        <div className="mt-1"><StarRating rating={rating} onChange={user ? setRating : undefined} size="md" /></div>
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Título (opcional)</label>
        <input value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Resumo da sua experiência" disabled={!user} />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Comentário *</label>
        <textarea value={comment} onChange={e => setComment(e.target.value)} rows={3} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Conte sua experiência..." disabled={!user} />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground">Fotos (até 5)</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="relative w-16 h-16 rounded-md overflow-hidden border">
              <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => removeFile(i)} className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
            </div>
          ))}
          {files.length < 5 && user && (
            <label className="w-16 h-16 rounded-md border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-accent transition-colors">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFiles} className="hidden" />
            </label>
          )}
        </div>
      </div>
      <button type="submit" disabled={submitting || !user} className="bg-accent text-accent-foreground font-semibold py-2 px-6 rounded-lg text-sm hover:bg-accent/90 disabled:opacity-50 transition-colors">
        {submitting ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}

export function ProductReviews({ productId }: { productId: string }) {
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);

  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  const openLightbox = (images: string[], idx: number) => {
    setLightboxImages(images);
    setLightboxImg(images[idx]);
  };

  const currentIdx = lightboxImages.indexOf(lightboxImg || "");

  return (
    <div className="mt-14">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display font-bold text-xl text-foreground">Avaliações</h2>
          {reviews.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <StarRating rating={Math.round(avgRating)} />
              <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} ({reviews.length} avaliações)</span>
            </div>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-accent text-accent-foreground font-semibold py-2 px-4 rounded-lg text-sm hover:bg-accent/90 transition-colors">
          {showForm ? "Cancelar" : "Deixar avaliação"}
        </button>
      </div>

      {showForm && (
        <div className="mb-6">
          <ReviewForm productId={productId} onSuccess={() => { setShowForm(false); queryClient.invalidateQueries({ queryKey: ["product-reviews", productId] }); }} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 bg-secondary rounded-lg animate-pulse" />)}</div>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma avaliação ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.id} className="bg-secondary/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <StarRating rating={r.rating} />
                <span className="font-medium text-sm text-foreground">{r.author_name}</span>
                {r.is_featured && <span className="text-[10px] bg-accent/20 text-accent font-semibold px-1.5 py-0.5 rounded">Compra verificada</span>}
                {r.is_pinned && <span className="text-[10px] bg-warning/20 text-warning font-semibold px-1.5 py-0.5 rounded">Destaque</span>}
                <span className="text-xs text-muted-foreground ml-auto">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
              {r.title && <p className="font-medium text-sm text-foreground mt-1">{r.title}</p>}
              <p className="text-sm text-muted-foreground mt-1">{r.body}</p>
              {r.images && r.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {r.images.map((img, i) => (
                    <button key={i} onClick={() => openLightbox(r.images, i)} className="w-14 h-14 rounded-md overflow-hidden border hover:border-accent transition-colors">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <Dialog open={!!lightboxImg} onOpenChange={() => setLightboxImg(null)}>
        <DialogContent className="max-w-2xl p-2 bg-black/90 border-none">
          <div className="relative">
            <img src={lightboxImg || ""} alt="" className="w-full h-auto max-h-[80vh] object-contain rounded" />
            {lightboxImages.length > 1 && (
              <>
                <button onClick={() => setLightboxImg(lightboxImages[(currentIdx - 1 + lightboxImages.length) % lightboxImages.length])} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 rounded-full p-1.5"><ChevronLeft className="h-5 w-5 text-white" /></button>
                <button onClick={() => setLightboxImg(lightboxImages[(currentIdx + 1) % lightboxImages.length])} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 rounded-full p-1.5"><ChevronRight className="h-5 w-5 text-white" /></button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
