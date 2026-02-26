import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, ImageIcon } from "lucide-react";

interface SlideData {
  id?: string;
  image_url: string;
  link: string;
  position: number;
  active: boolean;
  file?: File;
  preview?: string;
}

const emptySlide = (pos: number): SlideData => ({
  image_url: "",
  link: "",
  position: pos,
  active: true,
});

export default function AdminDesign() {
  const { toast } = useToast();
  const [slides, setSlides] = useState<SlideData[]>([emptySlide(1), emptySlide(2), emptySlide(3)]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("carousel_slides")
      .select("*")
      .order("position")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const merged = [1, 2, 3].map((pos) => {
            const existing = data.find((s) => s.position === pos);
            return existing ? { ...existing } : emptySlide(pos);
          });
          setSlides(merged);
        }
      });
  }, []);

  const handleFileChange = (index: number, file: File | undefined) => {
    if (!file) return;
    const updated = [...slides];
    updated[index] = {
      ...updated[index],
      file,
      preview: URL.createObjectURL(file),
    };
    setSlides(updated);
  };

  const handleLinkChange = (index: number, link: string) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], link };
    setSlides(updated);
  };

  const handleRemove = (index: number) => {
    const updated = [...slides];
    updated[index] = emptySlide(index + 1);
    setSlides(updated);
  };

  const uploadFile = async (file: File, position: number): Promise<string> => {
    const ext = file.name.split(".").pop();
    const path = `carousel/slide-${position}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Delete all existing slides
      await supabase.from("carousel_slides").delete().neq("id", "00000000-0000-0000-0000-000000000000");

      for (const slide of slides) {
        if (!slide.image_url && !slide.file) continue; // empty slot

        let imageUrl = slide.image_url;
        if (slide.file) {
          imageUrl = await uploadFile(slide.file, slide.position);
        }

        await supabase.from("carousel_slides").insert({
          image_url: imageUrl,
          link: slide.link || "",
          position: slide.position,
          active: true,
        });
      }

      toast({ title: "Carrossel salvo com sucesso!" });

      // Reload from DB
      const { data } = await supabase.from("carousel_slides").select("*").order("position");
      if (data) {
        const merged = [1, 2, 3].map((pos) => {
          const existing = data.find((s) => s.position === pos);
          return existing ? { ...existing } : emptySlide(pos);
        });
        setSlides(merged);
      }
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getDisplayImage = (slide: SlideData) => slide.preview || slide.image_url;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">🎨 Design do Site</h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie os elementos visuais da loja</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Carrossel da Página Inicial</CardTitle>
          <p className="text-muted-foreground text-sm">
            Envie até 3 imagens (1920×560px). Elas serão exibidas no topo da página principal.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {slides.map((slide, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="font-semibold">Slide {i + 1}</Label>
                {getDisplayImage(slide) && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemove(i)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Remover
                  </Button>
                )}
              </div>

              {getDisplayImage(slide) ? (
                <div className="relative rounded-md overflow-hidden bg-secondary">
                  <img
                    src={getDisplayImage(slide)}
                    alt={`Slide ${i + 1}`}
                    className="w-full h-auto max-h-[200px] object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-32 bg-secondary rounded-md border-2 border-dashed border-muted-foreground/30">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Label htmlFor={`file-${i}`} className="text-xs text-muted-foreground">Imagem</Label>
                  <div className="mt-1">
                    <label
                      htmlFor={`file-${i}`}
                      className="flex items-center gap-2 cursor-pointer text-sm text-accent hover:underline"
                    >
                      <Upload className="h-4 w-4" />
                      {getDisplayImage(slide) ? "Substituir imagem" : "Enviar imagem"}
                    </label>
                    <input
                      id={`file-${i}`}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileChange(i, e.target.files?.[0])}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <Label htmlFor={`link-${i}`} className="text-xs text-muted-foreground">Link (opcional)</Label>
                  <Input
                    id={`link-${i}`}
                    value={slide.link}
                    onChange={(e) => handleLinkChange(i, e.target.value)}
                    placeholder="/categoria/novidades"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          ))}

          <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
