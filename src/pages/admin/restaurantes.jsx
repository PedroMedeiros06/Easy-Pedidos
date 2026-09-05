import { useState } from "react";
import { Plus, AlertTriangle, Loader2 } from "lucide-react";
import { useRestaurantes } from "../../hooks/useRestaurantes";
import FiltrosRestaurante from "../../components/admin/filtros_restaurantes";
import ModalCriarRestaurante from "../../components/admin/modal_restaurantes";
import TabelaRestaurantes from "../../components/admin/tabela_restaurantes";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const handleLimiteChange = (valor) => {
    const novoLimite = Number(valor);
    setLimite(novoLimite);
    if (buscarDadosDoBanco) {
      buscarDadosDoBanco(novoLimite);
    }
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Restaurantes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie os estabelecimentos parceiros e suas permissões de acesso.
          </p>
        </div>
        <Button onClick={abrirParaCriar}>
          <Plus size={16} /> Novo Restaurante
        </Button>
      </div>

      <FiltrosRestaurante
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
          <TabelaRestaurantes
            restaurantes={restaurantesFiltrados}
            setRestaurantes={setRestaurantes}
            onActionSuccess={() => buscarDadosDoBanco(limite)}
            onEditarClick={abrirParaEditar}
          />

          <div className="flex justify-end items-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium">Exibir quantidade:</span>
            <Select value={String(limite)} onValueChange={handleLimiteChange} disabled={carregando}>
              <SelectTrigger className="h-9! w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 restaurantes</SelectItem>
                <SelectItem value="50">50 restaurantes</SelectItem>
                <SelectItem value="100">100 restaurantes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <ModalCriarRestaurante
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => buscarDadosDoBanco(limite)}
        restauranteParaEditar={restauranteSelecionado}
      />
    </div>
  );
}
