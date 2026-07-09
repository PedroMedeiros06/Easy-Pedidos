import { useState, useEffect } from "react";
import { restauranteApi } from "../api/restaurante";

const DEBUG  = true

export function useRestaurantes() {
  // Estados dos Filtros
  const [pesquisa, setPesquisa] = useState("");
  const [ordem, setOrdem] = useState("A-Z");
  const [filtraStatus, setFiltraStatus] = useState("todos");
  
  // Estados do Modal (Agora suporta Criar e Editar)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restauranteSelecionado, setRestauranteSelecionado] = useState(null);

  // Estados dos Dados da API
  const [restaurantes, setRestaurantes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Função centralizada para buscar dados usando a nossa camada de API
  const buscarDadosDoBanco = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const dados = await restauranteApi.listar();
      setRestaurantes(dados);
      if (DEBUG){ console.log((dados))}
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

  // Funções de controle do Modal (Preparado para Edição)
  const abrirParaCriar = () => {
    setRestauranteSelecionado(null);
    setIsModalOpen(true);
  };

  const abrirParaEditar = (restaurante) => {
    setRestauranteSelecionado(restaurante);
    setIsModalOpen(true);
  };

  // Lógica de Filtro aplicada sobre os dados em tempo real
  const restaurantesFiltrados = restaurantes
    .filter(res => {
      const nomeRes = res.nome?.toLowerCase() || "";
      const nomeDono = (res.nomeDono || "").toLowerCase();
      const codrest = (res.codigo || "").toLowerCase();
      const termo = pesquisa.toLowerCase();

      const batePesquisa = nomeRes.includes(termo) || nomeDono.includes(termo) || codrest.includes(termo);
      
      const statusRes = res.bloqueado ? "suspenso" : "liberado";
      const bateStatus = filtraStatus === "todos" ? true : statusRes === filtraStatus;
      
      return batePesquisa && bateStatus;
    })
    .sort((a, b) => {
      if (ordem === "A-Z") return a.nome.localeCompare(b.nome);
      return b.nome.localeCompare(a.nome);
    });

  return {
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
  };
}