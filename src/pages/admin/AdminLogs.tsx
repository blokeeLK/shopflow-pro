import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Search } from "lucide-react";

export default function AdminLogs() {
  const [search, setSearch] = useState("");

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["admin-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_logs")
        .select("*, profile:profiles!admin_logs_admin_id_fkey(name, email)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) {
        // Fallback without join if FK doesn't exist
        const { data: d2, error: e2 } = await supabase
          .from("admin_logs")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(200);
        if (e2) throw e2;
        return d2;
      }
      return data;
    },
  });

  const filtered = logs.filter((l: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return l.action?.toLowerCase().includes(s) || l.entity?.toLowerCase().includes(s) || l.entity_id?.toLowerCase().includes(s);
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Log de Auditoria</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por ação, entidade..."
          className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg text-sm text-foreground" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Data</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Admin</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Ação</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Entidade</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l: any) => (
                <tr key={l.id} className="border-b last:border-0">
                  <td className="p-3 text-muted-foreground text-xs">{new Date(l.created_at).toLocaleString("pt-BR")}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{(l as any).profile?.name || l.admin_id?.slice(0, 8)}</td>
                  <td className="p-3 text-foreground capitalize">{l.action}</td>
                  <td className="p-3 text-foreground">{l.entity}{l.entity_id ? ` #${l.entity_id.slice(0, 8)}` : ""}</td>
                  <td className="p-3 text-muted-foreground text-xs hidden md:table-cell max-w-[200px] truncate">
                    {l.details ? JSON.stringify(l.details) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum log encontrado</p>}
        </div>
      )}
    </div>
  );
}
