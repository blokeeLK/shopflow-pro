import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSupabaseData";
import { trackClickWhatsApp } from "@/lib/tracking";

export function WhatsAppButton() {
  const { data: settings } = useSiteSettings();
  const phone = settings?.whatsapp_number || "553791000090";
  const defaultMessage = "Olá, gostaria de saber mais informações sobre o atacado de camisas !";
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(defaultMessage)}`;

  const handleClick = () => {
    trackClickWhatsApp({
      phone,
      page: window.location.pathname,
      context: "floating",
      position: "floating",
      intent_level: "curious",
      button_text: "WhatsApp",
      message_type: "general",
    });
  };

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="fixed bottom-4 right-4 z-50 bg-success hover:bg-success/90 text-success-foreground rounded-full p-3.5 shadow-elevated transition-all hover:scale-105"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
