import { MessageCircle, Package, Shuffle, Ruler, TrendingUp, AlertTriangle, Clock } from "lucide-react";

const whatsappUrl =
  "https://wa.me/553791000090?text=Ol%C3%A1!%20Vim%20pelo%20site%20e%20quero%20comprar%20no%20ATACADO%20a%20partir%20de%208%20pe%C3%A7as.%20Gostaria%20de%20ver%20os%20modelos%20dispon%C3%ADveis%20e%20os%20pre%C3%A7os%20exclusivos%20para%20pedido%20m%C3%ADnimo.";

const benefits = [
  { icon: Package, title: "Mínimo de 8 peças", desc: "Comece com apenas 8 peças para garantir preço de atacado." },
  { icon: Shuffle, title: "Peças variadas", desc: "Misture modelos diferentes no mesmo pedido." },
  { icon: Ruler, title: "Tamanhos livres", desc: "Escolha tamanhos diferentes sem restrição." },
  { icon: TrendingUp, title: "Margem de lucro", desc: "Preços exclusivos para maximizar seu ganho na revenda." },
];

export default function AtacadoPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1a1a2e] to-[#16213e] text-white py-16 md:py-24">
        <div className="container text-center max-w-3xl mx-auto px-4">
          <span className="inline-block bg-accent/20 text-accent text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Atacado exclusivo
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-extrabold leading-tight mb-6">
            ATACADO EXCLUSIVO –<br className="hidden md:block" /> COMPRE A PARTIR DE{" "}
            <span className="text-accent">8 PEÇAS</span>
          </h1>
          <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            Agora você pode comprar direto no <strong>ATACADO</strong> em nossa loja e pagar muito menos por peça.
          </p>
        </div>
      </section>

      {/* Benefits grid */}
      <section className="container py-14 md:py-20 max-w-5xl mx-auto px-4">
        <h2 className="font-display text-xl md:text-2xl font-bold text-foreground text-center mb-10">
          Por que comprar no atacado conosco?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 md:p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex-shrink-0 rounded-lg bg-accent/10 p-3">
                <b.icon className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-display font-bold text-foreground mb-1">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Persuasive text */}
      <section className="bg-secondary/50">
        <div className="container py-14 md:py-20 max-w-3xl mx-auto px-4 text-center">
          <p className="text-base md:text-lg text-foreground leading-relaxed mb-6">
            Comprando no atacado você garante <strong>preços exclusivos</strong>, maior margem de lucro e acesso aos
            nossos modelos mais procurados.
          </p>
          <p className="text-base md:text-lg text-foreground leading-relaxed mb-6">
            Ideal para <strong>revendedores</strong> ou quem quer economizar comprando mais.
          </p>

          <div className="inline-flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-xl p-5 text-left max-w-lg mx-auto">
            <AlertTriangle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-foreground text-sm mb-1">⚠️ Atenção: Estoque limitado!</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Nosso estoque gira rápido e as peças mais bonitas acabam primeiro.{" "}
                <strong className="text-foreground">Quem chega primeiro escolhe os melhores modelos.</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container py-16 md:py-24 max-w-2xl mx-auto px-4 text-center">
        <Clock className="h-10 w-10 text-accent mx-auto mb-4" />
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-3">
          Não perca tempo!
        </h2>
        <p className="text-muted-foreground mb-8 text-sm md:text-base">
          Fale agora com nosso time e garanta os melhores modelos com preço de atacado.
        </p>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-base md:text-lg px-8 py-4 md:px-10 md:py-5 rounded-2xl transition-all duration-200 hover:scale-[1.04] hover:shadow-xl shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
          QUERO COMPRAR NO ATACADO
        </a>
      </section>
    </div>
  );
}
