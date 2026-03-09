import { MessageCircle, Package, Palette, Ruler, TrendingUp, AlertTriangle, Clock, CheckCircle2, Truck, Users, Zap } from "lucide-react";
import { FadeInSection } from "@/components/FadeInSection";

const whatsappUrl =
  "https://wa.me/553791000090?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20comprar%20no%20ATACADO%20a%20partir%20de%208%20pe%C3%A7as.%20Gostaria%20de%20ver%20os%20modelos%20dispon%C3%ADveis%20e%20os%20pre%C3%A7os%20exclusivos.";

function WhatsAppCTA({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-extrabold text-base md:text-lg px-8 py-4 md:px-10 md:py-5 rounded-2xl transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_8px_30px_rgba(37,211,102,0.4)] shadow-lg animate-pulse-subtle ${className}`}
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
      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f1629] via-[#1a1a2e] to-[#16213e] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,211,102,0.08),transparent_60%)]" />
        <div className="container relative z-10 py-16 md:py-28 max-w-3xl mx-auto px-4 text-center">
          <FadeInSection>
            <span className="inline-block bg-[#25D366]/15 text-[#25D366] text-xs font-bold uppercase tracking-[0.2em] px-5 py-2 rounded-full mb-8 border border-[#25D366]/20">
              Atacado exclusivo
            </span>
          </FadeInSection>

          <FadeInSection delay={100}>
            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-5 tracking-tight">
              ATACADO DIRETO
              <br />
              DA FÁBRICA
            </h1>
            <p className="text-lg md:text-xl text-white/70 font-medium mb-8">
              Camisas fio 30.1 com preço especial
            </p>
          </FadeInSection>

          <FadeInSection delay={200}>
            <p className="text-base md:text-lg text-white/80 leading-relaxed mb-3">
              Compre a partir de <strong className="text-white">8 peças</strong> e pague preço de atacado real.
            </p>
            <p className="text-sm md:text-base text-white/60 mb-8">
              Ideal para <strong className="text-white/80">Revendedores</strong> · <strong className="text-white/80">Lojistas</strong> · <strong className="text-white/80">Quem quer comprar barato</strong>
            </p>
          </FadeInSection>

          <FadeInSection delay={300}>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-x-6 gap-y-2 mb-10">
              {proofs.map((p) => (
                <span key={p} className="inline-flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-[#25D366] flex-shrink-0" />
                  {p}
                </span>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={400}>
            <p className="text-xs text-white/50 mb-3 flex items-center justify-center gap-1.5">
              <Zap className="h-3.5 w-3.5" />
              Atendimento rápido pelo WhatsApp · Tempo médio de resposta: menos de 5 minutos
            </p>
            <WhatsAppCTA>FALAR COM ATENDENTE NO WHATSAPP</WhatsAppCTA>
          </FadeInSection>
        </div>
      </section>

      {/* ── TRUST CARDS ── */}
      <section className="container py-16 md:py-24 max-w-5xl mx-auto px-4">
        <FadeInSection>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
            Por que comprar conosco?
          </h2>
        </FadeInSection>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
          {trustCards.map((c, i) => (
            <FadeInSection key={c.title} delay={i * 80}>
              <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 md:p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 rounded-xl bg-[#25D366]/10 p-3.5">
                  <c.icon className="h-6 w-6 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground text-base mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ── PROFIT BLOCK ── */}
      <section className="bg-secondary/40">
        <div className="container py-16 md:py-24 max-w-4xl mx-auto px-4">
          <FadeInSection>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              Quanto você pode ganhar revendendo
            </h2>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6 mb-8">
              {[
                { label: "Compra no atacado", value: "R$19,99", sub: "por peça", color: "text-foreground" },
                { label: "Revenda média", value: "R$59 a R$79", sub: "no varejo", color: "text-[#25D366]" },
                { label: "Lucro possível", value: "até R$50", sub: "por peça", color: "text-[#25D366]" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-card p-6 md:p-8 text-center shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-semibold">{item.label}</p>
                  <p className={`font-display text-3xl md:text-4xl font-extrabold ${item.color} mb-1`}>{item.value}</p>
                  <p className="text-sm text-muted-foreground">{item.sub}</p>
                </div>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <p className="text-center text-sm text-muted-foreground">
              Perfeito para quem quer começar a revender roupas ou aumentar a renda.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ── SCARCITY ── */}
      <section className="container py-14 md:py-20 max-w-2xl mx-auto px-4">
        <FadeInSection>
          <div className="rounded-2xl border-2 border-amber-400/30 bg-amber-50/80 dark:bg-amber-950/20 p-6 md:p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-4" />
            <h3 className="font-display text-lg md:text-xl font-extrabold text-foreground mb-2">
              ⚠️ ESTOQUE LIMITADO
            </h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-1">
              Os modelos mais procurados acabam rápido.
            </p>
            <p className="text-sm md:text-base font-semibold text-foreground">
              Quem compra primeiro escolhe os melhores modelos.
            </p>
          </div>
        </FadeInSection>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="bg-secondary/40">
        <div className="container py-16 md:py-24 max-w-3xl mx-auto px-4">
          <FadeInSection>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-12">
              Como comprar no atacado
            </h2>
          </FadeInSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6 mb-10">
            {steps.map((s, i) => (
              <FadeInSection key={s.num} delay={i * 80}>
                <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
                  <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-[#25D366]/15 text-[#25D366] font-extrabold text-lg">
                    {s.num}
                  </span>
                  <p className="text-sm md:text-base text-foreground font-medium leading-relaxed pt-1.5">{s.text}</p>
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
      <section className="container py-14 md:py-20 max-w-2xl mx-auto px-4 text-center">
        <FadeInSection>
          <div className="flex items-center justify-center gap-3 mb-3">
            <Users className="h-6 w-6 text-[#25D366]" />
            <span className="font-display text-xl md:text-2xl font-extrabold text-foreground">+120 revendedores</span>
          </div>
          <p className="text-muted-foreground text-sm md:text-base">
            já compram conosco. Modelos que vendem rápido no varejo.
          </p>
        </FadeInSection>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="bg-gradient-to-br from-[#0f1629] via-[#1a1a2e] to-[#16213e] text-white">
        <div className="container py-16 md:py-28 max-w-2xl mx-auto px-4 text-center">
          <FadeInSection>
            <Truck className="h-10 w-10 text-[#25D366] mx-auto mb-5" />
            <h2 className="font-display text-2xl md:text-4xl font-extrabold mb-4 leading-tight">
              Garanta seu pedido<br />no atacado agora
            </h2>
            <p className="text-white/70 mb-8 text-sm md:text-base">
              Fale com nosso time e receba:
            </p>
          </FadeInSection>

          <FadeInSection delay={100}>
            <div className="flex flex-col items-center gap-2 mb-10">
              {["Catálogo atualizado", "Tabela de preços", "Modelos disponíveis"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
                  {t}
                </span>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={200}>
            <p className="text-xs text-white/40 mb-3 flex items-center justify-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Resposta em menos de 5 minutos
            </p>
            <WhatsAppCTA>QUERO COMPRAR NO ATACADO</WhatsAppCTA>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
