import { Link } from "react-router-dom";
import { useCategoriesWithStock } from "@/hooks/useSupabaseData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function Footer() {
  const { data: categories = [] } = useCategoriesWithStock();

  const { data: settings } = useQuery({
    queryKey: ["site-settings-footer"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["company_address", "company_phone", "company_email"]);
      const map: Record<string, string> = {};
      (data || []).forEach((s: any) => { map[s.key] = s.value || ""; });
      return map;
    },
    staleTime: 60000,
  });

  return (
    <footer className="bg-[#1a1a2e] text-white mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src="/images/logo-shopflow.png" alt="ShopFlow" className="h-16 md:h-20 w-auto mb-4" />
            <p className="text-sm opacity-70 leading-relaxed">Moda com estilo e qualidade. Entregamos em todo o Brasil com os melhores preços.</p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 opacity-70">Categorias</h4>
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <Link key={cat.slug} to={`/categoria/${cat.slug}`} className="text-sm opacity-70 hover:opacity-100 transition-opacity">{cat.name}</Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 opacity-70">Atendimento</h4>
            <div className="flex flex-col gap-2 text-sm opacity-70">
              <span>Segunda a Sexta: 9h às 18h</span>
              <span>{settings?.company_email || "contato@loja.com.br"}</span>
              <span>{settings?.company_phone || "(11) 99999-9999"}</span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 opacity-70">Sede</h4>
            <p className="text-sm opacity-70 leading-relaxed whitespace-pre-line">
              {settings?.company_address || "Endereço não configurado"}
            </p>
            <Link to="/faq" className="text-sm opacity-70 hover:opacity-100 transition-opacity mt-3 inline-block">
              Perguntas Frequentes →
            </Link>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-primary-foreground/10 text-center text-xs opacity-50">© 2026 ShopFlow. Todos os direitos reservados.</div>
      </div>
    </footer>
  );
}
