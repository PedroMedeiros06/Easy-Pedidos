import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store, CreditCard, Lock, Loader2, AlertCircle, UtensilsCrossed } from "lucide-react";
import { authApi } from "../api/base/auth";
import { consumirMotivoBloqueio } from "../api/httpClient";
import { changeToString, stringToCpf } from "../services/formatString";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_code: "",
    member_cpf: "",
    member_password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Se o httpClient deslogou por estabelecimento bloqueado (403), mostra o motivo.
  useEffect(() => {
    const motivo = consumirMotivoBloqueio();
    if (motivo) setError(motivo);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let treatedValue = value;

    if (name === "member_cpf") {
      treatedValue = stringToCpf(value);
    }

    if (name === "company_code") {
      treatedValue = value.toUpperCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: treatedValue,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const rawCompanyCode = formData.company_code.trim();
      const normalizedCompanyCode = rawCompanyCode.startsWith("E-")
        ? rawCompanyCode
        : `E-${rawCompanyCode}`;

      const loginData = {
        ...formData,
        company_code: normalizedCompanyCode,
        member_cpf: changeToString(formData.member_cpf),
      };

      console.log("[Login] formData bruto:", formData);
      console.log("[Login] loginData enviado:", loginData);

      const data = await authApi.login(loginData);

      console.log("[Login] resposta recebida:", data);

      if (!data?.session?.access_token) {
        console.error("[Login] sessão ausente na resposta:", data);
        throw new Error("Sessão de autenticação não recebida.");
      }

      localStorage.setItem("@App:token", data.session.access_token);

      if (data.session.refresh_token) {
        localStorage.setItem("@App:refresh_token", data.session.refresh_token);
      }

      if (data.user) {
        localStorage.setItem("@App:user", JSON.stringify(data.user));
      }

      if (data.member) {
        localStorage.setItem("@App:member", JSON.stringify(data.member));
      }

      if (data.company) {
        localStorage.setItem("@App:company", JSON.stringify(data.company));
      }

      if (data.permissions) {
        localStorage.setItem("@App:permissions", JSON.stringify(data.permissions));
      }

      navigate("/app");
    } catch (err) {
      console.error("Erro no login:", err);

      setError(err?.message || "Não foi possível realizar o login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center px-16 overflow-hidden bg-zinc-950 text-zinc-50">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div
          className="absolute -top-32 -left-10 h-96 w-96 rounded-full bg-brand/20 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col gap-7 max-w-md">
          <div className="inline-flex size-11 items-center justify-center rounded-xl bg-brand text-brand-foreground font-semibold">
            <UtensilsCrossed size={20} />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight">
              Gestão completa para o seu restaurante
            </h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Pedidos, estoque e equipe em um só painel. Simples para o seu dia a dia.
            </p>
          </div>

          <div className="flex gap-2">
            <span className="h-1 w-6 rounded-full bg-brand" />
            <span className="h-1 w-2 rounded-full bg-zinc-700" />
            <span className="h-1 w-2 rounded-full bg-zinc-700" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Acesse sua conta</h2>
            <p className="text-sm text-muted-foreground">
              Entre com os dados do seu estabelecimento
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle size={16} />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="company_code">Código do Estabelecimento</Label>

              <div className="relative">
                <Store
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />

                <Input
                  required
                  id="company_code"
                  type="text"
                  name="company_code"
                  value={formData.company_code}
                  onChange={handleInputChange}
                  autoComplete="off"
                  className="pl-8 uppercase font-mono"
                  placeholder="Ex: 1002"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="member_cpf">Seu CPF</Label>

              <div className="relative">
                <CreditCard
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />

                <Input
                  required
                  id="member_cpf"
                  type="text"
                  name="member_cpf"
                  value={formData.member_cpf}
                  onChange={handleInputChange}
                  className="pl-8 font-mono"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="member_password">Sua Senha</Label>

                <a href="#esqueceu" className="text-xs text-brand hover:underline">
                  Esqueceu-se da senha?
                </a>
              </div>

              <div className="relative">
                <Lock
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={16}
                />

                <Input
                  required
                  id="member_password"
                  type="password"
                  name="member_password"
                  value={formData.member_password}
                  onChange={handleInputChange}
                  className="pl-8"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-brand text-brand-foreground hover:bg-brand/90"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Validando Acesso...
                </>
              ) : (
                "Entrar no Painel"
              )}
            </Button>
          </form>

          <Link
            to="/admin/login"
            className="block text-center text-xs text-muted-foreground hover:underline"
          >
            Acesso do Administrador
          </Link>
        </div>
      </div>
    </div>
  );
}
