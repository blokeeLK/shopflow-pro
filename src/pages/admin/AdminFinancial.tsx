import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { Download, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const PAID_STATUSES = ["pago", "separando", "enviado", "entregue"];

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
        .select("*, order_items(unit_price, quantity, product_id, product_name, products:product_id(category_id, category:categories(name))), profiles:user_id(name, email, cpf, phone)")
        .gte("created_at", start)
        .lte("created_at", end)
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Only paid orders count for revenue
      const paidOrders = (orders || []).filter((o: any) => PAID_STATUSES.includes(o.status));
      const revenue = paidOrders.reduce((a, o) => a + Number(o.total), 0);
      const avgTicket = paidOrders.length > 0 ? revenue / paidOrders.length : 0;

      const catMap: Record<string, number> = {};
      paidOrders.forEach((o: any) => {
        (o.order_items || []).forEach((item: any) => {
          const catName = item.products?.category?.name || "Sem categoria";
          catMap[catName] = (catMap[catName] || 0) + Number(item.unit_price) * item.quantity;
        });
      });
      const byCategory = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

      return { orders: orders || [], paidOrders, revenue, avgTicket, byCategory, totalPaid: paidOrders.length };
    },
  });

  const exportPDF = () => {
    if (!data?.paidOrders.length) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Relatório Financeiro", 14, 20);
    doc.setFontSize(10);
    doc.text(`Período: ${startDate} a ${endDate}`, 14, 28);
    doc.text(`Total faturado: ${formatCurrency(data.revenue)}`, 14, 34);
    doc.text(`Pedidos pagos: ${data.totalPaid}`, 14, 40);

    const rows = data.paidOrders.map((o: any) => [
      o.id.slice(0, 8),
      new Date(o.created_at).toLocaleDateString("pt-BR"),
      (o.profiles as any)?.name || "—",
      (o.profiles as any)?.email || "—",
      (o.profiles as any)?.phone || "—",
      o.status.replace(/_/g, " "),
      o.payment_method || "—",
      formatCurrency(Number(o.total)),
    ]);

    autoTable(doc, {
      startY: 46,
      head: [["ID", "Data", "Cliente", "Email", "Telefone", "Status", "Pagamento", "Total"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 30, 30] },
    });

    doc.save(`relatorio-${startDate}-${endDate}.pdf`);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Relatório Financeiro</h1>
        <button onClick={exportPDF} className="bg-accent text-accent-foreground font-semibold text-sm px-4 py-2 rounded-lg hover:bg-accent/90 flex items-center gap-2">
          <Download className="h-4 w-4" /> Exportar PDF
        </button>
      </div>

      <p className="text-xs text-muted-foreground mb-4">⚠️ Apenas pedidos com pagamento confirmado (pago, separando, enviado, entregue) são contabilizados.</p>

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
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1"><DollarSign className="h-4 w-4 text-success" /><span className="text-xs text-muted-foreground">Faturamento</span></div>
              <p className="font-display font-bold text-lg text-foreground">{formatCurrency(data?.revenue || 0)}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1"><ShoppingCart className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Pedidos Pagos</span></div>
              <p className="font-display font-bold text-lg text-foreground">{data?.totalPaid || 0}</p>
            </div>
            <div className="bg-card border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-warning" /><span className="text-xs text-muted-foreground">Ticket Médio</span></div>
              <p className="font-display font-bold text-lg text-foreground">{formatCurrency(data?.avgTicket || 0)}</p>
            </div>
          </div>

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

          {/* Full orders table with client data */}
          <div className="bg-card border rounded-lg overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Cliente</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">Telefone</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Pagamento</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.orders || []).map((o: any) => (
                  <tr key={o.id} className={`border-b last:border-0 ${PAID_STATUSES.includes(o.status) ? "" : "opacity-50"}`}>
                    <td className="p-3 text-muted-foreground font-mono text-xs">#{o.id.slice(0, 8)}</td>
                    <td className="p-3 text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 text-foreground">{(o.profiles as any)?.name || "—"}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{(o.profiles as any)?.email || "—"}</td>
                    <td className="p-3 text-muted-foreground hidden lg:table-cell">{(o.profiles as any)?.phone || "—"}</td>
                    <td className="p-3 text-foreground capitalize">{o.status.replace(/_/g, " ")}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell capitalize">{o.payment_method || "—"}</td>
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
