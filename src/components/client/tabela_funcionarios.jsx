import { useState } from "react";
import { UserX, UserCheck, AlertCircle, Crown, MoreVertical, Edit3 } from "lucide-react";
import { stringToCpf } from "../../services/formatString";
import { membersApi } from "../../api/members";
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

export default function TabelaFuncionarios({ funcionarios, setFuncionarios, onActionSuccess, onEditarClick }) {
  const [processandoId, setProcessandoId] = useState(null);

  const tratarBloqueio = async (id, estaAtivo) => {
    const novoAtivo = !estaAtivo;
    const confirmMsg = novoAtivo ? "Ativar acesso deste colaborador?" : "Bloquear acesso deste colaborador?";
    if (!confirm(confirmMsg)) return;

    try {
      setProcessandoId(id);
      await membersApi.updateStatus(id, novoAtivo);

      if (setFuncionarios) {
        setFuncionarios((listaAtual) =>
          listaAtual.map((func) => (func.member_id === id ? { ...func, member_active: novoAtivo } : func)),
        );
      }

      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      alert(`Erro ao alterar acesso: ${err.message}`);
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {funcionarios.length > 0 ? (
              funcionarios.map((func) => (
                <TableRow key={func.member_id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-brand/10 flex items-center justify-center font-bold text-brand shrink-0">
                        {func.member_name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-2 text-foreground">
                          <span>{func.member_name}</span>
                          {func.member_access === "owner" && (
                            <Badge
                              variant="outline"
                              className="gap-1 text-[10px] uppercase text-amber-500 border-amber-500/20 bg-amber-500/10"
                            >
                              <Crown size={10} /> Dono
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {func.member_cpf && stringToCpf(`${func.member_cpf}`)}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-muted-foreground">{func.member_email}</TableCell>

                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        func.member_active
                          ? "gap-1.5 text-emerald-500 border-emerald-500/20 bg-emerald-500/10"
                          : "gap-1.5 text-rose-500 border-rose-500/20 bg-rose-500/10"
                      }
                    >
                      <span
                        className={`size-1.5 rounded-full ${func.member_active ? "bg-emerald-500" : "bg-rose-500"}`}
                      />
                      {func.member_active ? "Ativo" : "Bloqueado"}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    {func.member_access === "owner" ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={processandoId === func.member_id}>
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEditarClick?.(func)}>
                            <Edit3 size={14} className="text-brand" />
                            Editar Dados / Telas
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => tratarBloqueio(func.member_id, func.member_active)}
                            className={func.member_active ? "text-rose-500 focus:text-rose-500" : "text-emerald-500 focus:text-emerald-500"}
                          >
                            {func.member_active ? <UserX size={14} /> : <UserCheck size={14} />}
                            {func.member_active ? "Bloquear Acesso" : "Ativar Acesso"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle size={20} />
                    <span>Nenhum funcionário cadastrado ou encontrado.</span>
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
