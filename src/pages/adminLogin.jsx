import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, CreditCard, Lock, Loader2, AlertCircle } from "lucide-react";
import { authApi } from "../api/base/auth";
import { changeToString, stringToCpf } from "../services/formatString";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    admin_cpf: "",
    admin_password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let treatedValue = value;

    if (name === "admin_cpf") {
      treatedValue = stringToCpf(value);
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
      const loginData = {
        ...formData,
        admin_cpf: changeToString(formData.admin_cpf),
      };

      const data = await authApi.adminLogin(loginData);

      if (!data?.session?.access_token) {
        throw new Error("Sessão de autenticação não recebida.");
      }

      localStorage.setItem("@App:token", data.session.access_token);

      if (data.session.refresh_token) {
        localStorage.setItem("@App:refresh_token", data.session.refresh_token);
      }

      if (data.user) {
        localStorage.setItem("@App:user", JSON.stringify(data.user));
      }

      if (data.admin) {
        localStorage.setItem("@App:admin", JSON.stringify(data.admin));
      }

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Erro no login de admin:", err);

      setError(err?.message || "Não foi possível realizar o login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <Card className="w-full max-w-md border-amber-500/20 bg-zinc-900 text-zinc-100">
        <CardHeader className="text-center gap-2">
          <div className="mx-auto inline-flex p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 mb-2">
            <ShieldCheck size={28} />
          </div>

          <Badge variant="outline" className="mx-auto border-amber-500/30 text-amber-500">
            Painel do Administrador
          </Badge>

          <CardTitle className="text-2xl text-zinc-100">Acesso Restrito</CardTitle>

          <CardDescription className="text-zinc-400">
            Área exclusiva para administradores da plataforma.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle size={16} />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="admin_cpf" className="text-zinc-300">
                CPF
              </Label>

              <div className="relative">
                <CreditCard
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={16}
                />

                <Input
                  required
                  id="admin_cpf"
                  type="text"
                  name="admin_cpf"
                  value={formData.admin_cpf}
                  onChange={handleInputChange}
                  className="pl-8 font-mono bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-amber-500/40 focus-visible:border-amber-500/50"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="admin_password" className="text-zinc-300">
                Senha
              </Label>

              <div className="relative">
                <Lock
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={16}
                />

                <Input
                  required
                  id="admin_password"
                  type="password"
                  name="admin_password"
                  value={formData.admin_password}
                  onChange={handleInputChange}
                  className="pl-8 bg-zinc-950 border-zinc-800 text-zinc-100 focus-visible:ring-amber-500/40 focus-visible:border-amber-500/50"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-amber-600 text-zinc-950 hover:bg-amber-500"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Validando Acesso...
                </>
              ) : (
                "Entrar como Administrador"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link to="/login" className="text-xs text-zinc-500 hover:underline mt-6">
        Voltar ao login do estabelecimento
      </Link>
    </div>
  );
}
