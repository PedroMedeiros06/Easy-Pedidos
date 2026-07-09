import React, { useState } from "react";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { useRestaurantes } from "../../hooks/useRestaurantes"; 
import FiltrosRestaurante from "../../components/admin/filtros_restaurantes";
import ModalCriarRestaurante from "../../components/admin/modal_restaurantes";
import TabelaRestaurantes from "../../components/admin/tabela_restaurantes";

export default function Restaurantes() {
  const {
    restaurantesFiltrados,
    setRestaurantes,
    carregando,
    erro,
    pesquisa,
    setPesquisa,
    ordem,
    alternarOrdem,
    filtraStatus,
    setFiltraStatus,
    isModalOpen,
    setIsModalOpen,
    restauranteSelecionado,
    abrirParaCriar,
    abrirParaEditar,
    buscarDadosDoBanco,
  } = useRestaurantes();

  const [limite, setLimite] = useState(10);

  const handleLimiteChange = (e) => {
    const novoLimite = Number(e.target.value);
    setLimite(novoLimite);
    if (buscarDadosDoBanco) {
      buscarDadosDoBanco(novoLimite);
    }
  };

  return (
    <div className="p-8 min-h-screen text-slate-100 relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Restaurantes</h1>
          <p className="text-sm text-slate-400 mt-1">Gerencie os estabelecimentos parceiros e suas respectivas permissões de acesso.</p>
        </div>
        <button 
          onClick={abrirParaCriar}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition px-5 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/10"
        >
          <Plus size={18} /> Novo Restaurante
        </button>
      </div>

      {/* COMPONENTE DE FILTROS */}
      <div className="mb-6">
        <FiltrosRestaurante 
          pesquisa={pesquisa} setPesquisa={setPesquisa}
          ordem={ordem} alternarOrdem={alternarOrdem}
          filtraStatus={filtraStatus} setFiltraStatus={setFiltraStatus}
        />
      </div>

      {/* RENDERIZAÇÃO CONDICIONAL DA TABELA */}
      {carregando ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 size={24} className="animate-spin text-blue-500" />
          <span className="text-sm">Buscando dados no banco...</span>
        </div>
      ) : erro ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 text-center">
          <AlertTriangle size={32} className="text-amber-500 mb-2" />
          <h3 className="text-sm font-semibold text-white">Falha na conexão</h3>
          <p className="text-xs text-slate-400 max-w-xs">{erro}</p>
          <button 
            onClick={() => buscarDadosDoBanco(limite)} 
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl text-slate-200 transition"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* TABELA */}
          <TabelaRestaurantes 
            restaurantes={restaurantesFiltrados} 
            setRestaurantes={setRestaurantes} 
            onActionSuccess={() => buscarDadosDoBanco(limite)}
            onEditarClick={abrirParaEditar}
          />

          {/* 🌟 FILTRO DE LIMITE POSICIONADO EMBAIXO DA TABELA */}
          <div className="flex justify-end items-center gap-2 mt-4 px-2 text-xs">
            <span className="text-slate-500 font-medium">Exibir quantidade:</span>
            <select
              value={limite}
              onChange={handleLimiteChange}
              disabled={carregando}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-xl pl-3 pr-10 py-2 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed appearance-none"
              style={{
                backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'><path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/></svg>")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 0.75rem center',
                backgroundSize: '1rem'
              }}
            >
              <option value={10}>10 restaurantes</option>
              <option value={50}>50 restaurantes</option>
              <option value={100}>100 restaurantes</option>
            </select>
          </div>
        </>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      <ModalCriarRestaurante 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => buscarDadosDoBanco(limite)}
        restauranteParaEditar={restauranteSelecionado}
      />

    </div>
  );
}