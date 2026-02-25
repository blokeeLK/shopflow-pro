import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { validateCPF, formatCPF } from "@/lib/cpf";
import { Eye, EyeOff, UserPlus } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCpfChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    setCpf(digits.length === 11 ? formatCPF(digits) : digits);
  };

  const handlePhoneChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) setPhone(digits);
    else if (digits.length <= 7) setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2)}`);
    else setPhone(`(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = cpf.replace(/\D/g, "");

    if (!name.trim() || !email.trim() || !password || !cleanCpf) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "A senha deve ter no mínimo 6 caracteres", variant: "destructive" });
      return;
    }
    if (!validateCPF(cleanCpf)) {
      toast({ title: "CPF inválido", description: "Verifique o número digitado.", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name: name.trim() },
      },
    });

    if (error) {
      setLoading(false);
      toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      return;
    }

    // Update profile with CPF and phone
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({
        cpf: cleanCpf,
        phone: phone.replace(/\D/g, ""),
      }).eq("id", user.id);
    }

    setLoading(false);
    toast({ title: "Conta criada com sucesso! 🎉", description: "Verifique seu e-mail para confirmar." });
    navigate("/login");
  };

  return (
    <div className="container max-w-md py-12 md:py-20">
      <div className="bg-card border rounded-xl p-6 md:p-8">
        <h1 className="font-display text-2xl font-bold text-foreground text-center mb-6">Criar conta</h1>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nome completo *</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" maxLength={100} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">E-mail *</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" maxLength={255} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">CPF *</label>
            <Input value={cpf} onChange={(e) => handleCpfChange(e.target.value)} placeholder="000.000.000-00" maxLength={14} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Telefone</label>
            <Input value={phone} onChange={(e) => handlePhoneChange(e.target.value)} placeholder="(00) 00000-0000" maxLength={15} />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Senha *</label>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-accent-foreground font-display font-semibold py-3 rounded-lg hover:bg-accent/90 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            {loading ? "Criando..." : "Criar conta"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-accent font-semibold hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
}
