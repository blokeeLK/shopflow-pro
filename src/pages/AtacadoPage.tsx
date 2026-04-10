import { useEffect } from "react";

const AtacadoPage = () => {
  useEffect(() => {
    // Load UTMify Scripts
    if (!document.getElementById("utmify-scripts")) {
      const container = document.createElement("div");
      container.id = "utmify-scripts";
      
      const script1 = document.createElement("script");
      script1.src = "https://cdn.utmify.com.br/scripts/utms/latest.js";
      script1.async = true;
      script1.setAttribute("data-utmify-prevent-xcod-sck", "");
      script1.setAttribute("data-utmify-prevent-subids", "");
      
      const script2 = document.createElement("script");
      script2.src = "https://cdn.utmify.com.br/scripts/pixel/pixel.js";
      script2.async = true;
      
      const script3 = document.createElement("script");
      script3.text = `window.utmify_pixel_id = "69add314ca90986027a3c6c5";`;
      
      container.appendChild(script1);
      container.appendChild(script2);
      container.appendChild(script3);
      document.head.appendChild(container);
    }

    // Tracking for WhatsApp clicks
    const handleWhatsAppClick = () => {
      // @ts-ignore
      if (window.utmify_event) {
        // @ts-ignore
        window.utmify_event("ClickWhatsApp", { position: "landing" });
        // @ts-ignore
        window.utmify_event("WhatsAppWholesaleIntent", { source: "landing" });
        // @ts-ignore
        window.utmify_event("Lead", { type: "whatsapp" });
      }
    };

    const btns = document.querySelectorAll('a[href*="wa.me"]');
    btns.forEach((btn) => {
      btn.addEventListener("click", handleWhatsAppClick);
    });

    // Tracking PageView/OpenWholesalePage events
    // @ts-ignore
    if (window.utmify_event) {
      // @ts-ignore
      window.utmify_event("PageView", { page: window.location.pathname });
      // @ts-ignore
      window.utmify_event("OpenWholesalePage", {});
    }

    // Cleanup
    return () => {
      btns.forEach((btn) => {
        btn.removeEventListener("click", handleWhatsAppClick);
      });
    };
  }, []);

  const whatsappNumber = "553791000090";
  const whatsappLink1 = `https://wa.me/${whatsappNumber}?text=Ol%C3%A1%2C+quero+comprar+no+atacado`;
  const whatsappLink2 = `https://wa.me/${whatsappNumber}?text=Quero+comprar+no+atacado`;

  return (
    <div className="atacado-page" style={{ 
      backgroundColor: "#05070b", 
      color: "#ffffff", 
      minHeight: "100vh",
      fontFamily: "Inter, Arial, sans-serif",
      lineHeight: "1.5"
    }}>
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

        * { margin: 0; padding: 0; box-sizing: border-box; }

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
          width: min(calc(100% - 32px), 980px);
          margin: 0 auto;
        }

        a { text-decoration: none; }

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
          color: #aab4c4;
          max-width: 520px;
          margin: 0 auto 28px;
          font-size: 16px;
        }

        .btn {
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
          color: #aab4c4;
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

        .bubble {
          background: rgba(255,255,255,0.05);
          padding: 10px;
          border-radius: 10px;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .bubble.green {
          background: rgba(42,214,107,0.15);
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
          color: #aab4c4;
          margin-bottom: 24px;
        }

        footer {
          text-align: center;
          padding: 30px 0;
          color: #7f8a9a;
          font-size: 13px;
        }

        @media(max-width: 768px){
          .proof {
            justify-content: flex-start;
          }
        }
      `}</style>

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
        <p>Entre em contato agora para ver catálogo atualizado e comprar direto no atacado.</p>

        <a className="btn" href={whatsappLink1} target="_blank" rel="noopener noreferrer">
          Falar no WhatsApp
        </a>
      </section>

      <section className="section container">
        <h2>O que nossos clientes falam</h2>

        <div className="proof">
          <div className="proof-card">
            <img src="https://i.ibb.co/d4KrmjKj/REMODELE-ESSA-CIONVERSA-202604100921.jpg" style={{ width: "180px", height: "320px", objectFit: "cover", borderRadius: "8px" }} alt="Feedback 1" />
          </div>

          <div className="proof-card">
            <img src="https://i.ibb.co/RG0DVhjt/Coloque-foto-agradecendo-202604100927.jpg" style={{ width: "180px", height: "320px", objectFit: "cover", borderRadius: "8px" }} alt="Feedback 2" />
          </div>
          
          <div className="proof-card">
            <img src="https://i.ibb.co/1Gs5LRLk/Whats-App-Image-2026-04-10-at-09-41-27.jpg" style={{ width: "180px", height: "320px", objectFit: "cover", borderRadius: "8px" }} alt="Feedback 3" />
          </div>
          
          <div className="proof-card">
            <img src="https://i.ibb.co/5hP23RLP/retire-pedidos-no-202604100950.jpg" style={{ width: "180px", height: "320px", objectFit: "cover", borderRadius: "8px" }} alt="Feedback 4" />
          </div>
        </div>
      </section>

      <section className="cta container">
        <h2>Garanta seu pedido no atacado</h2>
        <p>Compra rápida direto pelo WhatsApp</p>

        <a className="btn" href={whatsappLink2} target="_blank" rel="noopener noreferrer">
          Comprar agora
        </a>
      </section>

      <footer>
        © {new Date().getFullYear()} Atacado ShopFlow - Todos os direitos reservados
      </footer>
    </div>
  );
};

export default AtacadoPage;

