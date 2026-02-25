import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Informe seu e-mail", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="container max-w-md py-20 text-center">
        <Mail className="h-12 w-12 text-accent mx-auto mb-4" />
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">E-mail enviado!</h1>
        <p className="text-sm text-muted-foreground mb-6">Verifique sua caixa de entrada para redefinir sua senha.</p>
        <Link to="/login" className="text-accent font-semibold hover:underline text-sm">Voltar ao login</Link>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-12 md:py-20">
      <div className="bg-card border rounded-xl p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold text-foreground text-center mb-2">Esqueci minha senha</h1>
        <p className="text-sm text-muted-foreground text-center mb-6">Informe seu e-mail para receber o link de recuperação.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" maxLength={255} />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 transition-colors text-sm disabled:opacity-50"
          >
            {loading ? "Enviando..." : "Enviar link de recuperação"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/login" className="text-accent font-semibold hover:underline">Voltar ao login</Link>
        </p>
      </div>
    </div>
  );
}
