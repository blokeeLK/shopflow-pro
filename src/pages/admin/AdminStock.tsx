import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Package } from "lucide-react";

export default function AdminStock() {
  const { data: variants = [], isLoading } = useQuery({
    queryKey: ["admin-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variants")
        .select("*, products(name, active, category:categories(name))")
        .order("stock", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const lowStock = variants.filter((v: any) => v.stock <= 5 && v.stock > 0);
  const outOfStock = variants.filter((v: any) => v.stock === 0);
  const inStock = variants.filter((v: any) => v.stock > 5);

  const Section = ({ title, items, icon, color }: { title: string; items: any[]; icon: any; color: string }) => (
    <div className="mb-8">
      <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
        {icon} {title} <span className="text-xs text-muted-foreground font-normal">({items.length})</span>
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum item</p>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Produto</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Categoria</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Tamanho</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Estoque</th>
              </tr>
            </thead>
            <tbody>
              {items.map((v: any) => (
                <tr key={v.id} className="border-b last:border-0">
                  <td className="p-3 text-foreground">{v.products?.name}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{v.products?.category?.name || "—"}</td>
                  <td className="p-3 text-center text-foreground">{v.size}</td>
                  <td className={`p-3 text-right font-bold ${color}`}>{v.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  if (isLoading) return <div className="p-8"><p className="text-muted-foreground">Carregando...</p></div>;

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Estoque</h1>
      
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{outOfStock.length}</p>
          <p className="text-xs text-muted-foreground">Sem estoque</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-warning">{lowStock.length}</p>
          <p className="text-xs text-muted-foreground">Estoque baixo</p>
        </div>
        <div className="bg-card border rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-success">{inStock.length}</p>
          <p className="text-xs text-muted-foreground">Em estoque</p>
        </div>
      </div>

      <Section title="Sem Estoque" items={outOfStock} icon={<AlertTriangle className="h-4 w-4 text-destructive" />} color="text-destructive" />
      <Section title="Estoque Baixo (≤ 5)" items={lowStock} icon={<AlertTriangle className="h-4 w-4 text-warning" />} color="text-warning" />
      <Section title="Em Estoque" items={inStock} icon={<Package className="h-4 w-4 text-success" />} color="text-success" />
    </div>
  );
}
