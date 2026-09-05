import { useState, useEffect } from "react";
import { companyApi } from "../api/base/company";

export function useRestaurantes() {
  const [pesquisa, setPesquisa] = useState("");
  const [ordem, setOrdem] = useState("A-Z");
  const [filtraStatus, setFiltraStatus] = useState("todos");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restauranteSelecionado, setRestauranteSelecionado] = useState(null);

  const [restaurantes, setRestaurantes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const buscarDadosDoBanco = async (limit = 10) => {
    try {
      setCarregando(true);
      setErro(null);
      const dados = await companyApi.list(limit);
      setRestaurantes(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDadosDoBanco();
  }, []);

  const alternarOrdem = () => setOrdem((prev) => (prev === "A-Z" ? "Z-A" : "A-Z"));

  const abrirParaCriar = () => {
    setRestauranteSelecionado(null);
    setIsModalOpen(true);
  };

  const abrirParaEditar = (restaurante) => {
    setRestauranteSelecionado(restaurante);
    setIsModalOpen(true);
  };

  const restaurantesFiltrados = restaurantes
    .filter((res) => {
      const nomeRes = (res.companyName || "").toLowerCase();
      const nomeDono = (res.ownerName || "").toLowerCase();
      const codigo = (res.companyCode || "").toLowerCase();
      const termo = pesquisa.toLowerCase();

      const batePesquisa = nomeRes.includes(termo) || nomeDono.includes(termo) || codigo.includes(termo);

      const statusRes = res.blocked ? "suspenso" : "liberado";
      const bateStatus = filtraStatus === "todos" ? true : statusRes === filtraStatus;

      return batePesquisa && bateStatus;
    })
    .sort((a, b) => {
      const nomeA = a.companyName || "";
      const nomeB = b.companyName || "";
      return ordem === "A-Z" ? nomeA.localeCompare(nomeB) : nomeB.localeCompare(nomeA);
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
    buscarDadosDoBanco,
  };
}
