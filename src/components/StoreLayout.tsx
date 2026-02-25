import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SocialProofPopup } from "@/components/SocialProofPopup";
import { WhatsAppButton } from "@/components/WhatsAppButton";
import { CustomHtmlBlock } from "@/components/CustomHtmlBlock";
import { Outlet } from "react-router-dom";

export function StoreLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <CustomHtmlBlock section="header_html" />
      <main className="flex-1">
        <Outlet />
      </main>
      <CustomHtmlBlock section="footer_html" />
      <Footer />
      <SocialProofPopup />
      <WhatsAppButton />
    </div>
  );
}
