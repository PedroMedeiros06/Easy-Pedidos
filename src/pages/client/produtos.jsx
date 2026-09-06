import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ArrowUpDown,
  Package,
  MoreVertical,
  Edit3,
  Trash2,
  AlertCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import ModalProduto from "../../components/client/modal_produto";
import { categoriesApi, catalogItemsApi } from "../../api/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function formatarMoeda(centavos) {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularPrecoFinalCentavos(produto) {
  const desconto =
    produto.discountType === "percentage"
      ? produto.priceCents * (Math.min(produto.discountValue, 100) / 100)
      : produto.discountValue;
  return Math.max(produto.priceCents - desconto, 0);
}

export default function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [pesquisa, setPesquisa] = useState("");
  const [ordem, setOrdem] = useState("A-Z");
  const [filtraCategoria, setFiltraCategoria] = useState("todas");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);

  const buscarDadosDoBanco = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const [itens, cats] = await Promise.all([catalogItemsApi.list(), categoriesApi.list()]);
      setProdutos(itens);
      setCategorias(cats);
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
    setProdutoParaEditar(null);
    setIsModalOpen(true);
  };

  const abrirParaEditar = (produto) => {
    setProdutoParaEditar(produto);
    setIsModalOpen(true);
  };

  const excluirProduto = async (produto) => {
    if (!confirm(`Excluir o produto "${produto.itemName}" do cardápio?`)) return;

    try {
      setExcluindoId(produto.itemId);
      await catalogItemsApi.remove(produto.itemId);
      await buscarDadosDoBanco();
    } catch (err) {
      alert(`Erro ao excluir produto: ${err.message}`);
    } finally {
      setExcluindoId(null);
    }
  };

  const produtosFiltrados = produtos
    .filter((p) => {
      const bateNome = (p.itemName || "").toLowerCase().includes(pesquisa.toLowerCase());
      const bateCategoria = filtraCategoria === "todas" ? true : p.categoryId === filtraCategoria;
      return bateNome && bateCategoria;
    })
    .sort((a, b) =>
      ordem === "A-Z" ? a.itemName.localeCompare(b.itemName) : b.itemName.localeCompare(a.itemName),
    );

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Produtos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre os itens do seu cardápio, com preço e desconto.
          </p>
        </div>
        <Button onClick={abrirParaCriar}>
          <Plus size={16} /> Novo Produto
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            type="text"
            placeholder="Pesquisar produto..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pl-9 h-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={alternarOrdem} className="h-10!">
            <ArrowUpDown size={15} />
            Ordem: {ordem}
          </Button>

          <Select value={filtraCategoria} onValueChange={setFiltraCategoria}>
            <SelectTrigger className="h-10! w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as categorias</SelectItem>
              {categorias.map((cat) => (
                <SelectItem key={cat.categoryId} value={cat.categoryId}>
                  {cat.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {produtosFiltrados.length > 0 ? (
                  produtosFiltrados.map((produto) => {
                    const temDesconto = produto.discountValue > 0;
                    const precoFinalCentavos = calcularPrecoFinalCentavos(produto);

                    return (
                      <TableRow key={produto.itemId}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                              <Package size={14} className="text-muted-foreground" />
                            </div>
                            <span className="font-semibold text-foreground">{produto.itemName}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-muted-foreground">
                          {produto.categoryName || "Sem categoria"}
                        </TableCell>

                        <TableCell>
                          {temDesconto ? (
                            <div className="flex flex-col">
                              <span className="text-xs text-muted-foreground line-through">
                                {formatarMoeda(produto.priceCents)}
                              </span>
                              <span className="font-semibold text-brand">
                                {formatarMoeda(precoFinalCentavos)}
                              </span>
                            </div>
                          ) : (
                            <span className="font-semibold text-foreground">
                              {formatarMoeda(produto.priceCents)}
                            </span>
                          )}
                        </TableCell>

                        <TableCell>
                          {produto.active ? (
                            <Badge
                              variant="outline"
                              className="gap-1.5 text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
                            >
                              <span className="size-1.5 rounded-full bg-emerald-500" />
                              Disponível
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="gap-1.5 text-muted-foreground border-border bg-muted/40"
                            >
                              <span className="size-1.5 rounded-full bg-muted-foreground" />
                              Oculto
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={excluindoId === produto.itemId}>
                                <MoreVertical size={16} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => abrirParaEditar(produto)}>
                                <Edit3 size={14} className="text-brand" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => excluirProduto(produto)}
                                className="text-rose-500 focus:text-rose-500"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <AlertCircle size={20} />
                        <span>Nenhum produto cadastrado ou encontrado.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ModalProduto
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProdutoParaEditar(null);
        }}
        onSuccess={buscarDadosDoBanco}
        produtoParaEditar={produtoParaEditar}
        categorias={categorias}
      />
    </div>
  );
}
