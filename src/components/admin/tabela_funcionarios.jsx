// src/components/admin/tabela_funcionarios.jsx
import React, { useState } from "react";
import { Building2, UserX, UserCheck, AlertCircle, Crown, MoreVertical, Calendar, Clock } from "lucide-react";
import { stringToCpf, stringToWhatsapp } from "../../services/formatString";

export default function TabelaFuncionarios({ funcionarios, onActionSuccess, onEditarClick }) {
  // Estado para controlar qual ID está aberto e a posição flutuante do menu na tela
  const [dropdownAberto, setDropdownAberto] = useState(null);
  const [dropdownPosicao, setDropdownPosicao] = useState({ top: 0, left: 0 });

  // 🕒 Função auxiliar para deixar a data no padrão brasileiro (DD/MM/AAAA HH:MM)
  const formatarData = (dataString) => {
    if (!dataString) return "Nunca acessou";
    return new Date(dataString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }) + "h";
  };

  const alternarBloqueio = async (id, statusAtual) => {
    let motivo = "";
    
    // Se a ação for BLOQUEAR (status atual é ativo/false), pede o motivo
    if (!statusAtual) {
      motivo = prompt("Digite o motivo do bloqueio do colaborador:");
      if (motivo === null) return; // Cancela se o administrador clicar em cancelar no prompt
    }

    try {
      const response = await fetch(`http://localhost:3000/funcionarios/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          statusAtual: statusAtual, 
          motivo: motivo 
        }),
      });

      if (!response.ok) throw new Error("Erro ao mudar status do colaborador.");
      onActionSuccess();
      setDropdownAberto(null); // Fecha o menu
    } catch (err) {
      alert(err.message);
    }
  };

  // Calcula onde o botão de 3 pontinhos está na janela para desenhar o menu por cima (evita cortar)
  const lidarComCliqueDropdown = (e, funcId) => {
    if (dropdownAberto === funcId) {
      setDropdownAberto(null);
      return;
    }

    const retanguloBotao = e.currentTarget.getBoundingClientRect();
    
    setDropdownPosicao({
      top: retanguloBotao.bottom + window.scrollY + 8, 
      left: retanguloBotao.left + window.scrollX - 150, // Ajuste para alinhar à esquerda do botão
    });
    setDropdownAberto(funcId);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl min-h-100">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
              <th className="p-4 pl-6">Colaborador</th>
              <th className="p-4">Restaurante vinculado</th>
              <th className="p-4">Histórico / Acesso</th>
              <th className="p-4">Status</th>
              <th className="p-4 pr-6 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="text-xs text-slate-300 divide-y divide-slate-800/60">
          
            {funcionarios.length > 0 ? (
              funcionarios.map((func) => (
                <tr key={func.id} className="hover:bg-slate-800/10 transition-all group">
                  
                  {/* Colaborador (Nome, CPF, ID e Badge Admin se aplicável) */}
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center font-bold text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        {func.nome?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                          <span>{func.nome}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">ID: {func.id}</span>
                          
                          {(func.isOwner || func.permissoes?.isOwner) && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Crown size={10} /> Dono
                            </span>
                          )}
                        </div>
                        {/* 📞 Telefone em linha com o CPF se existir */}
                        <div className="text-[11px] text-slate-500 mt-0.5">
                         {func.cpf && stringToCpf(`${func.cpf}`)}     {func.telefone && ` • ` + stringToWhatsapp(`${func.telefone}`)}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Restaurante */}
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-slate-400 font-medium">
                      <Building2 size={13} className="text-slate-600" />
                      {func.restauranteNome} <span className="text-slate-600">({func.restauranteId})</span>
                    </div>
                  </td>

                  {/* Histórico / Acessos */}
                  <td className="p-4 text-[11px] text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar size={12} />
                      <span>Criado em: {func.data_cadastro ? new Date(func.data_cadastro).toLocaleDateString("pt-BR") : "---"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} className={func.ultimo_login ? "text-blue-400" : "text-slate-600"} />
                      <span className={func.ultimo_login ? "text-slate-300" : "text-slate-600 italic"}>
                        Login: {formatarData(func.ultimo_login)}
                      </span>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        func.bloqueado ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${func.bloqueado ? 'bg-red-500' : 'bg-emerald-500'}`} />
                        {func.bloqueado ? 'Bloqueado' : 'Ativo'}
                      </span>
                      {func.bloqueado && func.motivoBloqueio && (
                        <span className="text-[10px] text-red-400/70 italic max-w-37.5 truncate" title={func.motivoBloqueio}>
                          Motivo: {func.motivoBloqueio}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Botão das Ações */}
                  <td className="p-4 pr-6 text-center">
                    <div className="flex justify-center">
                      <button 
                        onClick={(e) => lidarComCliqueDropdown(e, func.id)}
                        className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                      >
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-12 text-center text-slate-500 font-medium">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle size={20} className="text-slate-600" />
                    <span>Nenhum funcionário cadastrado ou encontrado.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DROPDOWN FLUTUANTE EM FIXED */}
      {dropdownAberto !== null && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setDropdownAberto(null)} />
          
          <div 
            style={{ 
              position: 'fixed',
              top: `${dropdownPosicao.top}px`, 
              left: `${dropdownPosicao.left}px` 
            }}
            className="w-44 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 p-1.5 text-left animate-in fade-in slide-in-from-top-1 duration-100"
          >
            {/* 🌟 AÇÃO DE EDITAR CORRIGIDA: Repassa os dados do funcionário para a página principal */}
            <button 
              onClick={() => {
                const funcionarioAlvo = funcionarios.find(u => u.id === dropdownAberto);
                if (funcionarioAlvo && onEditarClick) {
                  onEditarClick(funcionarioAlvo); // Dispara a abertura do modal em modo edição
                }
                setDropdownAberto(null);
              }}
              className="w-full text-left px-3 py-2 text-slate-300 hover:bg-slate-800 rounded-lg transition text-xs font-medium"
            >
              Editar Dados / Telas
            </button>
            
            <button 
              onClick={() => {
                const f = funcionarios.find(u => u.id === dropdownAberto);
                if (f) alternarBloqueio(f.id, f.bloqueado);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg transition text-xs font-medium flex items-center gap-2 ${
                funcionarios.find(u => u.id === dropdownAberto)?.bloqueado 
                  ? "text-emerald-400 hover:bg-emerald-500/10" 
                  : "text-red-400 hover:bg-red-500/10"
              }`}
            >
              {funcionarios.find(u => u.id === dropdownAberto)?.bloqueado ? <UserCheck size={12} /> : <UserX size={12} />}
              {funcionarios.find(u => u.id === dropdownAberto)?.bloqueado ? "Ativar Acesso" : "Bloquear Acesso"}
            </button>
          </div>
        </>
      )}

    </div>
  );
}