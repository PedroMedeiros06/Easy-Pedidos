import { useEffect, useState } from "react";
import {
  Building2,
  Users,
  DollarSign,
  Activity,
  BarChart3,
  Ban,
  XCircle,
  Ticket,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { dashboardApi, type AdminDashboardOverview } from "../../api/dashboard";

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarNumero(n: number): string {
  return n.toLocaleString("pt-BR");
}

export default function DashboardAdmin() {
  const [dados, setDados] = useState<AdminDashboardOverview | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const buscar = async () => {
    try {
      setCarregando(true);
      setErro(null);
      setDados(await dashboardApi.overview());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao carregar o painel.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscar();
  }, []);

  const kpis = dados
    ? [
        {
          label: "Estabelecimentos ativos",
          valor: formatarNumero(dados.companies.active),
          nota: `${formatarNumero(dados.companies.total)} no total`,
          icon: Building2,
        },
        {
          label: "Bloqueados",
          valor: formatarNumero(dados.companies.blocked),
          nota: dados.companies.blocked > 0 ? "requer atenção" : "nenhum",
          icon: Ban,
        },
        {
          label: "Membros de equipe",
          valor: formatarNumero(dados.members.total),
          nota: "em todos os estabelecimentos",
          icon: Users,
        },
        {
          label: "Pedidos (não cancelados)",
          valor: formatarNumero(dados.orders.total),
          nota: `${formatarNumero(dados.orders.last30Days)} nos últimos 30 dias`,
          icon: Activity,
        },
        {
          label: "Pedidos cancelados",
          valor: formatarNumero(dados.orders.cancelled),
          nota: "todos os tempos",
          icon: XCircle,
        },
        {
          label: "Receita total",
          valor: formatarMoeda(dados.revenue.totalCents),
          nota: "pedidos não cancelados",
          icon: DollarSign,
        },
        {
          label: "Receita (30 dias)",
          valor: formatarMoeda(dados.revenue.last30DaysCents),
          nota: "janela móvel",
          icon: BarChart3,
        },
        {
          label: "Ticket médio",
          valor: formatarMoeda(dados.revenue.averageTicketCents),
          nota: "receita / pedidos",
          icon: Ticket,
        },
      ]
    : [];

  return (
    <div className="space-y-7">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel Master</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão geral da plataforma</p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-lg text-xs font-semibold text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Sistemas operacionais normais
        </div>
      </div>

      {carregando ? (
        <Card className="min-h-60 items-center justify-center">
          <CardContent className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 size={24} className="animate-spin text-brand" />
            <span className="text-sm">Carregando métricas...</span>
          </CardContent>
        </Card>
      ) : erro ? (
        <Card className="min-h-60 items-center justify-center">
          <CardContent className="flex flex-col items-center gap-2 text-center max-w-sm">
            <AlertTriangle size={28} className="text-amber-500 mb-1" />
            <h3 className="text-sm font-semibold text-foreground">Não foi possível carregar</h3>
            <p className="text-xs text-muted-foreground">{erro}</p>
            <Button variant="outline" size="sm" onClick={buscar} className="mt-3">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(({ label, valor, nota, icon: Icon }) => (
              <Card key={label} className="gap-3">
                <CardHeader className="flex-row items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </span>
                  <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                    <Icon size={14} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-0.5">
                  <span className="block text-xl font-bold text-foreground">{valor}</span>
                  <span className="block text-[11px] text-muted-foreground">{nota}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="py-6 text-center">
              <p className="text-xs text-muted-foreground">
                Série temporal (evolução diária de pedidos e receita) ainda não disponível no
                backend — aqui ficam só os totais e a janela de 30 dias.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
