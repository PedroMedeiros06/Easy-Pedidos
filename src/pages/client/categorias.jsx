import { useState, useEffect } from "react";
import { Plus, Search, Tag, MoreVertical, Edit3, Trash2, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import ModalCategoria from "../../components/client/modal_categoria";
import { categoriesApi } from "../../api/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function Categorias() {
  const [categorias, setCategorias] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [pesquisa, setPesquisa] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState(null);
  const [excluindoId, setExcluindoId] = useState(null);

  const buscarDadosDoBanco = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await categoriesApi.list();
      setCategorias(dados);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarDadosDoBanco();
  }, []);

  const categoriasFiltradas = categorias.filter((cat) =>
    (cat.categoryName || "").toLowerCase().includes(pesquisa.toLowerCase()),
  );

  const abrirParaCriar = () => {
    setCategoriaParaEditar(null);
    setIsModalOpen(true);
  };

  const abrirParaEditar = (categoria) => {
    setCategoriaParaEditar(categoria);
    setIsModalOpen(true);
  };

  const excluirCategoria = async (categoria) => {
    if (!confirm(`Excluir a categoria "${categoria.categoryName}"?`)) return;

    try {
      setExcluindoId(categoria.categoryId);
      await categoriesApi.remove(categoria.categoryId);
      await buscarDadosDoBanco();
    } catch (err) {
      alert(`Erro ao excluir categoria: ${err.message}`);
    } finally {
      setExcluindoId(null);
    }
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
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {categoriasFiltradas.length > 0 ? (
                  categoriasFiltradas.map((cat) => (
                    <TableRow key={cat.categoryId}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
                            <Tag size={14} />
                          </div>
                          <span className="font-semibold text-foreground">{cat.categoryName}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-muted-foreground">
                        {cat.active ? "Ativa" : "Inativa"}
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={excluindoId === cat.categoryId}>
                              <MoreVertical size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => abrirParaEditar(cat)}>
                              <Edit3 size={14} className="text-brand" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => excluirCategoria(cat)}
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
                    <TableCell colSpan={3} className="py-12 text-center text-muted-foreground">
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
      )}

      <ModalCategoria
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setCategoriaParaEditar(null);
        }}
        onSuccess={buscarDadosDoBanco}
        categoriaParaEditar={categoriaParaEditar}
      />
    </div>
  );
}
