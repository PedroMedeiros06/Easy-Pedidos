import React, { useState, useEffect } from "react";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import ModalCriarFuncionario from "../../components/admin/modal_funcionarios";
import FiltrosFuncionarios from "../../components/admin/filtros_funcionario";
import TabelaFuncionarios from "../../components/admin/tabela_funcionarios";

export default function Funcionarios() {
  // Estados dos Filtros
  const [pesquisa, setPesquisa] = useState("");
  const [ordem, setOrdem] = useState("A-Z");
  const [filtraStatus, setFiltraStatus] = useState("todos");
  
  // Estados do Modal e Controle de Edição
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [funcionarioParaEditar, setFuncionarioParaEditar] = useState(null); // 🌟 NOVO: Controla quem editar

  // Estados dos Dados da API
  const [funcionarios, setFuncionarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Busca dados do NestJS
  const buscarDadosDoBanco = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const response = await fetch("http://localhost:3000/funcionarios");

      if (!response.ok) throw new Error("Erro ao carregar funcionários.");
      
      const dados = await response.json();
      console.log(dados)
      setFuncionarios(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDadosDoBanco();
  }, []);

  const alternarOrdem = () => setOrdem(prev => prev === "A-Z" ? "Z-A" : "A-Z");

  // Função disparada ao clicar em "Editar Dados / Telas" na tabela
  const lidarComEditar = (funcionario) => {
    setFuncionarioParaEditar(funcionario); // Define qual funcionário vai preencher o modal
    setIsModalOpen(true);                  // Abre o modal
  };

  // Função disparada ao clicar no botão de Criar Novo
  const lidarComNovoFuncionario = () => {
    setFuncionarioParaEditar(null); // 🔒 Limpa o estado para garantir que abra no modo CRIAÇÃO
    setIsModalOpen(true);
  };

  // Lógica de Filtro aplicada sobre os dados de funcionários em tempo real
  const funcionariosFiltrados = funcionarios
    .filter(func => {
      const nomeFunc = func.nome?.toLowerCase() || "";
      const cpfFunc = (func.cpf || "").toLowerCase();
      const cargoFunc = (func.cargo || "").toLowerCase();
      const restauranteVinculado = (func.restauranteNome || "").toLowerCase();
      const termo = pesquisa.toLowerCase();

      const batePesquisa = 
        nomeFunc.includes(termo) || 
        cpfFunc.includes(termo) || 
        cargoFunc.includes(termo) ||
        restauranteVinculado.includes(termo);
      
      const statusFunc = func.bloqueado ? "suspenso" : "liberado";
      const bateStatus = filtraStatus === "todos" ? true : statusFunc === filtraStatus;
      
      return batePesquisa && bateStatus;
    })
    .sort((a, b) => {
      if (ordem === "A-Z") return a.nome.localeCompare(b.nome);
      return b.nome.localeCompare(a.nome);
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
          onClick={lidarComNovoFuncionario} // 🌟 Atualizado
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 transition px-5 py-3 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/10"
        >
          <Plus size={18} /> Novo Funcionário
        </button>
      </div>

      {/* COMPONENTE DE FILTROS */}
      <FiltrosFuncionarios 
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
        /* TABELA DE COMPONENTES */
        <TabelaFuncionarios 
          funcionarios={funcionariosFiltrados} 
          onActionSuccess={buscarDadosDoBanco} 
          onEditarClick={lidarComEditar} // 🌟 Passando o callback de clique em editar
        />
      )}

      {/* MODAL DUPLO (CRIAÇÃO / EDIÇÃO) */}
      <ModalCriarFuncionario 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setFuncionarioParaEditar(null); // Limpa o estado ao fechar
        }} 
        onSuccess={buscarDadosDoBanco} 
        funcionarioParaEditar={funcionarioParaEditar} // 🌟 Nova propriedade repassada
      />

    </div>
  );
}