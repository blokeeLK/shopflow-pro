import { Link } from "react-router-dom";
import { ArrowRight, Truck, ShieldCheck, CreditCard } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { getFeaturedProducts, getCategoriesWithStock, products, getTotalStock } from "@/data/store";

const Index = () => {
  const featured = getFeaturedProducts();
  const categoriesWithStock = getCategoriesWithStock();
  const allActive = products.filter((p) => getTotalStock(p) > 0);

  return (
    <div>
      {/* Hero Banner */}
      <section className="relative bg-primary overflow-hidden">
        <div className="container py-16 md:py-24 relative z-10">
          <div className="max-w-lg">
            <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-sm mb-4 animate-pulse-soft">
              NOVA COLEÇÃO
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold text-primary-foreground leading-tight mb-4">
              Estilo que fala
              <br />
              por você<span className="text-accent">.</span>
            </h1>
            <p className="text-primary-foreground/70 text-sm md:text-base mb-6 leading-relaxed">
              Descubra peças únicas com qualidade premium e preços que cabem no seu bolso.
            </p>
            <Link
              to="/categoria/camisetas"
              className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-display font-semibold text-sm px-6 py-3 rounded-lg hover:bg-accent/90 transition-colors"
            >
              Ver coleção <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        {/* Decorative shape */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-accent/5 rounded-bl-[100px] hidden md:block" />
      </section>

      {/* Trust bar */}
      <section className="border-b bg-card">
        <div className="container py-4 flex flex-wrap justify-center gap-6 md:gap-12">
          {[
            { icon: Truck, text: "Frete grátis acima de R$299" },
            { icon: ShieldCheck, text: "Compra 100% segura" },
            { icon: CreditCard, text: "Parcele em até 3x sem juros" },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Icon className="h-4 w-4 text-accent" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categoriesWithStock.length > 0 && (
        <section className="container py-10 md:py-14">
          <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-6">
            Categorias
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {categoriesWithStock.map((cat) => (
              <Link
                key={cat.slug}
                to={`/categoria/${cat.slug}`}
                className="group relative bg-secondary rounded-lg p-6 md:p-8 text-center hover:bg-accent hover:text-accent-foreground transition-all duration-300"
              >
                <h3 className="font-display font-semibold text-sm md:text-base">{cat.name}</h3>
                <ArrowRight className="h-4 w-4 mx-auto mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section className="container pb-10 md:pb-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl md:text-2xl text-foreground">
              Destaques 🔥
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {featured.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* All products */}
      <section className="container pb-10 md:pb-14">
        <h2 className="font-display font-bold text-xl md:text-2xl text-foreground mb-6">
          Todos os produtos
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {allActive.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
};

export default Index;
