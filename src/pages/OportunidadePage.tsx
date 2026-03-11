import { useEffect, useState, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackClickWhatsApp, trackWholesaleLead, trackCustomEvent } from "@/lib/tracking";
import {
  MessageCircle,
  Factory,
  DollarSign,
  TrendingUp,
  Package,
  Palette,
  Ruler,
  Truck,
  AlertTriangle,
  Users,
  Sparkles,
  Clock,
  CheckCircle2,
  HelpCircle,
  Eye,
  ShoppingBag,
} from "lucide-react";

const WA_URL =
  "https://wa.me/553791000090?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20quero%20receber%20os%20modelos%20dispon%C3%ADveis%20de%20camisetas%20com%20pre%C3%A7o%20de%20atacado.%20Pode%20me%20enviar%20as%20op%C3%A7%C3%B5es%3F";

/* ── Social proof data ── */
const socialNames = [
  { name: "Carlos", city: "Belo Horizonte", action: "acabou de solicitar catálogo" },
  { name: "Marcos", city: "Goiânia", action: "está comprando camisetas para revenda" },
  { name: "Juliana", city: "São Paulo", action: "pediu informações sobre atacado" },
  { name: "Fernanda", city: "Rio de Janeiro", action: "solicitou tabela de preços" },
  { name: "Pedro", city: "Curitiba", action: "fez pedido de 20 peças" },
  { name: "Ana", city: "Salvador", action: "acabou de fechar pedido no atacado" },
  { name: "Lucas", city: "Fortaleza", action: "pediu catálogo atualizado" },
  { name: "Camila", city: "Porto Alegre", action: "está escolhendo modelos para revenda" },
];

function WhatsAppCTA({ children, className = "", pulse = false, ctaPosition = "unknown" }: { children: React.ReactNode; className?: string; pulse?: boolean; ctaPosition?: string }) {
  const handleClick = () => {
    trackClickWhatsApp({
      phone: "553791000090",
      page: "/oportunidade",
      context: "oportunidade",
      is_wholesale: true,
      message_text: "modelos atacado",
    });
    trackWholesaleLead({
      page: "/oportunidade",
      cta_text: typeof children === "string" ? children : "WhatsApp CTA",
      cta_position: ctaPosition,
    });
  };
  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className={`inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-base md:text-lg px-8 py-4 md:px-10 md:py-5 rounded-2xl transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)] shadow-lg ${pulse ? "animate-[pulse_2s_ease-in-out_infinite]" : ""} ${className}`}
    >
      <MessageCircle className="h-6 w-6" />
      {children}
    </a>
  );
}

/* ── Benefits cards ── */
const benefits = [
  { icon: Factory, title: "Camisetas fio 30.1 direto da fábrica" },
  { icon: DollarSign, title: "Preço de atacado real" },
  { icon: Package, title: "Pedido mínimo acessível" },
  { icon: TrendingUp, title: "Alta margem de revenda" },
  { icon: Palette, title: "Modelos com ótima saída" },
  { icon: Ruler, title: "Tamanhos P M G GG disponíveis" },
  { icon: Truck, title: "Enviamos para todo Brasil" },
];

const steps = [
  { num: "1", text: "Clique no WhatsApp" },
  { num: "2", text: "Receba os modelos disponíveis" },
  { num: "3", text: "Escolha tamanhos e estampas" },
  { num: "4", text: "Finalize seu pedido direto com atendimento" },
];

export default function OportunidadePage() {
  const isMobile = useIsMobile();

  /* ── Urgency counter ── */
  const [vagas] = useState(() => Math.floor(Math.random() * 13) + 7);

  /* ── Active visitors counter ── */
  const [activeVisitors, setActiveVisitors] = useState(() => Math.floor(Math.random() * 16) + 8); // 8–23
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVisitors(Math.floor(Math.random() * 16) + 8);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  /* ── Social proof popup ── */
  const [socialVisible, setSocialVisible] = useState(false);
  const [socialItem, setSocialItem] = useState(socialNames[0]);
  const socialIndex = useRef(0);

  useEffect(() => {
    const show = () => {
      socialIndex.current = (socialIndex.current + 1) % socialNames.length;
      setSocialItem(socialNames[socialIndex.current]);
      setSocialVisible(true);
      setTimeout(() => setSocialVisible(false), 4500);
    };
    const initial = setTimeout(show, 6000);
    const interval = setInterval(show, 35000);
    return () => { clearTimeout(initial); clearInterval(interval); };
  }, []);

  /* ── CTA pulse after 25s ── */
  const [ctaPulse, setCtaPulse] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setCtaPulse(true), 25000);
    return () => clearTimeout(t);
  }, []);

  /* ── Micro popup after 25s (once per session) ── */
  const [microPopup, setMicroPopup] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem("sf_oport_popup_shown")) return;
    const t = setTimeout(() => {
      setMicroPopup(true);
      sessionStorage.setItem("sf_oport_popup_shown", "1");
    }, 25000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1629] via-[#1a1a2e] to-[#16213e] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,211,102,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.08),transparent_50%)]" />

        <div className="container relative z-10 py-12 md:py-20 lg:py-28 max-w-4xl mx-auto px-4 text-center">
          {/* 1 — Recovery message */}
          <p className="text-xs md:text-sm text-white/60 font-medium tracking-wide mb-4 uppercase">
            Antes de sair, veja isso 👇
          </p>

          <span className="inline-block bg-[#25D366]/10 text-[#25D366] text-[11px] font-bold uppercase tracking-[0.25em] px-4 py-1.5 rounded-full mb-6 border border-[#25D366]/20">
            Oportunidade exclusiva
          </span>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl xl:text-[3.6rem] font-extrabold leading-[1.08] mb-6 tracking-tight">
            NÃO DEIXE 2026 PASSAR
            <br />
            <span className="bg-gradient-to-r from-[#25D366] to-[#1ebe5d] bg-clip-text text-transparent">
              SEM COMEÇAR SEU NEGÓCIO
            </span>
          </h1>

          <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto mb-4">
            O mercado de camisetas é um dos que mais cresce no Brasil.
            <br className="hidden md:block" />
            Centenas de revendedores estão faturando todos os meses revendendo camisetas básicas.
          </p>
          <p className="text-sm md:text-base text-[#25D366] font-semibold mb-8">
            Você pode começar direto da fábrica pagando preço de atacado real.
          </p>

          <WhatsAppCTA pulse={ctaPulse} className="w-full sm:w-auto">
            QUERO COMPRAR CAMISAS COM PREÇO DE ATACADO
          </WhatsAppCTA>

          {/* 2 — Microcopy */}
          <p className="text-xs text-white/40 mt-3">
            Receba no WhatsApp os modelos disponíveis no atacado agora.
          </p>

          {/* 3 — Active visitors */}
          <div className="flex items-center justify-center gap-1.5 mt-5 text-white/50 text-xs">
            <Eye className="h-3.5 w-3.5" />
            <span><strong className="text-white/70">{activeVisitors}</strong> pessoas estão vendo esta oportunidade agora</span>
          </div>
        </div>
      </section>

      {/* ═══ COPY PRINCIPAL ═══ */}
      <section className="container py-12 md:py-16 max-w-3xl mx-auto px-4">
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-4">
          Se você chegou até aqui é porque está procurando camisetas com preço de atacado para revender ou começar um novo negócio.
        </p>
        <p className="text-base md:text-lg text-foreground leading-relaxed font-medium">
          Aqui você encontra camisetas fio 30.1 direto da fábrica, com qualidade, variedade de modelos e um preço pensado para quem quer comprar barato e vender com margem.
        </p>
      </section>

      {/* ═══ BENEFÍCIOS ═══ */}
      <section className="bg-secondary/40">
        <div className="container py-12 md:py-16 max-w-4xl mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Por que comprar conosco
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <div className="flex-shrink-0 rounded-xl bg-[#25D366]/10 p-2.5">
                  <b.icon className="h-5 w-5 text-[#25D366]" />
                </div>
                <p className="text-sm font-semibold text-foreground">{b.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ SIMULADOR DE LUCRO ═══ */}
      <section className="container py-12 md:py-16 max-w-3xl mx-auto px-4">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-8 flex items-center justify-center gap-2">
          <Sparkles className="h-6 w-6 text-[#25D366]" />
          Quanto você pode ganhar
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
              Preço de atacado
            </p>
            <p className="font-display text-3xl font-extrabold text-[#25D366]">R$19,99</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
              Preço médio de revenda
            </p>
            <p className="font-display text-3xl font-extrabold text-foreground">R$59 – R$79</p>
          </div>
          <div className="rounded-2xl border-2 border-[#25D366]/30 bg-card p-6 text-center shadow-sm shadow-[#25D366]/10">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold mb-2">
              💰 Lucro possível por peça
            </p>
            <p className="font-display text-3xl font-extrabold text-[#22c55e]">até R$50</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center mb-8">
          Revendedores conseguem recuperar o investimento já nos primeiros pedidos.
        </p>

        {/* 4 — Exemplo prático de revenda */}
        <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm max-w-md mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="h-5 w-5 text-[#25D366]" />
            <h3 className="font-display text-base font-bold text-foreground">Exemplo de revenda</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Compra de 20 camisetas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custo total:</span>
              <span className="font-bold text-foreground">R$399,80</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenda média:</span>
              <span className="font-bold text-foreground">R$59</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Faturamento possível:</span>
              <span className="font-bold text-foreground">R$1.180</span>
            </div>
            <div className="border-t border-border pt-2 mt-2 flex justify-between">
              <span className="font-bold text-foreground">Lucro aproximado:</span>
              <span className="font-extrabold text-[#25D366] text-base">R$780</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ ESCASSEZ ═══ */}
      <section className="container py-8 md:py-12 max-w-2xl mx-auto px-4">
        <div className="rounded-2xl border-2 border-amber-400/30 bg-amber-50/80 dark:bg-amber-950/20 p-6 md:p-8 text-center">
          <AlertTriangle className="h-7 w-7 text-amber-500 mx-auto mb-3" />
          <h3 className="font-display text-lg md:text-xl font-extrabold text-foreground mb-2">
            ⚠️ ATENÇÃO
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-1">
            Alguns modelos de camisetas podem esgotar ainda hoje devido à alta procura no atacado.
          </p>
          <p className="text-sm font-semibold text-foreground">
            Quem chama primeiro no WhatsApp consegue ver as opções disponíveis antes do estoque girar.
          </p>
        </div>
      </section>

      {/* ═══ CONTADOR DE URGÊNCIA ═══ */}
      <section className="container py-6 md:py-8 max-w-md mx-auto px-4 text-center">
        <div className="rounded-2xl bg-gradient-to-r from-[#0f1629] to-[#1a1a2e] text-white p-6">
          <p className="text-sm text-white/60 mb-1">Restam poucas vagas para novos revendedores hoje</p>
          <p className="font-display text-4xl font-extrabold text-[#25D366]">{vagas}</p>
          <p className="text-xs text-white/50 mt-1">vagas restantes</p>
        </div>
      </section>

      {/* ═══ CTA PRINCIPAL ═══ */}
      <section className="container py-8 md:py-12 max-w-2xl mx-auto px-4 text-center">
        <WhatsAppCTA pulse={ctaPulse} className="w-full sm:w-auto text-center">
          QUERO COMPRAR CAMISAS COM PREÇO DE ATACADO
        </WhatsAppCTA>
        <p className="text-xs text-muted-foreground mt-3">
          Receba no WhatsApp os modelos disponíveis no atacado agora.
        </p>
      </section>

      {/* ═══ COMO FUNCIONA ═══ */}
      <section className="bg-secondary/40">
        <div className="container py-12 md:py-16 max-w-3xl mx-auto px-4">
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Como funciona
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {steps.map((s) => (
              <div key={s.num} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-[#25D366]/15 text-[#25D366] font-extrabold text-base">
                  {s.num}
                </span>
                <p className="text-sm text-foreground font-medium leading-relaxed pt-1">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PROVA SOCIAL ═══ */}
      <section className="container py-10 md:py-14 max-w-2xl mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Users className="h-5 w-5 text-[#25D366]" />
          <span className="font-display text-xl md:text-2xl font-extrabold text-foreground">
            Mais de 120 revendedores já compram camisetas conosco para revenda.
          </span>
        </div>
        <p className="text-muted-foreground text-sm">
          Modelos com excelente saída no varejo.
        </p>
      </section>

      {/* ═══ URGÊNCIA FINAL ═══ */}
      <section className="container py-8 md:py-12 max-w-3xl mx-auto px-4 text-center">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mb-3">
          Seu próximo pedido pode começar hoje.
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
          Clique no WhatsApp e receba agora os modelos disponíveis no atacado.
        </p>
      </section>

      {/* ═══ CTA FINAL ═══ */}
      <section className="bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0f172a] text-white">
        <div className={`container py-14 md:py-20 max-w-2xl mx-auto px-4 text-center ${isMobile ? "pb-28" : ""}`}>
          <Truck className="h-9 w-9 text-[#25D366] mx-auto mb-4" />
          <h2 className="font-display text-2xl md:text-3xl font-extrabold mb-6 leading-tight">
            Fale com nosso atendente agora
          </h2>
          <p className="text-[11px] text-white/35 mb-4 flex items-center justify-center gap-1.5">
            <Clock className="h-3 w-3" />
            Resposta em menos de 5 minutos
          </p>
          <WhatsAppCTA pulse={ctaPulse}>
            QUERO VER OS MODELOS DE ATACADO
          </WhatsAppCTA>
        </div>
      </section>

      {/* ═══ BOTÃO FLUTUANTE WHATSAPP (desktop) ═══ */}
      {!isMobile && (
        <a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackClickWhatsApp({ phone: "553791000090", page: "/oportunidade", context: "oportunidade", is_wholesale: true })}
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm px-5 py-3 rounded-full shadow-lg hover:scale-105 transition-all"
        >
          <MessageCircle className="h-5 w-5" />
          Comprar no atacado
        </a>
      )}

      {/* ═══ BARRA FIXA MOBILE ═══ */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border p-3">
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-sm py-4 rounded-xl shadow-lg transition-all"
          >
            <MessageCircle className="h-5 w-5" />
            VER MODELOS DE ATACADO NO WHATSAPP
          </a>
        </div>
      )}

      {/* ═══ SOCIAL PROOF POPUP ═══ */}
      {socialVisible && (
        <div className={`fixed ${isMobile ? "bottom-20" : "bottom-20"} left-4 z-50 max-w-xs bg-card rounded-lg shadow-lg border p-3 animate-in slide-in-from-left-5 duration-300`}>
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-[#25D366] flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{socialItem.name.charAt(0)}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">
                ShopFlow informa:
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="font-bold text-foreground">{socialItem.name}</span> de {socialItem.city} {socialItem.action}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MICRO POPUP (25s, once per session) ═══ */}
      {microPopup && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] max-w-sm w-[90vw] bg-card rounded-2xl shadow-2xl border p-6 text-center animate-in zoom-in-95 duration-300">
          <button
            onClick={() => setMicroPopup(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground text-lg leading-none"
          >
            ✕
          </button>
          <HelpCircle className="h-8 w-8 text-[#25D366] mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-foreground mb-1">
            Ainda quer ver os modelos de camisetas com preço de atacado?
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Receba o catálogo direto no WhatsApp.
          </p>
          <a
            href={WA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-[1.03]"
          >
            <MessageCircle className="h-5 w-5" />
            Receber catálogo no WhatsApp
          </a>
        </div>
      )}
      {microPopup && (
        <div
          className="fixed inset-0 z-[59] bg-black/40"
          onClick={() => setMicroPopup(false)}
        />
      )}
    </div>
  );
}
