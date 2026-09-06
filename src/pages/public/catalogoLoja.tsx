import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import {
  Search,
  Sun,
  Moon,
  ShoppingCart,
  MapPin,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  X,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { storefrontApi } from "../../api/storefront";
import type { Category, CatalogItem, Order } from "@/types/catalog";
import { extrairAddons } from "@/types/catalog";
import SeletorAdicionais from "@/components/shared/seletor_adicionais";
import AlertaErroPedido from "@/components/shared/alerta_erro_pedido";
import { tratarErroPedido, type ErroPedidoTratado } from "@/lib/erros_pedido";
import {
  type LinhaCarrinho,
  type AddonEscolhido,
  adicionarLinha,
  alterarQuantidadeLinha,
  removerLinha,
  editarAddonsDaLinha,
  precoItemComDescontoCentavos,
  subtotalLinhaCentavos,
  itemsParaPayload,
} from "@/lib/carrinho";

type TipoEntrega = "retirada" | "entrega";

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CatalogoLoja() {
  const { companyCode } = useParams();

  const [loja, setLoja] = useState<{
    companyName: string;
    companyLocation: { city?: string; state?: string; [k: string]: unknown } | null;
  } | null>(null);
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [produtos, setProdutos] = useState<CatalogItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState<string | null>(null);

  const [temaClaro, setTemaClaro] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("todos");
  const [carrinho, setCarrinho] = useState<LinhaCarrinho[]>([]);
  const [carrinhoAberto, setCarrinhoAberto] = useState(false);
  const [itemParaAddons, setItemParaAddons] = useState<CatalogItem | null>(null);
  // Linha do carrinho em edição de adicionais (reabre o seletor com o que já foi escolhido).
  const [linhaEditando, setLinhaEditando] = useState<{ lineId: string; item: CatalogItem } | null>(
    null,
  );

  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>("retirada");
  const [enderecoEntrega, setEnderecoEntrega] = useState("");
  const [numeroEntrega, setNumeroEntrega] = useState("");
  const [erroDadosCliente, setErroDadosCliente] = useState("");
  const [dadosClienteAberto, setDadosClienteAberto] = useState(false);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [erroPedido, setErroPedido] = useState<ErroPedidoTratado | null>(null);
  const [pedidoEnviado, setPedidoEnviado] = useState<Order | null>(null);

  const buscarLoja = async () => {
    try {
      setCarregando(true);
      setErroCarregamento(null);

      const dados = await storefrontApi.get(companyCode);
      setLoja(dados.company);
      setCategorias(dados.categories || []);
      setProdutos(dados.catalogItems || []);
    } catch (err) {
      setErroCarregamento(err instanceof Error ? err.message : "Estabelecimento não encontrado.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarLoja();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyCode]);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return produtos.filter((p) => {
      const bateBusca = !termo || p.itemName.toLowerCase().includes(termo);
      const bateCategoria = filtroCategoria === "todos" || p.categoryId === filtroCategoria;
      return bateBusca && bateCategoria;
    });
  }, [produtos, busca, filtroCategoria]);

  const aoClicarAdicionar = (produto: CatalogItem) => {
    if (extrairAddons(produto).length > 0) {
      setItemParaAddons(produto);
    } else {
      setCarrinho((atual) => adicionarLinha(atual, produto, []));
    }
  };

  const confirmarAddons = (addons: AddonEscolhido[]) => {
    if (!itemParaAddons) return;
    setCarrinho((atual) => adicionarLinha(atual, itemParaAddons, addons));
    setItemParaAddons(null);
  };

  const abrirEdicaoAddons = (linha: LinhaCarrinho) => {
    const item = produtos.find((p) => p.itemId === linha.itemId);
    if (!item || extrairAddons(item).length === 0) return;
    setLinhaEditando({ lineId: linha.lineId, item });
  };

  const salvarEdicaoAddons = (addons: AddonEscolhido[]) => {
    if (!linhaEditando) return;
    setCarrinho((atual) => editarAddonsDaLinha(atual, linhaEditando.lineId, addons));
    setLinhaEditando(null);
  };

  const alterarQuantidade = (lineId: string, delta: number) => {
    setCarrinho((atual) => alterarQuantidadeLinha(atual, lineId, delta));
  };

  const removerItem = (lineId: string) => setCarrinho((atual) => removerLinha(atual, lineId));

  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  const totalPedidoCentavos = carrinho.reduce((soma, l) => soma + subtotalLinhaCentavos(l), 0);

  const abrirDadosCliente = () => {
    if (carrinho.length === 0) return;
    setErroDadosCliente("");
    setDadosClienteAberto(true);
  };

  const confirmarDadosCliente = () => {
    if (!nomeCliente.trim() || !telefoneCliente.trim()) {
      setErroDadosCliente("Informe seu nome e telefone para continuar.");
      return;
    }
    if (tipoEntrega === "entrega" && !enderecoEntrega.trim()) {
      setErroDadosCliente("Informe o endereço de entrega.");
      return;
    }
    if (tipoEntrega === "entrega" && !numeroEntrega.trim()) {
      setErroDadosCliente("Informe o número da residência.");
      return;
    }
    finalizarPedido();
  };

  const finalizarPedido = async () => {
    if (carrinho.length === 0) return;

    setEnviandoPedido(true);
    setErroPedido(null);

    try {
      // Backend não tem campo estruturado de entrega/endereço ainda — vai em "notes" (texto livre).
      const notes =
        tipoEntrega === "entrega"
          ? `Entrega — endereço: ${enderecoEntrega.trim()}, nº ${numeroEntrega.trim()}`
          : "Retirada no local";

      const pedido = await storefrontApi.createOrder(companyCode, {
        items: itemsParaPayload(carrinho),
        customerName: nomeCliente.trim(),
        customerPhone: telefoneCliente.trim(),
        notes,
      });

      setPedidoEnviado(pedido);
      setDadosClienteAberto(false);
      setCarrinho([]);
      setCarrinhoAberto(false);
      setNomeCliente("");
      setTelefoneCliente("");
      setEnderecoEntrega("");
      setNumeroEntrega("");
    } catch (err) {
      setErroPedido(tratarErroPedido(err));
    } finally {
      setEnviandoPedido(false);
    }
  };

  if (carregando) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 size={28} className="animate-spin text-brand" />
        <span className="text-sm">Carregando cardápio...</span>
      </div>
    );
  }

  if (erroCarregamento) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3 text-center px-6">
        <AlertTriangle size={32} className="text-amber-500" />
        <h1 className="text-lg font-semibold text-foreground">Estabelecimento não encontrado</h1>
        <p className="text-sm text-muted-foreground max-w-sm">{erroCarregamento}</p>
      </div>
    );
  }

  const nomeLoja = loja?.companyName || "Estabelecimento";
  const localizacao = loja?.companyLocation;
  const cidadeEstado = localizacao?.city
    ? `${localizacao.city}${localizacao.state ? ` · ${localizacao.state}` : ""}`
    : null;

  return (
    <div className={temaClaro ? "" : "dark"}>
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-brand text-brand-foreground flex items-center justify-center shrink-0 font-bold">
                {nomeLoja.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-brand">
                  Catálogo Digital
                </p>
                <h1 className="text-base font-bold tracking-tight text-foreground truncate">
                  {nomeLoja}
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

              <Button
                onClick={() => setCarrinhoAberto(true)}
                className="h-9 bg-brand text-brand-foreground hover:bg-brand/90"
              >
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

              {cidadeEstado && (
                <Badge
                  variant="outline"
                  className="bg-brand-foreground/15 border-transparent text-brand-foreground gap-1.5"
                >
                  <MapPin size={12} />
                  {cidadeEstado}
                </Badge>
              )}
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
            {categorias.map((cat) => (
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

          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={16}
            />
            <Input
              value={busca}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setBusca(e.target.value)}
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
                const temDesconto = produto.discountValue > 0;
                const precoFinalCentavos = precoItemComDescontoCentavos(
                  produto.priceCents,
                  produto.discountValue,
                  produto.discountType,
                );
                const temAddons = extrairAddons(produto).length > 0;

                return (
                  <div
                    key={produto.itemId}
                    className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-foreground leading-tight">
                          {produto.itemName}
                        </h3>
                        {produto.itemDescription && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {produto.itemDescription}
                          </p>
                        )}
                        {temAddons && (
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-brand mt-1">
                            Adicionais disponíveis
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-auto pt-2">
                      <div>
                        {temDesconto && (
                          <span className="text-xs text-muted-foreground line-through block">
                            {formatarMoeda(produto.priceCents)}
                          </span>
                        )}
                        <span className="text-lg font-bold text-brand">
                          {formatarMoeda(precoFinalCentavos)}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => aoClicarAdicionar(produto)}
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
                {nomeLoja.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{nomeLoja}</p>
                {cidadeEstado && <p className="text-xs text-muted-foreground">{cidadeEstado}</p>}
              </div>
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Powered by MesaFlow
            </p>
          </div>
        </footer>

        {/* Painel do carrinho */}
        {carrinhoAberto && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/40" onClick={() => setCarrinhoAberto(false)} />
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
                    {carrinho.map((item) => {
                      const produtoBase = produtos.find((p) => p.itemId === item.itemId);
                      const podeEditarAddons =
                        !!produtoBase && extrairAddons(produtoBase).length > 0;

                      return (
                      <div
                        key={item.lineId}
                        className="bg-muted/40 border border-border rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-sm font-medium text-foreground leading-tight">
                              {item.itemName}
                            </span>
                            {item.addons.length > 0 ? (
                              <span className="block text-[11px] text-muted-foreground mt-0.5">
                                + {item.addons.map((a) => a.ingredientName).join(", ")}
                              </span>
                            ) : podeEditarAddons ? (
                              <span className="block text-[11px] text-muted-foreground mt-0.5">
                                sem adicionais
                              </span>
                            ) : null}
                            {podeEditarAddons && (
                              <button
                                onClick={() => abrirEdicaoAddons(item)}
                                className="text-[11px] font-semibold text-brand hover:underline mt-1"
                              >
                                Editar adicionais
                              </button>
                            )}
                          </div>
                          <button
                            onClick={() => removerItem(item.lineId)}
                            className="text-muted-foreground hover:text-rose-500 transition shrink-0"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => alterarQuantidade(item.lineId, -1)}
                              className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-semibold text-foreground w-5 text-center">
                              {item.quantidade}
                            </span>
                            <button
                              onClick={() => alterarQuantidade(item.lineId, 1)}
                              className="size-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/70 transition"
                            >
                              <Plus size={12} />
                            </button>
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
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <ShoppingCart size={32} />
                    <span className="text-sm font-medium">Seu carrinho está vazio</span>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-border space-y-3 shrink-0">
                <AlertaErroPedido erro={erroPedido} tema="light" />

                <div className="flex justify-between font-bold text-base">
                  <span className="text-foreground">Total</span>
                  <span className="text-brand">{formatarMoeda(totalPedidoCentavos)}</span>
                </div>
                <Button
                  disabled={carrinho.length === 0 || enviandoPedido}
                  onClick={abrirDadosCliente}
                  className="w-full h-11 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
                >
                  {enviandoPedido && <Loader2 size={16} className="animate-spin" />}
                  {enviandoPedido ? "Enviando..." : "Continuar"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de dados do cliente, exigido antes do envio */}
        {dadosClienteAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setDadosClienteAberto(false)}
            />
            <div className="relative bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Seus dados</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Precisamos do seu nome e telefone para {nomeLoja} confirmar o pedido.
                </p>
              </div>

              {erroDadosCliente && (
                <div className="text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
                  {erroDadosCliente}
                </div>
              )}

              <AlertaErroPedido erro={erroPedido} tema="light" />

              <div className="space-y-3">
                <Input
                  value={nomeCliente}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNomeCliente(e.target.value)}
                  placeholder="Seu nome"
                  autoFocus
                />
                <Input
                  value={telefoneCliente}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTelefoneCliente(e.target.value)}
                  placeholder="Telefone com DDD"
                  inputMode="tel"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoEntrega("retirada")}
                    className={`h-10 rounded-lg text-sm font-semibold transition ${
                      tipoEntrega === "retirada"
                        ? "bg-brand text-brand-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    Retirar no local
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoEntrega("entrega")}
                    className={`h-10 rounded-lg text-sm font-semibold transition ${
                      tipoEntrega === "entrega"
                        ? "bg-brand text-brand-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    Entrega
                  </button>
                </div>

                {tipoEntrega === "entrega" && (
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <Input
                      value={enderecoEntrega}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setEnderecoEntrega(e.target.value)
                      }
                      placeholder="Rua e bairro"
                    />
                    <Input
                      value={numeroEntrega}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNumeroEntrega(e.target.value)}
                      placeholder="Número"
                      className="w-24"
                      inputMode="numeric"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDadosClienteAberto(false)}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
                  disabled={enviandoPedido}
                  onClick={confirmarDadosCliente}
                >
                  {enviandoPedido && <Loader2 size={16} className="animate-spin" />}
                  {enviandoPedido ? "Enviando..." : "Enviar Pedido"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Seletor de adicionais */}
        <SeletorAdicionais
          item={itemParaAddons}
          tema="light"
          onCancelar={() => setItemParaAddons(null)}
          onConfirmar={confirmarAddons}
        />

        {/* Edição de adicionais de uma linha já no carrinho */}
        <SeletorAdicionais
          item={linhaEditando?.item ?? null}
          tema="light"
          selecaoInicial={
            linhaEditando
              ? (carrinho
                  .find((l) => l.lineId === linhaEditando.lineId)
                  ?.addons.map((a) => a.ingredientId) ?? [])
              : undefined
          }
          onCancelar={() => setLinhaEditando(null)}
          onConfirmar={salvarEdicaoAddons}
        />

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
                Seu pedido no valor de{" "}
                <span className="font-semibold text-foreground">
                  {formatarMoeda(pedidoEnviado.totalCents)}
                </span>{" "}
                foi enviado para {nomeLoja}.
              </p>
              <Button
                onClick={() => setPedidoEnviado(null)}
                className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
              >
                Fechar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
