import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { Download, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";

export default function AdminFinancial() {
  const today = new Date();
  const [startDate, setStartDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(today.toISOString().slice(0, 10));

  const { data, isLoading } = useQuery({
    queryKey: ["admin-financial", startDate, endDate],
    queryFn: async () => {
      const start = new Date(startDate).toISOString();
      const end = new Date(endDate + "T23:59:59").toISOString();

      const { data: orders, error } = await supabase
        .from("orders")
        .select("*, order_items(unit_price, quantity, product_id, products:product_id(category_id, category:categories(name)))")
        .gte("created_at", start)
        .lte("created_at", end)
        .not("status", "eq", "cancelado");
      if (error) throw error;

      const revenue = (orders || []).reduce((a, o) => a + Number(o.total), 0);
      const avgTicket = orders && orders.length > 0 ? revenue / orders.length : 0;

      // Group by category
      const catMap: Record<string, number> = {};
      (orders || []).forEach((o: any) => {
        (o.order_items || []).forEach((item: any) => {
          const catName = item.products?.category?.name || "Sem categoria";
          catMap[catName] = (catMap[catName] || 0) + Number(item.unit_price) * item.quantity;
        });
      });
      const byCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

      return { orders: orders || [], revenue, avgTicket, byCategory, totalOrders: orders?.length || 0 };
    },
  });

  const exportCSV = () => {
    if (!data?.orders.length) return;
    const rows = [["ID", "Data", "Status", "Subtotal", "Frete", "Total", "Pagamento"]];
    data.orders.forEach((o: any) => {
      rows.push([o.id.slice(0, 8), new Date(o.created_at).toLocaleDateString("pt-BR"), o.status, o.subtotal, o.shipping_cost, o.total, o.payment_method]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `relatorio-${startDate}-${endDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Relatório Financeiro</h1>
        <button onClick={exportCSV} className="bg-accent text-accent-foreground font-semibold text-sm px-4 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-2">
          <Download className="h-4 w-4" /> Exportar CSV
        </button>
      </div>

      {/* Date filters */}
      <div className="flex gap-3 mb-6">
        <div>
          <label className="text-xs text-muted-foreground">De</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="block bg-card border rounded-lg px-3 py-2 text-sm text-foreground" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Até</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="block bg-card border rounded-lg px-3 py-2 text-sm text-foreground" />
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-success" /><span className="text-xs text-muted-foreground">Faturamento</span></div>
              <p className="font-display font-bold text-lg text-foreground">{formatCurrency(data?.revenue || 0)}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1"><ShoppingCart className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Pedidos</span></div>
              <p className="font-display font-bold text-lg text-foreground">{data?.totalOrders || 0}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-warning" /><span className="text-xs text-muted-foreground">Ticket Médio</span></div>
              <p className="font-display font-bold text-lg text-foreground">{formatCurrency(data?.avgTicket || 0)}</p>
            </div>
          </div>

          {/* By category */}
          <div className="bg-card border rounded-lg p-4 mb-8">
            <h2 className="font-display font-semibold text-foreground mb-3">Faturamento por Categoria</h2>
            {(data?.byCategory || []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem dados no período</p>
            ) : (
              <div className="space-y-2">
                {data!.byCategory.map(([cat, value]) => {
                  const pct = data!.revenue > 0 ? (value / data!.revenue) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{cat}</span>
                        <span className="text-muted-foreground">{formatCurrency(value)} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Orders table */}
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.orders || []).map((o: any) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="p-3 text-muted-foreground font-mono text-xs">#{o.id.slice(0, 8)}</td>
                    <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 text-foreground capitalize">{o.status.replace(/_/g, " ")}</td>
                    <td className="p-3 text-right font-medium text-foreground">{formatCurrency(Number(o.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
