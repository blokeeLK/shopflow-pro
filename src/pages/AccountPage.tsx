import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatCPF } from "@/lib/cpf";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { User, Package, LogOut, Star, Save, Truck, ExternalLink, Copy } from "lucide-react";

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
  order_items?: { product_id: string; product_name: string }[];
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

  // Review state
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [reviewProductId, setReviewProductId] = useState<string | null>(null);
  const [reviewProductName, setReviewProductName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login", { state: { from: "/conta" } });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadOrders();
      loadExistingReviews();
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
      .select("id, status, total, tracking_code, created_at, shipping_service, order_items(product_id, product_name)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setOrders(data as any[]);
  }

  async function loadExistingReviews() {
    const { data } = await supabase
      .from("reviews")
      .select("product_id")
      .eq("user_id", user!.id);
    if (data) {
      setExistingReviews(new Set(data.map((r) => r.product_id)));
    }
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

  async function handleSubmitReview() {
    if (!user || !reviewProductId) return;
    setSavingReview(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      product_id: reviewProductId,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });
    setSavingReview(false);
    if (error) {
      toast({ title: "Erro ao enviar avaliação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Avaliação enviada! ⭐" });
      setReviewOrderId(null);
      setReviewProductId(null);
      setReviewComment("");
      setReviewRating(5);
      loadExistingReviews();
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
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="(00) 00000-0000" maxLength={15} />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50">
                <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar alterações"}
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

                {/* Status timeline */}
                <OrderTimeline status={order.status} />

                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="font-display font-bold text-foreground">{formatCurrency(Number(order.total))}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>

                {/* Tracking section */}
                {order.tracking_code && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center gap-2 mb-1">
                      <Truck className="h-4 w-4 text-accent" />
                      <span className="text-xs font-semibold text-foreground">Rastreamento</span>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2.5">
                      <code className="text-xs font-mono text-foreground flex-1">{order.tracking_code}</code>
                      <button
                        onClick={() => { navigator.clipboard.writeText(order.tracking_code); }}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                        title="Copiar código"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <a
                        href={`https://www.linkcorreios.com.br/?id=${encodeURIComponent(order.tracking_code)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-accent/90 transition-colors"
                      >
                        Rastrear <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Review section for delivered orders */}
                {order.status === "entregue" && order.order_items && order.order_items.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1">
                      <Star className="h-3 w-3" /> Avaliar produtos
                    </p>
                    <div className="space-y-2">
                      {order.order_items.map((item) => {
                        const alreadyReviewed = existingReviews.has(item.product_id);
                        const isReviewing = reviewOrderId === order.id && reviewProductId === item.product_id;

                        return (
                          <div key={item.product_id} className="text-sm">
                            {alreadyReviewed ? (
                              <span className="text-xs text-muted-foreground">✅ {item.product_name} — já avaliado</span>
                            ) : isReviewing ? (
                              <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
                                <p className="text-xs font-medium text-foreground">{item.product_name}</p>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <button key={s} onClick={() => setReviewRating(s)}>
                                      <Star className={`h-5 w-5 ${s <= reviewRating ? "fill-warning text-warning" : "text-border"}`} />
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  value={reviewComment}
                                  onChange={(e) => setReviewComment(e.target.value)}
                                  placeholder="Comentário (opcional)"
                                  className="w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground resize-none"
                                  rows={2}
                                  maxLength={500}
                                />
                                <div className="flex gap-2">
                                  <button onClick={handleSubmitReview} disabled={savingReview}
                                    className="bg-accent text-accent-foreground text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-accent/90 disabled:opacity-50">
                                    {savingReview ? "Enviando..." : "Enviar"}
                                  </button>
                                  <button onClick={() => { setReviewOrderId(null); setReviewProductId(null); }}
                                    className="text-xs text-muted-foreground px-3 py-1.5">Cancelar</button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => { setReviewOrderId(order.id); setReviewProductId(item.product_id); setReviewProductName(item.product_name); setReviewRating(5); setReviewComment(""); }}
                                className="text-xs text-accent hover:underline">
                                ⭐ Avaliar {item.product_name}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

const TIMELINE_STEPS = ["criado", "pago", "separando", "enviado", "entregue"];

function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelado") {
    return (
      <div className="flex items-center gap-1 mt-2">
        <div className="h-1.5 flex-1 bg-destructive/30 rounded-full" />
        <span className="text-[10px] text-destructive font-semibold">Cancelado</span>
      </div>
    );
  }

  const currentIdx = TIMELINE_STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-0.5 mt-2">
      {TIMELINE_STEPS.map((step, i) => (
        <div key={step} className="flex-1 flex flex-col items-center gap-0.5">
          <div className={`h-1.5 w-full rounded-full transition-colors ${i <= currentIdx ? "bg-accent" : "bg-secondary"}`} />
          <span className={`text-[9px] leading-tight ${i <= currentIdx ? "text-accent font-semibold" : "text-muted-foreground"}`}>
            {step === "criado" ? "Pedido" : step === "pago" ? "Pago" : step === "separando" ? "Separando" : step === "enviado" ? "Enviado" : "Entregue"}
          </span>
        </div>
      ))}
    </div>
  );
}
