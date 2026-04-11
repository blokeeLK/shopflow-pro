import { useEffect } from "react";

declare global {
  interface Window {
    utmify_pixel_id?: string;
    utmify_event?: (eventName: string, payload?: Record<string, unknown>) => void;
  }
}

const WHATSAPP_NUMBER = "553791000090";
const WHATSAPP_MESSAGE = "Olá, gostaria de saber mais informações sobre o atacado de camisas !";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export default function AtacadoPage() {
  useEffect(() => {
    window.utmify_pixel_id = "69add314ca90986027a3c6c5";

    const existingUtmScript = document.querySelector(
      'script[src="https://cdn.utmify.com.br/scripts/utms/latest.js"]'
    );
    const existingPixelScript = document.querySelector(
      'script[src="https://cdn.utmify.com.br/scripts/pixel/pixel.js"]'
    );

    let utmScript: HTMLScriptElement | null = null;
    let pixelScript: HTMLScriptElement | null = null;

    if (!existingUtmScript) {
      utmScript = document.createElement("script");
      utmScript.async = true;
      utmScript.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
      utmScript.setAttribute("data-utmify-prevent-xcod-sck", "");
      utmScript.setAttribute("data-utmify-prevent-subids", "");
      document.head.appendChild(utmScript);
    }

    if (!existingPixelScript) {
      pixelScript = document.createElement("script");
      pixelScript.async = true;
      pixelScript.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
      document.head.appendChild(pixelScript);
    }

    const fireInitialEvents = () => {
      if (window.utmify_event) {
        window.utmify_event("PageView", { page: window.location.pathname });
        window.utmify_event("OpenWholesalePage", {});
      }
    };

    const timeout = setTimeout(fireInitialEvents, 1200);

    const handleWhatsappClick = () => {
      if (window.utmify_event) {
        window.utmify_event("ClickWhatsApp", { position: "landing" });
        window.utmify_event("WhatsAppWholesaleIntent", { source: "landing" });
        window.utmify_event("Lead", { type: "whatsapp" });
      }
    };

    const buttons = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href*="wa.me"]')
    );

    buttons.forEach((btn) => btn.addEventListener("click", handleWhatsappClick));

    return () => {
      clearTimeout(timeout);
      buttons.forEach((btn) =>
        btn.removeEventListener("click", handleWhatsappClick)
      );
    };
  }, []);

  return (
    <>
      <style>{`
        :root {
          --bg: #05070b;
          --bg-soft: #0b1020;
          --panel: #0d1422;
          --text: #ffffff;
          --muted: #aab4c4;
          --green: #2ad66b;
          --green-dark: #1da553;
          --line: rgba(255,255,255,0.06);
          --radius: 14px;
          --max: 980px;
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: Inter, Arial, sans-serif;
          background: linear-gradient(180deg, #05070b 0%, #07101a 100%);
          color: var(--text);
          line-height: 1.5;
        }

        .atacado-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #05070b 0%, #07101a 100%);
          color: var(--text);
        }

        .top-highlight {
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

        .container {
          width: min(calc(100% - 32px), var(--max));
          margin: 0 auto;
        }

        .atacado-page a {
          text-decoration: none;
        }

        .hero {
          text-align: center;
          padding: 72px 0 50px;
        }

        .logo {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: .05em;
          margin-bottom: 20px;
        }

        .hero h1 {
          font-size: clamp(28px, 4vw, 44px);
          font-weight: 800;
          margin-bottom: 14px;
        }

        .hero p {
          color: var(--muted);
          max-width: 520px;
          margin: 0 auto 28px;
          font-size: 16px;
        }

        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 14px 26px;
          border-radius: var(--radius);
          background: linear-gradient(180deg, var(--green) 0%, var(--green-dark) 100%);
          color: #04120a;
          font-weight: 700;
          font-size: 15px;
          box-shadow: 0 10px 30px rgba(42,214,107,0.25);
          transform: translateZ(0) scale(1);
          transition: transform .18s ease, box-shadow .18s ease, filter .18s ease;
          will-change: transform;
        }

        .btn:hover {
          transform: scale(1.06);
          box-shadow: 0 18px 42px rgba(42,214,107,0.34);
          filter: brightness(1.03);
        }

        .btn:active {
          transform: scale(1.03);
          box-shadow: 0 12px 28px rgba(42,214,107,0.28);
        }

        .section {
          padding: 50px 0;
          text-align: center;
        }

        .section h2 {
          font-size: 22px;
          margin-bottom: 8px;
        }

        .section p {
          color: var(--muted);
          margin-bottom: 20px;
          font-size: 15px;
        }

        .proof {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          padding: 10px 0 16px;
        }

        .proof::-webkit-scrollbar {
          height: 6px;
        }

        .proof::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 10px;
        }

        .proof-card {
          flex: 0 0 auto;
          scroll-snap-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .cta {
          text-align: center;
          padding: 70px 0;
        }

        .cta h2 {
          font-size: 26px;
          margin-bottom: 12px;
        }

        .cta p {
          color: var(--muted);
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .proof {
            justify-content: flex-start;
          }
        }
      `}</style>

      <div className="atacado-page">
        <div className="top-highlight">Vendas somente no atacado</div>

        <section className="hero container">
          <div className="logo">
            <img
              src="https://iyhshxhvnmgcylxnnlrs.supabase.co/storage/v1/object/public/site-assets/logo/site-logo-1772585641158.png"
              alt="Atacado ShopFlow"
              style={{ maxWidth: "180px", margin: "0 auto" }}
            />
          </div>

          <h1>A qualidade que seu cliente procura está aqui</h1>
          <p>
            Entre em contato agora para ver catálogo atualizado e comprar direto
            no atacado.
          </p>

          <a
            className="btn"
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
          >
            Falar no WhatsApp
          </a>
        </section>

        <section className="section container">
          <h2>O que nossos clientes falam</h2>

          <div className="proof">
            <div className="proof-card">
              <img
                src="https://i.ibb.co/d4KrmjKj/REMODELE-ESSA-CIONVERSA-202604100921.jpg"
                alt="Comprovante 1"
                style={{
                  width: "180px",
                  height: "320px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>

            <div className="proof-card">
              <img
                src="https://i.ibb.co/RG0DVhjt/Coloque-foto-agradecendo-202604100927.jpg"
                alt="Comprovante 2"
                style={{
                  width: "180px",
                  height: "320px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>

            <div className="proof-card">
              <img
                src="https://i.ibb.co/1Gs5LRLk/Whats-App-Image-2026-04-10-at-09-41-27.jpg"
                alt="Comprovante 3"
                style={{
                  width: "180px",
                  height: "320px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>

            <div className="proof-card">
              <img
                src="https://i.ibb.co/5hP23RLP/retire-pedidos-no-202604100950.jpg"
                alt="Comprovante 4"
                style={{
                  width: "180px",
                  height: "320px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>
          </div>
        </section>

        <section className="cta container">
          <h2>Garanta seu pedido no atacado</h2>
          <p>Compra rápida direto pelo WhatsApp</p>

          <a
            className="btn"
            href={WHATSAPP_LINK}
            target="_blank"
            rel="noreferrer"
          >
            Comprar agora
          </a>
        </section>
      </div>
    </>
  );
}
