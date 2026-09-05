import { useState, useEffect } from "react";
import { CreditCard, Mail, Phone, Loader2, User, MapPin, Building, Store } from "lucide-react";
import { stringToCnpj, stringToCpf, stringToWhatsapp, changeToString } from "../../services/formatString";
import { companyApi } from "../../api/base/company";
import { integracoesService } from "../../api/integracoes";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";

const FORM_INICIAL = {
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  email: "",
  whatsapp: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  nomeDono: "",
  cpf: "",
  senha: "",
};

export default function ModalCriarRestaurante({ isOpen, onClose, onSuccess, restauranteParaEditar }) {
  const [formData, setFormData] = useState(FORM_INICIAL);
  const [carregando, setCarregando] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState("");

  const isEdicao = !!restauranteParaEditar;

  useEffect(() => {
    if (!isOpen) return;

    if (restauranteParaEditar) {
      const legal = restauranteParaEditar.companyLegal || {};
      const location = restauranteParaEditar.companyLocation || {};

      setFormData({
        ...FORM_INICIAL,
        nome_fantasia: restauranteParaEditar.companyName || "",
        razao_social: legal.registeredName || "",
        cnpj: legal.cnpj ? stringToCnpj(legal.cnpj) : "",
        email: restauranteParaEditar.companyEmail || "",
        whatsapp: legal.whatsapp ? stringToWhatsapp(legal.whatsapp) : "",
        cep: location.zipCode || "",
        logradouro: location.street || "",
        numero: location.number || "",
        complemento: location.complement || "",
        bairro: location.district || "",
        cidade: location.city || "",
        estado: location.state || "",
      });
    } else {
      setFormData(FORM_INICIAL);
    }
    setErro("");
  }, [isOpen, restauranteParaEditar]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorFormatado = value;

    if (name === "cpf") valorFormatado = stringToCpf(value);
    if (name === "whatsapp") valorFormatado = stringToWhatsapp(value);
    if (name === "cnpj") valorFormatado = stringToCnpj(value);

    setFormData((prev) => ({ ...prev, [name]: valorFormatado }));
  };

  const handleConsultaCnpj = async (e) => {
    const cnpjLimpo = changeToString(e.target.value);
    if (!cnpjLimpo || cnpjLimpo.length !== 14) return;

    try {
      setBuscandoCnpj(true);
      setErro("");

      const data = await integracoesService.buscarCnpj(cnpjLimpo);

      if (data) {
        setFormData((prev) => ({
          ...prev,
          razao_social: data.razao_social || prev.razao_social,
          nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
          cep: data.cep ? data.cep.replace(/\D/g, "") : prev.cep,
          logradouro: data.logradouro || prev.logradouro,
          numero: data.numero || prev.numero,
          complemento: data.complemento || prev.complemento,
          bairro: data.bairro || prev.bairro,
          cidade: data.cidade || prev.cidade,
          estado: data.estado || prev.estado,
        }));
      }
    } catch (err) {
      setErro(err.message || "Erro ao consultar CNPJ");
    } finally {
      setBuscandoCnpj(false);
    }
  };

  const handleConsultaCep = async (e) => {
    const cepLimpo = changeToString(e.target.value);
    if (!cepLimpo || cepLimpo.length !== 8) return;

    try {
      setBuscandoCep(true);
      setErro("");

      const data = await integracoesService.buscarCep(cepLimpo);

      if (data) {
        setFormData((prev) => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.cidade || prev.cidade,
          estado: data.estado || prev.estado,
        }));
      }
    } catch (err) {
      setErro(err.message || "Erro ao consultar CEP");
    } finally {
      setBuscandoCep(false);
    }
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro("");

    const companyLegal = {
      cnpj: changeToString(formData.cnpj) || undefined,
      tradeName: formData.nome_fantasia || undefined,
      registeredName: formData.razao_social || undefined,
      whatsapp: changeToString(formData.whatsapp) || undefined,
    };

    const companyLocation = {
      zipCode: changeToString(formData.cep) || undefined,
      street: formData.logradouro || undefined,
      number: formData.numero || undefined,
      complement: formData.complemento || undefined,
      district: formData.bairro || undefined,
      city: formData.cidade || undefined,
      state: formData.estado || undefined,
    };

    try {
      if (isEdicao) {
        await companyApi.update(restauranteParaEditar.companyId, {
          companyName: formData.nome_fantasia,
          companyEmail: formData.email,
          companyLegal,
          companyLocation,
        });
        alert("Estabelecimento atualizado com sucesso!");
      } else {
        await companyApi.create({
          companyName: formData.nome_fantasia,
          companyEmail: formData.email,
          companyLegal,
          companyLocation,
          ownerName: formData.nomeDono,
          ownerCpf: changeToString(formData.cpf),
          ownerPassword: formData.senha,
        });
        alert("Estabelecimento e responsável cadastrados com sucesso!");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Store size={18} className="text-brand" />
            {isEdicao ? "Editar Informações do Parceiro" : "Cadastrar Novo Parceiro"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="form-restaurante"
          onSubmit={handleSalvar}
          className="flex-1 overflow-y-auto px-6 space-y-6"
        >
          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-brand uppercase tracking-wider">
              1. Informações da Empresa
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                <div className="relative">
                  <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="cnpj"
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleInputChange}
                    onBlur={handleConsultaCnpj}
                    className="pl-8 font-mono"
                    placeholder="00.000.000/0000-00"
                  />
                  {buscandoCnpj && (
                    <Loader2 size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-brand" />
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nome_fantasia">Nome Fantasia</Label>
                <div className="relative">
                  <Store className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    required
                    id="nome_fantasia"
                    type="text"
                    name="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={handleInputChange}
                    className="pl-8"
                    placeholder="Ex: Burger House"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="razao_social">Razão Social</Label>
                <div className="relative">
                  <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="razao_social"
                    type="text"
                    name="razao_social"
                    value={formData.razao_social}
                    onChange={handleInputChange}
                    className="pl-8"
                    placeholder="Ex: Burger House Alimentação LTDA"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail Comercial</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    required
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-8"
                    placeholder="comercial@restaurante.com"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="whatsapp">WhatsApp de Atendimento</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    required
                    id="whatsapp"
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="pl-8 font-mono"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-brand uppercase tracking-wider">
              2. Endereço e Localização
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input
                    id="cep"
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    onBlur={handleConsultaCep}
                    className="pl-8 font-mono"
                    placeholder="00000-000"
                  />
                  {buscandoCep && (
                    <Loader2 size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-brand" />
                  )}
                </div>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="logradouro">Logradouro / Rua</Label>
                <Input
                  id="logradouro"
                  type="text"
                  name="logradouro"
                  value={formData.logradouro}
                  onChange={handleInputChange}
                  placeholder="Rua, Avenida, Alameda..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleInputChange}
                  placeholder="123"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  type="text"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleInputChange}
                  placeholder="Apto, Sala, Bloco"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  type="text"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleInputChange}
                  placeholder="Centro"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  placeholder="Cidade"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="estado">UF</Label>
                <Input
                  id="estado"
                  type="text"
                  name="estado"
                  maxLength={2}
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="text-center uppercase"
                  placeholder="UF"
                />
              </div>
            </div>
          </div>

          {!isEdicao && (
            <>
              <Separator />
              <div className="space-y-4 pb-6">
                <h3 className="text-xs font-semibold text-brand uppercase tracking-wider">
                  3. Responsável Legal (Dono)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label htmlFor="nomeDono">Nome Completo do Dono</Label>
                    <div className="relative">
                      <User className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        required
                        id="nomeDono"
                        type="text"
                        name="nomeDono"
                        value={formData.nomeDono}
                        onChange={handleInputChange}
                        className="pl-8"
                        placeholder="Ex: João Silva Costa"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="cpf">CPF do Dono</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <Input
                        required
                        id="cpf"
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleInputChange}
                        className="pl-8 font-mono"
                        placeholder="000.000.000-00"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="senha">Senha Provisória de Acesso</Label>
                    <Input
                      required
                      id="senha"
                      type="password"
                      name="senha"
                      value={formData.senha}
                      onChange={handleInputChange}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </form>

        <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={carregando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-restaurante"
            disabled={carregando || buscandoCnpj || buscandoCep}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {carregando && <Loader2 size={16} className="animate-spin" />}
            {carregando ? "Salvando..." : isEdicao ? "Salvar Alterações" : "Concluir Cadastro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
