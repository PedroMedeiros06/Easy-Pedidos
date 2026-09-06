import { useState } from "react";
import { ExternalLink, Copy, Check, Store, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ClientDashboard() {
  let company = null;
  try {
    company = JSON.parse(localStorage.getItem("@App:company") || "null");
  } catch {
    company = null;
  }

  const [copiado, setCopiado] = useState(false);

  // company vem de POST /auth/login em snake_case: { company_id, company_code, company_name }.
  const companyCode = company?.company_code || null;
  const linkCatalogo = companyCode ? `${window.location.origin}/loja/${companyCode}` : null;

  const copiarLink = async () => {
    if (!linkCatalogo) return;
    try {
      await navigator.clipboard.writeText(linkCatalogo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // Clipboard indisponível — ignora silenciosamente, o link já está visível no campo.
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Bem-vindo{company?.company_name ? `, ${company.company_name}` : ""}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Painel do estabelecimento em construção.
        </p>
      </div>

      {!companyCode ? (
        <div className="max-w-lg bg-card border border-border rounded-2xl p-6 flex items-start gap-3">
          <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-foreground">Link da vitrine indisponível</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Não encontramos o código do seu estabelecimento nesta sessão. Saia e entre novamente
              para atualizar seus dados.
            </p>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl bg-brand p-7 max-w-lg">
          <div
            className="absolute -top-10 -right-10 size-40 rounded-full bg-brand-foreground/10"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-16 -right-4 size-52 rounded-full bg-brand-foreground/5"
            aria-hidden="true"
          />

          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <Badge className="bg-brand-foreground text-brand hover:bg-brand-foreground gap-1.5">
                Catálogo Ativo
              </Badge>
              <a
                href={linkCatalogo}
                target="_blank"
                rel="noreferrer"
                className="text-brand-foreground/70 hover:text-brand-foreground transition"
              >
                <ExternalLink size={18} />
              </a>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-foreground/70">
                Sua vitrine digital
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight text-brand-foreground leading-[1.1] mt-1">
                Seus produtos prontos para vender.
              </h2>
            </div>

            <p className="text-sm text-brand-foreground/80 max-w-sm">
              Compartilhe seu link e deixe o cliente navegar, escolher e enviar o pedido de forma
              organizada.
            </p>

            <div className="flex items-center gap-2 bg-brand-foreground/15 rounded-xl p-1.5 pl-4">
              <span className="flex-1 text-sm font-medium text-brand-foreground truncate font-mono">
                {linkCatalogo}
              </span>
              <button
                onClick={copiarLink}
                title="Copiar link"
                className="shrink-0 size-9 rounded-lg bg-brand-foreground text-brand flex items-center justify-center hover:opacity-90 transition"
              >
                {copiado ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>

            <Button
              render={<a href={linkCatalogo} target="_blank" rel="noreferrer" />}
              className="w-full h-11 bg-brand-foreground text-brand hover:bg-brand-foreground/90 font-semibold"
            >
              <Store size={16} />
              Abrir Catálogo
              <ExternalLink size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
