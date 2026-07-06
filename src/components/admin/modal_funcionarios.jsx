import React, { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

export default function ModalRestaurante({ aberto, fechar, salvar, restaurante }) {
  const [formData, setFormData] = useState({
    nome: "",
    codigo: "",
    cnpj: "",
    telefone: "",
    plano: "Basic",
  });
  const [erroApi, setErroApi] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Sempre que o modal abrir ou mudar o restaurante selecionado, atualiza o formulário
  useEffect(() => {
    if (restaurante) {
      setFormData({
        nome: restaurante.nome || "",
        codigo: restaurante.codigo || "",
        cnpj: restaurante.cnpj || "",
        telefone: restaurante.telefone || "",
        plano: restaurante.plano || "Basic",
      });
    } else {
      setFormData({ nome: "", codigo: "", cnpj: "", telefone: "", plano: "Basic" });
    }
    setErroApi(null);
  }, [restaurante, aberto]);

  if (!aberto) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErroApi(null);

    try {
      await salvar(formData);
    } catch (err) {
      setErroApi(err.message); // Exibe a mensagem limpa vinda do Filtro de Exceções do NestJS
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        
        {/* Header do Modal */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100">
            {restaurante ? "Editar Restaurante" : "Cadastrar Novo Restaurante"}
          </h2>
          <button onClick={fechar} className="text-slate-400 hover:text-slate-200 transition">
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {erroApi && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-start gap-2 text-xs font-medium">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{erroApi}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Nome do Estabelecimento *</label>
            <input
              type="text"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Código Único (Slug/URL) *</label>
            <input
              type="text"
              required
              disabled={!!restaurante} // Bloqueia alteração do código se for edição para não quebrar links
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toLowerCase().trim() })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">CNPJ</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Telefone</label>
              <input
                type="text"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">Plano de Assinatura</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition"
              value={formData.plano}
              onChange={(e) => setFormData({ ...formData, plano: e.target.value })}
            >
              <option value="Basic">Basic</option>
              <option value="Premium">Premium</option>
              <option value="MasterFranchise">Master Franchise</option>
            </select>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/60 mt-6">
            <button
              type="button"
              onClick={fechar}
              className="px-4 py-2 bg-slate-950 border border-slate-800 hover:bg-slate-800 text-sm font-semibold text-slate-400 hover:text-white rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-sm font-semibold text-white rounded-xl transition flex items-center justify-center"
            >
              {enviando ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}