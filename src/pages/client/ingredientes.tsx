import { useState, useEffect, type ChangeEvent } from "react";
import {
  Plus,
  Search,
  Boxes,
  MoreVertical,
  Edit3,
  Trash2,
  ArrowDownUp,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import ModalIngrediente from "@/components/client/modal_ingrediente";
import ModalAjusteEstoque from "@/components/client/modal_ajuste_estoque";
import { ingredientsApi } from "@/api/ingredients";
import type { Ingredient } from "@/types/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const UNIDADE_LABEL: Record<Ingredient["unit"], string> = {
  g: "g",
  ml: "ml",
  unid: "unid",
};

export default function Ingredientes() {
  const [ingredientes, setIngredientes] = useState<Ingredient[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [pesquisa, setPesquisa] = useState("");
  const [modalFormAberto, setModalFormAberto] = useState(false);
  const [ingredienteParaEditar, setIngredienteParaEditar] = useState<Ingredient | null>(null);
  const [ingredienteParaAjustar, setIngredienteParaAjustar] = useState<Ingredient | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const buscarDadosDoBanco = async () => {
    try {
      setCarregando(true);
      setErro(null);
      const dados = await ingredientsApi.list();
      setIngredientes(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao carregar ingredientes.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDadosDoBanco();
  }, []);

  const filtrados = ingredientes.filter((ing) =>
    (ing.ingredientName || "").toLowerCase().includes(pesquisa.toLowerCase()),
  );

  const abrirParaCriar = () => {
    setIngredienteParaEditar(null);
    setModalFormAberto(true);
  };

  const abrirParaEditar = (ing: Ingredient) => {
    setIngredienteParaEditar(ing);
    setModalFormAberto(true);
  };

  const excluir = async (ing: Ingredient) => {
    if (
      !confirm(
        `Excluir o ingrediente "${ing.ingredientName}"? Ele será removido da receita de qualquer produto que o utilize.`,
      )
    )
      return;

    try {
      setExcluindoId(ing.ingredientId);
      await ingredientsApi.remove(ing.ingredientId);
      await buscarDadosDoBanco();
    } catch (err) {
      alert(`Erro ao excluir: ${err instanceof Error ? err.message : "desconhecido"}`);
    } finally {
      setExcluindoId(null);
    }
  };

  const estoqueBaixo = (ing: Ingredient) =>
    ing.lowStockAt != null && ing.quantity <= ing.lowStockAt;

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ingredientes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Matéria-prima usada nas receitas dos produtos. O estoque é descontado automaticamente a
            cada pedido.
          </p>
        </div>
        <Button onClick={abrirParaCriar}>
          <Plus size={16} /> Novo Ingrediente
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="relative max-w-sm">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={16}
          />
          <Input
            type="text"
            placeholder="Pesquisar ingrediente..."
            value={pesquisa}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPesquisa(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

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
            <Button variant="outline" size="sm" onClick={buscarDadosDoBanco} className="mt-3">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead>Em estoque</TableHead>
                  <TableHead>Alerta</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtrados.length > 0 ? (
                  filtrados.map((ing) => (
                    <TableRow key={ing.ingredientId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <Boxes size={14} />
                          </div>
                          <span className="font-semibold text-foreground">
                            {ing.ingredientName}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {ing.quantity} {UNIDADE_LABEL[ing.unit]}
                          </span>
                          {estoqueBaixo(ing) && (
                            <Badge variant="destructive" className="text-[10px]">
                              Estoque baixo
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {ing.lowStockAt != null
                          ? `${ing.lowStockAt} ${UNIDADE_LABEL[ing.unit]}`
                          : "—"}
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={excluindoId === ing.ingredientId}
                            >
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setIngredienteParaAjustar(ing)}>
                              <ArrowDownUp size={14} className="text-brand" />
                              Ajustar estoque
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => abrirParaEditar(ing)}>
                              <Edit3 size={14} className="text-brand" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => excluir(ing)}
                              className="text-rose-500 focus:text-rose-500"
                            >
                              <Trash2 size={14} />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle size={20} />
                        <span>Nenhum ingrediente cadastrado ou encontrado.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ModalIngrediente
        isOpen={modalFormAberto}
        onClose={() => {
          setModalFormAberto(false);
          setIngredienteParaEditar(null);
        }}
        onSuccess={buscarDadosDoBanco}
        ingredienteParaEditar={ingredienteParaEditar}
      />

      <ModalAjusteEstoque
        isOpen={!!ingredienteParaAjustar}
        onClose={() => setIngredienteParaAjustar(null)}
        onSuccess={buscarDadosDoBanco}
        ingrediente={ingredienteParaAjustar}
      />
    </div>
  );
}
