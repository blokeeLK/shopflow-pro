import { useEffect, useState } from "react";
import { products, formatCurrency, getTotalStock } from "@/data/store";

const fakeNames = [
  "Maria S.", "João P.", "Ana L.", "Carlos M.", "Fernanda R.",
  "Pedro H.", "Julia C.", "Lucas O.", "Camila T.", "Rafael B.",
  "Beatriz A.", "Gustavo F.", "Larissa D.", "Thiago N.", "Isabela V.",
];

const fakeCities = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba",
  "Salvador", "Fortaleza", "Brasília", "Porto Alegre",
];

export function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [notification, setNotification] = useState({ name: "", product: "", city: "" });

  useEffect(() => {
    const availableProducts = products.filter((p) => getTotalStock(p) > 0);
    if (availableProducts.length === 0) return;

    const showNotification = () => {
      const product = availableProducts[Math.floor(Math.random() * availableProducts.length)];
      const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
      const city = fakeCities[Math.floor(Math.random() * fakeCities.length)];

      setNotification({ name, product: product.name, city });
      setVisible(true);

      setTimeout(() => setVisible(false), 4000);
    };

    const interval = setInterval(showNotification, 25000 + Math.random() * 20000);
    const initialTimeout = setTimeout(showNotification, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(initialTimeout);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-xs bg-card rounded-lg shadow-elevated border p-3 animate-slide-in-right">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-foreground">
            {notification.name.charAt(0)}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground">
            <span className="font-bold">{notification.name}</span> comprou
          </p>
          <p className="text-xs text-muted-foreground truncate">{notification.product}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{notification.city} • agora mesmo</p>
        </div>
      </div>
    </div>
  );
}
