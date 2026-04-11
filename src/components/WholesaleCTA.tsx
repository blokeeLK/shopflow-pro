import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSupabaseData";
import { trackWhatsAppProductIntent, trackWholesaleLead } from "@/lib/tracking";

export function WholesaleCTA() {
  const { data: settings } = useSiteSettings();

  const isEnabled = settings?.wholesale_block_enabled !== "false";
  if (!isEnabled) return null;

  const phone = settings?.whatsapp_number || "553791000090";
  const prefilledMsg = "Olá, gostaria de saber mais informações sobre o atacado de camisas !";
  const message = encodeURIComponent(prefilledMsg);
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

  const handleClick = () => {
    trackWhatsAppProductIntent({
      phone,
      message_text: "atacado revenda",
      prefilled_message: prefilledMsg,
      message_type: "wholesale",
      page: window.location.pathname,
      context: "wholesale",
      position: "product_wholesale_block",
      is_wholesale: true,
      intent_level: "strong_lead",
      button_text: "Falar no WhatsApp sobre Atacado",
      wholesale_cta_type: "contact_seller",
    });
    trackWholesaleLead({
      page: window.location.pathname,
      cta_text: "Falar no WhatsApp sobre Atacado",
      cta_position: "product_page_wholesale_block",
      wholesale_cta_type: "contact_seller",
    });
  };

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 md:p-6">
      <h3 className="font-display text-lg md:text-xl font-bold text-foreground mb-2">
        💼 Quer se tornar um Revendedor?
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed mb-1">
        Ganhe dinheiro revendendo nossos produtos! Trabalhamos também no atacado com condições especiais, preços exclusivos e suporte direto para parceiros.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        Se você quer comprar em maior quantidade para revenda, fale agora com nosso time e receba sua tabela especial.
      </p>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm px-5 py-3 rounded-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
      >
        <MessageCircle className="h-5 w-5" />
        👉 Falar no WhatsApp sobre Atacado
      </a>
    </div>
  );
}
