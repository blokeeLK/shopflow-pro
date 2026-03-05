import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { formatCPF, validateCPF } from "@/lib/cpf";
import { formatCurrency } from "@/hooks/useSupabaseData";
import { User, Package, LogOut, Star, Save, Truck, ExternalLink, Copy, CreditCard, QrCode, Loader2, RefreshCw, AlertTriangle } from "lucide-react";

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
  payment_method: string;
  payment_init_point: string;
  payment_qr_code_base64: string;
  payment_expires_at: string | null;
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
  enviado: "bg-warning/20 text-warning",
  entregue: "bg-success/20 text-success",
  cancelado: "bg-destructive/20 text-destructive",
};

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<"profile" | "orders">("profile");
  const [filterPending, setFilterPending] = useState(false);
  const [profile, setProfile] = useState<Profile>({ name: "", cpf: "", phone: "", email: "" });
  const [originalCpf, setOriginalCpf] = useState("");
  const [cpfInput, setCpfInput] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // PIX modal state
  const [pixModalOrder, setPixModalOrder] = useState<Order | null>(null);
  const [regeneratingPix, setRegeneratingPix] = useState<string | null>(null);

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
      setOriginalCpf(data.cpf || "");
      setCpfInput(data.cpf || "");
    }
    setLoadingData(false);
  }

  async function loadOrders() {
    const { data } = await supabase
      .from("orders")
      .select("id, status, total, tracking_code, created_at, shipping_service, payment_method, payment_init_point, payment_qr_code_base64, payment_expires_at, order_items(product_id, product_name)")
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

  const handleCpfChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    setCpfInput(digits.length === 11 ? formatCPF(digits) : digits);
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) setProfile(p => ({ ...p, phone: digits }));
    else if (digits.length <= 7) setProfile(p => ({ ...p, phone: `(${digits.slice(0, 2)}) ${digits.slice(2)}` }));
    else setProfile(p => ({ ...p, phone: `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}` }));
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const updateData: any = {
      name: profile.name.trim(),
      phone: profile.phone.replace(/\D/g, ""),
    };

    const cleanCpf = cpfInput.replace(/\D/g, "");
    if (!originalCpf && cleanCpf) {
      if (!validateCPF(cleanCpf)) {
        toast({ title: "CPF inválido", variant: "destructive" });
        return;
      }
      updateData.cpf = cleanCpf;
    }

    setSaving(true);
    const { error } = await supabase.from("profiles").update(updateData).eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Dados atualizados! ✅" });
      if (updateData.cpf) {
        setOriginalCpf(updateData.cpf);
      }
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

  const canPayOrder = (status: string) => status === "criado" || status === "aguardando_pagamento";

  const isPixExpired = (order: Order): boolean => {
    if (!order.payment_expires_at) return false;
    return new Date(order.payment_expires_at) < new Date();
  };

  const hasValidPix = (order: Order): boolean => {
    return !!(order.payment_init_point && order.payment_init_point.length > 0 && !isPixExpired(order));
  };

  async function handlePayNow(order: Order) {
    // If it's a PIX payment with valid data, show it directly
    if (order.payment_method === "pix" && hasValidPix(order)) {
      setPixModalOrder(order);
      return;
    }

    // If PIX expired or no data, regenerate
    if (order.payment_method === "pix" || order.status === "aguardando_pagamento" || order.status === "criado") {
      await regeneratePix(order);
      return;
    }

    // Fallback: redirect to checkout
    navigate(`/checkout?order_id=${order.id}`);
  }

  async function regeneratePix(order: Order) {
    setRegeneratingPix(order.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { order_id: order.id, payment_method: "pix" },
      });

      if (error || data?.error) {
        const msg = data?.error || (typeof error === "object" ? JSON.stringify(error) : String(error));
        toast({ title: "Erro ao gerar PIX", description: msg, variant: "destructive" });
        return;
      }

      // Update local order data with new PIX info
      const updatedOrder: Order = {
        ...order,
        payment_method: "pix",
        payment_init_point: data.pix_copy_paste || data.pix_qr_code || "",
        payment_qr_code_base64: data.pix_qr_code_base64 || "",
        payment_expires_at: data.expires_at || null,
        status: "aguardando_pagamento",
      };

      setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
      setPixModalOrder(updatedOrder);
      toast({ title: "PIX gerado com sucesso! Escaneie o QR Code." });
    } catch (err: any) {
      toast({ title: "Erro ao gerar PIX", description: err?.message, variant: "destructive" });
    } finally {
      setRegeneratingPix(null);
    }
  }

  if (authLoading || !user) {
    return <div className="container py-20 text-center text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="container max-w-2xl py-6 md:py-10">
      {/* PIX Modal */}
      {pixModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setPixModalOrder(null)}>
          <div className="bg-card rounded-xl p-6 max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="bg-accent/10 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                <QrCode className="h-8 w-8 text-accent" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground mb-1">Pague com Pix</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Pedido #{pixModalOrder.id.slice(0, 8)} — {formatCurrency(Number(pixModalOrder.total))}
              </p>

              {pixModalOrder.payment_qr_code_base64 && (
                <div className="flex justify-center mb-4">
                  <img
                    src={`data:image/png;base64,${pixModalOrder.payment_qr_code_base64}`}
                    alt="QR Code Pix"
                    className="w-48 h-48 rounded-lg border"
                  />
                </div>
              )}

              {pixModalOrder.payment_init_point && (
                <div className="bg-secondary rounded-lg p-3 mb-4">
                  <p className="text-xs text-muted-foreground mb-2">Código Pix (copiar e colar)</p>
                  <div className="flex gap-2 items-center">
                    <input
                      value={pixModalOrder.payment_init_point}
                      readOnly
                      className="flex-1 bg-background border rounded px-2 py-1.5 text-xs text-foreground font-mono truncate"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(pixModalOrder.payment_init_point || "");
                        toast({ title: "Código copiado!" });
                      }}
                      className="bg-accent text-accent-foreground p-2 rounded-lg hover:bg-accent/90"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {pixModalOrder.payment_expires_at && (
                <p className="text-xs text-muted-foreground mb-4">
                  Expira em: {new Date(pixModalOrder.payment_expires_at).toLocaleString("pt-BR")}
                </p>
              )}

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setPixModalOrder(null)}
                  className="w-full bg-accent text-accent-foreground font-display font-semibold py-2.5 rounded-lg text-sm hover:bg-accent/90 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => { setPixModalOrder(null); regeneratePix(pixModalOrder); }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1 py-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Gerar novo PIX
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-colors relative ${tab === "orders" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
        >
          <Package className="h-4 w-4" /> Pedidos
          {(() => {
            const pending = orders.filter(o => o.status === "aguardando_pagamento" && o.payment_method === "pix").length;
            return pending > 0 ? (
              <span className="bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full h-4 min-w-[1rem] px-1 flex items-center justify-center animate-pulse">
                {pending}
              </span>
            ) : null;
          })()}
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
                <label className="text-sm font-medium text-foreground mb-1 block">
                  CPF {originalCpf ? "(não editável)" : "(opcional — só pode ser informado 1 vez)"}
                </label>
                {originalCpf ? (
                  <Input value={formatCPF(originalCpf)} disabled className="bg-muted" />
                ) : (
                  <Input value={cpfInput} onChange={(e) => handleCpfChange(e.target.value)} placeholder="000.000.000-00" maxLength={14} />
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Telefone</label>
                <Input value={profile.phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="(00) 00000-0000" maxLength={15} />
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
          {/* Pending PIX alert banner */}
          {(() => {
            const pendingPix = orders.filter(o => o.status === "aguardando_pagamento" && o.payment_method === "pix");
            if (pendingPix.length === 0) return null;
            return (
              <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-warning">PIX pendente</p>
                  <p className="text-xs text-warning/80 mt-0.5">
                    Você tem {pendingPix.length} pedido(s) aguardando pagamento via PIX. Finalize para garantir seu pedido.
                  </p>
                  <button
                    onClick={() => setFilterPending(prev => !prev)}
                    className="mt-2 bg-warning text-warning-foreground text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-warning/90 transition-colors"
                  >
                    {filterPending ? "Ver todos os pedidos" : "Ver pedidos pendentes"}
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Delete unpaid orders button */}
          {orders.some((o) => o.status === "criado" || o.status === "aguardando_pagamento") && (
            <button
              onClick={async () => {
                const unpaid = orders.filter((o) => o.status === "criado" || o.status === "aguardando_pagamento");
                for (const o of unpaid) {
                  await supabase.from("order_items").delete().eq("order_id", o.id);
                  await supabase.from("orders").delete().eq("id", o.id);
                }
                toast({ title: `${unpaid.length} pedido(s) removido(s)` });
                loadOrders();
              }}
              className="w-full bg-destructive text-destructive-foreground font-display font-semibold py-2.5 rounded-lg text-sm hover:bg-destructive/90 transition-colors"
            >
              APAGAR PEDIDOS
            </button>
          )}
          {(() => {
            const displayOrders = filterPending
              ? orders.filter(o => o.status === "aguardando_pagamento" && o.payment_method === "pix")
              : orders;
            return displayOrders.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">
                {filterPending ? "Nenhum pedido pendente." : "Você ainda não fez nenhum pedido."}
              </p>
            </div>
          ) : (
            displayOrders.map((order) => (
              <div key={order.id} className="bg-card border rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground font-mono">#{order.id.slice(0, 8)}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[order.status] || "bg-muted text-muted-foreground"}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>

                <OrderTimeline status={order.status} />

                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="font-display font-bold text-foreground">{formatCurrency(Number(order.total))}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>

                {/* PIX notice for aguardando_pagamento */}
                {order.status === "aguardando_pagamento" && order.payment_method === "pix" && (
                  <div className="mt-3 bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2">
                    <QrCode className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-warning font-medium">
                      {hasValidPix(order)
                        ? "PIX gerado — clique em 'Pagar agora' para abrir novamente."
                        : "PIX expirado — clique em 'Pagar agora' para gerar um novo."}
                    </p>
                  </div>
                )}

                {/* Pay now button for unpaid orders */}
                {canPayOrder(order.status) && (
                  <div className="mt-3 pt-3 border-t">
                    <button
                      onClick={() => handlePayNow(order)}
                      disabled={regeneratingPix === order.id}
                      className="w-full bg-accent text-accent-foreground font-display font-semibold py-2.5 rounded-lg text-sm text-center hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {regeneratingPix === order.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Gerando PIX...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" /> Pagar agora
                        </>
                      )}
                    </button>
                  </div>
                )}

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
          );
          })()}
        </div>
      )}
    </div>
  );
}

const TIMELINE_STEPS = ["criado", "pago", "separando", "enviado", "entregue"];

function OrderTimeline({ status }: { status: string }) {
  const cancelled = status === "cancelado";
  const currentIdx = TIMELINE_STEPS.indexOf(status === "aguardando_pagamento" ? "criado" : status);

  const getBarColor = (done: boolean) => {
    if (cancelled) return "bg-destructive/30";
    if (!done) return "bg-secondary";
    if (status === "entregue") return "bg-success";
    if (status === "enviado") return "bg-warning";
    return "bg-accent";
  };

  return (
    <div className="flex items-center gap-1 my-2">
      {TIMELINE_STEPS.map((s, i) => {
        const done = i <= currentIdx;
        const isEnviadoBar = status === "enviado" && done;
        return (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div className={`h-2 flex-1 rounded-full ${getBarColor(done)} ${isEnviadoBar ? "status-enviado" : ""}`} />
          </div>
        );
      })}
    </div>
  );
}
