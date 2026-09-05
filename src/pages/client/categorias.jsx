import { useState } from "react";
import { Plus, Search, Tag, MoreVertical, Edit3, Trash2, AlertCircle } from "lucide-react";
import ModalCategoria from "../../components/client/modal_categoria";
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

// TODO: trocar por chamada real à API de categorias (catalog_items/categories) quando o endpoint existir.
const CATEGORIAS_EXEMPLO = [
  { id: "cat-1", nome: "Lanches", descricao: "Hambúrgueres e sanduíches", itens: 6 },
  { id: "cat-2", nome: "Acompanhamentos", descricao: "Porções e adicionais", itens: 3 },
  { id: "cat-3", nome: "Bebidas", descricao: "Refrigerantes, sucos e água", itens: 5 },
];

export default function Categorias() {
  const [categorias, setCategorias] = useState(CATEGORIAS_EXEMPLO);
  const [pesquisa, setPesquisa] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState(null);

  const categoriasFiltradas = categorias.filter((cat) =>
    cat.nome.toLowerCase().includes(pesquisa.toLowerCase()),
  );

  const abrirParaCriar = () => {
    setCategoriaParaEditar(null);
    setIsModalOpen(true);
  };

  const abrirParaEditar = (categoria) => {
    setCategoriaParaEditar(categoria);
    setIsModalOpen(true);
  };

  const salvarCategoria = async (dados) => {
    if (dados.id) {
      setCategorias((atual) =>
        atual.map((cat) => (cat.id === dados.id ? { ...cat, ...dados } : cat)),
      );
    } else {
      setCategorias((atual) => [
        ...atual,
        { id: `cat-${Date.now()}`, itens: 0, ...dados },
      ]);
    }
  };

  const excluirCategoria = (id) => {
    if (!confirm("Excluir esta categoria? Os produtos vinculados a ela ficarão sem categoria.")) return;
    setCategorias((atual) => atual.filter((cat) => cat.id !== id));
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Categorias</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize seu cardápio agrupando os produtos por categoria.
          </p>
        </div>
        <Button onClick={abrirParaCriar}>
          <Plus size={16} /> Nova Categoria
        </Button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            type="text"
            placeholder="Pesquisar categoria..."
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Produtos</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {categoriasFiltradas.length > 0 ? (
                categoriasFiltradas.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                          <Tag size={14} />
                        </div>
                        <span className="font-semibold text-foreground">{cat.nome}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {cat.descricao || "—"}
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-muted-foreground">
                        {cat.itens} {cat.itens === 1 ? "produto" : "produtos"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => abrirParaEditar(cat)}>
                            <Edit3 size={14} className="text-brand" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => excluirCategoria(cat.id)}
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
                      <span>Nenhuma categoria cadastrada ou encontrada.</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <ModalCategoria
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoriaParaEditar(null);
        }}
        onSalvar={salvarCategoria}
        categoriaParaEditar={categoriaParaEditar}
      />
    </div>
  );
}
