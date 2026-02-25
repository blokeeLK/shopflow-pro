import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

const SETTINGS_KEYS = [
  { key: "free_shipping_threshold", label: "Frete Grátis a partir de (R$)", type: "number" },
  { key: "whatsapp_number", label: "WhatsApp (DDI + DDD + número)", type: "text" },
  { key: "installment_count", label: "Número de parcelas", type: "number" },
  { key: "social_proof_interval_min", label: "Social Proof — intervalo mín (seg)", type: "number" },
  { key: "social_proof_interval_max", label: "Social Proof — intervalo máx (seg)", type: "number" },
  { key: "top_bar_message", label: "Mensagem barra topo (vazio = padrão)", type: "text" },
];

export default function AdminMarketing() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, string>>({});

  const { data: settings = {} } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.key] = s.value || ""; });
      return map;
    },
  });

  useEffect(() => { setValues(settings); }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      for (const [key, value] of Object.entries(values)) {
        if (value !== settings[key]) {
          await supabase.from("site_settings").update({ value }).eq("key", key);
        }
      }
      await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "update", entity: "site_settings", details: values });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-settings"] }); queryClient.invalidateQueries({ queryKey: ["site-settings"] }); toast({ title: "Configurações salvas!" }); },
  });

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Marketing & Configurações</h1>

      <div className="bg-card border rounded-lg p-4 space-y-4">
        {SETTINGS_KEYS.map(({ key, label, type }) => (
          <div key={key}>
            <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
            <input
              type={type}
              value={values[key] || ""}
              onChange={(e) => setValues({ ...values, [key]: e.target.value })}
              className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground"
            />
          </div>
        ))}

        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
          className="bg-accent text-accent-foreground font-semibold text-sm px-6 py-2.5 rounded-lg hover:bg-accent/90 flex items-center gap-2 disabled:opacity-50">
          <Save className="h-4 w-4" /> {saveMutation.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}
