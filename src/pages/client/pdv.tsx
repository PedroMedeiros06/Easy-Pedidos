import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import {
  Search,
  ShoppingCart,
  ScanBarcode,
  Trash2,
  Minus,
  Plus,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { catalogItemsApi, categoriesApi } from "../../api/catalog";
import { ordersApi } from "../../api/orders";
import type { CatalogItem, Category, DiscountType, Order } from "@/types/catalog";
import { extrairAddons, extrairRemoviveis } from "@/types/catalog";
import SeletorAdicionais, {
  type PersonalizacaoEscolhida,
} from "@/components/shared/seletor_adicionais";
import ModalDetalheProduto from "@/components/shared/modal_detalhe_produto";
import AlertaErroPedido from "@/components/shared/alerta_erro_pedido";
import { tratarErroPedido, type ErroPedidoTratado } from "@/lib/erros_pedido";
import {
  type LinhaCarrinho,
  adicionarLinha,
  alterarQuantidadeLinha,
  removerLinha,
  editarPersonalizacaoDaLinha,
  subtotalLinhaCentavos,
  itemsParaPayload,
  quantidadeNoCarrinho,
  podeAdicionarMais,
} from "@/lib/carrinho";

// Item tem algo pra personalizar? (adicional ou ingrediente removível)
function temPersonalizacao(item: CatalogItem): boolean {
  return extrairAddons(item).length > 0 || extrairRemoviveis(item).length > 0;
}

const FORMAS_PAGAMENTO = [
  { valor: "dinheiro", rotulo: "Dinheiro" },
  { valor: "pix", rotulo: "PIX" },
  { valor: "credito", rotulo: "Crédito" },
  { valor: "debito", rotulo: "Débito" },
];

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function precoVitrineCentavos(produto: CatalogItem): number {
  const desconto =
    produto.discountType === "percentage"
      ? produto.priceCents * (Math.min(produto.discountValue, 100) / 100)
      : produto.discountValue;
  return Math.max(produto.priceCents - desconto, 0);
}

export default function ClientPdv() {
  const [produtos, setProdutos] = useState<CatalogItem[]>([]);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [carrinho, setCarrinho] = useState<LinhaCarrinho[]>([]);
  const [itemParaPersonalizar, setItemParaPersonalizar] = useState<CatalogItem | null>(null);
  const [itemDetalhe, setItemDetalhe] = useState<CatalogItem | null>(null);
  const [linhaEditando, setLinhaEditando] = useState<{ lineId: string; item: CatalogItem } | null>(
    null,
  );
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [desconto, setDesconto] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState<DiscountType>("value");

  const [enviandoVenda, setEnviandoVenda] = useState(false);
  const [erroVenda, setErroVenda] = useState<ErroPedidoTratado | null>(null);
  const [vendaConcluida, setVendaConcluida] = useState<Order | null>(null);

  const buscarProdutos = async () => {
    try {
      setCarregandoProdutos(true);
      setErroProdutos(null);

      const [itens, cats] = await Promise.all([
        catalogItemsApi.list(),
        categoriesApi.list(),
      ]);
      setProdutos(itens.filter((item) => item.active));
      setCategorias(cats);
    } catch (err) {
      setErroProdutos(err instanceof Error ? err.message : "Falha ao carregar produtos.");
    } finally {
      setCarregandoProdutos(false);
    }
  };

  useEffect(() => {
    buscarProdutos();
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const bateBusca = !termo || p.itemName.toLowerCase().includes(termo);
      const bateCategoria = filtroCategoria === "todos" || p.categoryId === filtroCategoria;
      return bateBusca && bateCategoria;
    });
  }, [produtos, busca, filtroCategoria]);

  // Só mostra chips de categorias que têm ao menos um produto ativo.
  const categoriasComProduto = useMemo(() => {
    const ids = new Set(produtos.map((p) => p.categoryId).filter(Boolean));
    return categorias.filter((c) => ids.has(c.categoryId));
  }, [categorias, produtos]);

  // Clique no corpo do card: fluxo rápido de balcão. Tem personalização → seletor; senão adiciona direto.
  const aoClicarProduto = (produto: CatalogItem) => {
    if (!podeAdicionarMais(carrinho, produto.itemId, produto.maxQuantity)) return;
    if (temPersonalizacao(produto)) {
      setItemParaPersonalizar(produto);
    } else {
      setCarrinho((atual) => adicionarLinha(atual, produto, [], []));
    }
  };

  // Adição vinda do modal de detalhes (adicionais/remoções já escolhidos lá).
  const adicionarDoModal = (produto: CatalogItem) => ({
    addons,
    removidos,
  }: PersonalizacaoEscolhida) => {
    if (!podeAdicionarMais(carrinho, produto.itemId, produto.maxQuantity)) {
      setItemDetalhe(null);
      return;
    }
    setCarrinho((atual) => adicionarLinha(atual, produto, addons, removidos));
    setItemDetalhe(null);
  };

  const confirmarPersonalizacao = ({ addons, removidos }: PersonalizacaoEscolhida) => {
    if (!itemParaPersonalizar) return;
    if (!podeAdicionarMais(carrinho, itemParaPersonalizar.itemId, itemParaPersonalizar.maxQuantity)) {
      setItemParaPersonalizar(null);
      return;
    }
    setCarrinho((atual) => adicionarLinha(atual, itemParaPersonalizar, addons, removidos));
    setItemParaPersonalizar(null);
  };

  const abrirEdicaoPersonalizacao = (linha: LinhaCarrinho) => {
    const item = produtos.find((p) => p.itemId === linha.itemId);
    if (!item || !temPersonalizacao(item)) return;
    setLinhaEditando({ lineId: linha.lineId, item });
  };

  const salvarEdicaoPersonalizacao = ({ addons, removidos }: PersonalizacaoEscolhida) => {
    if (!linhaEditando) return;
    setCarrinho((atual) =>
      editarPersonalizacaoDaLinha(atual, linhaEditando.lineId, addons, removidos),
    );
    setLinhaEditando(null);
  };

  const alterarQuantidade = (lineId: string, delta: number) => {
    setCarrinho((atual) => {
      if (delta > 0) {
        const linha = atual.find((l) => l.lineId === lineId);
        const produto = linha && produtos.find((p) => p.itemId === linha.itemId);
        if (produto && !podeAdicionarMais(atual, produto.itemId, produto.maxQuantity)) {
          return atual;
        }
      }
      return alterarQuantidadeLinha(atual, lineId, delta);
    });
  };

  const removerItem = (lineId: string) => {
    setCarrinho((atual) => removerLinha(atual, lineId));
  };

  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);

  // Bruto = preço cheio dos itens + adicionais, sem nenhum desconto.
  // Subtotal (o de sempre) já traz o desconto de produto embutido, então a
  // diferença entre os dois é exatamente o desconto de origem "produto".
  const brutoCentavos = carrinho.reduce((soma, l) => {
    const extras = l.addons.reduce((s, a) => s + a.priceCents, 0);
    return soma + (l.priceCents + extras) * l.quantidade;
  }, 0);
  const subtotalCentavos = carrinho.reduce((soma, l) => soma + subtotalLinhaCentavos(l), 0);
  const descontoProdutosCentavos = Math.max(brutoCentavos - subtotalCentavos, 0);

  const descontoDigitado = Number(String(desconto).replace(",", ".")) || 0;
  const descontoPedidoCentavos =
    tipoDesconto === "percentage" ? descontoDigitado : Math.round(descontoDigitado * 100);
  // Desconto do pedido incide sobre o subtotal (que já tem o desconto de produto).
  const valorDescontoPedidoCentavos =
    tipoDesconto === "percentage"
      ? subtotalCentavos * (Math.min(descontoDigitado, 100) / 100)
      : descontoPedidoCentavos;
  const totalCentavos = Math.max(subtotalCentavos - valorDescontoPedidoCentavos, 0);

  // Empilhado: soma dos descontos de todas as origens (produto + pedido; categoria no futuro).
  const descontoTotalCentavos = descontoProdutosCentavos + valorDescontoPedidoCentavos;
  const linhasDesconto: { origem: string; valorCentavos: number }[] = [];
  if (descontoProdutosCentavos > 0) {
    linhasDesconto.push({ origem: "Produtos", valorCentavos: descontoProdutosCentavos });
  }
  if (valorDescontoPedidoCentavos > 0) {
    linhasDesconto.push({
      origem:
        tipoDesconto === "percentage" ? `Pedido (${descontoDigitado}%)` : "Pedido",
      valorCentavos: valorDescontoPedidoCentavos,
    });
  }

  const dadosClienteOk = nomeCliente.trim().length > 0;

  const finalizarVenda = async () => {
    if (carrinho.length === 0) return;

    if (!dadosClienteOk) {
      setErroVenda({
        categoria: "generico",
        titulo: "Nome do cliente obrigatório",
        detalhe: "Informe o nome do cliente antes de finalizar a venda.",
        acao: "",
      });
      return;
    }

    setEnviandoVenda(true);
    setErroVenda(null);

    try {
      const pedido = await ordersApi.create({
        items: itemsParaPayload(carrinho),
        customerName: nomeCliente.trim(),
        customerPhone: telefoneCliente.trim() || undefined,
        paymentMethod: formaPagamento,
        discountValue: descontoPedidoCentavos,
        discountType: tipoDesconto,
      });

      setVendaConcluida(pedido);
      setCarrinho([]);
      setNomeCliente("");
      setTelefoneCliente("");
      setDesconto("");
    } catch (err) {
      setErroVenda(tratarErroPedido(err));
    } finally {
      setEnviandoVenda(false);
    }
  };

  return (
    <div className="-m-6 h-screen flex flex-col">
      {/* Cabeçalho */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-brand text-brand-foreground flex items-center justify-center shrink-0">
            <ScanBarcode size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
              Operação no Balcão
            </p>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Frente de Caixa</h1>
          </div>
        </div>

        <Badge
          variant="outline"
          className="gap-1.5 text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
        >
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Leitor Ativo
        </Badge>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Coluna de produtos */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-border shrink-0 space-y-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                value={busca}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
                placeholder="Buscar por nome do produto..."
                className="pl-9 h-11"
              />
            </div>

            {categoriasComProduto.length > 0 && (
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
                {categoriasComProduto.map((cat) => (
                  <button
                    key={cat.categoryId}
                    onClick={() => setFiltroCategoria(cat.categoryId)}
                    className={`h-8 px-4 rounded-full text-xs font-semibold transition ${
                      filtroCategoria === cat.categoryId
                        ? "bg-brand text-brand-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {cat.categoryName}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {carregandoProdutos ? (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                <Loader2 size={24} className="animate-spin text-brand" />
                <span className="text-sm">Carregando cardápio...</span>
              </div>
            ) : erroProdutos ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                <AlertTriangle size={28} className="text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">Falha ao carregar produtos</h3>
                <p className="text-xs text-muted-foreground max-w-xs">{erroProdutos}</p>
                <Button variant="outline" size="sm" onClick={buscarProdutos} className="mt-2">
                  Tentar novamente
                </Button>
              </div>
            ) : produtosFiltrados.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {produtosFiltrados.map((produto) => {
                  const temDesconto = produto.discountValue > 0;
                  const precoFinalCentavos = precoVitrineCentavos(produto);
                  const temAddons = temPersonalizacao(produto);
                  const semEstoque = !podeAdicionarMais(carrinho, produto.itemId, produto.maxQuantity);

                  const capa = produto.imageUrl ?? produto.images?.[0]?.url ?? null;

                  return (
                    <div
                      key={produto.itemId}
                      className={`relative bg-card border border-border rounded-xl overflow-hidden transition flex flex-col ${
                        semEstoque
                          ? "opacity-40"
                          : "hover:border-brand/50 hover:shadow-sm"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setItemDetalhe(produto)}
                        className="absolute top-1.5 right-1.5 z-10 size-7 rounded-full bg-black/45 text-white flex items-center justify-center hover:bg-black/65 transition"
                        title="Ver detalhes"
                        aria-label={`Ver detalhes de ${produto.itemName}`}
                      >
                        <Info size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={() => aoClicarProduto(produto)}
                        disabled={semEstoque}
                        className="text-left flex flex-col flex-1 disabled:cursor-not-allowed"
                      >
                        <div className="aspect-4/3 bg-muted w-full shrink-0">
                          {capa ? (
                            <img
                              src={capa}
                              alt={produto.itemName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <span className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Package size={20} />
                            </span>
                          )}
                        </div>

                        <div className="p-3 flex flex-col gap-1 flex-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {produto.categoryName || "Sem categoria"}
                          </span>
                          <span className="text-sm font-semibold text-foreground leading-tight">
                            {produto.itemName}
                          </span>
                          <div className="mt-auto pt-1">
                            {temDesconto && (
                              <span className="text-xs text-muted-foreground line-through block">
                                {formatarMoeda(produto.priceCents)}
                              </span>
                            )}
                            <span className="text-base font-bold text-brand">
                              {formatarMoeda(precoFinalCentavos)}
                            </span>
                            {semEstoque ? (
                              <span className="block text-[10px] font-semibold uppercase tracking-wide text-rose-500 mt-0.5">
                                {produto.maxQuantity === 0 ? "sem estoque" : "limite no carrinho"}
                              </span>
                            ) : (
                              temAddons && (
                                <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-0.5">
                                  personalizável
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        </div>

        {/* Painel de venda */}
        <div className="w-96 shrink-0 bg-zinc-950 text-zinc-50 flex flex-col border-l border-border">
          <div className="p-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <ShoppingCart size={16} className="text-brand" />
              Venda atual
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{totalItens} item(ns)</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {carrinho.length > 0 ? (
              <div className="space-y-2">
                {carrinho.map((item) => {
                  const produtoBase = produtos.find((p) => p.itemId === item.itemId);
                  const podeEditar = !!produtoBase && temPersonalizacao(produtoBase);
                  const semNada = item.addons.length === 0 && item.removidos.length === 0;
                  const teto = produtoBase?.maxQuantity ?? null;
                  const noTeto =
                    teto != null && quantidadeNoCarrinho(carrinho, item.itemId) >= teto;

                  return (
                  <div key={item.lineId} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-zinc-50 leading-tight">
                          {item.itemName}
                        </span>
                        {item.addons.length > 0 && (
                          <span className="block text-[11px] text-zinc-400 mt-0.5">
                            + {item.addons.map((a) => a.ingredientName).join(", ")}
                          </span>
                        )}
                        {item.removidos.length > 0 && (
                          <span className="block text-[11px] text-rose-400 mt-0.5">
                            sem {item.removidos.map((r) => r.ingredientName).join(", ")}
                          </span>
                        )}
                        {semNada && podeEditar && (
                          <span className="block text-[11px] text-zinc-500 mt-0.5">
                            sem personalização
                          </span>
                        )}
                        {podeEditar && (
                          <button
                            onClick={() => abrirEdicaoPersonalizacao(item)}
                            className="text-[11px] font-semibold text-brand hover:underline mt-1"
                          >
                            Personalizar
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => removerItem(item.lineId)}
                        className="text-zinc-500 hover:text-rose-400 transition shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alterarQuantidade(item.lineId, -1)}
                          className="size-6 rounded-md bg-white/10 flex items-center justify-center text-zinc-300 hover:bg-white/20 transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold text-zinc-50 w-5 text-center">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => alterarQuantidade(item.lineId, 1)}
                          disabled={noTeto}
                          className="size-6 rounded-md bg-white/10 flex items-center justify-center text-zinc-300 hover:bg-white/20 transition disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={12} />
                        </button>
                        {noTeto && (
                          <span className="text-[10px] text-amber-400 ml-1">máx {teto}</span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-brand">
                        {formatarMoeda(subtotalLinhaCentavos(item))}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                <ShoppingCart size={32} />
                <span className="text-sm font-medium">Carrinho vazio</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
            <AlertaErroPedido erro={erroVenda} tema="dark" />

            <div className="grid grid-cols-2 gap-2">
              <Input
                value={nomeCliente}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setNomeCliente(e.target.value)}
                placeholder="Nome do cliente *"
                className="h-9 bg-white/5 border-white/10 text-zinc-50 placeholder:text-zinc-500"
              />
              <Input
                value={telefoneCliente}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTelefoneCliente(e.target.value)}
                placeholder="Telefone (opcional)"
                inputMode="tel"
                className="h-9 bg-white/5 border-white/10 text-zinc-50 placeholder:text-zinc-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {FORMAS_PAGAMENTO.map((forma) => (
                <button
                  key={forma.valor}
                  onClick={() => setFormaPagamento(forma.valor)}
                  className={`h-9 rounded-lg text-xs font-semibold transition ${
                    formaPagamento === forma.valor
                      ? "bg-brand text-brand-foreground"
                      : "bg-white/5 text-zinc-300 hover:bg-white/10"
                  }`}
                >
                  {forma.rotulo}
                </button>
              ))}
            </div>

            <div className="flex h-9 rounded-md border border-white/10 bg-white/5 overflow-hidden focus-within:ring-1 focus-within:ring-ring">
              <Input
                value={desconto}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setDesconto(e.target.value)}
                placeholder="Desconto do pedido"
                className="h-9 flex-1 min-w-0 border-0 bg-transparent text-zinc-50 placeholder:text-zinc-500 focus-visible:ring-0 rounded-none"
              />
              <div className="flex shrink-0 border-l border-white/10">
                <button
                  type="button"
                  onClick={() => setTipoDesconto("value")}
                  title="Desconto em reais"
                  className={`px-2 text-xs font-semibold transition ${
                    tipoDesconto === "value"
                      ? "bg-brand text-brand-foreground"
                      : "text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  R$
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDesconto("percentage")}
                  title="Desconto em porcentagem"
                  className={`px-2 text-xs font-semibold transition border-l border-white/10 ${
                    tipoDesconto === "percentage"
                      ? "bg-brand text-brand-foreground"
                      : "text-zinc-400 hover:bg-white/10"
                  }`}
                >
                  %
                </button>
              </div>
            </div>

            <div className="text-sm space-y-0.5">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal{descontoProdutosCentavos > 0 ? " (sem descontos)" : ""}</span>
                <span>{formatarMoeda(brutoCentavos)}</span>
              </div>

              {linhasDesconto.length > 0 && (
                <div className="pt-1 mt-1 border-t border-white/10 space-y-0.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Descontos
                  </p>
                  {linhasDesconto.map((d) => (
                    <div
                      key={d.origem}
                      className="flex justify-between text-zinc-400 pl-2"
                    >
                      <span>{d.origem}</span>
                      <span className="text-rose-400">-{formatarMoeda(d.valorCentavos)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-zinc-300 font-medium">
                    <span>Total de descontos</span>
                    <span className="text-rose-400">
                      -{formatarMoeda(descontoTotalCentavos)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between font-bold text-base mt-1 pt-1 border-t border-white/10">
                <span className="text-zinc-50">Total</span>
                <span className="text-brand">{formatarMoeda(totalCentavos)}</span>
              </div>
            </div>

            <Button
              disabled={carrinho.length === 0 || enviandoVenda || !dadosClienteOk}
              onClick={finalizarVenda}
              className="w-full h-11 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
            >
              {enviandoVenda && <Loader2 size={16} className="animate-spin" />}
              {enviandoVenda ? "Enviando..." : "Finalizar Venda"}
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de detalhes do produto (fotos, descrição, adicionais) */}
      {itemDetalhe &&
        (() => {
          const semEstoque = !podeAdicionarMais(
            carrinho,
            itemDetalhe.itemId,
            itemDetalhe.maxQuantity,
          );
          return (
            <ModalDetalheProduto
              item={itemDetalhe}
              tema="dark"
              bloqueado={semEstoque}
              rotuloBotao={
                semEstoque
                  ? itemDetalhe.maxQuantity === 0
                    ? "Sem estoque"
                    : "No limite"
                  : "Adicionar"
              }
              onFechar={() => setItemDetalhe(null)}
              onAdicionar={adicionarDoModal(itemDetalhe)}
            />
          );
        })()}

      {/* Seletor de personalização (adicionais + remoções) */}
      <SeletorAdicionais
        item={itemParaPersonalizar}
        tema="dark"
        onCancelar={() => setItemParaPersonalizar(null)}
        onConfirmar={confirmarPersonalizacao}
      />

      <SeletorAdicionais
        item={linhaEditando?.item ?? null}
        tema="dark"
        addonsIniciais={
          linhaEditando
            ? (carrinho
                .find((l) => l.lineId === linhaEditando.lineId)
                ?.addons.map((a) => a.ingredientId) ?? [])
            : undefined
        }
        removidosIniciais={
          linhaEditando
            ? (carrinho
                .find((l) => l.lineId === linhaEditando.lineId)
                ?.removidos.map((r) => r.ingredientId) ?? [])
            : undefined
        }
        onCancelar={() => setLinhaEditando(null)}
        onConfirmar={salvarEdicaoPersonalizacao}
      />

      {/* Confirmação de venda concluída */}
      {vendaConcluida && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setVendaConcluida(null)} />
          <div className="relative bg-card border border-border rounded-2xl p-8 max-w-sm w-full text-center space-y-3">
            <div className="mx-auto size-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Venda registrada!</h3>
            <p className="text-sm text-muted-foreground">
              Total de{" "}
              <span className="font-semibold text-foreground">
                {formatarMoeda(vendaConcluida.totalCents)}
              </span>{" "}
              lançado com sucesso.
            </p>
            <Button
              onClick={() => setVendaConcluida(null)}
              className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
            >
              Nova Venda
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
