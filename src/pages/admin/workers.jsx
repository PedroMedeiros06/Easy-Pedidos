import React, { useState, useEffect } from "react";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import ModalCriarFuncionario from "../../components/admin/modal_funcionarios";
import FiltrosFuncionarios from "../../components/admin/filtros_funcionario";
import TabelaFuncionarios from "../../components/admin/tabela_funcionarios";

import { funcionarioApi } from "../../api/funcionario";

export default function Funcionarios() {
  // Estados dos Filtros
  const [pesquisa, setPesquisa] = useState("");
  const [ordem, setOrdem] = useState("A-Z");
  const [filtraStatus, setFiltraStatus] = useState("todos");
  
  // Estado do Dropdown de Limite
  const [limite, setLimite] = useState(10);
  
  // Estados do Modal e Controle de Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [funcionarioParaEditar, setFuncionarioParaEditar] = useState(null);

  // Estados dos Dados da API
  const [funcionarios, setFuncionarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // 🔄 Busca dados do NestJS usando o método unificado da API
  const buscarDadosDoBanco = async (limiteAtual = limite) => {
    try {
      setCarregando(true);
      setErro(null);
      
      // 🌟 Consumindo a função centralizada que já possui a URL correta da Render
      const dados = await funcionarioApi.listar(limiteAtual);
      setFuncionarios(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  // Dispara a busca inicial e monitora as mudanças no dropdown de limite
  useEffect(() => {
    buscarDadosDoBanco(limite);
  }, [limite]);

  // Função para gerenciar a troca de limite pelo dropdown
  const handleLimiteChange = (e) => {
    const novoLimite = Number(e.target.value);
    setLimite(novoLimite);
  };

  const alternarOrdem = () => setOrdem(prev => prev === "A-Z" ? "Z-A" : "A-Z");

  const lidarComEditar = (funcionario) => {
    setFuncionarioParaEditar(funcionario);
    setIsModalOpen(true);
  };

  const lidarComNovoFuncionario = () => {
    setFuncionarioParaEditar(null);
    setIsModalOpen(true);
  };

  // Lógica de Filtro em tempo real
  const funcionariosFiltrados = funcionarios
    .filter(func => {
      const nomeFunc = func.nome?.toLowerCase() || "";
      const cpfFunc = (func.cpf || "").toLowerCase();
      const cargoFunc = (func.cargo || "").toLowerCase();
      const restauranteVinculado = (func.restauranteNome || func.restaurante?.nome || "").toLowerCase();
      const termo = pesquisa.toLowerCase();

      const batePesquisa = 
        nomeFunc.includes(termo) || 
        cpfFunc.includes(termo) || 
        cargoFunc.includes(termo) ||
        restauranteVinculado.includes(termo);
      
      // Mapeia o status de acordo com o que vem da API nest
      const statusFunc = func.bloqueado ? "suspenso" : "liberado";
      const bateStatus = filtraStatus === "todos" ? true : statusFunc === filtraStatus;
      
      return batePesquisa && bateStatus;
    })
    .sort((a, b) => {
      if (ordem === "A-Z") return (a.nome || "").localeCompare(b.nome || "");
      return (b.nome || "").localeCompare(a.nome || "");
    });

  return (
    <div className="p-8 min-h-screen text-slate-100 relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Funcionários</h1>
          <p className="text-sm text-slate-400 mt-1">Gerencie a equipe, cargos e permissões de acesso integradas ao sistema.</p>
        </div>
        <button 
          onClick={lidarComNovoFuncionario}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition px-5 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/10"
        >
          <Plus size={18} /> Novo Funcionário
        </button>
      </div>

      {/* COMPONENTE DE FILTROS */}
      <div className="mb-6">
        <FiltrosFuncionarios 
          pesquisa={pesquisa} setPesquisa={setPesquisa}
          ordem={ordem} alternarOrdem={alternarOrdem}
          filtraStatus={filtraStatus} setFiltraStatus={setFiltraStatus}
        />
      </div>

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
          <button 
            onClick={() => buscarDadosDoBanco(limite)} 
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium rounded-xl text-slate-200"
          >
            Tentar novamente
          </button>
        </div>
      ) : (
        <>
          {/* TABELA DE COMPONENTES */}
          <TabelaFuncionarios 
            funcionarios={funcionariosFiltrados}
            setFuncionarios={setFuncionarios} 
            onActionSuccess={() => buscarDadosDoBanco(limite)} 
            onEditarClick={lidarComEditar}
          />

          {/* FILTRO DE LIMITE INFERIOR ACOPLADO */}
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
              <option value={10}>10 funcionários</option>
              <option value={50}>50 funcionários</option>
              <option value={100}>100 funcionários</option>
            </select>
          </div>
        </>
      )}

      {/* MODAL DUPLO (CRIAÇÃO / EDIÇÃO) */}
      <ModalCriarFuncionario 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setFuncionarioParaEditar(null);
        }} 
        onSuccess={() => buscarDadosDoBanco(limite)} 
        funcionarioParaEditar={funcionarioParaEditar}
      />

    </div>
  );
}