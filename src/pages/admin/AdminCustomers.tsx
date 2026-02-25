import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { useState } from "react";

export default function AdminCustomers() {
  const [search, setSearch] = useState("");

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = profiles.filter((p: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s) || p.cpf?.includes(s);
  });

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1 className="font-display text-2xl font-bold text-foreground mb-6">Clientes</h1>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nome, email ou CPF..."
          className="w-full pl-10 pr-4 py-2 bg-card border rounded-lg text-sm text-foreground" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-card border rounded-lg animate-pulse" />)}</div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Nome</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Email</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">CPF</th>
                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Telefone</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Cadastro</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-secondary/30">
                  <td className="p-3 font-medium text-foreground">{p.name || "—"}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{p.email || "—"}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell font-mono">{p.cpf || "—"}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{p.phone || "—"}</td>
                  <td className="p-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum cliente encontrado</p>}
        </div>
      )}
    </div>
  );
}
