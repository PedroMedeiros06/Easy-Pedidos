import { AlertTriangle, PackageX, Info } from "lucide-react";
import type { ErroPedidoTratado } from "@/lib/erros_pedido";

interface Props {
  erro: ErroPedidoTratado | null;
  tema?: "dark" | "light";
}

// Alerta padronizado pros erros de finalização de pedido (PDV e vitrine).
export default function AlertaErroPedido({ erro, tema = "light" }: Props) {
  if (!erro) return null;

  const escuro = tema === "dark";
  const Icone = erro.categoria === "estoque" ? PackageX : erro.categoria === "generico" ? Info : AlertTriangle;

  const wrap = escuro
    ? "bg-rose-500/10 border-rose-500/30 text-rose-100"
    : "bg-rose-500/10 border-rose-500/20 text-rose-600";
  const acaoCls = escuro ? "text-rose-200/80" : "text-rose-600/80";

  return (
    <div className={`rounded-lg border px-3 py-2.5 space-y-1 ${wrap}`}>
      <div className="flex items-start gap-2">
        <Icone size={15} className="mt-0.5 shrink-0" />
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-semibold leading-tight">{erro.titulo}</p>
          <p className="text-xs leading-snug opacity-90">{erro.detalhe}</p>
          {erro.acao && <p className={`text-[11px] leading-snug ${acaoCls}`}>{erro.acao}</p>}
        </div>
      </div>
    </div>
  );
}
