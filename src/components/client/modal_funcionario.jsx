import { useState, useEffect } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { membersApi } from "../../api/members";
import { stringToCpf } from "../../services/formatString";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

const FORM_INICIAL = { nome: "", cpf: "", email: "", senha: "" };

export default function ModalFuncionario({ isOpen, onClose, onSuccess, funcionarioParaEditar = null }) {
  const modoEdicao = !!funcionarioParaEditar;

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [acessoTotal, setAcessoTotal] = useState(false);
  const [verFinanceiro, setVerFinanceiro] = useState(false);
  const [gerenciarCatalogo, setGerenciarCatalogo] = useState(false);
  const [operarCaixa, setOperarCaixa] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (modoEdicao && funcionarioParaEditar) {
      setFormData({
        nome: funcionarioParaEditar.member_name || "",
        cpf: funcionarioParaEditar.member_cpf || "",
        email: funcionarioParaEditar.member_email || "",
        senha: "",
      });

      const perms = funcionarioParaEditar.member_permissions || {};
      const todasMarcadas = perms.financialView && perms.stockUpdate && perms.ordersCreate;
      setAcessoTotal(!!todasMarcadas);
      setVerFinanceiro(perms.financialView || false);
      setGerenciarCatalogo(perms.stockUpdate || false);
      setOperarCaixa(perms.ordersCreate || false);
    } else {
      setFormData(FORM_INICIAL);
      setAcessoTotal(false);
      setVerFinanceiro(false);
      setGerenciarCatalogo(false);
      setOperarCaixa(false);
    }
    setErro("");
  }, [funcionarioParaEditar, modoEdicao, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorFormatado = value;

    if (name === "cpf") valorFormatado = stringToCpf(value);

    setFormData((prev) => ({ ...prev, [name]: valorFormatado }));
  };

  const lidarComEnvio = async (e) => {
    e.preventDefault();

    try {
      setEnviando(true);
      setErro("");

      const payload = {
        memberName: formData.nome,
        memberCpf: formData.cpf.replace(/\D/g, ""),
        memberEmail: formData.email,
        memberPermissions: {
          financialView: acessoTotal ? true : verFinanceiro,
          stockUpdate: acessoTotal ? true : gerenciarCatalogo,
          ordersCreate: acessoTotal ? true : operarCaixa,
        },
      };

      if (modoEdicao) {
        // Nunca mandar memberAccess na edição — evita rebaixar um "owner" pra "employee" sem querer.
        // member_access só é definido na criação (sempre "employee" aqui) e nunca muda depois.
        if (formData.senha.trim() !== "") {
          payload.memberPassword = formData.senha;
        }
        await membersApi.update(funcionarioParaEditar.member_id, payload);
      } else {
        // Só o dono do estabelecimento tem member_access "owner" (definido no cadastro do restaurante).
        // Colaboradores cadastrados aqui são sempre "employee" — acesso total é uma questão de permissões, não de papel.
        payload.memberAccess = "employee";
        payload.memberPassword = formData.senha;
        await membersApi.create(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErro(err.message || "Erro ao salvar funcionário.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-foreground">
            {modoEdicao ? `Editar Dados: ${formData.nome}` : "Adicionar Novo Colaborador"}
          </DialogTitle>
        </DialogHeader>

        <form id="form-funcionario" onSubmit={lidarComEnvio} className="px-6 space-y-4">
          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input
              required
              id="nome"
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              placeholder="Ex: João da Silva"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              required
              id="cpf"
              type="text"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              className="font-mono"
              placeholder="000.000.000-00"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail de Acesso</Label>
            <Input
              required
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="joao@restaurante.com"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="senha">
              Senha de Entrada
              {modoEdicao && (
                <span className="text-brand font-normal normal-case">
                  {" "}(deixe vazio para manter a atual)
                </span>
              )}
            </Label>
            <Input
              required={!modoEdicao}
              id="senha"
              type="password"
              name="senha"
              value={formData.senha}
              onChange={handleInputChange}
              placeholder={modoEdicao ? "••••••••" : "Nova senha"}
            />
          </div>

          <div className="bg-muted/40 border border-border p-4 rounded-xl space-y-3 pb-6">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-brand">
              Painéis e Telas Liberadas
            </span>

            <label className="flex items-center gap-3 bg-background/60 p-2.5 rounded-lg border border-border hover:border-brand/30 transition cursor-pointer select-none">
              <Checkbox
                checked={acessoTotal}
                onCheckedChange={(checked) => {
                  setAcessoTotal(!!checked);
                  if (checked) {
                    setVerFinanceiro(true);
                    setGerenciarCatalogo(true);
                    setOperarCaixa(true);
                  }
                }}
              />
              <div>
                <div className="text-xs font-bold text-brand uppercase tracking-wide flex items-center gap-1">
                  <ShieldCheck size={12} /> Acesso Total
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Libera todas as telas e permissões abaixo de uma vez.
                </div>
              </div>
            </label>

            <div className={`space-y-2 ${acessoTotal ? "opacity-40 pointer-events-none" : ""}`}>
              <label className="flex items-center gap-3 p-2 hover:bg-background/60 rounded-lg cursor-pointer transition select-none">
                <Checkbox disabled={acessoTotal} checked={verFinanceiro} onCheckedChange={(c) => setVerFinanceiro(!!c)} />
                <span className="text-xs font-medium text-foreground">Visualizar Fluxo Financeiro e Relatórios</span>
              </label>

              <label className="flex items-center gap-3 p-2 hover:bg-background/60 rounded-lg cursor-pointer transition select-none">
                <Checkbox disabled={acessoTotal} checked={gerenciarCatalogo} onCheckedChange={(c) => setGerenciarCatalogo(!!c)} />
                <span className="text-xs font-medium text-foreground">Gerenciar Cardápio e Estoque</span>
              </label>

              <label className="flex items-center gap-3 p-2 hover:bg-background/60 rounded-lg cursor-pointer transition select-none">
                <Checkbox disabled={acessoTotal} checked={operarCaixa} onCheckedChange={(c) => setOperarCaixa(!!c)} />
                <span className="text-xs font-medium text-foreground">Operar Painel de Pedidos (Frente de Caixa)</span>
              </label>
            </div>
          </div>
        </form>

        <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-funcionario"
            disabled={enviando}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {enviando && <Loader2 size={14} className="animate-spin" />}
            {modoEdicao ? "Salvar Alterações" : "Salvar Colaborador"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
