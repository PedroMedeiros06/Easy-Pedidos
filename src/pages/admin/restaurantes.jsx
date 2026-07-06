import React from "react";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { useRestaurantes } from "../../hooks/useRestaurantes"; // 🌟 Importando a lógica limpa
import FiltrosRestaurante from "../../components/admin/filtros_restaurantes";
import ModalCriarRestaurante from "../../components/admin/modal_restaurantes"; // Nota: Depois você pode renomear para apenas modal_restaurantes, já que ele vai editar também!
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
    buscarDadosDoBanco
  } = useRestaurantes();

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
      <FiltrosRestaurante 
        pesquisa={pesquisa} setPesquisa={setPesquisa}
        ordem={ordem} alternarOrdem={alternarOrdem}
        filtraStatus={filtraStatus} setFiltraStatus={setFiltraStatus}
      />

      {/* RENDERIZAÇÃO CONDICIONAL */}
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
          <button onClick={buscarDadosDoBanco} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl text-slate-200">
            Tentar novamente
          </button>
        </div>
      ) : (
        /* PASSANDO OS DADOS E O ATUALIZADOR DE ESTADO */
        <TabelaRestaurantes 
          restaurantes={restaurantesFiltrados} 
          setRestaurantes={setRestaurantes} 
          onActionSuccess={buscarDadosDoBanco}
          onEditarClick={abrirParaEditar}
        />
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO */}
      <ModalCriarRestaurante 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={buscarDadosDoBanco}
        restauranteParaEditar={restauranteSelecionado}
      />

    </div>
  );
}