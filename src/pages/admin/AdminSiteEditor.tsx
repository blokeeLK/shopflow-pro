import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Code, Save, RotateCcw, Eye, EyeOff } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

// ── Default HTML snapshots matching the actual site layout ──

const DEFAULT_HEADER_HTML = `<!-- Banner de topo customizável -->
<div style="background:#e11d48;color:#fff;text-align:center;font-size:12px;padding:8px 16px;font-family:sans-serif;">
  🔥 <strong>FRETE GRÁTIS</strong> acima de R$ 130
</div>`;

const DEFAULT_HOME_HTML = `<!-- Hero Banner -->
<section style="background:#1a1a2e;overflow:hidden;position:relative;">
  <div style="max-width:1200px;margin:0 auto;padding:64px 24px;position:relative;z-index:1;">
    <div style="max-width:480px;">
      <span style="display:inline-block;background:#e11d48;color:#fff;font-size:11px;font-weight:700;padding:4px 12px;border-radius:2px;margin-bottom:16px;">NOVA COLEÇÃO</span>
      <h1 style="font-size:40px;font-weight:700;color:#fff;line-height:1.15;margin-bottom:16px;font-family:'Inter',sans-serif;">
        Estilo que fala<br/>por você<span style="color:#e11d48">.</span>
      </h1>
      <p style="color:rgba(255,255,255,0.7);font-size:15px;margin-bottom:24px;line-height:1.6;">
        Descubra peças únicas com qualidade premium e preços que cabem no seu bolso.
      </p>
      <a href="/" style="display:inline-flex;align-items:center;gap:8px;background:#e11d48;color:#fff;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Ver coleção →
      </a>
    </div>
  </div>
</section>

<!-- Barra de confiança -->
<section style="border-bottom:1px solid #eee;background:#fff;">
  <div style="max-width:1200px;margin:0 auto;padding:16px 24px;display:flex;flex-wrap:wrap;justify-content:center;gap:32px;">
    <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#666;">
      🚚 <span>Frete grátis acima de R$130</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#666;">
      🛡️ <span>Compra 100% segura</span>
    </div>
    <div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#666;">
      💳 <span>Parcele em até 3x sem juros</span>
    </div>
  </div>
</section>

<!-- Seção de categorias (dinâmica - gerada pelo React) -->
<!-- As categorias e produtos são carregados automaticamente do banco de dados -->
<!-- Este HTML é exibido ACIMA do conteúdo dinâmico da Home -->`;

const DEFAULT_FOOTER_HTML = `<!-- Footer customizável -->
<footer style="background:#1a1a2e;color:#fff;padding:48px 0 0;">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:32px;">
      <div>
        <h3 style="font-size:18px;font-weight:700;margin-bottom:16px;">LOJA<span style="color:#e11d48">.</span></h3>
        <p style="font-size:14px;opacity:0.7;line-height:1.6;">Moda com estilo e qualidade. Entregamos em todo o Brasil com os melhores preços.</p>
      </div>
      <div>
        <h4 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;opacity:0.7;margin-bottom:16px;">Institucional</h4>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:14px;">
          <a href="/" style="color:#fff;opacity:0.7;text-decoration:none;">Sobre nós</a>
          <a href="/" style="color:#fff;opacity:0.7;text-decoration:none;">Política de troca</a>
          <a href="/" style="color:#fff;opacity:0.7;text-decoration:none;">Termos de uso</a>
        </div>
      </div>
      <div>
        <h4 style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1px;opacity:0.7;margin-bottom:16px;">Atendimento</h4>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:14px;opacity:0.7;">
          <span>Segunda a Sexta: 9h às 18h</span>
          <span>contato@loja.com.br</span>
          <span>(11) 99999-9999</span>
        </div>
      </div>
    </div>
    <div style="margin-top:40px;padding:24px 0;border-top:1px solid rgba(255,255,255,0.1);text-align:center;font-size:11px;opacity:0.5;">
      © 2026 LOJA. Todos os direitos reservados.
    </div>
  </div>
</footer>`;

interface SiteHtml {
  home_html: string;
  header_html: string;
  footer_html: string;
}

export default function AdminSiteEditor() {
  const { toast } = useToast();
  const { user } = useAuth();
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
      setLoading(false);
      return;
    }

    const d = data as any;
    const isEmpty = !d.home_html && !d.header_html && !d.footer_html;

    if (isEmpty) {
      // Auto-populate with default HTML from the actual site
      const defaults: SiteHtml = {
        home_html: DEFAULT_HOME_HTML,
        header_html: DEFAULT_HEADER_HTML,
        footer_html: DEFAULT_FOOTER_HTML,
      };
      setHtml(defaults);

      // Save defaults to DB so they persist
      await supabase
        .from("site_html" as any)
        .update({
          home_html: defaults.home_html,
          header_html: defaults.header_html,
          footer_html: defaults.footer_html,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        } as any)
        .eq("id", "singleton");

      toast({ title: "HTML padrão carregado automaticamente ✅" });
    } else {
      setHtml({
        home_html: d.home_html || "",
        header_html: d.header_html || "",
        footer_html: d.footer_html || "",
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
        updated_by: user?.id,
      } as any)
      .eq("id", "singleton");

    if (error) {
      console.error("Error saving HTML:", error);
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "HTML salvo com sucesso! ✅", description: "Atualize a loja para ver as mudanças." });
    }
    setSaving(false);
  }

  function handleRestore() {
    if (activeTab === "home") setHtml((h) => ({ ...h, home_html: DEFAULT_HOME_HTML }));
    if (activeTab === "header") setHtml((h) => ({ ...h, header_html: DEFAULT_HEADER_HTML }));
    if (activeTab === "footer") setHtml((h) => ({ ...h, footer_html: DEFAULT_FOOTER_HTML }));
    toast({ title: "HTML padrão restaurado (salve para aplicar)" });
  }

  function handleRestoreAll() {
    setHtml({
      home_html: DEFAULT_HOME_HTML,
      header_html: DEFAULT_HEADER_HTML,
      footer_html: DEFAULT_FOOTER_HTML,
    });
    toast({ title: "Todo HTML restaurado ao padrão (salve para aplicar)" });
  }

  const currentHtml = activeTab === "home" ? html.home_html : activeTab === "header" ? html.header_html : html.footer_html;

  function setCurrentHtml(value: string) {
    setHtml((h) => ({
      ...h,
      [activeTab === "home" ? "home_html" : activeTab === "header" ? "header_html" : "footer_html"]: value,
    }));
  }

  function sanitizeHtml(raw: string) {
    return raw
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/on\w+="[^"]*"/gi, "")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, "");
  }

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-muted-foreground text-sm">Carregando editor...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Code className="h-6 w-6 text-accent" /> Editor do Site (HTML)
        </h1>
        <div className="flex flex-wrap gap-2">
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
            <RotateCcw className="h-4 w-4" /> Restaurar aba
          </button>
          <button
            onClick={handleRestoreAll}
            className="flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <RotateCcw className="h-4 w-4" /> Restaurar tudo
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

      {/* Info */}
      <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mb-4 text-xs text-muted-foreground">
        💡 <strong>Dica:</strong> Edite o HTML de cada seção do site. O conteúdo salvo aparece automaticamente na loja. 
        Categorias e produtos continuam sendo carregados dinamicamente do banco de dados.
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 border-b">
        {([
          { key: "header" as const, label: "Header / Banner" },
          { key: "home" as const, label: "Home (Conteúdo)" },
          { key: "footer" as const, label: "Footer" },
        ]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 ${
              activeTab === key ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={`grid gap-6 ${showPreview ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
        {/* Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              HTML — {activeTab === "home" ? "HOME" : activeTab === "header" ? "HEADER / BANNER" : "FOOTER"}
            </label>
            <span className="text-[10px] text-muted-foreground">
              {currentHtml.length} caracteres
            </span>
          </div>
          <Textarea
            value={currentHtml}
            onChange={(e) => setCurrentHtml(e.target.value)}
            className="font-mono text-xs min-h-[500px] bg-background border rounded-lg leading-relaxed"
            placeholder={`Cole aqui o HTML para o ${activeTab}...`}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium uppercase tracking-wider">
              Pré-visualização
            </label>
            <div className="border rounded-lg bg-background min-h-[500px] overflow-auto">
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentHtml) }} />
            </div>
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground mt-4">
        ⚠️ Scripts, iframes e eventos inline são removidos automaticamente por segurança. Apenas HTML e CSS inline são permitidos.
      </p>
    </div>
  );
}