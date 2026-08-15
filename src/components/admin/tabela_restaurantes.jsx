import React, { useState } from "react";
import { CheckCircle, Ban, Trash2, ShieldAlert, MoreVertical, MessageSquare, Edit3, AlertCircle } from "lucide-react";
import { companyApi } from "../../api/base/company";

export default function TabelaRestaurantes({ restaurantes, setRestaurantes, onActionSuccess, onEditarClick }) {
  const [menuAbertoId, setMenuAbertoId] = useState(null);

  const tratarBloqueio = async (id, statusAtual, motivoAtual) => {
    const novoStatusAtivo = statusAtual; 
    const acaoTexto = novoStatusAtivo ? "liberação" : "bloqueio";

    const motivo = prompt(`Digite o motivo da ${acaoTexto} (opcional):`, !novoStatusAtivo ? "" : motivoAtual);
    if (motivo === null) return; // Cancela se o usuário clicar em Cancelar

    try {
      await companyApi.changeState(id, novoStatusAtivo, motivo)
      
      setMenuAbertoId(null);
      
      if (setRestaurantes) {
        setRestaurantes((listaAtual) => 
          listaAtual.map((res) => 
            res.id === id 
              ? { 
                  ...res, 
                  bloqueado: !novoStatusAtivo, 
                  motivoBloqueio: novoStatusAtivo ? null : (motivo.trim() || null) 
                } 
              : res
          )
        );
      }

      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert(`Erro ao alterar acesso: ${err.message}`);
    }
  };

  const tratarExclusao = async (id) => {
    if (!confirm("⚠️ ATENÇÃO: Isso apagará permanentemente o restaurante e TODOS os funcionários dele. Continuar?")) return;

    try {
      const dados = await companyApi.delet(id);

      alert(dados?.mensagem || "Restaurante removido com sucesso!");
      setMenuAbertoId(null);
      
      if (setRestaurantes) {
        setRestaurantes((listaAtual) => listaAtual.filter((res) => res.id !== id));
      }

      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert(`Erro ao excluir: ${err.message}`);
    }
  };

  const formatarWhatsapp = (num) => {
    if (!num) return "—";
    const limpo = num.replace(/\D/g, "");
    if (limpo.length === 11) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
    }
    return num;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto pb-32 min-h-100">
      <table className="w-full text-left border-collapse table-auto">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/50 text-xs uppercase tracking-wider text-slate-500 font-semibold">
            <th className="py-4 px-6">Restaurante / Dono</th>
            <th className="py-4 px-6">Código ID</th>
            <th className="py-4 px-6">WhatsApp</th>
            <th className="py-4 px-6">Data de Adesão</th>
            <th className="py-4 px-6">Acesso</th>
            <th className="py-4 px-6 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-sm">
          {restaurantes.length > 0 ? (
            restaurantes.map((res) => (
              <tr key={res.id} className="hover:bg-slate-800/30 transition">
                
                {/* Nome, Dono e Miniatura */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    {res.logoUrl ? (
                      <img src={res.logoUrl} alt={res.nome} className="w-8 h-8 rounded-lg object-cover border border-slate-700" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 shrink-0">
                        {res.nome?.slice(0, 2).toUpperCase() || "RE"}
                      </div>
                    )}
                    <div className="truncate max-w-45">
                      <div className="font-semibold text-slate-200 truncate">{res.nome}</div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">{res.nomeDono}</div>
                    </div>
                  </div>
                </td>

                {/* Código de Login */}
                <td className="py-4 px-6 font-mono text-xs text-blue-400 font-semibold whitespace-nowrap">
                  {res.codigoRestaurante || res.codigo}
                </td>

                {/* WhatsApp */}
                <td className="py-4 px-6 text-slate-300 whitespace-nowrap">
                  {res.whatsapp ? (
                    <a 
                      href={`https://wa.me/55${res.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-emerald-400 transition"
                    >
                      <MessageSquare size={14} className="text-slate-500" />
                      {formatarWhatsapp(res.whatsapp)}
                    </a>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>

                {/* Data de Adesão */}
                <td className="py-4 px-6 text-slate-400 font-mono text-xs whitespace-nowrap">
                  {res.criadoEm ? new Date(res.criadoEm).toLocaleDateString('pt-BR') : '—'}
                </td>

                {/* Badge de Status + Tooltip Descritiva */}
                <td className="py-4 px-6 whitespace-nowrap">
                  {res.bloqueado ? (
                    <div className="relative group inline-block">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 cursor-help">
                        <ShieldAlert size={12} /> Suspenso
                      </span>
                      
                      {/* Tooltip flutuante 🌟 Corrigido para res.motivoBloqueio */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl p-3 shadow-xl z-30 pointer-events-none text-center">
                        <p className="font-semibold text-white mb-1">Motivo do Bloqueio:</p>
                        <p className="text-[11px] text-slate-400 break-word">{res.motivo_bloqueio || "Não informado."}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950"></div>
                      </div>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle size={12} /> Liberado
                    </span>
                  )}
                </td>

                {/* Botão de Ações Isolado com Dropdown Absoluto */}
                <td className="py-4 px-6 text-right relative whitespace-nowrap">
                  <button 
                    onClick={() => setMenuAbertoId(menuAbertoId === res.id ? null : res.id)}
                    className="text-slate-500 hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-950 transition"
                  >
                    <MoreVertical size={16} />
                  </button>

                  {menuAbertoId === res.id && (
                    <>
                      {/* Backdrop invisível para fechar o menu clicando fora */}
                      <div className="fixed inset-0 z-40" onClick={() => setMenuAbertoId(null)}></div>
                      
                      {/* Dropdown flutuante por cima das linhas */}
                      <div className="absolute right-6 top-12 w-48 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-left py-1 animate-in fade-in slide-in-from-top-2 duration-100">
                        
                        {/* Ação: Editar Cadastro */}
                        <button 
                          onClick={() => {
                            if (onEditarClick) onEditarClick(res);
                            setMenuAbertoId(null);
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-900 transition text-left"
                        >
                          <Edit3 size={14} className="text-blue-400" />
                          Editar Informações
                        </button>

                        <button 
                          onClick={() => tratarBloqueio(res.id, res.bloqueado, res.motivoBloqueio)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-900 transition text-left"
                        >
                          <Ban size={14} className={res.bloqueado ? "text-emerald-500" : "text-amber-500"} />
                          {res.bloqueado ? "Liberar Acesso" : "Bloquear Acesso"}
                        </button>
                        
                        <div className="border-t border-slate-800/60 my-1"></div>
                        
                        <button 
                          onClick={() => tratarExclusao(res.id)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 transition text-left font-medium"
                        >
                          <Trash2 size={14} />
                          Excluir Registro
                        </button>
                      </div>
                    </>
                  )}
                </td>

              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="py-12 text-center text-slate-500">
                <div className="flex flex-col items-center justify-center gap-2">
                  <AlertCircle size={20} className="text-slate-600" />
                  <span>Nenhum restaurante cadastrado ou encontrado.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}