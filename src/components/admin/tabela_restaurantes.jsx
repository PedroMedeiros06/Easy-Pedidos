import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, ShieldAlert, MoreVertical, MessageSquare, Edit3, Ban, AlertCircle, Users } from "lucide-react";
import { companyApi } from "../../api/base/company";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TabelaRestaurantes({ restaurantes, setRestaurantes, onActionSuccess, onEditarClick }) {
  const navigate = useNavigate();
  const [processandoId, setProcessandoId] = useState(null);

  const tratarBloqueio = async (id, estaBloqueado, motivoAtual) => {
    const acaoTexto = estaBloqueado ? "liberação" : "bloqueio";
    const motivo = prompt(`Digite o motivo da ${acaoTexto} (opcional):`, estaBloqueado ? "" : motivoAtual || "");
    if (motivo === null) return;

    const novoBlocked = !estaBloqueado;

    try {
      setProcessandoId(id);
      await companyApi.updateStatus(id, novoBlocked, motivo.trim());

      if (setRestaurantes) {
        setRestaurantes((listaAtual) =>
          listaAtual.map((res) =>
            res.companyId === id
              ? { ...res, blocked: novoBlocked, blockReason: novoBlocked ? motivo.trim() || null : null }
              : res,
          ),
        );
      }

      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert(`Erro ao alterar acesso: ${err.message}`);
    } finally {
      setProcessandoId(null);
    }
  };

  const formatarWhatsapp = (num) => {
    if (!num) return "—";
    const limpo = num.replace(/\D/g, "");
    if (limpo.length === 11) {
      return `(${limpo.slice(0, 2)}) ${limpo.slice(2, 7)}-${limpo.slice(7)}`;
    }
    return num;
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Restaurante / Dono</TableHead>
              <TableHead>Código</TableHead>
              <TableHead>WhatsApp</TableHead>
              <TableHead>Data de Adesão</TableHead>
              <TableHead>Acesso</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {restaurantes.length > 0 ? (
              restaurantes.map((res) => (
                <TableRow key={res.companyId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-muted border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                        {res.companyName?.slice(0, 2).toUpperCase() || "RE"}
                      </div>
                      <div className="truncate max-w-45">
                        <div className="font-semibold truncate text-foreground">{res.companyName}</div>
                        <div className="text-xs text-muted-foreground truncate">{res.ownerName}</div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-brand font-semibold">
                    {res.companyCode}
                  </TableCell>

                  <TableCell>
                    {res.companyLegal?.whatsapp ? (
                      <a
                        href={`https://wa.me/55${res.companyLegal.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm hover:text-emerald-500 transition"
                      >
                        <MessageSquare size={14} className="text-muted-foreground" />
                        {formatarWhatsapp(res.companyLegal.whatsapp)}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>

                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {res.createdAt ? new Date(res.createdAt).toLocaleDateString("pt-BR") : "—"}
                  </TableCell>

                  <TableCell>
                    {res.blocked ? (
                      <Badge
                        variant="outline"
                        title={res.blockReason || "Motivo não informado."}
                        className="gap-1.5 text-rose-500 border-rose-500/20 bg-rose-500/10"
                      >
                        <ShieldAlert size={12} /> Suspenso
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1.5 text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
                      >
                        <CheckCircle size={12} /> Liberado
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={processandoId === res.companyId}>
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/admin/restaurantes/${res.companyId}/usuarios`)}>
                          <Users size={14} className="text-brand" />
                          Ver Funcionários
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditarClick?.(res)}>
                          <Edit3 size={14} className="text-brand" />
                          Editar Informações
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => tratarBloqueio(res.companyId, res.blocked, res.blockReason)}
                        >
                          <Ban size={14} className={res.blocked ? "text-emerald-500" : "text-amber-500"} />
                          {res.blocked ? "Liberar Acesso" : "Bloquear Acesso"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle size={20} />
                    <span>Nenhum restaurante cadastrado ou encontrado.</span>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
