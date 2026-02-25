import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Code, Save, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const DEFAULT_HOME_HTML = `<div style="text-align:center;padding:40px 20px;">
  <h2>Bem-vindo à nossa loja!</h2>
  <p>Confira nossas novidades e promoções.</p>
</div>`;

const DEFAULT_HEADER_HTML = "";
const DEFAULT_FOOTER_HTML = "";

interface SiteHtml {
  home_html: string;
  header_html: string;
  footer_html: string;
}

export default function AdminSiteEditor() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "header" | "footer">("home");
  const [html, setHtml] = useState<SiteHtml>({ home_html: "", header_html: "", footer_html: "" });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadHtml();
  }, []);

  async function loadHtml() {
    setLoading(true);
    const { data, error } = await supabase
      .from("site_html" as any)
      .select("home_html, header_html, footer_html")
      .eq("id", "singleton")
      .single();

    if (error) {
      console.error("Error loading site HTML:", error);
      toast({ title: "Erro ao carregar HTML", variant: "destructive" });
    } else if (data) {
      setHtml({
        home_html: (data as any).home_html || "",
        header_html: (data as any).header_html || "",
        footer_html: (data as any).footer_html || "",
      });
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("site_html" as any)
      .update({
        home_html: html.home_html,
        header_html: html.header_html,
        footer_html: html.footer_html,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", "singleton");

    if (error) {
      console.error("Error saving HTML:", error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "HTML salvo com sucesso! ✅" });
    }
    setSaving(false);
  }

  function handleRestore() {
    if (activeTab === "home") setHtml((h) => ({ ...h, home_html: DEFAULT_HOME_HTML }));
    if (activeTab === "header") setHtml((h) => ({ ...h, header_html: DEFAULT_HEADER_HTML }));
    if (activeTab === "footer") setHtml((h) => ({ ...h, footer_html: DEFAULT_FOOTER_HTML }));
    toast({ title: "HTML padrão restaurado (salve para aplicar)" });
  }

  const currentHtml = activeTab === "home" ? html.home_html : activeTab === "header" ? html.header_html : html.footer_html;

  function setCurrentHtml(value: string) {
    setHtml((h) => ({
      ...h,
      [activeTab === "home" ? "home_html" : activeTab === "header" ? "header_html" : "footer_html"]: value,
    }));
  }

  // Sanitize for preview (strip scripts)
  function sanitizeHtml(raw: string) {
    return raw.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/on\w+="[^"]*"/gi, "");
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-muted-foreground text-sm">Carregando editor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Code className="h-6 w-6 text-accent" /> Editor do Site (HTML)
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? "Esconder" : "Preview"}
          </button>
          <button
            onClick={handleRestore}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Restaurar padrão
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 font-semibold disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {(["home", "header", "footer"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "home" ? "Home" : tab === "header" ? "Header" : "Footer"}
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Editor */}
        <div>
          <label className="text-xs text-muted-foreground mb-2 block font-medium uppercase tracking-wider">
            HTML — {activeTab.toUpperCase()}
          </label>
          <Textarea
            value={currentHtml}
            onChange={(e) => setCurrentHtml(e.target.value)}
            className="font-mono text-xs min-h-[400px] bg-background border rounded-lg"
            placeholder={`Cole aqui o HTML para o ${activeTab}...`}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium uppercase tracking-wider">
              Pré-visualização
            </label>
            <div className="border rounded-lg bg-background p-4 min-h-[400px] overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentHtml) }} />
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-4">
        ⚠️ Scripts e eventos inline são removidos automaticamente por segurança. Apenas HTML e CSS inline são permitidos.
      </p>
    </div>
  );
}