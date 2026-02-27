import { MessageCircle } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSupabaseData";

export function WholesaleCTA() {
  const { data: settings } = useSiteSettings();

  // Check if wholesale block is disabled via admin settings
  const isEnabled = settings?.wholesale_block_enabled !== "false";
  if (!isEnabled) return null;

  const phone = settings?.whatsapp_number || "5511999999999";
  const message = encodeURIComponent(
    "Olá, vim pelo site e tenho interesse em comprar no atacado para revenda. Poderia me enviar as informações e tabela de preços?"
  );
  const whatsappUrl = `https://wa.me/${phone}?text=${message}`;

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
        className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold text-sm px-5 py-3 rounded-lg transition-all duration-200 hover:scale-[1.03] hover:shadow-lg"
      >
        <MessageCircle className="h-5 w-5" />
        👉 Falar no WhatsApp sobre Atacado
      </a>
    </div>
  );
}
