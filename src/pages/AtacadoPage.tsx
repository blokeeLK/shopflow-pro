import { useEffect, useCallback } from "react";

declare global {
  interface Window {
    utmify_pixel_id?: string;
    utmify_event?: (event: string, data: Record<string, string>) => void;
  }
}

const WHATSAPP_NUMBER = "5500000000000";
const WHATSAPP_LINK_HERO = `https://wa.me/${WHATSAPP_NUMBER}?text=Ol%C3%A1%2C+quero+comprar+no+atacado`;
const WHATSAPP_LINK_CTA = `https://wa.me/${WHATSAPP_NUMBER}?text=Quero+comprar+no+atacado`;

const AtacadoPage = () => {
  // Load UTMify pixel scripts
  useEffect(() => {
    if (document.getElementById("utmify-pixel-container")) return;

    const container = document.createElement("div");
    container.id = "utmify-pixel-container";

    const scriptUtms = document.createElement("script");
    scriptUtms.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
    scriptUtms.async = true;
    scriptUtms.setAttribute("data-utmify-prevent-xcod-sck", "");
    scriptUtms.setAttribute("data-utmify-prevent-subids", "");

    const scriptPixel = document.createElement("script");
    scriptPixel.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
    scriptPixel.async = true;

    container.appendChild(scriptUtms);
    container.appendChild(scriptPixel);
    document.head.appendChild(container);

    window.utmify_pixel_id = "69add314ca90986027a3c6c5";

    return () => {
      const el = document.getElementById("utmify-pixel-container");
      if (el) el.remove();
    };
  }, []);

  // Fire page-level tracking events
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.utmify_event) {
        window.utmify_event("PageView", { page: window.location.pathname });
        window.utmify_event("OpenWholesalePage", {});
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // WhatsApp click tracking handler
  const handleWhatsAppClick = useCallback(() => {
    if (window.utmify_event) {
      window.utmify_event("ClickWhatsApp", { position: "landing" });
      window.utmify_event("WhatsAppWholesaleIntent", { source: "landing" });
      window.utmify_event("Lead", { type: "whatsapp" });
    }
  }, []);

  return (
    <div
      className="atacado-landing"
      style={{
        background: "linear-gradient(180deg, #05070b 0%, #07101a 100%)",
        color: "#ffffff",
        minHeight: "100vh",
        fontFamily: "Inter, Arial, sans-serif",
        lineHeight: 1.5,
      }}
    >
      <style>{`
        .atacado-landing * { margin: 0; padding: 0; box-sizing: border-box; }

        .atacado-landing .atc-top-highlight {
          width: 100%;
          background: linear-gradient(90deg, #16a34a 0%, #2ad66b 50%, #16a34a 100%);
          color: #04120a;
          text-align: center;
          font-size: 14px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          padding: 12px 16px;
          box-shadow: 0 10px 30px rgba(42,214,107,0.18);
        }

        .atacado-landing .atc-container {
          width: min(calc(100% - 32px), 980px);
          margin: 0 auto;
        }

        .atacado-landing a { text-decoration: none; }

        .atacado-landing .atc-hero {
          text-align: center;
          padding: 72px 0 50px;
        }

        .atacado-landing .atc-logo {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: .05em;
          margin-bottom: 20px;
        }

        .atacado-landing .atc-hero h1 {
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          margin-bottom: 14px;
        }

        .atacado-landing .atc-hero p {
          color: #aab4c4;
          max-width: 520px;
          margin: 0 auto 28px;
          font-size: 16px;
        }

        .atacado-landing .atc-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 26px;
          border-radius: 14px;
          background: linear-gradient(180deg, #2ad66b 0%, #1da553 100%);
          color: #04120a;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 10px 30px rgba(42,214,107,0.25);
          text-decoration: none;
          transform: translateZ(0) scale(1);
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
          will-change: transform;
        }

        .atacado-landing .atc-btn:hover {
          transform: scale(1.06);
          box-shadow: 0 18px 42px rgba(42,214,107,0.34);
          filter: brightness(1.03);
        }

        .atacado-landing .atc-btn:active {
          transform: scale(1.03);
          box-shadow: 0 12px 28px rgba(42,214,107,0.28);
        }

        .atacado-landing .atc-section {
          padding: 50px 0;
          text-align: center;
        }

        .atacado-landing .atc-section h2 {
          font-size: 22px;
          margin-bottom: 8px;
        }

        .atacado-landing .atc-section p {
          color: #aab4c4;
          margin-bottom: 20px;
          font-size: 15px;
        }

        .atacado-landing .atc-proof {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 10px 0 16px;
        }

        .atacado-landing .atc-proof::-webkit-scrollbar {
          height: 6px;
        }

        .atacado-landing .atc-proof::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }

        .atacado-landing .atc-proof-card {
          flex: 0 0 auto;
          scroll-snap-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .atacado-landing .atc-cta {
          text-align: center;
          padding: 70px 0;
        }

        .atacado-landing .atc-cta h2 {
          font-size: 26px;
          margin-bottom: 12px;
        }

        .atacado-landing .atc-cta p {
          color: #aab4c4;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .atacado-landing .atc-proof {
            justify-content: flex-start;
          }
        }
      `}</style>

      {/* TOP BAR */}
      <div className="atc-top-highlight">Vendas somente no atacado</div>

      {/* HERO */}
      <section className="atc-hero atc-container">
        <div className="atc-logo">
          <img
            src="https://iyhshxhvnmgcylxnnlrs.supabase.co/storage/v1/object/public/site-assets/logo/site-logo-1772585641158.png"
            alt="Atacado ShopFlow"
            style={{ maxWidth: "180px", margin: "0 auto", display: "block" }}
          />
        </div>
        <h1>A qualidade que seu cliente procura está aqui</h1>
        <p>Entre em contato agora para ver catálogo atualizado e comprar direto no atacado.</p>

        <a
          className="atc-btn"
          href={WHATSAPP_LINK_HERO}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
        >
          Falar no WhatsApp
        </a>
      </section>

      {/* SOCIAL PROOF */}
      <section className="atc-section atc-container">
        <h2>O que nossos clientes falam</h2>

        <div className="atc-proof">
          <div className="atc-proof-card">
            <img
              src="https://i.ibb.co/d4KrmjKj/REMODELE-ESSA-CIONVERSA-202604100921.jpg"
              alt="Feedback cliente 1"
              style={{ width: "180px", height: "320px", objectFit: "cover", borderRadius: "8px" }}
            />
          </div>

          <div className="atc-proof-card">
            <img
              src="https://i.ibb.co/RG0DVhjt/Coloque-foto-agradecendo-202604100927.jpg"
              alt="Feedback cliente 2"
              style={{ width: "180px", height: "320px", objectFit: "cover", borderRadius: "8px" }}
            />
          </div>

          <div className="atc-proof-card">
            <img
              src="https://i.ibb.co/1Gs5LRLk/Whats-App-Image-2026-04-10-at-09-41-27.jpg"
              alt="Feedback cliente 3"
              style={{ width: "180px", height: "320px", objectFit: "cover", borderRadius: "8px" }}
            />
          </div>

          <div className="atc-proof-card">
            <img
              src="https://i.ibb.co/5hP23RLP/retire-pedidos-no-202604100950.jpg"
              alt="Feedback cliente 4"
              style={{ width: "180px", height: "320px", objectFit: "cover", borderRadius: "8px" }}
            />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="atc-cta atc-container">
        <h2>Garanta seu pedido no atacado</h2>
        <p>Compra rápida direto pelo WhatsApp</p>

        <a
          className="atc-btn"
          href={WHATSAPP_LINK_CTA}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleWhatsAppClick}
        >
          Comprar agora
        </a>
      </section>
    </div>
  );
};

export default AtacadoPage;
