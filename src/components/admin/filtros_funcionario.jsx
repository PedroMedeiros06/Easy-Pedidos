import React from "react";
import { Search, ArrowUpDown, Calendar, SlidersHorizontal } from "lucide-react";

export default function FiltrosRestaurante({
  pesquisa,
  setPesquisa,
  ordem,
  alternarOrdem,
  filtraStatus,
  setFiltraStatus,
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
      {/* Input de Busca */}
      <div className="relative flex-1 min-w-72">
        <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Pesquisar por restaurante, dono ou codigo..." 
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-12 pr-4 py-3 text-sm text-slate-200 placeholder-slate-400 focus:outline-none focus:border-slate-500 transition"
        />
      </div>

      {/* Filtros rápidos e Ordenação */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={alternarOrdem}
          className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 transition px-4 py-3 rounded-xl text-sm text-slate-300"
        >
          <ArrowUpDown size={16} className="text-blue-500" />
          Ordem: {ordem}
        </button>

        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-4 py-3 rounded-xl text-sm text-slate-300 hover:bg-slate-800 transition">
        {/* O seu ícone roxo da Lucide que vai ficar visível */}
        <Calendar size={16} className="text-purple-500" />
        
        <input type="date" className="bg-transparent focus:outline-none text-slate-300 text-xs cursor-pointer [scheme:dark] [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:opacity-0 uppercase" />
      </div>

        <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/60 px-3 py-1 rounded-xl text-sm text-slate-300">
          <SlidersHorizontal size={16} className="text-emerald-500" />
          <select
            value={filtraStatus}
            onChange={(e) => setFiltraStatus(e.target.value)}
            className="bg-transparent py-2 focus:outline-none text-sm text-slate-300 cursor-pointer pr-2"
          >
            <option value="todos" className="bg-slate-900">Todos os status</option>
            <option value="ativo" className="bg-slate-900">Ativos</option>
            <option value="cancelado" className="bg-slate-900">Bloqueados</option>
          </select>
        </div>
      </div>
    </div>
  );
}