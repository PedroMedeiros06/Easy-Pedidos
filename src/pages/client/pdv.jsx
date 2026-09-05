import { useMemo, useState } from "react";
import { Search, ShoppingCart, ScanBarcode, Trash2, Minus, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// TODO: trocar por chamada real ao catálogo quando o endpoint existir.
const PRODUTOS_EXEMPLO = [
  { id: "1", nome: "X-Burger Clássico", preco: 24.9, categoria: "Lanches" },
  { id: "2", nome: "X-Salada", preco: 26.9, categoria: "Lanches" },
  { id: "3", nome: "X-Bacon", preco: 29.9, categoria: "Lanches" },
  { id: "4", nome: "Batata Frita P", preco: 12.0, categoria: "Acompanhamentos" },
  { id: "5", nome: "Batata Frita G", preco: 18.0, categoria: "Acompanhamentos" },
  { id: "6", nome: "Coca-Cola Lata", preco: 6.5, categoria: "Bebidas" },
  { id: "7", nome: "Suco Natural", preco: 9.0, categoria: "Bebidas" },
  { id: "8", nome: "Água Mineral", preco: 4.0, categoria: "Bebidas" },
];

const FORMAS_PAGAMENTO = [
  { valor: "dinheiro", rotulo: "Dinheiro" },
  { valor: "pix", rotulo: "PIX" },
  { valor: "credito", rotulo: "Crédito" },
  { valor: "debito", rotulo: "Débito" },
];

function formatarMoeda(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ClientPdv() {
  const [busca, setBusca] = useState("");
  const [carrinho, setCarrinho] = useState([]);
  const [formaPagamento, setFormaPagamento] = useState("dinheiro");
  const [nomeCliente, setNomeCliente] = useState("Cliente Balcão");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [desconto, setDesconto] = useState("");
  const [tipoDesconto, setTipoDesconto] = useState("valor"); // "valor" (R$) ou "percentual" (%)
  const [valorRecebido, setValorRecebido] = useState("");

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return PRODUTOS_EXEMPLO;
    return PRODUTOS_EXEMPLO.filter((p) => p.nome.toLowerCase().includes(termo));
  }, [busca]);

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

  const removerItem = (id) => {
    setCarrinho((atual) => atual.filter((item) => item.id !== id));
  };

  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
  const subtotal = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  const descontoDigitado = Number(desconto.replace(",", ".")) || 0;
  const valorDesconto =
    tipoDesconto === "percentual" ? subtotal * (Math.min(descontoDigitado, 100) / 100) : descontoDigitado;
  const total = Math.max(subtotal - valorDesconto, 0);

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

        <Badge variant="outline" className="gap-1.5 text-emerald-500 border-emerald-500/20 bg-emerald-500/10">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Leitor Ativo
        </Badge>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Coluna de produtos */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-4 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, SKU ou código..."
                className="pl-9 h-11"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {produtosFiltrados.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {produtosFiltrados.map((produto) => (
                  <button
                    key={produto.id}
                    onClick={() => adicionarAoCarrinho(produto)}
                    className="text-left bg-card border border-border rounded-xl p-4 hover:border-brand/50 hover:shadow-sm transition flex flex-col gap-2"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {produto.categoria}
                    </span>
                    <span className="text-sm font-semibold text-foreground leading-tight">
                      {produto.nome}
                    </span>
                    <span className="text-base font-bold text-brand mt-auto">
                      {formatarMoeda(produto.preco)}
                    </span>
                  </button>
                ))}
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
                {carrinho.map((item) => (
                  <div key={item.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-zinc-50 leading-tight">{item.nome}</span>
                      <button
                        onClick={() => removerItem(item.id)}
                        className="text-zinc-500 hover:text-rose-400 transition shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alterarQuantidade(item.id, -1)}
                          className="size-6 rounded-md bg-white/10 flex items-center justify-center text-zinc-300 hover:bg-white/20 transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-semibold text-zinc-50 w-5 text-center">
                          {item.quantidade}
                        </span>
                        <button
                          onClick={() => alterarQuantidade(item.id, 1)}
                          className="size-6 rounded-md bg-white/10 flex items-center justify-center text-zinc-300 hover:bg-white/20 transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-brand">
                        {formatarMoeda(item.preco * item.quantidade)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                <ShoppingCart size={32} />
                <span className="text-sm font-medium">Carrinho vazio</span>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/10 space-y-3 shrink-0">
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={nomeCliente}
                onChange={(e) => setNomeCliente(e.target.value)}
                placeholder="Cliente Balcão"
                className="h-9 bg-white/5 border-white/10 text-zinc-50 placeholder:text-zinc-500"
              />
              <Input
                value={telefoneCliente}
                onChange={(e) => setTelefoneCliente(e.target.value)}
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

            <div className="grid grid-cols-2 gap-2">
              <div className="flex h-9 rounded-md border border-white/10 bg-white/5 overflow-hidden focus-within:ring-1 focus-within:ring-ring">
                <Input
                  value={desconto}
                  onChange={(e) => setDesconto(e.target.value)}
                  placeholder="Desconto"
                  className="h-9 flex-1 min-w-0 border-0 bg-transparent text-zinc-50 placeholder:text-zinc-500 focus-visible:ring-0 rounded-none"
                />
                <div className="flex shrink-0 border-l border-white/10">
                  <button
                    type="button"
                    onClick={() => setTipoDesconto("valor")}
                    title="Desconto em reais"
                    className={`px-2 text-xs font-semibold transition ${
                      tipoDesconto === "valor"
                        ? "bg-brand text-brand-foreground"
                        : "text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    R$
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoDesconto("percentual")}
                    title="Desconto em porcentagem"
                    className={`px-2 text-xs font-semibold transition border-l border-white/10 ${
                      tipoDesconto === "percentual"
                        ? "bg-brand text-brand-foreground"
                        : "text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>

              <Input
                value={valorRecebido}
                onChange={(e) => setValorRecebido(e.target.value)}
                placeholder="Valor recebido"
                className="h-9 bg-white/5 border-white/10 text-zinc-50 placeholder:text-zinc-500"
              />
            </div>

            <div className="text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{formatarMoeda(subtotal)}</span>
              </div>
              {valorDesconto > 0 && (
                <div className="flex justify-between text-zinc-400">
                  <span>
                    Desconto{tipoDesconto === "percentual" ? ` (${descontoDigitado}%)` : ""}
                  </span>
                  <span>-{formatarMoeda(valorDesconto)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base mt-1">
                <span className="text-zinc-50">Total</span>
                <span className="text-brand">{formatarMoeda(total)}</span>
              </div>
            </div>

            <Button
              disabled={carrinho.length === 0}
              className="w-full h-11 bg-brand text-brand-foreground hover:bg-brand/90 font-semibold"
            >
              Finalizar Venda
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
