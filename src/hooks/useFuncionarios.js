import { useState, useEffect, useCallback } from "react";
import { funcionarioApi } from "../api/funcionario"; // 🌟 Certifique-se de criar este arquivo de API

export function useFuncionarios(restauranteIdInicial = null) {
  const [funcionarios, setFuncionarios] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);

  // Estados de Filtros e Busca
  const [pesquisa, setPesquisa] = useState("");
  const [filtraStatus, setFiltraStatus] = useState("todos"); // todos, ativos, suspensos
  const [ordem, setOrdem] = useState("asc"); // asc ou desc
  
  // Estado para controlar se estamos filtrando por um restaurante específico
  const [restauranteId, setRestauranteId] = useState(restauranteIdInicial);

  // Estados do Modal (Criação / Edição)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

  // 🔄 1. Buscar dados do Banco (Aceita o limite dinâmico que vem do Dropdown)
  const buscarDadosDoBanco = useCallback(async (limiteAtual = 10) => {
    try {
      setCarregando(true);
      setErro(null);
      
      // Passa o limite e opcionalmente o restauranteId se quiser filtrar os funcionários daquela loja
      const dados = await funcionarioApi.listar({ 
        limite: limiteAtual, 
        restauranteId 
      });
      
      setFuncionarios(dados);
    } catch (err) {
      setErro(err.message || "Erro ao carregar funcionários.");
    } finally {
      setCarregando(false);
    }
  }, [restauranteId]);

  // 📝 2. Controle do Modal
  const abrirParaCriar = () => {
    setFuncionarioSelecionado(null);
    setIsModalOpen(true);
  };

  const abrirParaEditar = (funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setIsModalOpen(true);
  };

  // 🔁 3. Alternar Ordem Alfabética
  const alternarOrdem = () => {
    setOrdem((atual) => (atual === "asc" ? "desc" : "asc"));
  };

  // 🔍 4. Aplicação dos Filtros em Memória (Client-side)
  // Filtra por Nome/CPF e pelo Status antes de mandar para a Tabela
  const funcionariosFiltrados = funcionarios
    .filter((func) => {
      const termo = pesquisa.toLowerCase();
      const correspondePesquisa = 
        func.nome?.toLowerCase().includes(termo) || 
        func.cpf?.includes(termo);

      if (filtraStatus === "ativos") {
        return correspondePesquisa && !func.bloqueado; // Se não está bloqueado, está ativo
      }
      if (filtraStatus === "suspensos") {
        return correspondePesquisa && func.bloqueado;
      }

      return correspondePesquisa;
    })
    .sort((a, b) => {
      const nomeA = a.nome || "";
      const nomeB = b.nome || "";
      return ordem === "asc" 
        ? nomeA.localeCompare(nomeB) 
        : nomeB.localeCompare(nomeA);
    });

  return {
    funcionarios,
    funcionariosFiltrados,
    setFuncionarios,
    carregando,
    erro,
    pesquisa,
    setPesquisa,
    ordem,
    alternarOrdem,
    filtraStatus,
    setFiltraStatus,
    restauranteId,
    setRestauranteId,
    isModalOpen,
    setIsModalOpen,
    funcionarioSelecionado,
    abrirParaCriar,
    abrirParaEditar,
    buscarDadosDoBanco,
  };
}