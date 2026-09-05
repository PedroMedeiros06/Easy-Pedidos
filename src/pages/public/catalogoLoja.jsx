import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Search,
  Sun,
  Moon,
  ClipboardList,
  ShoppingCart,
  MapPin,
  Truck,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// TODO: trocar por chamada real à API pública da loja (nome, categorias, catalog_items) quando o endpoint existir.
const LOJA_EXEMPLO = {
  nome: "Burger House",
  cidade: "Guarei",
  estado: "SP",
  aberta: true,
};

const CATEGORIAS_EXEMPLO = [
  { id: "cat-1", nome: "Lanches" },
  { id: "cat-2", nome: "Acompanhamentos" },
  { id: "cat-3", nome: "Bebidas" },
];

const PRODUTOS_EXEMPLO = [
  { id: "1", nome: "X-Burger Clássico", descricao: "Pão, carne, queijo, alface e tomate.", categoriaId: "cat-1", preco: 24.9, descontoValor: 0, tipoDesconto: "valor" },
  { id: "2", nome: "X-Salada", descricao: "Pão, carne, queijo, salada completa.", categoriaId: "cat-1", preco: 26.9, descontoValor: 10, tipoDesconto: "percentual" },
  { id: "3", nome: "X-Bacon", descricao: "Pão, carne, queijo, bacon crocante.", categoriaId: "cat-1", preco: 29.9, descontoValor: 0, tipoDesconto: "valor" },
  { id: "4", nome: "Batata Frita P", descricao: "Porção individual.", categoriaId: "cat-2", preco: 12.0, descontoValor: 0, tipoDesconto: "valor" },
  { id: "5", nome: "Batata Frita G", descricao: "Porção para compartilhar.", categoriaId: "cat-2", preco: 18.0, descontoValor: 2, tipoDesconto: "valor" },
  { id: "6", nome: "Coca-Cola Lata", descricao: "350ml gelada.", categoriaId: "cat-3", preco: 6.5, descontoValor: 0, tipoDesconto: "valor" },
  { id: "7", nome: "Suco Natural", descricao: "Sabor da casa, 400ml.", categoriaId: "cat-3", preco: 9.0, descontoValor: 0, tipoDesconto: "valor" },
  { id: "8", nome: "Água Mineral", descricao: "500ml sem gás.", categoriaId: "cat-3", preco: 4.0, descontoValor: 0, tipoDesconto: "valor" },
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

export default function CatalogoLoja() {
  // eslint-disable-next-line no-unused-vars
  const { companyCode } = useParams(); // TODO: usar para buscar dados reais da loja quando o endpoint público existir.

  const [temaClaro, setTemaClaro] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(null);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return PRODUTOS_EXEMPLO.filter((p) => {
      const bateBusca = !termo || p.nome.toLowerCase().includes(termo);
      const bateCategoria = filtroCategoria === "todos" || p.categoriaId === filtroCategoria;
      return bateBusca && bateCategoria;
    });
  }, [busca, filtroCategoria]);

  const adicionarAoCarrinho = (produto) => {
    setCarrinho((atual) => {
      const existente = atual.find((item) => item.id === produto.id);
      if (existente) {
        return atual.map((item) =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item,
        );
      }
      return [...atual, { ...produto, quantidade: 1 }];
    });
  };

  const alterarQuantidade = (id, delta) => {
    setCarrinho((atual) =>
      atual
        .map((item) => (item.id === id ? { ...item, quantidade: item.quantidade + delta } : item))
        .filter((item) => item.quantidade > 0),
    );
  };

  const removerItem = (id) => setCarrinho((atual) => atual.filter((item) => item.id !== id));

  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  const totalPedido = carrinho.reduce(
    (soma, item) => soma + calcularPrecoFinal(item) * item.quantidade,
    0,
  );

  const finalizarPedido = () => {
    // TODO: enviar pedido pra API real quando o endpoint de pedidos públicos existir.
    setPedidoEnviado({
      codigo: `#${Math.floor(1000 + Math.random() * 9000)}`,
      total: totalPedido,
    });
    setCarrinho([]);
    setCarrinhoAberto(false);
  };

  return (
    <div className={temaClaro ? "" : "dark"}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-brand text-brand-foreground flex items-center justify-center shrink-0 font-bold">
                {LOJA_EXEMPLO.nome.slice(0, 1)}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
                  Catálogo Digital
                </p>
                <h1 className="text-base font-bold tracking-tight text-foreground truncate">
                  {LOJA_EXEMPLO.nome}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setTemaClaro((v) => !v)}
                title="Alternar tema"
                className="size-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition"
              >
                {temaClaro ? <Moon size={16} /> : <Sun size={16} />}
              </button>

              <Button variant="outline" className="h-9 hidden sm:inline-flex">
                <ClipboardList size={15} />
                Pedidos
              </Button>

              <Button onClick={() => setCarrinhoAberto(true)} className="h-9 bg-brand text-brand-foreground hover:bg-brand/90">
                <ShoppingCart size={15} />
                Carrinho
                {totalItens > 0 && (
                  <Badge className="bg-brand-foreground text-brand hover:bg-brand-foreground ml-0.5">
                    {totalItens}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 pb-3">
            <Badge
              variant="outline"
              className={
                LOJA_EXEMPLO.aberta
                  ? "gap-1.5 text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
                  : "gap-1.5 text-rose-500 border-rose-500/20 bg-rose-500/10"
              }
            >
              <span className={`size-1.5 rounded-full ${LOJA_EXEMPLO.aberta ? "bg-emerald-500" : "bg-rose-500"}`} />
              {LOJA_EXEMPLO.aberta ? "Aberto para pedidos" : "Fechado no momento"}
            </Badge>
          </div>
        </header>

        {/* Hero */}
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand to-brand/70 p-8 sm:p-10 grid sm:grid-cols-[1.3fr_1fr] gap-8 items-center">
            <div className="relative space-y-4">
              <Badge className="bg-brand-foreground text-brand hover:bg-brand-foreground gap-1.5">
                <Sparkles size={12} />
                Pedido rápido e organizado
              </Badge>

              <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-brand-foreground leading-[1.05]">
                Escolha.
                <br />
                Peça.
                <br />
                Receba.
              </h2>

              <p className="text-sm text-brand-foreground/85 max-w-sm">
                Encontre seus produtos, monte seu combo e finalize tudo em poucos cliques.
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-brand-foreground/15 border-transparent text-brand-foreground gap-1.5">
                  <MapPin size={12} />
                  {LOJA_EXEMPLO.cidade} · {LOJA_EXEMPLO.estado}
                </Badge>
                <Badge className="bg-brand-foreground text-brand hover:bg-brand-foreground gap-1.5">
                  <Truck size={12} />
                  Consulte a entrega
                </Badge>
              </div>
            </div>

            <div className="hidden sm:flex aspect-square rounded-2xl bg-brand-foreground/10 items-center justify-center">
              <ShoppingCart size={64} className="text-brand-foreground/70" />
            </div>
          </div>
        </div>

        {/* Filtros de categoria + busca */}
        <div className="max-w-6xl mx-auto px-6 pt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFiltroCategoria("todos")}
              className={`h-8 px-4 rounded-full text-xs font-semibold transition ${
                filtroCategoria === "todos"
                  ? "bg-brand text-brand-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              Todos
            </button>
            {CATEGORIAS_EXEMPLO.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setFiltroCategoria(cat.id)}
                className={`h-8 px-4 rounded-full text-xs font-semibold transition ${
                  filtroCategoria === cat.id
                    ? "bg-brand text-brand-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                }`}
              >
                {cat.nome}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="O que você quer pedir hoje?"
              className="pl-11 h-12 rounded-xl"
            />
          </div>
        </div>

        {/* Grid de produtos */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {produtosFiltrados.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {produtosFiltrados.map((produto) => {
                const temDesconto = produto.descontoValor > 0;
                const precoFinal = calcularPrecoFinal(produto);

                return (
                  <div
                    key={produto.id}
                    className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground leading-tight">{produto.nome}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{produto.descricao}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div>
                        {temDesconto && (
                          <span className="text-xs text-muted-foreground line-through block">
                            {formatarMoeda(produto.preco)}
                          </span>
                        )}
                        <span className="text-lg font-bold text-brand">{formatarMoeda(precoFinal)}</span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => adicionarAoCarrinho(produto)}
                        className="bg-brand text-brand-foreground hover:bg-brand/90"
                      >
                        <Plus size={14} />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground text-sm">
              Nenhum produto encontrado para essa busca.
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="border-t border-border">
          <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-lg bg-brand text-brand-foreground flex items-center justify-center text-xs font-bold shrink-0">
                {LOJA_EXEMPLO.nome.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{LOJA_EXEMPLO.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {LOJA_EXEMPLO.cidade} · {LOJA_EXEMPLO.estado}
                </p>
              </div>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Powered by Easy Orders
            </p>
          </div>
        </footer>

        {/* Painel do carrinho */}
        {carrinhoAberto && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setCarrinhoAberto(false)}
            />
            <div className="relative w-full max-w-sm h-full bg-card border-l border-border flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <ShoppingCart size={16} className="text-brand" />
                  Seu pedido
                </div>
                <button
                  onClick={() => setCarrinhoAberto(false)}
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {carrinho.length > 0 ? (
                  <div className="space-y-2">
                    {carrinho.map((item) => (
                      <div key={item.id} className="bg-muted/40 border border-border rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-foreground leading-tight">
                            {item.nome}
                          </span>
                          <button
                            onClick={() => removerItem(item.id)}
                            className="text-muted-foreground hover:text-rose-500 transition shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => alterarQuantidade(item.id, -1)}
                              className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-semibold text-foreground w-5 text-center">
                              {item.quantidade}
                            </span>
                            <button
                              onClick={() => alterarQuantidade(item.id, 1)}
                              className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="text-sm font-semibold text-brand">
                            {formatarMoeda(calcularPrecoFinal(item) * item.quantidade)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ShoppingCart size={32} />
                    <span className="text-sm font-medium">Seu carrinho está vazio</span>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border space-y-3 shrink-0">
                <div className="flex justify-between font-bold text-base">
                  <span className="text-foreground">Total</span>
                  <span className="text-brand">{formatarMoeda(totalPedido)}</span>
                </div>
                <Button
                  disabled={carrinho.length === 0}
                  onClick={finalizarPedido}
                  className="w-full h-11 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
                >
                  Enviar Pedido
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmação de pedido enviado */}
        {pedidoEnviado && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setPedidoEnviado(null)} />
            <div className="relative bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center space-y-3">
              <div className="mx-auto size-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <CheckCircle2 size={28} />
              </div>
              <h3 className="text-lg font-bold text-foreground">Pedido enviado!</h3>
              <p className="text-sm text-muted-foreground">
                Seu pedido {pedidoEnviado.codigo} no valor de{" "}
                <span className="font-semibold text-foreground">
                  {formatarMoeda(pedidoEnviado.total)}
                </span>{" "}
                foi enviado para {LOJA_EXEMPLO.nome}.
              </p>
              <Button onClick={() => setPedidoEnviado(null)} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
