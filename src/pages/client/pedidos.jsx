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

const STATUS_OPCOES = [
  { valor: "pending", rotulo: "Pendente", cor: "text-amber-500 border-amber-500/20 bg-amber-500/10" },
  { valor: "confirmed", rotulo: "Confirmado", cor: "text-sky-500 border-sky-500/20 bg-sky-500/10" },
  { valor: "preparing", rotulo: "Preparando", cor: "text-violet-500 border-violet-500/20 bg-violet-500/10" },
  { valor: "ready", rotulo: "Pronto", cor: "text-teal-500 border-teal-500/20 bg-teal-500/10" },
  { valor: "completed", rotulo: "Concluído", cor: "text-emerald-500 border-emerald-500/20 bg-emerald-500/10" },
  { valor: "cancelled", rotulo: "Cancelado", cor: "text-rose-500 border-rose-500/20 bg-rose-500/10" },
];

function statusInfo(status) {
  return STATUS_OPCOES.find((s) => s.valor === status) || { rotulo: status, cor: "text-muted-foreground border-border bg-muted" };
}

function formatarMoeda(centavos) {
  return ((centavos || 0) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(iso) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function ClientPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [filtroOrigem, setFiltroOrigem] = useState("todos");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [limite, setLimite] = useState(50);

  const [expandido, setExpandido] = useState(null);
  const [atualizandoStatus, setAtualizandoStatus] = useState(null);

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
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarPedidos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtroOrigem, filtroStatus, limite]);

  const alterarStatus = async (pedido, novoStatus) => {
    if (novoStatus === pedido.status) return;
    setAtualizandoStatus(pedido.orderId);
    try {
      await ordersApi.updateStatus(pedido.orderId, novoStatus);
      setPedidos((atual) =>
        atual.map((p) => (p.orderId === pedido.orderId ? { ...p, status: novoStatus } : p)),
      );
    } catch (err) {
      setErro(err.message);
    } finally {
      setAtualizandoStatus(null);
    }
  };

  const resumo = useMemo(() => {
    const hoje = new Date().toDateString();
    const doDia = pedidos.filter((p) => new Date(p.createdAt).toDateString() === hoje);
    const faturamentoHoje = doDia
      .filter((p) => p.status !== "cancelled")
      .reduce((soma, p) => soma + (p.totalCents || 0), 0);
    return { totalDia: doDia.length, faturamentoHoje };
  }, [pedidos]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pedidos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Pedidos do PDV e da vitrine pública, tudo em um só lugar.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 max-w-md">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Pedidos hoje</p>
            <p className="text-2xl font-bold text-foreground mt-1">{resumo.totalDia}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Faturamento hoje</p>
            <p className="text-2xl font-bold text-brand mt-1">{formatarMoeda(resumo.faturamentoHoje)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={filtroOrigem} onValueChange={setFiltroOrigem}>
          <SelectTrigger className="h-9! w-44">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as origens</SelectItem>
            <SelectItem value="pdv">PDV</SelectItem>
            <SelectItem value="storefront">Vitrine</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
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

        <Select value={String(limite)} onValueChange={(v) => setLimite(Number(v))}>
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
            <h3 className="text-sm font-semibold text-foreground">Falha na conexão</h3>
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
          {pedidos.map((pedido) => {
            const aberto = expandido === pedido.orderId;
            const info = statusInfo(pedido.status);
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
                        <div key={item.orderItemId} className="flex justify-between text-sm">
                          <span className="text-foreground">
                            {item.quantity}x {item.itemName}
                          </span>
                          <span className="text-muted-foreground">{formatarMoeda(item.totalCents)}</span>
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

                      <Select
                        value={pedido.status}
                        onValueChange={(v) => alterarStatus(pedido, v)}
                        disabled={atualizandoStatus === pedido.orderId}
                      >
                        <SelectTrigger className="h-8! w-40 text-xs">
                          {atualizandoStatus === pedido.orderId ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <SelectValue />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPCOES.map((s) => (
                            <SelectItem key={s.valor} value={s.valor}>
                              {s.rotulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
