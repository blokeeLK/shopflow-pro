import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setReady(true);
    } else {
      // Also check if user has active session from recovery link
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) setReady(true);
      });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (password !== confirm) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha atualizada com sucesso! 🔒" });
      navigate("/conta");
    }
  };

  if (!ready) {
    return (
      <div className="container max-w-md py-20 text-center">
        <h1 className="font-display text-xl font-bold text-foreground mb-2">Link inválido</h1>
        <p className="text-sm text-muted-foreground">Use o link enviado ao seu e-mail para redefinir a senha.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-12 md:py-20">
      <div className="bg-card border rounded-xl p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold text-foreground text-center mb-6">Nova senha</h1>
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nova senha</label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                maxLength={72}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Confirmar senha</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repita a senha" maxLength={72} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 transition-colors text-sm disabled:opacity-50"
          >
            {loading ? "Atualizando..." : "Atualizar senha"}
          </button>
        </form>
      </div>
    </div>
  );
}
