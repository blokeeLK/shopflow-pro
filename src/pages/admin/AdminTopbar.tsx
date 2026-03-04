import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Save, Plus, Trash2, GripVertical, Truck, Shield, CreditCard, Eye, EyeOff,
  ChevronUp, ChevronDown, Zap, Tag, Heart, Star, Gift, Clock, MapPin, Phone
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";

interface TopbarItem {
  id: string;
  text: string;
  enabled: boolean;
  icon: string;
  order: number;
}

const ICON_OPTIONS = [
  { value: "truck", label: "Frete", Icon: Truck },
  { value: "shield", label: "Segurança", Icon: Shield },
  { value: "credit-card", label: "Cartão", Icon: CreditCard },
  { value: "zap", label: "Relâmpago", Icon: Zap },
  { value: "tag", label: "Etiqueta", Icon: Tag },
  { value: "heart", label: "Coração", Icon: Heart },
  { value: "star", label: "Estrela", Icon: Star },
  { value: "gift", label: "Presente", Icon: Gift },
  { value: "clock", label: "Relógio", Icon: Clock },
  { value: "map-pin", label: "Local", Icon: MapPin },
  { value: "phone", label: "Telefone", Icon: Phone },
];

function getIconComponent(iconName: string) {
  const found = ICON_OPTIONS.find((i) => i.value === iconName);
  return found ? found.Icon : Zap;
}

export default function AdminTopbar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [items, setItems] = useState<TopbarItem[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["topbar_enabled", "topbar_items"]);

    if (data) {
      const map: Record<string, string> = {};
      data.forEach((r) => { map[r.key] = r.value || ""; });
      setEnabled(map.topbar_enabled !== "false");
      try {
        const parsed = JSON.parse(map.topbar_items || "[]");
        setItems(parsed.sort((a: TopbarItem, b: TopbarItem) => a.order - b.order));
      } catch {
        setItems([]);
      }
    }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    const orderedItems = items.map((item, i) => ({ ...item, order: i + 1 }));

    const updates = [
      { key: "topbar_enabled", value: String(enabled) },
      { key: "topbar_items", value: JSON.stringify(orderedItems) },
    ];

    for (const u of updates) {
      await supabase
        .from("site_settings")
        .update({ value: u.value, updated_at: new Date().toISOString() })
        .eq("key", u.key);
    }

    queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    toast({ title: "Topbar salva com sucesso! ✅" });
    setSaving(false);
  }

  function addItem() {
    setItems([
      ...items,
      {
        id: `item_${Date.now()}`,
        text: "Novo item",
        enabled: true,
        icon: "zap",
        order: items.length + 1,
      },
    ]);
  }

  function removeItem(id: string) {
    setItems(items.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: keyof TopbarItem, value: any) {
    setItems(items.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  function moveItem(index: number, direction: -1 | 1) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= items.length) return;
    const newItems = [...items];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setItems(newItems);
  }

  if (loading) {
    return <div className="p-6"><p className="text-muted-foreground text-sm">Carregando...</p></div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-accent" /> Topbar do Site
        </h1>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 text-sm bg-accent text-accent-foreground rounded-lg hover:bg-accent/90 font-semibold disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4" /> {saving ? "Salvando..." : "Salvar"}
        </button>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mb-6 text-xs text-muted-foreground">
        💡 Configure a faixa que aparece no topo do site com mensagens promocionais. As alterações são aplicadas imediatamente após salvar.
      </div>

      {/* Toggle global */}
      <div className="flex items-center justify-between p-4 bg-card border rounded-lg mb-6">
        <div>
          <p className="text-sm font-semibold text-foreground">Ativar Topbar</p>
          <p className="text-xs text-muted-foreground">Exibir a faixa promocional no topo do site</p>
        </div>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>

      {/* Preview */}
      <div className="mb-6">
        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2 block">
          Pré-visualização
        </label>
        {enabled ? (
          <div className="bg-[hsl(var(--primary))] text-primary-foreground rounded-lg overflow-hidden">
            <div className="flex items-center justify-center gap-6 py-2.5 px-4 flex-wrap">
              {items.filter((i) => i.enabled).map((item) => {
                const IconComp = getIconComponent(item.icon);
                return (
                  <span key={item.id} className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap">
                    <IconComp className="h-3.5 w-3.5" />
                    {item.text}
                  </span>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 text-center text-sm text-muted-foreground bg-muted/30">
            <EyeOff className="h-5 w-5 mx-auto mb-1 opacity-50" />
            Topbar desativada
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-3 mb-4">
        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Itens da Topbar ({items.length})
        </label>
        {items.map((item, index) => {
          const IconComp = getIconComponent(item.icon);
          return (
            <div key={item.id} className={`border rounded-lg p-4 bg-card transition-opacity ${!item.enabled ? "opacity-50" : ""}`}>
              <div className="flex items-start gap-3">
                {/* Reorder */}
                <div className="flex flex-col gap-0.5 pt-1">
                  <button onClick={() => moveItem(index, -1)} disabled={index === 0} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20">
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                  <button onClick={() => moveItem(index, 1)} disabled={index === items.length - 1} className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-20">
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-3">
                  {/* Text */}
                  <Input
                    value={item.text}
                    onChange={(e) => updateItem(item.id, "text", e.target.value)}
                    placeholder="Texto do item..."
                    className="text-sm"
                  />

                  {/* Icon selector */}
                  <div className="flex flex-wrap gap-1.5">
                    {ICON_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateItem(item.id, "icon", opt.value)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                          item.icon === opt.value
                            ? "bg-accent text-accent-foreground"
                            : "bg-secondary text-muted-foreground hover:text-foreground"
                        }`}
                        title={opt.label}
                      >
                        <opt.Icon className="h-3 w-3" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle + Delete */}
                <div className="flex items-center gap-2 pt-1">
                  <Switch
                    checked={item.enabled}
                    onCheckedChange={(v) => updateItem(item.id, "enabled", v)}
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={addItem}
        className="flex items-center gap-1.5 px-4 py-2.5 text-sm border-2 border-dashed rounded-lg text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors w-full justify-center"
      >
        <Plus className="h-4 w-4" /> Adicionar item
      </button>
    </div>
  );
}
