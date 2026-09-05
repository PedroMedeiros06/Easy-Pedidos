import { useState } from "react";
import {
  Plus,
  Search,
  ArrowUpDown,
  Package,
  MoreVertical,
  Edit3,
  Trash2,
  AlertCircle,
} from "lucide-react";
import ModalProduto from "../../components/client/modal_produto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// TODO: trocar por chamada real à API de produtos (catalog_items) quando o endpoint existir.
const CATEGORIAS_EXEMPLO = [
  { id: "cat-1", nome: "Lanches" },
  { id: "cat-2", nome: "Acompanhamentos" },
  { id: "cat-3", nome: "Bebidas" },
];

const PRODUTOS_EXEMPLO = [
  { id: "1", nome: "X-Burger Clássico", categoriaId: "cat-1", preco: 24.9, descontoValor: 0, tipoDesconto: "valor", estoque: null, ativo: true },
  { id: "2", nome: "X-Salada", categoriaId: "cat-1", preco: 26.9, descontoValor: 10, tipoDesconto: "percentual", estoque: null, ativo: true },
  { id: "3", nome: "X-Bacon", categoriaId: "cat-1", preco: 29.9, descontoValor: 0, tipoDesconto: "valor", estoque: 40, ativo: true },
  { id: "4", nome: "Batata Frita P", categoriaId: "cat-2", preco: 12.0, descontoValor: 0, tipoDesconto: "valor", estoque: 25, ativo: true },
  { id: "5", nome: "Batata Frita G", categoriaId: "cat-2", preco: 18.0, descontoValor: 2, tipoDesconto: "valor", estoque: 25, ativo: true },
  { id: "6", nome: "Coca-Cola Lata", categoriaId: "cat-3", preco: 6.5, descontoValor: 0, tipoDesconto: "valor", estoque: 80, ativo: true },
  { id: "7", nome: "Suco Natural", categoriaId: "cat-3", preco: 9.0, descontoValor: 0, tipoDesconto: "valor", estoque: 15, ativo: false },
];

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularPrecoFinal(produto) {
  const desconto =
    produto.tipoDesconto === "percentual"
      ? produto.preco * (Math.min(produto.descontoValor, 100) / 100)
      : produto.descontoValor;
  return Math.max(produto.preco - desconto, 0);
}

export default function Produtos() {
  const [produtos, setProdutos] = useState(PRODUTOS_EXEMPLO);
  const [categorias] = useState(CATEGORIAS_EXEMPLO);

  const [pesquisa, setPesquisa] = useState("");
  const [ordem, setOrdem] = useState("A-Z");
  const [filtraCategoria, setFiltraCategoria] = useState("todas");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState(null);

  const alternarOrdem = () => setOrdem((prev) => (prev === "A-Z" ? "Z-A" : "A-Z"));

  const abrirParaCriar = () => {
    setProdutoParaEditar(null);
    setIsModalOpen(true);
  };

  const abrirParaEditar = (produto) => {
    setProdutoParaEditar(produto);
    setIsModalOpen(true);
  };

  const salvarProduto = async (dados) => {
    if (dados.id) {
      setProdutos((atual) => atual.map((p) => (p.id === dados.id ? { ...p, ...dados } : p)));
    } else {
      setProdutos((atual) => [...atual, { id: `prod-${Date.now()}`, ...dados }]);
    }
  };

  const excluirProduto = (id) => {
    if (!confirm("Excluir este produto do cardápio?")) return;
    setProdutos((atual) => atual.filter((p) => p.id !== id));
  };

  const nomeCategoria = (categoriaId) =>
    categorias.find((cat) => cat.id === categoriaId)?.nome || "Sem categoria";

  const produtosFiltrados = produtos
    .filter((p) => {
      const bateNome = p.nome.toLowerCase().includes(pesquisa.toLowerCase());
      const bateCategoria = filtraCategoria === "todas" ? true : p.categoriaId === filtraCategoria;
      return bateNome && bateCategoria;
    })
    .sort((a, b) => (ordem === "A-Z" ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome)));

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
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {produtosFiltrados.length > 0 ? (
                produtosFiltrados.map((produto) => {
                  const temDesconto = produto.descontoValor > 0;
                  const precoFinal = calcularPrecoFinal(produto);

                  return (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center shrink-0">
                            <Package size={14} className="text-muted-foreground" />
                          </div>
                          <span className="font-semibold text-foreground">{produto.nome}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {nomeCategoria(produto.categoriaId)}
                      </TableCell>

                      <TableCell>
                        {temDesconto ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-muted-foreground line-through">
                              {formatarMoeda(produto.preco)}
                            </span>
                            <span className="font-semibold text-brand">{formatarMoeda(precoFinal)}</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-foreground">{formatarMoeda(produto.preco)}</span>
                        )}
                      </TableCell>

                      <TableCell className="text-muted-foreground font-mono text-xs">
                        {produto.estoque === null ? "Ilimitado" : produto.estoque}
                      </TableCell>

                      <TableCell>
                        {produto.ativo ? (
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
                            <Button variant="ghost" size="icon">
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirParaEditar(produto)}>
                              <Edit3 size={14} className="text-brand" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => excluirProduto(produto.id)}
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
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
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

      <ModalProduto
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setProdutoParaEditar(null);
        }}
        onSalvar={salvarProduto}
        produtoParaEditar={produtoParaEditar}
        categorias={categorias}
      />
    </div>
  );
}
