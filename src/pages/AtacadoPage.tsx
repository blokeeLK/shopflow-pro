import { MessageCircle, Package, Palette, Ruler, TrendingUp, AlertTriangle, Clock, CheckCircle2, Truck, Users, Zap, DollarSign, ShoppingBag, Sparkles } from "lucide-react";
import { FadeInSection } from "@/components/FadeInSection";
import { useExitIntent } from "@/hooks/useExitIntent";

const whatsappUrl =
  "https://wa.me/553791000090?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20comprar%20no%20ATACADO%20a%20partir%20de%208%20pe%C3%A7as.%20Gostaria%20de%20ver%20os%20modelos%20dispon%C3%ADveis%20e%20os%20pre%C3%A7os%20exclusivos.";

function WhatsAppCTA({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-base md:text-lg px-8 py-4 md:px-10 md:py-5 rounded-2xl transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)] shadow-lg ${className}`}
    >
      <MessageCircle className="h-6 w-6" />
      {children}
    </a>
  );
}

const proofs = [
  "Pedido mínimo de apenas 8 peças",
  "Misture cores e modelos",
  "Enviamos para todo Brasil",
  "Alta margem de revenda",
];


const trustCards = [
  { icon: Package, title: "Pedido mínimo baixo", desc: "Comece no atacado com apenas 8 peças." },
  { icon: Palette, title: "Modelos variados", desc: "Misture cores e estampas no mesmo pedido." },
  { icon: Ruler, title: "Tamanhos livres", desc: "P, M, G e GG disponíveis." },
  { icon: TrendingUp, title: "Alta margem de lucro", desc: "Revenda com ótimo lucro." },
];

const steps = [
  { num: "1", text: "Clique no botão do WhatsApp" },
  { num: "2", text: "Receba fotos dos modelos disponíveis" },
  { num: "3", text: "Escolha tamanhos e cores" },
  { num: "4", text: "Finalize seu pedido" },
];

export default function AtacadoPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* ── HERO + PROFIT — ABOVE THE FOLD ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1629] via-[#1a1a2e] to-[#16213e] text-white">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,211,102,0.12),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(37,211,102,0.04),transparent_70%)]" />

        <div className="container relative z-10 py-10 md:py-16 lg:py-20 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">

            {/* ── LEFT COLUMN — OFFER & CTA (3/5) ── */}
            <div className="lg:col-span-3 flex flex-col">
              <FadeInSection>
                <span className="inline-block bg-[#25D366]/10 text-[#25D366] text-[11px] font-bold uppercase tracking-[0.25em] px-4 py-1.5 rounded-full mb-6 border border-[#25D366]/20">
                  Atacado exclusivo
                </span>
              </FadeInSection>

              <FadeInSection delay={80}>
                <h1 className="font-display text-3xl sm:text-4xl md:text-5xl xl:text-[3.4rem] font-extrabold leading-[1.08] mb-4 tracking-tight">
                  ATACADO DIRETO
                  <br />
                  <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">DA FÁBRICA</span>
                </h1>
                <p className="text-lg md:text-2xl text-white/70 font-semibold mb-5">
                  Camisas fio 30.1 com preço especial
                </p>
              </FadeInSection>

              <FadeInSection delay={140}>
                <p className="text-base md:text-lg text-white/80 leading-relaxed mb-1.5">
                  Compre a partir de <strong className="text-[#25D366]">8 peças</strong> e pague preço de atacado real.
                </p>
                <p className="text-sm md:text-base text-white/60 mb-5">
                  Ideal para <strong className="text-white">Revendedores</strong> · <strong className="text-white">Lojistas</strong> · <strong className="text-white">Quem quer comprar barato</strong>
                </p>
              </FadeInSection>

              <FadeInSection delay={200}>
                <div className="flex flex-col sm:flex-row flex-wrap gap-x-5 gap-y-1.5 mb-6">
                  {proofs.map((p) => (
                    <span key={p} className="inline-flex items-center gap-2 text-[13px] text-white/75">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#25D366] flex-shrink-0" />
                      {p}
                    </span>
                  ))}
                </div>
              </FadeInSection>

              <FadeInSection delay={260}>
                <p className="text-[11px] text-white/40 mb-3 flex items-center gap-1.5">
                  <Zap className="h-3 w-3" />
                  Atendimento rápido pelo WhatsApp · Tempo médio de resposta: menos de 5 min
                </p>
                <WhatsAppCTA className="w-full sm:w-auto text-center">
                  FALAR COM ATENDENTE NO WHATSAPP
                </WhatsAppCTA>
              </FadeInSection>
            </div>

            {/* ── RIGHT COLUMN — PROFIT CARDS (2/5) ── */}
            <div className="lg:col-span-2 flex flex-col">
              <FadeInSection delay={100}>
                <h2 className="font-display text-lg md:text-xl font-bold text-white mb-5 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#25D366]" />
                  Quanto você pode ganhar
                </h2>
              </FadeInSection>

              <div className="flex flex-col gap-3">
                {/* Card 1 — Preço de Atacado */}
                <FadeInSection delay={160}>
                  <div className="relative rounded-2xl border border-white/10 bg-white p-5 md:p-6 flex items-center gap-4 hover:shadow-lg hover:shadow-[#25D366]/10 transition-all duration-300">
                    <div className="flex-shrink-0 rounded-xl bg-[#25D366]/15 p-3">
                      <ShoppingBag className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-1">Preço de atacado</p>
                      <p className="font-display text-3xl md:text-4xl font-extrabold text-[#25D366] leading-none">APENAS R$19,99</p>
                      <p className="text-xs text-gray-500 mt-1">por peça</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 italic">Preço direto da fábrica</p>
                    </div>
                  </div>
                </FadeInSection>

                {/* Card 2 — Revenda Média */}
                <FadeInSection delay={240}>
                  <div className="relative rounded-2xl border border-white/10 bg-white p-5 md:p-6 flex items-center gap-4 hover:shadow-lg hover:shadow-[#25D366]/10 transition-all duration-300">
                    <div className="flex-shrink-0 rounded-xl bg-[#25D366]/15 p-3">
                      <TrendingUp className="h-5 w-5 text-[#25D366]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-1">Revenda média</p>
                      <p className="font-display text-2xl md:text-3xl font-extrabold text-[#25D366] leading-none">R$59 a R$79</p>
                      <p className="text-xs text-gray-400 mt-0.5">no varejo</p>
                    </div>
                  </div>
                </FadeInSection>

                {/* Card 3 — Lucro na Revenda */}
                <FadeInSection delay={320}>
                  <div className="relative rounded-2xl border-2 border-[#25D366]/30 bg-white p-5 md:p-6 flex items-center gap-4 hover:shadow-lg hover:shadow-[#25D366]/20 transition-all duration-300 shadow-sm shadow-[#25D366]/10">
                    <div className="flex-shrink-0 rounded-xl bg-[#25D366]/20 p-3">
                      <DollarSign className="h-6 w-6 text-[#25D366]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-widest text-gray-500 font-semibold mb-1">💰 Lucro na revenda</p>
                      <p className="font-display text-3xl md:text-4xl font-extrabold text-[#22c55e] leading-none">GANHE ATÉ R$50</p>
                      <p className="text-xs text-gray-500 mt-1">de lucro por peça</p>
                    </div>
                  </div>
                </FadeInSection>
              </div>

              <FadeInSection delay={420}>
                <p className="text-sm md:text-base text-white font-bold mt-4 leading-relaxed">
                  Comece com apenas 8 peças e pague preço direto da fábrica.
                </p>
              </FadeInSection>

              <FadeInSection delay={460}>
                <div className="flex items-center gap-2 mt-3 text-amber-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <p className="text-sm font-bold">
                    Modelos mais procurados esgotam rápido no atacado.
                  </p>
                </div>
              </FadeInSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST CARDS ── */}
      <section className="container py-14 md:py-20 max-w-5xl mx-auto px-4">
        <FadeInSection>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
            Por que comprar conosco?
          </h2>
        </FadeInSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
          {trustCards.map((c, i) => (
            <FadeInSection key={c.title} delay={i * 80}>
              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 rounded-xl bg-[#25D366]/10 p-3">
                  <c.icon className="h-5 w-5 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-sm mb-0.5">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ── SCARCITY ── */}
      <section className="container py-10 md:py-14 max-w-2xl mx-auto px-4">
        <FadeInSection>
          <div className="rounded-2xl border-2 border-amber-400/30 bg-amber-50/80 dark:bg-amber-950/20 p-6 md:p-8 text-center">
            <AlertTriangle className="h-7 w-7 text-amber-500 mx-auto mb-3" />
            <h3 className="font-display text-lg md:text-xl font-extrabold text-foreground mb-2">
              ⚠️ ESTOQUE LIMITADO
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-1">
              Os modelos mais procurados acabam rápido.
            </p>
            <p className="text-sm font-semibold text-foreground">
              Quem compra primeiro escolhe os melhores modelos.
            </p>
          </div>
        </FadeInSection>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-secondary/40">
        <div className="container py-14 md:py-20 max-w-3xl mx-auto px-4">
          <FadeInSection>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-10">
              Como comprar no atacado
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 mb-8">
            {steps.map((s, i) => (
              <FadeInSection key={s.num} delay={i * 80}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <span className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-[#25D366]/15 text-[#25D366] font-extrabold text-base">
                    {s.num}
                  </span>
                  <p className="text-sm text-foreground font-medium leading-relaxed pt-1">{s.text}</p>
                </div>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection delay={350}>
            <p className="text-center text-muted-foreground font-semibold text-sm">Simples e rápido.</p>
          </FadeInSection>
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="container py-12 md:py-16 max-w-2xl mx-auto px-4 text-center">
        <FadeInSection>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Users className="h-5 w-5 text-[#25D366]" />
            <span className="font-display text-xl md:text-2xl font-extrabold text-foreground">+120 revendedores</span>
          </div>
          <p className="text-muted-foreground text-sm">
            já compram conosco. Modelos que vendem rápido no varejo.
          </p>
        </FadeInSection>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0f172a] text-white">
        <div className="container py-14 md:py-24 max-w-2xl mx-auto px-4 text-center">
          <FadeInSection>
            <Truck className="h-9 w-9 text-[#25D366] mx-auto mb-4" />
            <h2 className="font-display text-2xl md:text-3xl font-extrabold mb-3 leading-tight">
              Garanta seu pedido<br />no atacado agora
            </h2>
            <p className="text-white/60 mb-6 text-sm">
              Fale com nosso time e receba:
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="flex flex-col items-center gap-1.5 mb-8">
              {["Catálogo atualizado", "Tabela de preços", "Modelos disponíveis"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2 text-sm text-white/75">
                  <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
                  {t}
                </span>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <p className="text-[11px] text-white/35 mb-3 flex items-center justify-center gap-1.5">
              <Clock className="h-3 w-3" />
              Resposta em menos de 5 minutos
            </p>
            <WhatsAppCTA>QUERO COMPRAR NO ATACADO</WhatsAppCTA>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
