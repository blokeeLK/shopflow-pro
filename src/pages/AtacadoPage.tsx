import { useEffect, useRef } from "react";

const PROOF_IMAGES = [
  { src: "/images/foto2.jpeg", alt: "Comprovante 1" },
  { src: "https://i.ibb.co/1Gs5LRLk/Whats-App-Image-2026-04-10-at-09-41-27.jpg", alt: "Comprovante 3" },
  { src: "https://i.ibb.co/5hP23RLP/retire-pedidos-no-202604100950.jpg", alt: "Comprovante 4" },
];

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

const META_PIXEL_ID = "1552926625784575";

const WA_GUILHERME = "https://wa.me/553791000090?text=Ol%C3%A1%2C%20Guilherme!%20Quero%20saber%20mais%20informa%C3%A7%C3%B5es%20sobre%20o%20atacado.";
const WA_JUNIO = "https://wa.me/5537991339503?text=Ol%C3%A1%2C%20Junio!%20Quero%20saber%20mais%20informa%C3%A7%C3%B5es%20sobre%20o%20atacado.";


export default function AtacadoPage() {
  useEffect(() => {
    // Meta Pixel bootstrap
    if (!window.fbq) {
      const n: any = function (...args: any[]) {
        n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
      };
      if (!window._fbq) window._fbq = n;
      n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
      window.fbq = n;
      const fbScript = document.createElement("script");
      fbScript.async = true;
      fbScript.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(fbScript);
    }
    window.fbq!("init", META_PIXEL_ID);
    window.fbq!("track", "PageView");
    window.fbq!("trackCustom", "OpenWholesalePage");

    // UTMify UTM capture
    if (!document.querySelector('script[src*="utms/latest.js"]')) {
      const utmScript = document.createElement("script");
      utmScript.async = true;
      utmScript.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
      utmScript.setAttribute("data-utmify-prevent-xcod-sck", "");
      utmScript.setAttribute("data-utmify-prevent-subids", "");
      document.head.appendChild(utmScript);
    }

    const handleWhatsappClick = () => {
      window.fbq?.("trackCustom", "ClickWhatsApp", { position: "landing" });
      window.fbq?.("trackCustom", "WhatsAppWholesaleIntent", { source: "landing" });
      window.fbq?.("track", "Lead", { type: "whatsapp" });
    };

    const buttons = Array.from(
      document.querySelectorAll<HTMLAnchorElement>('a[href*="wa.me"]')
    );

    buttons.forEach((btn) => btn.addEventListener("click", handleWhatsappClick));

    return () => {
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
          overflow: hidden;
          padding: 10px 0 16px;
          position: relative;
          mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%);
        }

        .proof-track {
          display: flex;
          gap: 20px;
          width: max-content;
          animation: proof-scroll 30s linear infinite;
        }

        .proof-track:hover {
          animation-play-state: paused;
        }

        @keyframes proof-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .proof-card {
          flex: 0 0 auto;
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

        /* WhatsApp button group */
        .btn-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
        }

        .btn-wide {
          width: 100%;
          max-width: 320px;
        }

        @media (max-width: 768px) {
          .proof-track {
            animation-duration: 20s;
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
            Fale com nosso vendedor e agende sua compra por video chamada!
          </p>

          <div className="btn-group">
            <a className="btn btn-wide" href={WA_GUILHERME} target="_blank" rel="noreferrer">
              Vendedor Guilherme
            </a>
            <a className="btn btn-wide" href={WA_JUNIO} target="_blank" rel="noreferrer">
              Vendedor Junio
            </a>
          </div>
        </section>

        <section className="section container">
          <h2>Veja aqui oque nossos clientes falam</h2>

          <div className="proof">
            <div className="proof-track">
              {/* Original set + duplicated set for seamless loop */}
              {[...PROOF_IMAGES, ...PROOF_IMAGES].map((img, i) => (
                <div className="proof-card" key={i}>
                  <img
                    src={img.src}
                    alt={img.alt}
                    style={{
                      width: "180px",
                      height: "320px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="cta container">
          <h2>Garanta seu pedido no atacado</h2>
          <p>Compra rápida direto pelo WhatsApp</p>

          <div className="btn-group">
            <a
              className="btn btn-wide"
              href={WA_GUILHERME}
              target="_blank"
              rel="noreferrer"
              onClick={() => window.fbq?.("track", "CompleteRegistration", { content_name: "atacado_whatsapp" })}
            >
              Vendedor Guilherme
            </a>
            <a
              className="btn btn-wide"
              href={WA_JUNIO}
              target="_blank"
              rel="noreferrer"
              onClick={() => window.fbq?.("track", "CompleteRegistration", { content_name: "atacado_whatsapp" })}
            >
              Vendedor Junio
            </a>
          </div>
        </section>
      </div>
    </>
  );
}
