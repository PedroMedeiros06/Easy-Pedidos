import { useState, useEffect } from "react";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import ModalFuncionario from "../../components/client/modal_funcionario";
import FiltrosFuncionarios from "../../components/client/filtros_funcionario";
import TabelaFuncionarios from "../../components/client/tabela_funcionarios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { membersApi } from "../../api/members";

export default function Equipe() {
  const [pesquisa, setPesquisa] = useState("");
  const [ordem, setOrdem] = useState("A-Z");
  const [filtraStatus, setFiltraStatus] = useState("todos");

  const [limite, setLimite] = useState(10);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [funcionarioParaEditar, setFuncionarioParaEditar] = useState(null);

  const [funcionarios, setFuncionarios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const buscarDadosDoBanco = async (limiteAtual = limite) => {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await membersApi.list(limiteAtual);
      setFuncionarios(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDadosDoBanco(limite);
  }, [limite]);

  const handleLimiteChange = (valor) => {
    setLimite(Number(valor));
  };

  const alternarOrdem = () => setOrdem((prev) => (prev === "A-Z" ? "Z-A" : "A-Z"));

  const lidarComEditar = (funcionario) => {
    setFuncionarioParaEditar(funcionario);
    setIsModalOpen(true);
  };

  const lidarComNovoFuncionario = () => {
    setFuncionarioParaEditar(null);
    setIsModalOpen(true);
  };

  const funcionariosFiltrados = funcionarios
    .filter((func) => {
      const nomeFunc = (func.member_name || "").toLowerCase();
      const cpfFunc = (func.member_cpf || "").toLowerCase();
      const termo = pesquisa.toLowerCase();

      const batePesquisa = nomeFunc.includes(termo) || cpfFunc.includes(termo);

      const statusFunc = func.member_active ? "liberado" : "suspenso";
      const bateStatus = filtraStatus === "todos" ? true : statusFunc === filtraStatus;

      return batePesquisa && bateStatus;
    })
    .sort((a, b) => {
      if (ordem === "A-Z") return (a.member_name || "").localeCompare(b.member_name || "");
      return (b.member_name || "").localeCompare(a.member_name || "");
    });

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Equipe</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre colaboradores e defina o que cada um pode acessar no sistema.
          </p>
        </div>
        <Button onClick={lidarComNovoFuncionario}>
          <Plus size={16} /> Novo Colaborador
        </Button>
      </div>

      <FiltrosFuncionarios
        pesquisa={pesquisa}
        setPesquisa={setPesquisa}
        ordem={ordem}
        alternarOrdem={alternarOrdem}
        filtraStatus={filtraStatus}
        setFiltraStatus={setFiltraStatus}
      />

      {carregando ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 size={24} className="animate-spin text-brand" />
            <span className="text-sm">Buscando dados no banco...</span>
          </CardContent>
        </Card>
      ) : erro ? (
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center gap-2 text-center">
            <AlertTriangle size={32} className="text-amber-500 mb-1" />
            <h3 className="text-sm font-semibold text-foreground">Falha na conexão</h3>
            <p className="text-xs text-muted-foreground max-w-xs">{erro}</p>
            <Button variant="outline" size="sm" onClick={() => buscarDadosDoBanco(limite)} className="mt-3">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <TabelaFuncionarios
            funcionarios={funcionariosFiltrados}
            setFuncionarios={setFuncionarios}
            onActionSuccess={() => buscarDadosDoBanco(limite)}
            onEditarClick={lidarComEditar}
          />

          <div className="flex justify-end items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Exibir quantidade:</span>
            <Select value={String(limite)} onValueChange={handleLimiteChange} disabled={carregando}>
              <SelectTrigger className="h-9! w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 colaboradores</SelectItem>
                <SelectItem value="50">50 colaboradores</SelectItem>
                <SelectItem value="100">100 colaboradores</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <ModalFuncionario
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
