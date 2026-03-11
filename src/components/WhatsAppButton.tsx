import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSupabaseData";
import { trackClickWhatsApp } from "@/lib/tracking";

export function WhatsAppButton() {
  const { data: settings } = useSiteSettings();
  const phone = settings?.whatsapp_number || "5511999999999";

  const handleClick = () => {
    trackClickWhatsApp({
      phone,
      page: window.location.pathname,
      context: "floating",
    });
  };

  return (
    <a
      href={`https://wa.me/${phone}`}
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
