import { useCallback, useEffect, useRef, useState } from "react";
import {
  Activity,
  RefreshCw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Server,
  Layers,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { healthApi, type HealthReport, type HealthCheck, type HealthGroup } from "../../api/dashboard";

const AUTO_REFRESH_MS = 30_000;

function corLatencia(ms: number): string {
  if (ms <= 150) return "text-emerald-500";
  if (ms <= 500) return "text-amber-500";
  return "text-rose-500";
}

function formatarHora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

const GRUPOS: { chave: HealthGroup; titulo: string; icon: typeof Server }[] = [
  { chave: "infra", titulo: "Infraestrutura", icon: Server },
  { chave: "area", titulo: "Áreas da API", icon: Layers },
];

function LinhaCheck({ check }: { check: HealthCheck }) {
  const down = check.status === "down";
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0">
      {down ? (
        <XCircle size={16} className="text-rose-500 shrink-0" />
      ) : (
        <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <span className="text-sm font-medium text-foreground">{check.service}</span>
        {down && check.error && (
          <p className="text-[11px] text-rose-500 mt-0.5 truncate" title={check.error}>
            {check.error}
          </p>
        )}
      </div>
      <span className={`text-xs font-semibold tabular-nums shrink-0 ${corLatencia(check.latencyMs)}`}>
        {check.latencyMs} ms
      </span>
    </div>
  );
}

export default function StatusSistema() {
  const [relatorio, setRelatorio] = useState<HealthReport | null>(null);
  const [carregandoInicial, setCarregandoInicial] = useState(true);
  const [retestando, setRetestando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const buscar = useCallback(async (inicial: boolean) => {
    if (inicial) setCarregandoInicial(true);
    else setRetestando(true);
    setErro(null);
    try {
      setRelatorio(await healthApi.get());
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível contatar a API.");
    } finally {
      setCarregandoInicial(false);
      setRetestando(false);
    }
  }, []);

  useEffect(() => {
    buscar(true);
  }, [buscar]);

  // Auto-refresh: só enquanto o toggle está ligado E a aba está visível.
  useEffect(() => {
    if (!auto) {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    const tick = () => {
      if (document.visibilityState === "visible") buscar(false);
    };
    intervalRef.current = window.setInterval(tick, AUTO_REFRESH_MS);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [auto, buscar]);

  const degradado = relatorio?.status === "degraded";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Activity size={22} className="text-brand" />
            Status do Sistema
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Disponibilidade e latência de cada parte da API.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              type="checkbox"
              checked={auto}
              onChange={(e) => setAuto(e.target.checked)}
              className="accent-brand"
            />
            Atualizar a cada 30s
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => buscar(false)}
            disabled={retestando || carregandoInicial}
          >
            {retestando ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Testar novamente
          </Button>
        </div>
      </div>

      {carregandoInicial ? (
        <Card className="min-h-60 items-center justify-center">
          <CardContent className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 size={24} className="animate-spin text-brand" />
            <span className="text-sm">Verificando serviços...</span>
          </CardContent>
        </Card>
      ) : erro ? (
        <Card className="min-h-60 items-center justify-center border-rose-500/30">
          <CardContent className="flex flex-col items-center gap-2 text-center max-w-sm">
            <AlertTriangle size={28} className="text-rose-500 mb-1" />
            <h3 className="text-sm font-semibold text-foreground">
              Não foi possível contatar a API
            </h3>
            <p className="text-xs text-muted-foreground">{erro}</p>
            <Button variant="outline" size="sm" onClick={() => buscar(false)} className="mt-3">
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : relatorio ? (
        <>
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`size-2.5 rounded-full ${
                    degradado ? "bg-rose-500" : "bg-emerald-500"
                  }`}
                />
                <span className="text-sm font-semibold text-foreground">
                  {degradado ? "Sistema degradado" : "Operacional"}
                </span>
                <Badge
                  variant="outline"
                  className={
                    degradado
                      ? "text-rose-500 border-rose-500/20 bg-rose-500/10"
                      : "text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
                  }
                >
                  {relatorio.status}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">
                Última verificação: {formatarHora(relatorio.checkedAt)}
              </span>
            </CardHeader>
          </Card>

          {GRUPOS.map(({ chave, titulo, icon: Icon }) => {
            const doGrupo = relatorio.checks.filter((c) => c.group === chave);
            if (doGrupo.length === 0) return null;
            return (
              <div key={chave} className="space-y-2">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  <Icon size={13} />
                  {titulo}
                </div>
                <Card className="py-0 overflow-hidden">
                  <CardContent className="p-0">
                    {doGrupo.map((c) => (
                      <LinhaCheck key={c.service} check={c} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })}

          {/* Checks de grupo desconhecido (backend pode adicionar novos) — não deixa sumir. */}
          {(() => {
            const conhecidos = new Set<string>(GRUPOS.map((g) => g.chave));
            const outros = relatorio.checks.filter((c) => !conhecidos.has(c.group));
            if (outros.length === 0) return null;
            return (
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  Outros
                </div>
                <Card className="py-0 overflow-hidden">
                  <CardContent className="p-0">
                    {outros.map((c) => (
                      <LinhaCheck key={c.service} check={c} />
                    ))}
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </>
      ) : null}
    </div>
  );
}
