import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, CreditCard, Lock, Loader2, AlertCircle } from "lucide-react";
import { authApi } from "../api/base/Auth";
import { changeToString, stringToCpf } from "../services/formatString";

export default function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    company_code: "",
    member_cpf: "",
    member_password: "",
  });

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let valorTratado = value;

    if (name === "member_cpf") {
      valorTratado = stringToCpf(value);
    }

    if (name === "company_code") {
      valorTratado = value.toUpperCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: valorTratado,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setCarregando(true);
    setErro("");

    try {
      const dadosLogin = {  
        ...formData,
        member_cpf: changeToString(formData.member_cpf),
      };

      const dados = await authApi.login(dadosLogin);

      if (!dados?.session?.access_token) {
        throw new Error("Sessão de autenticação não recebida.");
      }

      localStorage.setItem("@App:token", dados.session.access_token );

      if (dados.session.refresh_token) {
        localStorage.setItem( "@App:refresh_token", dados.session.refresh_token );
      }

      if (dados.user) { 
        localStorage.setItem( "@App:user", JSON.stringify(dados.user));
      }

      if (dados.member) {
        localStorage.setItem( "@App:member", JSON.stringify(dados.member));
      }

      if (dados.company) {
        localStorage.setItem( "@App:company", JSON.stringify(dados.company));
      }

      if (dados.permissions) {
        localStorage.setItem("@App:permissions", JSON.stringify(dados.permissions));
      }

      if (dados.member.member_access === 'administrator') {
        navigate("/admin/dashboard");
      } else {
        navigate("/app");
      }
      

    } catch (err) {
      console.error("Erro no login:", err);

      setErro(
        err?.message ||
        "Não foi possível realizar o login."
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
      {/* Container do Card de Login */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">

        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20 mb-2">
            <Store size={28} />
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">
            Aceder à Plataforma
          </h1>

          <p className="text-sm text-slate-400">
            Insira as credenciais do seu estabelecimento para continuar.
          </p>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle
              size={16}
              className="shrink-0 mt-0.5"
            />

            <span>{erro}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* Código da empresa */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">
              Código do Estabelecimento
            </label>

            <div className="relative">
              <Store
                className="absolute left-3.5 top-3 text-slate-500"
                size={16}
              />

              <input
                required
                type="text"
                name="company_code"
                value={formData.company_code}
                onChange={handleInputChange}
                autoComplete="off"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono uppercase"
                placeholder="Ex: 1002"
              />
            </div>
          </div>

          {/* CPF */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">
              Seu CPF
            </label>

            <div className="relative">
              <CreditCard
                className="absolute left-3.5 top-3 text-slate-500"
                size={16}
              />

              <input
                required
                type="text"
                name="member_cpf"
                value={formData.member_cpf}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          {/* Senha */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-slate-400 font-medium">
                Sua Senha
              </label>

              <a
                href="#esqueceu"
                className="text-[11px] text-blue-500 hover:underline"
              >
                Esqueceu-se da senha?
              </a>
            </div>

            <div className="relative">
              <Lock
                className="absolute left-3.5 top-3 text-slate-500"
                size={16}
              />

              <input
                required
                type="password"
                name="member_password"
                value={formData.member_password}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Botão */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow-lg shadow-blue-600/10 transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />

                Validando Acesso...
              </>
            ) : (
              "Entrar no Painel"
            )}
          </button>
        </form>
      </div>

      {/* Rodapé */}
      <p className="text-[11px] text-slate-600 mt-6 font-mono">
        Plataforma SaaS © {new Date().getFullYear()}
      </p>
    </div>
  );
}