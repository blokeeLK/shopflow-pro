import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Save, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const FAQ_CATEGORIES = ["Sugestões", "Reclamações", "Troca", "Devolução", "Geral"];

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

export default function AdminFaq() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: faqData, isLoading } = useQuery({
    queryKey: ["admin-faq"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "faq_items")
        .maybeSingle();
      try {
        return data?.value ? JSON.parse(data.value) as FaqItem[] : [];
      } catch {
        return [];
      }
    },
  });

  const [items, setItems] = useState<FaqItem[] | null>(null);
  const currentItems = items ?? faqData ?? [];

  const addItem = () => {
    setItems([...currentItems, { question: "", answer: "", category: "Geral" }]);
  };

  const removeItem = (idx: number) => {
    setItems(currentItems.filter((_, i) => i !== idx));
  };

  const updateItem = (idx: number, field: keyof FaqItem, value: string) => {
    const updated = [...currentItems];
    updated[idx] = { ...updated[idx], [field]: value };
    setItems(updated);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const value = JSON.stringify(currentItems.filter(i => i.question.trim() && i.answer.trim()));
      const { data: existing } = await supabase.from("site_settings").select("id").eq("key", "faq_items").maybeSingle();
      if (existing) {
        await supabase.from("site_settings").update({ value }).eq("key", "faq_items");
      } else {
        await supabase.from("site_settings").insert({ key: "faq_items", value });
      }
      await supabase.from("admin_logs").insert({
        admin_id: user!.id, action: "update_faq", entity: "site_settings", details: { count: currentItems.length },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faq"] });
      queryClient.invalidateQueries({ queryKey: ["faq-public"] });
      toast({ title: "FAQ salvo! ✅" });
      setItems(null);
    },
  });

  if (isLoading) return <div className="p-6"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Perguntas Frequentes</h1>
        <button onClick={addItem} className="bg-accent text-accent-foreground font-semibold text-sm px-4 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-2">
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </div>

      <div className="space-y-3">
        {currentItems.map((item, idx) => (
          <div key={idx} className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-1 space-y-3">
                <select
                  value={item.category}
                  onChange={(e) => updateItem(idx, "category", e.target.value)}
                  className="bg-background border rounded-lg px-3 py-1.5 text-sm text-foreground"
                >
                  {FAQ_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input
                  value={item.question}
                  onChange={(e) => updateItem(idx, "question", e.target.value)}
                  placeholder="Pergunta..."
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground font-medium"
                  maxLength={200}
                />
                <textarea
                  value={item.answer}
                  onChange={(e) => updateItem(idx, "answer", e.target.value)}
                  placeholder="Resposta..."
                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground resize-none"
                  rows={3}
                  maxLength={1000}
                />
              </div>
              <button onClick={() => removeItem(idx)} className="p-2 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}

        {currentItems.length === 0 && (
          <p className="text-center py-10 text-muted-foreground">Nenhuma pergunta adicionada. Clique em "Adicionar" para começar.</p>
        )}
      </div>

      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full mt-6 bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
      >
        <Save className="h-4 w-4" /> {saveMutation.isPending ? "Salvando..." : "Salvar FAQ"}
      </button>
    </div>
  );
}
