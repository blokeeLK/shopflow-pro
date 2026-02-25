import { Link } from "react-router-dom";
import { getCategoriesWithStock } from "@/data/store";

export function Footer() {
  const categories = getCategoriesWithStock();

  return (
    <footer className="bg-primary text-primary-foreground mt-16">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display font-bold text-lg mb-4">
              LOJA<span className="text-accent">.</span>
            </h3>
            <p className="text-sm opacity-70 leading-relaxed">
              Moda com estilo e qualidade. Entregamos em todo o Brasil com os melhores preços.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 opacity-70">
              Categorias
            </h4>
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/categoria/${cat.slug}`}
                  className="text-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display font-semibold text-sm uppercase tracking-wider mb-4 opacity-70">
              Atendimento
            </h4>
            <div className="flex flex-col gap-2 text-sm opacity-70">
              <span>Segunda a Sexta: 9h às 18h</span>
              <span>contato@loja.com.br</span>
              <span>(11) 99999-9999</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/10 text-center text-xs opacity-50">
          © 2026 LOJA. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
