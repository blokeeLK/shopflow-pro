import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const CATEGORY_ORDER = ["Geral", "Sugestões", "Reclamações", "Troca", "Devolução"];

export default function FaqPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["faq-public"],
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
    staleTime: 60000,
  });

  const categories = CATEGORY_ORDER.filter(c => items.some(i => i.category === c));

  return (
    <div className="container max-w-3xl py-10 md:py-16">
      <div className="text-center mb-10">
        <HelpCircle className="h-10 w-10 text-accent mx-auto mb-3" />
        <h1 className="font-display text-3xl font-bold text-foreground">Perguntas Frequentes</h1>
        <p className="text-muted-foreground mt-2">Encontre respostas para as dúvidas mais comuns.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-card border rounded-lg animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">Nenhuma pergunta cadastrada ainda.</p>
      ) : (
        <div className="space-y-8">
          {categories.map(cat => (
            <div key={cat}>
              <h2 className="font-display font-bold text-lg text-foreground mb-3 border-b pb-2">{cat}</h2>
              <div className="space-y-2">
                {items.filter(i => i.category === cat).map((item, idx) => {
                  const globalIdx = items.indexOf(item);
                  const isOpen = openIdx === globalIdx;
                  return (
                    <div key={globalIdx} className="bg-card border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setOpenIdx(isOpen ? null : globalIdx)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-secondary/30 transition-colors"
                      >
                        <span className="font-medium text-sm text-foreground pr-4">{item.question}</span>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-line border-t pt-3">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
