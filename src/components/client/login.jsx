import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Store, CreditCard, Lock, Loader2, AlertCircle } from "lucide-react";
import { BASE_URL } from "../../api/Auth";

const formatarCPF = (value) => {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
};

export default function Login() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    codigoRestaurante: "",
    cpf: "",
    senha: "",
  });

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const valorTratado = name === "cpf" ? formatarCPF(value) : value;
    
    setFormData((prev) => ({ ...prev, [name]: valorTratado }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    console.log(base)
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigoRestaurante: formData.codigoRestaurante,
          cpf: formData.cpf,
          senha: formData.senha
        }),
      });

      const dados = await response.json();
      console.log(dados)

      if (!response.ok) {
        // Captura a mensagem de erro vinda do NestJS (ex: se o restaurante estiver bloqueado)
        throw new Error(dados.message || "Falha ao autenticar no sistema.");
      }

      // 💾 Salva os dados de autenticação no LocalStorage do navegador
      localStorage.setItem("@App:token", dados.token);
      localStorage.setItem("@App:user", JSON.stringify(dados.usuario));

      // 🚦 REDIRECIONAMENTO INTELIGENTE
      if (dados.usuario.permissao === "super_admin") {
        // Você e seu amigo entram no painel de controle administrativo global
        navigate("/admin/dashboard");
      } else {
        // Clientes e funcionários entram no painel operacional da loja deles
        navigate("/app");
      }

    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
      
      {/* Container do Card de Login */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6">
        
        {/* Identidade Visual / Header do Formulário */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-blue-600/10 text-blue-500 rounded-xl border border-blue-500/20 mb-2">
            <Store size={28} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Aceder à Plataforma</h1>
          <p className="text-sm text-slate-400">Insira as credenciais do seu estabelecimento para continuar.</p>
        </div>

        {/* Feedback de Erro Visual */}
        {erro && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5 font-medium animate-in fade-in slide-in-from-top-1 duration-200">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {/* FORMULÁRIO DE ENTRADA */}
        <form onSubmit={handleLogin} className="space-y-4">
          
          {/* Campo 1: Código do Restaurante */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Código do Estabelecimento</label>
            <div className="relative">
              <Store className="absolute left-3.5 top-3 text-slate-500" size={16} />
              <input
                required
                type="text"
                name="codigoRestaurante"
                value={formData.codigoRestaurante}
                onChange={handleInputChange}
                autoComplete="off"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono uppercase"
                placeholder="Ex: 1002"
              />
            </div>
          </div>

          {/* Campo 2: CPF do Usuário */}
          <div>
            <label className="text-xs text-slate-400 font-medium block mb-1.5">Seu CPF</label>
            <div className="relative">
              <CreditCard className="absolute left-3.5 top-3 text-slate-500" size={16} />
              <input
                required
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                placeholder="000.000.000-00"
              />
            </div>
          </div>

          {/* Campo 3: Senha de Acesso */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs text-slate-400 font-medium">Sua Senha</label>
              <a href="#esqueceu" className="text-[11px] text-blue-500 hover:underline">Esqueceu-se da senha?</a>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 text-slate-500" size={16} />
              <input
                required
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleInputChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Botão de Submissão */}
          <button
            type="submit"
            disabled={carregando}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl text-sm shadow-lg shadow-blue-600/10 transition mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Validando Acesso...
              </>
            ) : (
              "Entrar no Painel"
            )}
          </button>

        </form>
      </div>

      {/* Rodapé / Direitos Autorais */}
      <p className="text-[11px] text-slate-600 mt-6 font-mono">Plataforma SaaS © {new Date().getFullYear()}</p>
    </div>
  );
}