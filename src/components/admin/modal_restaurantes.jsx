import React, { useState, useEffect } from "react";
import { X, Store, CreditCard, Mail, Lock, Phone, Loader2, User } from "lucide-react";
import { stringToCnpj, stringToCpf, stringToWhatsapp, changeToString } from "../../services/formatString";
import { restauranteApi } from "../../api/restaurante"; // 🌟 Consumindo nossa central de APIs

export default function ModalCriarRestaurante({ isOpen, onClose, onSuccess, restauranteParaEditar }) {
  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    email: "",
    whatsapp: "",
    nomeDono: "",
    cpf: "",
    senha: ""
  });

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const isEdicao = !!restauranteParaEditar; // TRUE se houver um objeto para editar, FALSE se for um novo cadastro

  // 🌟 Carrega os dados caso seja Modo Edição ou limpa o formulário caso seja Criação
  useEffect(() => {
    if (isOpen) {
      if (restauranteParaEditar) {
        setFormData({
          nome: restauranteParaEditar.nome || "",
          cnpj: restauranteParaEditar.cnpj ? stringToCnpj(restauranteParaEditar.cnpj) : "",
          email: restauranteParaEditar.email || "",
          whatsapp: restauranteParaEditar.whatsapp ? stringToWhatsapp(restauranteParaEditar.whatsapp) : "",
          nomeDono: "", // Campos ocultados na edição, não precisam de valor
          cpf: "",
          senha: ""
        });
      } else {
        setFormData({ nome: "", cnpj: "", email: "", whatsapp: "", nomeDono: "", cpf: "", senha: "" });
      }
      setErro("");
    }
  }, [isOpen, restauranteParaEditar]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorFormatado = value;

    if (name === "cpf") valorFormatado = stringToCpf(value);
    if (name === "whatsapp") valorFormatado = stringToWhatsapp(value);
    if (name === "cnpj") valorFormatado = stringToCnpj(value);

    setFormData(prev => ({ ...prev, [name]: valorFormatado }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    // Higieniza as strings removendo pontuações das máscaras
    const dadosHigienizados = {
      nome: formData.nome,
      email: formData.email,
      cnpj: changeToString(formData.cnpj) || undefined, // 🌟 Corrigido o erro de digitação changeToStrin
      whatsapp: changeToString(formData.whatsapp) || undefined,
    };

    try {
      if (isEdicao) {
        // 🛠️ MODO EDIÇÃO: Envia para a rota PUT /restaurantes/:id
        await restauranteApi.atualizar(restauranteParaEditar.id, dadosHigienizados);
        alert("Estabelecimento atualizado com sucesso!");
      } else {
        // 📦 MODO CRIAÇÃO: Inclui os dados do Dono Mestre exigidos pelo DTO de criação
        const dadosCriacao = {
          ...dadosHigienizados,
          nomeDono: formData.nomeDono,
          cpf: changeToString(formData.cpf),
          senha: formData.senha
        };
        await restauranteApi.criar(dadosCriacao);
        alert("Estabelecimento e Dono Mestre criados com sucesso!");
      }

      if (onSuccess) onSuccess(); // Atualiza a tabela do pai em tempo real
      onClose(); // Fecha o modal
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop de fundo */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Caixa do Modal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2 text-blue-500">
            <Store size={20} />
            <h2 className="text-lg font-bold text-white">
              {isEdicao ? "Editar Informações do Parceiro" : "Cadastrar Novo Parceria"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition p-1 rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* CORPO DO FORMULÁRIO */}
        <form onSubmit={handleSalvar} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {erro && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl font-medium">
              {erro}
            </div>
          )}

          {/* SEÇÃO 1: DADOS DO ESTABELECIMENTO */}
          <div>
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">1. Informações da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome do Restaurante</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input required type="text" name="nome" value={formData.nome} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition" placeholder="Ex: Burger House" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">CNPJ (Opcional)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input type="text" name="cnpj" value={formData.cnpj} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono" placeholder="00.000.000/0000-00" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">E-mail Comercial</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition" placeholder="comercial@restaurante.com" />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">WhatsApp de Atendimento</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input required type="text" name="whatsapp" value={formData.whatsapp} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono" placeholder="(00) 00000-0000" />
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: DADOS DO DONO MESTRE (Ocultada dinamicamente se for Edição) */}
          {!isEdicao && (
            <>
              <div className="border-t border-slate-800/60"></div>
              <div>
                <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">2. Responsável Legal (Dono)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome Completo do Dono</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 text-slate-500" size={16} />
                      <input required type="text" name="nomeDono" value={formData.nomeDono} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition" placeholder="Ex: João Silva Costa" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">CPF do Dono</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3.5 top-3 text-slate-500" size={16} />
                      <input required type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono" placeholder="000.000.000-00" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 font-medium block mb-1.5">Senha Provisória de Acesso</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3 text-slate-500" size={16} />
                      <input required type="password" name="senha" value={formData.senha} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition" placeholder="Mínimo 6 caracteres" />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* RODAPÉ DO MODAL / BOTÕES DE AÇÃO */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800 bg-slate-900/10 -mx-6 -mb-6 p-6">
            <button type="button" onClick={onClose} disabled={carregando} className="px-5 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition disabled:opacity-50">
              Cancelar
            </button>
            <button type="submit" disabled={carregando} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/10 transition disabled:opacity-50 disabled:cursor-not-allowed">
              {carregando ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando no Banco...
                </>
              ) : (
                isEdicao ? "Salvar Alterações" : "Concluir Cadastro"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}