import { useState, useEffect } from "react";
import { Loader2, Crown } from "lucide-react";
import { adminMembersApi } from "../../api/members";
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

export default function ModalCriarFuncionario({ isOpen, onClose, onSuccess, funcionarioParaEditar = null, companyId }) {
  const modoEdicao = !!funcionarioParaEditar;

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [isAdmin, setIsAdmin] = useState(false);
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
      setIsAdmin(!!todasMarcadas);
      setVerFinanceiro(perms.financialView || false);
      setGerenciarCatalogo(perms.stockUpdate || false);
      setOperarCaixa(perms.ordersCreate || false);
    } else {
      setFormData(FORM_INICIAL);
      setIsAdmin(false);
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
          financialView: isAdmin ? true : verFinanceiro,
          stockUpdate: isAdmin ? true : gerenciarCatalogo,
          ordersCreate: isAdmin ? true : operarCaixa,
        },
      };

      if (modoEdicao) {
        // Nunca mandar memberAccess na edição — evita rebaixar um "owner" pra "employee" sem querer.
        // member_access só aceita "owner"/"employee" no backend atual; não é editável por aqui.
        if (formData.senha.trim() !== "") {
          payload.memberPassword = formData.senha;
        }
        await adminMembersApi.update(companyId, funcionarioParaEditar.member_id, payload);
      } else {
        payload.memberAccess = "employee";
        payload.memberPassword = formData.senha;
        await adminMembersApi.create(companyId, payload);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">
            {modoEdicao ? `Editar Dados: ${formData.nome}` : "Adicionar Novo Colaborador"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={lidarComEnvio} className="space-y-4">
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

          <div className="bg-muted/40 border border-border p-4 rounded-xl space-y-3">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-brand">
              Painéis e Telas Liberadas
            </span>

            <label className="flex items-center gap-3 bg-background/60 p-2.5 rounded-lg border border-border hover:border-amber-500/30 transition cursor-pointer select-none">
              <Checkbox
                checked={isAdmin}
                onCheckedChange={(checked) => {
                  setIsAdmin(!!checked);
                  if (checked) {
                    setVerFinanceiro(true);
                    setGerenciarCatalogo(true);
                    setOperarCaixa(true);
                  }
                }}
              />
              <div>
                <div className="text-xs font-bold text-amber-500 uppercase tracking-wide flex items-center gap-1">
                  <Crown size={12} /> Acesso Total
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Libera todas as telas e permissões abaixo de uma vez.
                </div>
              </div>
            </label>

            <div className={`space-y-2 ${isAdmin ? "opacity-40 pointer-events-none" : ""}`}>
              <label className="flex items-center gap-3 p-2 hover:bg-background/60 rounded-lg cursor-pointer transition select-none">
                <Checkbox disabled={isAdmin} checked={verFinanceiro} onCheckedChange={(c) => setVerFinanceiro(!!c)} />
                <span className="text-xs font-medium text-foreground">Visualizar Fluxo Financeiro e Relatórios</span>
              </label>

              <label className="flex items-center gap-3 p-2 hover:bg-background/60 rounded-lg cursor-pointer transition select-none">
                <Checkbox disabled={isAdmin} checked={gerenciarCatalogo} onCheckedChange={(c) => setGerenciarCatalogo(!!c)} />
                <span className="text-xs font-medium text-foreground">Gerenciar Cardápio e Estoque</span>
              </label>

              <label className="flex items-center gap-3 p-2 hover:bg-background/60 rounded-lg cursor-pointer transition select-none">
                <Checkbox disabled={isAdmin} checked={operarCaixa} onCheckedChange={(c) => setOperarCaixa(!!c)} />
                <span className="text-xs font-medium text-foreground">Operar Painel de Pedidos (Frente de Caixa)</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={enviando} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {enviando && <Loader2 size={14} className="animate-spin" />}
              {modoEdicao ? "Salvar Alterações" : "Salvar Membro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
