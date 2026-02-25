import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Truck, CreditCard, Check, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useAddresses, formatCurrency } from "@/hooks/useSupabaseData";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const STEPS = ["Endereço", "Frete", "Pagamento", "Confirmação"];

export default function CheckoutPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: addresses = [], refetch: refetchAddresses } = useAddresses();

  const [step, setStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [shippingOption, setShippingOption] = useState<"pac" | "sedex">("pac");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [submitting, setSubmitting] = useState(false);

  // New address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", label: "Casa" });
  const [savingAddress, setSavingAddress] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate("/login?redirect=/checkout");
  }, [user, authLoading, navigate]);

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0 && !submitting) navigate("/carrinho");
  }, [items, navigate, submitting]);

  // Auto-select default address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const def = addresses.find((a) => a.is_default) || addresses[0];
      setSelectedAddressId(def.id);
    }
  }, [addresses, selectedAddressId]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  // Simulated shipping costs (will be replaced by edge function later)
  const shippingCosts = { pac: { price: subtotal >= 299 ? 0 : 18.90, days: "8-12 dias úteis" }, sedex: { price: subtotal >= 299 ? 0 : 32.90, days: "3-5 dias úteis" } };
  const shipping = shippingCosts[shippingOption];
  const total = subtotal + shipping.price;

  const handleSaveAddress = async () => {
    if (!user) return;
    const { cep, street, number, neighborhood, city, state } = addressForm;
    if (!cep || !street || !number || !neighborhood || !city || !state) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    setSavingAddress(true);
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      ...addressForm,
      is_default: addresses.length === 0,
    });
    setSavingAddress(false);
    if (error) {
      toast({ title: "Erro ao salvar endereço", variant: "destructive" });
    } else {
      toast({ title: "Endereço salvo!" });
      setShowAddressForm(false);
      setAddressForm({ cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: "", label: "Casa" });
      refetchAddresses();
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddress) return;
    setSubmitting(true);
    try {
      // Create order
      const { data: order, error: orderErr } = await supabase.from("orders").insert({
        user_id: user.id,
        status: "criado",
        subtotal,
        shipping_cost: shipping.price,
        total,
        shipping_service: shippingOption.toUpperCase(),
        shipping_deadline: shipping.days,
        payment_method: paymentMethod,
        address_snapshot: selectedAddress as any,
      }).select().single();

      if (orderErr || !order) throw orderErr;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.name,
        size: item.size,
        quantity: item.quantity,
        unit_price: item.price,
      }));

      const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
      if (itemsErr) throw itemsErr;

      clearCart();
      setStep(3); // Confirmation step
      toast({ title: "Pedido criado com sucesso! 🎉" });
    } catch (err: any) {
      toast({ title: "Erro ao criar pedido", description: err?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return <div className="container py-20 text-center text-muted-foreground">Carregando...</div>;

  // Confirmation step
  if (step === 3) {
    return (
      <div className="container py-20 text-center max-w-md mx-auto">
        <div className="bg-success/10 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
          <Check className="h-10 w-10 text-success" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Pedido Realizado!</h1>
        <p className="text-muted-foreground mb-6">Seu pedido foi criado com sucesso. Acompanhe o status na sua conta.</p>
        <div className="flex flex-col gap-3">
          <Link to="/conta" className="bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg text-sm text-center hover:bg-accent/90 transition-colors">
            Ver meus pedidos
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Continuar comprando</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6 md:py-10 max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.slice(0, 3).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
              i <= step ? "bg-accent text-accent-foreground" : "bg-secondary text-muted-foreground"
            }`}>{i + 1}</div>
            <span className={`text-sm font-medium hidden md:block ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>{s}</span>
            {i < 2 && <div className={`w-8 md:w-16 h-0.5 ${i < step ? "bg-accent" : "bg-secondary"}`} />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Step 0: Address */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><MapPin className="h-5 w-5" /> Endereço de Entrega</h2>
              
              {addresses.map((addr) => (
                <button key={addr.id} onClick={() => setSelectedAddressId(addr.id)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${selectedAddressId === addr.id ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
                  <p className="text-sm font-semibold text-foreground">{addr.label || "Endereço"}</p>
                  <p className="text-sm text-muted-foreground">{addr.street}, {addr.number}{addr.complement ? ` - ${addr.complement}` : ""}</p>
                  <p className="text-sm text-muted-foreground">{addr.neighborhood}, {addr.city} - {addr.state}</p>
                  <p className="text-sm text-muted-foreground">CEP: {addr.cep}</p>
                </button>
              ))}

              {showAddressForm ? (
                <div className="bg-card border rounded-lg p-4 space-y-3">
                  <h3 className="font-display font-semibold text-sm text-foreground">Novo endereço</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="CEP *" value={addressForm.cep} onChange={(e) => setAddressForm((f) => ({ ...f, cep: e.target.value }))} className="col-span-1 bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
                    <input placeholder="Apelido" value={addressForm.label} onChange={(e) => setAddressForm((f) => ({ ...f, label: e.target.value }))} className="col-span-1 bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
                    <input placeholder="Rua *" value={addressForm.street} onChange={(e) => setAddressForm((f) => ({ ...f, street: e.target.value }))} className="col-span-2 bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
                    <input placeholder="Número *" value={addressForm.number} onChange={(e) => setAddressForm((f) => ({ ...f, number: e.target.value }))} className="bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
                    <input placeholder="Complemento" value={addressForm.complement} onChange={(e) => setAddressForm((f) => ({ ...f, complement: e.target.value }))} className="bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
                    <input placeholder="Bairro *" value={addressForm.neighborhood} onChange={(e) => setAddressForm((f) => ({ ...f, neighborhood: e.target.value }))} className="bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
                    <input placeholder="Cidade *" value={addressForm.city} onChange={(e) => setAddressForm((f) => ({ ...f, city: e.target.value }))} className="bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
                    <input placeholder="Estado *" value={addressForm.state} onChange={(e) => setAddressForm((f) => ({ ...f, state: e.target.value }))} maxLength={2} className="bg-background border rounded-lg px-3 py-2 text-sm text-foreground" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleSaveAddress} disabled={savingAddress} className="bg-accent text-accent-foreground font-semibold text-sm px-4 py-2 rounded-lg hover:bg-accent/90 disabled:opacity-50">
                      {savingAddress ? "Salvando..." : "Salvar"}
                    </button>
                    <button onClick={() => setShowAddressForm(false)} className="text-sm text-muted-foreground px-4 py-2">Cancelar</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowAddressForm(true)} className="w-full border border-dashed rounded-lg p-4 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" /> Adicionar novo endereço
                </button>
              )}

              <button disabled={!selectedAddressId} onClick={() => setStep(1)}
                className="w-full bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 transition-colors disabled:opacity-50 text-sm">
                Continuar
              </button>
            </div>
          )}

          {/* Step 1: Shipping */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><Truck className="h-5 w-5" /> Frete</h2>
              
              {(["pac", "sedex"] as const).map((opt) => (
                <button key={opt} onClick={() => setShippingOption(opt)}
                  className={`w-full text-left p-4 rounded-lg border transition-all flex justify-between items-center ${shippingOption === opt ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{opt === "pac" ? "PAC" : "SEDEX"}</p>
                    <p className="text-xs text-muted-foreground">{shippingCosts[opt].days}</p>
                  </div>
                  <span className="font-display font-bold text-foreground">
                    {shippingCosts[opt].price === 0 ? "Grátis" : formatCurrency(shippingCosts[opt].price)}
                  </span>
                </button>
              ))}

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="flex-1 border rounded-lg py-3 text-sm font-medium text-muted-foreground hover:text-foreground">Voltar</button>
                <button onClick={() => setStep(2)} className="flex-1 bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 text-sm">Continuar</button>
              </div>
            </div>
          )}

          {/* Step 2: Payment & Confirm */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2"><CreditCard className="h-5 w-5" /> Pagamento</h2>
              
              {(["pix", "card"] as const).map((opt) => (
                <button key={opt} onClick={() => setPaymentMethod(opt)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${paymentMethod === opt ? "border-accent bg-accent/5" : "border-border bg-card"}`}>
                  <p className="text-sm font-semibold text-foreground">{opt === "pix" ? "Pix" : "Cartão de Crédito"}</p>
                  <p className="text-xs text-muted-foreground">{opt === "pix" ? "Aprovação instantânea" : "Parcele em até 3x sem juros"}</p>
                </button>
              ))}

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 border rounded-lg py-3 text-sm font-medium text-muted-foreground hover:text-foreground">Voltar</button>
                <button onClick={handlePlaceOrder} disabled={submitting}
                  className="flex-1 bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 text-sm disabled:opacity-50">
                  {submitting ? "Processando..." : "Finalizar Pedido"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="bg-card rounded-lg border p-4 h-fit sticky top-20">
          <h3 className="font-display font-bold text-sm text-foreground mb-3">Resumo do Pedido</h3>
          <div className="space-y-2 mb-3">
            {items.map((item) => (
              <div key={`${item.productId}-${item.size}`} className="flex justify-between text-xs text-muted-foreground">
                <span className="truncate mr-2">{item.name} ({item.size}) x{item.quantity}</span>
                <span className="flex-shrink-0">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Frete ({shippingOption.toUpperCase()})</span><span>{shipping.price === 0 ? "Grátis" : formatCurrency(shipping.price)}</span></div>
            <div className="flex justify-between font-display font-bold text-foreground pt-2 border-t"><span>Total</span><span>{formatCurrency(total)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
