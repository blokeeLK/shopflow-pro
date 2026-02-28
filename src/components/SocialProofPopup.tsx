import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const fakeNames = ["Maria S.", "João P.", "Ana L.", "Carlos M.", "Fernanda R.", "Pedro H.", "Julia C.", "Lucas O.", "Camila T.", "Rafael B."];
const fakeCities = ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Salvador", "Fortaleza", "Brasília", "Porto Alegre"];

export function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState({ name: "", product: "", city: "" });
  const [productNames, setProductNames] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("name, product_variants(stock)")
      .eq("active", true)
      .then(({ data }) => {
        const names = (data || [])
          .filter((p: any) => (p.product_variants as any[])?.some((v: any) => v.stock > 0))
          .map((p: any) => p.name);
        setProductNames(names);
      });
  }, []);

  useEffect(() => {
    if (productNames.length === 0) return;
    const show = () => {
      setNotification({
        name: fakeNames[Math.floor(Math.random() * fakeNames.length)],
        product: productNames[Math.floor(Math.random() * productNames.length)],
        city: fakeCities[Math.floor(Math.random() * fakeCities.length)],
      });
      setVisible(true);
      setTimeout(() => setVisible(false), 4000);
    };
    const interval = setInterval(show, 25000 + Math.random() * 20000);
    const initial = setTimeout(show, 5000);
    return () => { clearInterval(interval); clearTimeout(initial); };
  }, [productNames]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs bg-card rounded-lg shadow-elevated border p-3 animate-slide-in-right">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-black">{notification.name.charAt(0)}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground"><span className="font-bold">{notification.name}</span> comprou</p>
          <p className="text-xs text-muted-foreground truncate">{notification.product}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{notification.city} • agora mesmo</p>
        </div>
      </div>
    </div>
  );
}
