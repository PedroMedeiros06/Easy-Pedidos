import { Building2, Users, DollarSign, Activity, BarChart3 } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const kpis = [
  { label: "Estabelecimentos ativos", icon: Building2 },
  { label: "Membros de equipe", icon: Users },
  { label: "Faturamento (MRR)", icon: DollarSign },
  { label: "Pedidos hoje", icon: Activity },
];

export default function DashboardAdmin() {
  return (
    <div className="space-y-7">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Painel Master</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral da plataforma
          </p>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-lg text-xs font-semibold text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-500" />
          Sistemas operacionais normais
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, icon: Icon }) => (
          <Card key={label} className="gap-3">
            <CardHeader className="flex-row items-start justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {label}
              </span>
              <div className="p-1.5 bg-brand/10 text-brand rounded-lg">
                <Icon size={14} />
              </div>
            </CardHeader>
            <CardContent>
              <span className="text-sm font-medium text-muted-foreground/70">
                Sem dados ainda
              </span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="flex-1 min-h-80 items-center justify-center text-center">
        <CardContent className="flex flex-col items-center gap-3 max-w-sm mx-auto">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-base font-semibold text-foreground">Métricas ainda não conectadas</h3>
          <p className="text-sm text-muted-foreground">
            Assim que os endpoints da plataforma estiverem disponíveis, os dados de
            faturamento, adesão e atividade aparecerão aqui.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
