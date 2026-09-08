import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  AlertTriangle,
  ChevronDown,
  Store,
  ScanBarcode,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ordersApi } from "../../api/orders";
import {
  proximosStatusValidos,
  statusEhTerminal,
  type Order,
  type OrderOrigin,
  type OrderStatus,
} from "@/types/catalog";

interface StatusOpcao {
  valor: OrderStatus;
  rotulo: string;
  cor: string;
}

const STATUS_OPCOES: StatusOpcao[] = [
  { valor: "pending", rotulo: "Pendente", cor: "text-amber-500 border-amber-500/0 bg-amber-500/10" },
  { valor: "confirmed", rotulo: "Confirmado", cor: "text-sky-500 border-sky-500/20 bg-sky-500/10" },
  { valor: "preparing", rotulo: "Preparando", cor: "text-violet-500 border-violet-500/20 bg-violet-500/10" },
  { valor: "ready", rotulo: "Pronto", cor: "text-teal-500 border-teal-500/20 bg-teal-500/10" },
  { valor: "completed", rotulo: "Concluído", cor: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" },
  { valor: "cancelled", rotulo: "Cancelado", cor: "text-rose-500 border-rose-500/20 bg-rose-500/10" },
];

// Status que ganham card de contagem no topo — os 4 estados operacionais mais úteis no balcão.
const CARDS_STATUS: OrderStatus[] = ["pending", "preparing", "ready", "completed"];

function statusInfo(status: OrderStatus | string): { rotulo: string; cor: string } {
  return (
    STATUS_OPCOES.find((s) => s.valor === status) || {
      rotulo: String(status),
      cor: "text-muted-foreground border-border bg-muted",
    }
  );
}

function rotuloStatus(status: OrderStatus): string {
  return STATUS_OPCOES.find((s) => s.valor === status)?.rotulo ?? status;
}

function formatarMoeda(centavos: number | null | undefined): string {
  return ((centavos || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso: string | null | undefined): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

type FiltroOrigem = OrderOrigin | "todos";
type FiltroStatus = OrderStatus | "todos";

export default function ClientPedidos() {
  const [pedidos, setPedidos] = useState<Order[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [filtroOrigem, setFiltroOrigem] = useState<FiltroOrigem>("todos");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
  const [limite, setLimite] = useState(50);

  const [expandido, setExpandido] = useState<string | null>(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState<string | null>(null);
  // Erro de transição de status — inline, não derruba a lista (diferente de `erro`, que é falha de carregamento).
  const [erroStatus, setErroStatus] = useState<string | null>(null);

  const buscarPedidos = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const dados = await ordersApi.list({
        origin: filtroOrigem === "todos" ? undefined : filtroOrigem,
        status: filtroStatus === "todos" ? undefined : filtroStatus,
        limit: limite,
      });
      setPedidos(dados);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao buscar pedidos.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroOrigem, filtroStatus, limite]);

  const alterarStatus = async (pedido: Order, novoStatus: OrderStatus) => {
    if (novoStatus === pedido.status) return;
    setAtualizandoStatus(pedido.orderId);
    setErroStatus(null);
    try {
      const atualizado = await ordersApi.updateStatus(pedido.orderId, novoStatus);
      setPedidos((atual) =>
        atual.map((p) => (p.orderId === pedido.orderId ? { ...p, ...atualizado } : p)),
      );
    } catch (err) {
      // Não mexe em `erro` — a lista continua na tela, só mostra um aviso inline.
      setErroStatus(err instanceof Error ? err.message : "Falha ao atualizar status.");
    } finally {
      setAtualizandoStatus(null);
    }
  };

  // Contagem por status dos pedidos carregados (respeita os filtros de origem/limite,
  // mas não o filtro de status — os cards são o próprio atalho pra filtrar por status).
  const contagemStatus = useMemo(() => {
    const base: Record<OrderStatus, number> = {
      pending: 0,
      confirmed: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const p of pedidos) {
      if (p.status in base) base[p.status] += 1;
    }
    return base;
  }, [pedidos]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pedidos do PDV e da vitrine pública, tudo em um só lugar.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {CARDS_STATUS.map((s) => {
          const info = statusInfo(s);
          const ativo = filtroStatus === s;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFiltroStatus(ativo ? "todos" : s)}
              className={`text-left rounded-xl border p-4 transition ${
                ativo
                  ? "border-brand ring-1 ring-brand bg-brand/5"
                  : "border-border bg-card hover:border-brand/40"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${info.cor.split(" ").find((c) => c.startsWith("bg-")) ?? "bg-muted"}`} />
                <p className="text-xs text-muted-foreground">{info.rotulo}</p>
              </div>
              <p className="text-2xl font-bold text-foreground mt-1">
                {contagemStatus[s]}
                <span className="text-xs font-normal text-muted-foreground ml-1">
                  {contagemStatus[s] === 1 ? "pedido" : "pedidos"}
                </span>
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filtroOrigem} onValueChange={(v: string) => setFiltroOrigem(v as FiltroOrigem)}>
          <SelectTrigger className="h-9! w-44">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as origens</SelectItem>
            <SelectItem value="pdv">PDV</SelectItem>
            <SelectItem value="storefront">Vitrine</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroStatus} onValueChange={(v: string) => setFiltroStatus(v as FiltroStatus)}>
          <SelectTrigger className="h-9! w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {STATUS_OPCOES.map((s) => (
              <SelectItem key={s.valor} value={s.valor}>
                {s.rotulo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(limite)} onValueChange={(v: string) => setLimite(Number(v))}>
          <SelectTrigger className="h-9! w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="50">50 pedidos</SelectItem>
            <SelectItem value="100">100 pedidos</SelectItem>
            <SelectItem value="200">200 pedidos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {carregando ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 size={24} className="animate-spin text-brand" />
            <span className="text-sm">Buscando pedidos...</span>
          </CardContent>
        </Card>
      ) : erro ? (
        <Card>
          <CardContent className="p-8 flex flex-col items-center justify-center gap-2 text-center">
            <AlertTriangle size={32} className="text-amber-500 mb-1" />
            <h3 className="text-sm font-semibold text-foreground">Algo deu errado</h3>
            <p className="text-xs text-muted-foreground max-w-xs">{erro}</p>
            <Button variant="outline" size="sm" onClick={buscarPedidos} className="mt-3">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : pedidos.length === 0 ? (
        <Card>
          <CardContent className="p-12 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <Package size={32} />
            <span className="text-sm font-medium">Nenhum pedido encontrado</span>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {erroStatus && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-xs text-rose-600">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              <span className="flex-1">{erroStatus}</span>
              <button
                onClick={() => setErroStatus(null)}
                className="shrink-0 font-medium hover:underline"
              >
                Fechar
              </button>
            </div>
          )}
          {pedidos.map((pedido) => {
            const aberto = expandido === pedido.orderId;
            const info = statusInfo(pedido.status);
            const terminal = statusEhTerminal(pedido.status);
            const proximos = proximosStatusValidos(pedido.status);
            return (
              <Card key={pedido.orderId} className="overflow-hidden py-0 gap-0">
                <button
                  onClick={() => setExpandido(aberto ? null : pedido.orderId)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition"
                >
                  <div className="size-9 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                    {pedido.origin === "pdv" ? <ScanBarcode size={16} /> : <Store size={16} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {pedido.customerName || "Cliente não identificado"}
                      </span>
                      <Badge variant="outline" className="text-[10px] py-0">
                        {pedido.origin === "pdv" ? "PDV" : "Vitrine"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatarData(pedido.createdAt)} · {pedido.items?.length || 0} item(ns)
                    </p>
                  </div>

                  <Badge variant="outline" className={`gap-1.5 shrink-0 ${info.cor}`}>
                    {info.rotulo}
                  </Badge>

                  <span className="text-sm font-bold text-foreground w-24 text-right shrink-0">
                    {formatarMoeda(pedido.totalCents)}
                  </span>

                  <ChevronDown
                    size={16}
                    className={`text-muted-foreground shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`}
                  />
                </button>

                {aberto && (
                  <div className="border-t border-border p-4 space-y-3 bg-muted/20">
                    <div className="space-y-1.5">
                      {pedido.items?.map((item) => (
                        <div key={item.orderItemId} className="text-sm">
                          <div className="flex justify-between">
                            <span className="text-foreground">
                              {item.quantity}x {item.itemName}
                            </span>
                            <span className="text-muted-foreground">
                              {formatarMoeda(item.totalCents)}
                            </span>
                          </div>
                          {item.addons && item.addons.length > 0 && (
                            <p className="text-[11px] text-muted-foreground pl-4">
                              + {item.addons.map((a) => a.ingredientName).join(", ")}
                            </p>
                          )}
                          {item.removed && item.removed.length > 0 && (
                            <p className="text-[11px] text-rose-500 pl-4">
                              sem {item.removed.map((r) => r.ingredientName).join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    <div className="text-sm space-y-1 pt-2 border-t border-border">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span>
                        <span>{formatarMoeda(pedido.subtotalCents)}</span>
                      </div>
                      {pedido.discountValue > 0 && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Desconto</span>
                          <span>
                            -{pedido.discountType === "percentage" ? `${pedido.discountValue}%` : formatarMoeda(pedido.discountValue)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-foreground">
                        <span>Total</span>
                        <span className="text-brand">{formatarMoeda(pedido.totalCents)}</span>
                      </div>
                    </div>

                    {pedido.notes && (
                      <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                        {pedido.notes}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-border gap-2 flex-wrap">
                      <div className="text-xs text-muted-foreground space-x-3">
                        {pedido.customerPhone && <span>Tel: {pedido.customerPhone}</span>}
                        {pedido.paymentMethod && <span>Pagamento: {pedido.paymentMethod}</span>}
                      </div>

                      {terminal ? (
                        <Badge variant="outline" className={`gap-1.5 shrink-0 ${info.cor}`}>
                          {info.rotulo} · finalizado
                        </Badge>
                      ) : (
                        <Select
                          // Não vinculado ao status do pedido: é um menu de ação ("mudar para..."),
                          // não um espelho do estado. `value` fixo vazio evita o bug do base-ui
                          // que emite string vazia quando o item selecionado está disabled.
                          value=""
                          onValueChange={(v: unknown) => {
                            if (typeof v === "string" && v) {
                              alterarStatus(pedido, v as OrderStatus);
                            }
                          }}
                          disabled={atualizandoStatus === pedido.orderId}
                        >
                          <SelectTrigger className="h-8! w-44 text-xs">
                            {atualizandoStatus === pedido.orderId ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <span className="text-muted-foreground">Mudar status…</span>
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            {proximos.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s === "cancelled" ? "Cancelar pedido" : `Avançar para ${rotuloStatus(s)}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
