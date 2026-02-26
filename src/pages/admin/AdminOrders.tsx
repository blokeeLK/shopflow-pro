import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Eye, Truck, Search } from "lucide-react";

const STATUSES = ["criado", "aguardando_pagamento", "pago", "separando", "enviado", "entregue", "cancelado"];
const STATUS_COLORS: Record<string, string> = {
  criado: "bg-secondary text-foreground",
  aguardando_pagamento: "bg-warning/10 text-warning",
  pago: "bg-success/10 text-success",
  separando: "bg-accent/10 text-accent",
  enviado: "bg-blue-100 text-blue-700",
  entregue: "bg-success/20 text-success",
  cancelado: "bg-destructive/10 text-destructive",
};

export default function AdminOrders() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      if (!ordersData || ordersData.length === 0) return [];

      // Fetch profiles separately since FK points to auth.users not profiles
      const userIds = [...new Set(ordersData.map((o) => o.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, cpf, phone")
        .in("id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
      return ordersData.map((o) => ({ ...o, profiles: profileMap.get(o.user_id) || null }));
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "update_status", entity: "order", entity_id: id, details: { status } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast({ title: "Status atualizado" }); },
  });

  const updateTracking = useMutation({
    mutationFn: async ({ id, tracking_code }: { id: string; tracking_code: string }) => {
      const { error } = await supabase.from("orders").update({ tracking_code }).eq("id", id);
      if (error) throw error;
      await supabase.from("admin_logs").insert({ admin_id: user!.id, action: "add_tracking", entity: "order", entity_id: id, details: { tracking_code } });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast({ title: "Rastreio atualizado" }); },
  });

  const filtered = orders.filter((o: any) => {
    if (filterStatus && o.status !== filterStatus) return false;
    if (search) {
      const s = search.toLowerCase();
      return o.id.toLowerCase().includes(s) || (o.profiles as any)?.name?.toLowerCase().includes(s) || (o.profiles as any)?.email?.toLowerCase().includes(s) || (o.profiles as any)?.phone?.includes(s);
    }
    return true;
  });

  const selectedOrder = selected ? orders.find((o: any) => o.id === selected) : null;

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Pedidos</h1>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por ID, nome, email ou telefone..."
            className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg text-sm text-foreground" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="bg-card border rounded-lg px-3 py-2 text-sm text-foreground">
          <option value="">Todos os status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders table */}
        <div className="lg:col-span-2 overflow-x-auto">
          {isLoading ? (
            [...Array(3)].map((_, i) => <div key={i} className="h-12 bg-card border rounded-lg animate-pulse mb-2" />)
          ) : filtered.length === 0 ? (
            <p className="text-center py-10 text-muted-foreground">Nenhum pedido encontrado</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground uppercase">
                  <th className="py-2 px-2">ID</th>
                  <th className="py-2 px-2">Cliente</th>
                  <th className="py-2 px-2">Celular</th>
                  <th className="py-2 px-2">CPF</th>
                  <th className="py-2 px-2">Status</th>
                  <th className="py-2 px-2">Data</th>
                  <th className="py-2 px-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order: any) => {
                  const profile = order.profiles as any;
                  return (
                    <tr key={order.id} onClick={() => setSelected(order.id)}
                      className={`border-b cursor-pointer hover:bg-secondary/30 transition-colors ${selected === order.id ? "bg-accent/10" : ""}`}>
                      <td className="py-2.5 px-2 font-mono text-xs">#{order.id.slice(0, 8)}</td>
                      <td className="py-2.5 px-2 font-medium text-foreground">{profile?.name || "—"}</td>
                      <td className="py-2.5 px-2 text-muted-foreground">{profile?.phone || "—"}</td>
                      <td className="py-2.5 px-2 text-muted-foreground">{profile?.cpf || ""}</td>
                      <td className="py-2.5 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${STATUS_COLORS[order.status] || ""}`}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-muted-foreground text-xs">{new Date(order.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="py-2.5 px-2 text-right font-bold">{formatCurrency(Number(order.total))}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Order detail */}
        <div className="bg-card border rounded-lg p-4 h-fit sticky top-4">
          {selectedOrder ? (
            <OrderDetail order={selectedOrder} onUpdateStatus={(s) => updateStatus.mutate({ id: selectedOrder.id, status: s })}
              onUpdateTracking={(t) => updateTracking.mutate({ id: selectedOrder.id, tracking_code: t })} />
          ) : (
            <p className="text-center py-10 text-muted-foreground text-sm">Selecione um pedido</p>
          )}
        </div>
      </div>
    </div>
  );
}

function OrderDetail({ order, onUpdateStatus, onUpdateTracking }: { order: any; onUpdateStatus: (s: string) => void; onUpdateTracking: (t: string) => void }) {
  const [tracking, setTracking] = useState(order.tracking_code || "");
  const address = order.address_snapshot as any;
  const profile = order.profiles as any;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8)}</p>
        <p className="font-display font-bold text-foreground">{profile?.name}</p>
        <p className="text-xs text-muted-foreground">{profile?.email}</p>
        {profile?.phone && <p className="text-xs text-muted-foreground">Tel: {profile.phone}</p>}
        {profile?.cpf && <p className="text-xs text-muted-foreground">CPF: {profile.cpf}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(order.created_at).toLocaleString("pt-BR")} · {order.payment_method || "—"}
        </p>
      </div>

      {/* Items */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Itens</h3>
        {(order.order_items || []).map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
            <span className="text-foreground">{item.product_name} ({item.size}) x{item.quantity}</span>
            <span className="text-foreground">{formatCurrency(Number(item.unit_price) * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1 text-sm">
        <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
        <div className="flex justify-between text-muted-foreground"><span>Frete ({order.shipping_service})</span><span>{Number(order.shipping_cost) === 0 ? "Grátis" : formatCurrency(Number(order.shipping_cost))}</span></div>
        <div className="flex justify-between font-bold text-foreground border-t pt-1"><span>Total</span><span>{formatCurrency(Number(order.total))}</span></div>
      </div>

      {/* Address */}
      {address && (
        <div>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Endereço</h3>
          <p className="text-xs text-muted-foreground">{address.street}, {address.number}{address.complement ? ` - ${address.complement}` : ""}</p>
          <p className="text-xs text-muted-foreground">{address.neighborhood}, {address.city} - {address.state}</p>
          <p className="text-xs text-muted-foreground">CEP: {address.cep}</p>
        </div>
      )}

      {/* Status update */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Status</h3>
        <select value={order.status} onChange={(e) => onUpdateStatus(e.target.value)}
          className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground">
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      {/* Tracking */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1"><Truck className="h-3 w-3" /> Rastreio</h3>
        <div className="flex gap-2">
          <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Código de rastreio"
            className="flex-1 bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
          <button onClick={() => onUpdateTracking(tracking)} className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-2 rounded-lg">Salvar</button>
        </div>
      </div>
    </div>
  );
}
