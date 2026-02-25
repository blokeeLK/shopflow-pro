import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatCPF } from "@/lib/cpf";
import { formatCurrency } from "@/data/store";
import { User, Package, LogOut, Star, MapPin, Save } from "lucide-react";

interface Profile {
  name: string;
  cpf: string;
  phone: string;
  email: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  tracking_code: string;
  created_at: string;
  shipping_service: string;
}

const statusLabels: Record<string, string> = {
  criado: "Criado",
  aguardando_pagamento: "Aguardando pagamento",
  pago: "Pago",
  separando: "Separando",
  enviado: "Enviado",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

const statusColors: Record<string, string> = {
  criado: "bg-muted text-muted-foreground",
  aguardando_pagamento: "bg-warning/20 text-warning",
  pago: "bg-accent/20 text-accent",
  separando: "bg-accent/20 text-accent",
  enviado: "bg-primary/20 text-primary",
  entregue: "bg-green-100 text-green-700",
  cancelado: "bg-destructive/20 text-destructive",
};

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<"profile" | "orders">("profile");
  const [profile, setProfile] = useState<Profile>({ name: "", cpf: "", phone: "", email: "" });
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: "/conta" } });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadOrders();
    }
  }, [user]);

  async function loadProfile() {
    setLoadingData(true);
    const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
    if (data) {
      setProfile({
        name: data.name || "",
        cpf: data.cpf || "",
        phone: data.phone || "",
        email: data.email || "",
      });
    }
    setLoadingData(false);
  }

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("id, status, total, tracking_code, created_at, shipping_service")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setOrders(data as Order[]);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: profile.name.trim(),
      phone: profile.phone.replace(/\D/g, ""),
    }).eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados atualizados! ✅" });
    }
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || !user) {
    return <div className="container py-20 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="container max-w-2xl py-6 md:py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Minha Conta</h1>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-secondary rounded-lg p-1">
        <button
          onClick={() => setTab("profile")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${tab === "profile" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          <User className="h-4 w-4" /> Meus Dados
        </button>
        <button
          onClick={() => setTab("orders")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors ${tab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          <Package className="h-4 w-4" /> Pedidos
        </button>
      </div>

      {tab === "profile" && (
        <div className="bg-card border rounded-xl p-6">
          {loadingData ? (
            <p className="text-muted-foreground text-sm">Carregando...</p>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Nome</label>
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} maxLength={100} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">E-mail</label>
                <Input value={profile.email} disabled className="bg-muted" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">CPF (não editável)</label>
                <Input value={profile.cpf ? formatCPF(profile.cpf) : "Não informado"} disabled className="bg-muted" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Telefone</label>
                <Input
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? "Salvando..." : "Salvar alterações"}
              </button>
            </form>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Você ainda não fez nenhum pedido.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8)}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-foreground">{formatCurrency(Number(order.total))}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                  {order.tracking_code && (
                    <a
                      href={`https://www.linkcorreios.com.br/?id=${encodeURIComponent(order.tracking_code)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-accent hover:underline"
                    >
                      <MapPin className="h-3 w-3" />
                      Rastrear
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
