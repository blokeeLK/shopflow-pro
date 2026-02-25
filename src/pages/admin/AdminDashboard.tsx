import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { Package, ShoppingCart, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [ordersToday, ordersMonth, allOrders, lowStock, topProduct] = await Promise.all([
        supabase.from("orders").select("total").gte("created_at", startOfDay),
        supabase.from("orders").select("total").gte("created_at", startOfMonth),
        supabase.from("orders").select("id, status"),
        supabase.from("product_variants").select("stock, product_id, size, products(name)").lte("stock", 5).gt("stock", 0),
        supabase.from("products").select("name, sold_count").order("sold_count", { ascending: false }).limit(1).single(),
      ]);

      const todayRevenue = (ordersToday.data || []).reduce((a, o) => a + Number(o.total), 0);
      const monthRevenue = (ordersMonth.data || []).reduce((a, o) => a + Number(o.total), 0);
      const totalOrders = allOrders.data?.length || 0;
      const avgTicket = totalOrders > 0 ? monthRevenue / (ordersMonth.data?.length || 1) : 0;

      const statusCount: Record<string, number> = {};
      (allOrders.data || []).forEach((o) => { statusCount[o.status] = (statusCount[o.status] || 0) + 1; });

      return {
        todayRevenue,
        monthRevenue,
        totalOrders,
        avgTicket,
        statusCount,
        lowStock: lowStock.data || [],
        topProduct: topProduct.data?.name || "—",
        topProductSold: topProduct.data?.sold_count || 0,
      };
    },
    refetchInterval: 30000,
  });

  const s = stats;

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Dashboard</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Vendas Hoje", value: formatCurrency(s?.todayRevenue || 0), icon: DollarSign, color: "text-success" },
          { label: "Vendas Mês", value: formatCurrency(s?.monthRevenue || 0), icon: TrendingUp, color: "text-accent" },
          { label: "Total Pedidos", value: String(s?.totalOrders || 0), icon: ShoppingCart, color: "text-foreground" },
          { label: "Ticket Médio", value: formatCurrency(s?.avgTicket || 0), icon: BarChartIcon, color: "text-warning" },
        ].map((m) => (
          <div key={m.label} className="bg-card border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`h-4 w-4 ${m.color}`} />
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </div>
            <p className="font-display font-bold text-lg text-foreground">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by status */}
        <div className="bg-card border rounded-lg p-4">
          <h2 className="font-display font-semibold text-foreground mb-3">Pedidos por Status</h2>
          <div className="space-y-2">
            {Object.entries(s?.statusCount || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground capitalize">{status.replace(/_/g, " ")}</span>
                <span className="font-medium text-foreground bg-secondary px-2 py-0.5 rounded">{count}</span>
              </div>
            ))}
            {Object.keys(s?.statusCount || {}).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum pedido ainda</p>
            )}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-card border rounded-lg p-4">
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Estoque Baixo
          </h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {(s?.lowStock || []).map((v: any, i: number) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground truncate mr-2">{v.products?.name} — {v.size}</span>
                <span className="font-medium text-warning bg-warning/10 px-2 py-0.5 rounded">{v.stock} un.</span>
              </div>
            ))}
            {(s?.lowStock || []).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum alerta</p>
            )}
          </div>
        </div>

        {/* Top product */}
        <div className="bg-card border rounded-lg p-4">
          <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Package className="h-4 w-4 text-accent" /> Mais Vendido
          </h2>
          <p className="text-foreground font-medium">{s?.topProduct}</p>
          <p className="text-sm text-muted-foreground">{s?.topProductSold} vendidos</p>
        </div>
      </div>
    </div>
  );
}

function BarChartIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <line x1="12" x2="12" y1="20" y2="10" /><line x1="18" x2="18" y1="20" y2="4" /><line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}
