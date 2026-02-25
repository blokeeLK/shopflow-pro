import { MessageCircle } from "lucide-react";

export function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5511999999999"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-50 bg-success hover:bg-success/90 text-success-foreground rounded-full p-3.5 shadow-elevated transition-all hover:scale-105"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
