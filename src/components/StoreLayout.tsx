import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SocialProofPopup } from "@/components/SocialProofPopup";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { Outlet } from "react-router-dom";

export function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <SocialProofPopup />
      <WhatsAppButton />
    </div>
  );
}
