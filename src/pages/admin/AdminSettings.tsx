import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Save, Building2, Phone, Mail, ImageIcon, Upload, Loader2 } from "lucide-react";

const SETTING_KEYS = ["company_address", "company_phone", "company_email", "site_logo_url"];

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", SETTING_KEYS);
      const map: Record<string, string> = {};
      SETTING_KEYS.forEach(k => { map[k] = ""; });
      (data || []).forEach((s: any) => { map[s.key] = s.value || ""; });
      return map;
    },
  });

  const [form, setForm] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentValues = { ...settings, ...form };

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem válida", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `logo/site-logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
      setForm(f => ({ ...f, site_logo_url: urlData.publicUrl }));
      toast({ title: "Logo enviada! Salve para aplicar ✅" });
    } catch (err: any) {
      toast({ title: "Erro ao enviar logo", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const key of SETTING_KEYS) {
        const value = currentValues[key] || "";
        // Upsert each setting
        const { data: existing } = await supabase
          .from("site_settings")
          .select("id")
          .eq("key", key)
          .maybeSingle();

        if (existing) {
          await supabase.from("site_settings").update({ value }).eq("key", key);
        } else {
          await supabase.from("site_settings").insert({ key, value });
        }
      }
      await supabase.from("admin_logs").insert({
        admin_id: user!.id,
        action: "update_settings",
        entity: "site_settings",
        details: currentValues,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings-footer"] });
      toast({ title: "Configurações salvas! ✅" });
      setForm({});
    },
    onError: (err: any) => {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Configurações da Loja</h1>

      <div className="bg-card border rounded-xl p-6 space-y-5">
        {/* Logo Upload */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-accent" /> Logo do Site (Header + Footer)
          </label>
          <div className="flex items-center gap-4">
            {currentValues.site_logo_url ? (
              <img src={currentValues.site_logo_url} alt="Logo atual" className="h-16 w-auto object-contain bg-[#1a1a2e] rounded-lg p-2" />
            ) : (
              <div className="h-16 w-24 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
                Sem logo
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 text-sm border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Enviando..." : "Enviar nova logo"}
              </button>
              <p className="text-[11px] text-muted-foreground mt-1">PNG ou JPG recomendado. Fundo transparente ideal.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-accent" /> Endereço da Sede
          </label>
          <textarea
            value={currentValues.company_address || ""}
            onChange={(e) => setForm(f => ({ ...f, company_address: e.target.value }))}
            placeholder="Rua Exemplo, 123 - Centro&#10;Pará de Minas - MG&#10;CEP: 35660-000"
            className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground resize-none"
            rows={3}
            maxLength={500}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
            <Phone className="h-4 w-4 text-accent" /> Telefone de Contato
          </label>
          <input
            value={currentValues.company_phone || ""}
            onChange={(e) => setForm(f => ({ ...f, company_phone: e.target.value }))}
            placeholder="(37) 99999-9999"
            className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground"
            maxLength={20}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1 flex items-center gap-2">
            <Mail className="h-4 w-4 text-accent" /> E-mail de Contato
          </label>
          <input
            value={currentValues.company_email || ""}
            onChange={(e) => setForm(f => ({ ...f, company_email: e.target.value }))}
            placeholder="contato@loja.com.br"
            className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground"
            maxLength={100}
          />
        </div>

        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="w-full bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
        >
          <Save className="h-4 w-4" /> {saveMutation.isPending ? "Salvando..." : "Salvar configurações"}
        </button>
      </div>
    </div>
  );
}
