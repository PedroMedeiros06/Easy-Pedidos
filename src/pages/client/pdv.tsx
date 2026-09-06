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
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { catalogItemsApi } from "../../api/catalog";
import { ordersApi } from "../../api/orders";
import type { CatalogItem, DiscountType, Order } from "@/types/catalog";
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
  subtotalLinhaCentavos,
  itemsParaPayload,
} from "@/lib/carrinho";

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
  const [carregandoProdutos, setCarregandoProdutos] = useState(true);
  const [erroProdutos, setErroProdutos] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState<LinhaCarrinho[]>([]);
  const [itemParaAddons, setItemParaAddons] = useState<CatalogItem | null>(null);
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

      const itens = await catalogItemsApi.list();
      setProdutos(itens.filter((item) => item.active));
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
    if (!termo) return produtos;
    return produtos.filter((p) => p.itemName.toLowerCase().includes(termo));
  }, [produtos, busca]);

  // Se o produto tem adicionais, abre o seletor; senão adiciona direto.
  const aoClicarProduto = (produto: CatalogItem) => {
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

  const removerItem = (lineId: string) => {
    setCarrinho((atual) => removerLinha(atual, lineId));
  };

  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  const subtotalCentavos = carrinho.reduce((soma, l) => soma + subtotalLinhaCentavos(l), 0);
  const descontoDigitado = Number(String(desconto).replace(",", ".")) || 0;
  const descontoPedidoCentavos =
    tipoDesconto === "percentage" ? descontoDigitado : Math.round(descontoDigitado * 100);
  const valorDescontoCentavos =
    tipoDesconto === "percentage"
      ? subtotalCentavos * (Math.min(descontoDigitado, 100) / 100)
      : descontoPedidoCentavos;
  const totalCentavos = Math.max(subtotalCentavos - valorDescontoCentavos, 0);

  const finalizarVenda = async () => {
    if (carrinho.length === 0) return;

    setEnviandoVenda(true);
    setErroVenda(null);

    try {
      const pedido = await ordersApi.create({
        items: itemsParaPayload(carrinho),
        customerName: nomeCliente.trim() || undefined,
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
          <div className="p-4 border-b border-border shrink-0">
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
                  const temAddons = extrairAddons(produto).length > 0;

                  return (
                    <button
                      key={produto.itemId}
                      onClick={() => aoClicarProduto(produto)}
                      className="text-left bg-card border border-border rounded-xl p-4 hover:border-brand/50 hover:shadow-sm transition flex flex-col gap-2"
                    >
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {produto.categoryName || "Sem categoria"}
                      </span>
                      <span className="text-sm font-semibold text-foreground leading-tight">
                        {produto.itemName}
                      </span>
                      <div className="mt-auto">
                        {temDesconto && (
                          <span className="text-xs text-muted-foreground line-through block">
                            {formatarMoeda(produto.priceCents)}
                          </span>
                        )}
                        <span className="text-base font-bold text-brand">
                          {formatarMoeda(precoFinalCentavos)}
                        </span>
                        {temAddons && (
                          <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-0.5">
                            + adicionais
                          </span>
                        )}
                      </div>
                    </button>
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
                  const podeEditarAddons =
                    !!produtoBase && extrairAddons(produtoBase).length > 0;

                  return (
                  <div key={item.lineId} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-zinc-50 leading-tight">
                          {item.itemName}
                        </span>
                        {item.addons.length > 0 ? (
                          <span className="block text-[11px] text-zinc-400 mt-0.5">
                            + {item.addons.map((a) => a.ingredientName).join(", ")}
                          </span>
                        ) : podeEditarAddons ? (
                          <span className="block text-[11px] text-zinc-500 mt-0.5">
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
                          className="size-6 rounded-md bg-white/10 flex items-center justify-center text-zinc-300 hover:bg-white/20 transition"
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
                placeholder="Cliente Balcão"
                className="h-9 bg-white/5 border-white/10 text-zinc-50 placeholder:text-zinc-500"
              />
              <Input
                value={telefoneCliente}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setTelefoneCliente(e.target.value)}
                placeholder="Telefone opcional"
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

            <div className="text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{formatarMoeda(subtotalCentavos)}</span>
              </div>
              {valorDescontoCentavos > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>Desconto{tipoDesconto === "percentage" ? ` (${descontoDigitado}%)` : ""}</span>
                  <span>-{formatarMoeda(valorDescontoCentavos)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base mt-1">
                <span className="text-zinc-50">Total</span>
                <span className="text-brand">{formatarMoeda(totalCentavos)}</span>
              </div>
            </div>

            <Button
              disabled={carrinho.length === 0 || enviandoVenda}
              onClick={finalizarVenda}
              className="w-full h-11 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
            >
              {enviandoVenda && <Loader2 size={16} className="animate-spin" />}
              {enviandoVenda ? "Enviando..." : "Finalizar Venda"}
            </Button>
          </div>
        </div>
      </div>

      {/* Seletor de adicionais */}
      <SeletorAdicionais
        item={itemParaAddons}
        tema="dark"
        onCancelar={() => setItemParaAddons(null)}
        onConfirmar={confirmarAddons}
      />

      <SeletorAdicionais
        item={linhaEditando?.item ?? null}
        tema="dark"
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
