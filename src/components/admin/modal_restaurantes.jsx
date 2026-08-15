import React, { useState, useEffect } from "react";
import { X, Store, CreditCard, Mail, Lock, Phone, Loader2, User, MapPin, Building } from "lucide-react";
import { stringToCnpj, stringToCpf, stringToWhatsapp, changeToString } from "../../services/formatString";
import { companyApi } from "../../api/base/company";
import { integracoesService } from "../../api/Integraçoes"

export default function ModalCriarRestaurante({ isOpen, onClose, onSuccess, restauranteParaEditar }) {
  const [formData, setFormData] = useState({
    nome_fantasia: "",
    razao_social: "",
    cnpj: "",
    email: "",
    whatsapp: "",
    // Endereço
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    // Dono
    nomeDono: "",
    cpf: "",
    senha: ""
  });

  const [carregando, setCarregando] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [erro, setErro] = useState("");

  const isEdicao = !!restauranteParaEditar;

  useEffect(() => {
    if (isOpen) {
      if (restauranteParaEditar) {
        setFormData({
          nome_fantasia: restauranteParaEditar.nome_fantasia || restauranteParaEditar.nome || "",
          razao_social: restauranteParaEditar.razao_social || "",
          cnpj: restauranteParaEditar.cnpj ? stringToCnpj(restauranteParaEditar.cnpj) : "",
          email: restauranteParaEditar.email || "",
          whatsapp: restauranteParaEditar.whatsapp ? stringToWhatsapp(restauranteParaEditar.whatsapp) : "",
          cep: restauranteParaEditar.cep || "",
          logradouro: restauranteParaEditar.logradouro || "",
          numero: restauranteParaEditar.numero || "",
          complemento: restauranteParaEditar.complemento || "",
          bairro: restauranteParaEditar.bairro || "",
          cidade: restauranteParaEditar.cidade || "",
          estado: restauranteParaEditar.estado || "",
          nomeDono: "",
          cpf: "",
          senha: ""
        });
      } else {
        setFormData({
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
          senha: ""
        });
      }
      setErro("");
    }
  }, [isOpen, restauranteParaEditar]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorFormatado = value;

    if (name === "cpf") valorFormatado = stringToCpf(value);
    if (name === "whatsapp") valorFormatado = stringToWhatsapp(value);
    if (name === "cnpj") valorFormatado = stringToCnpj(value);

    setFormData(prev => ({ ...prev, [name]: valorFormatado }));
  };

  // 🏢 CONSULTA DE CNPJ VIA SERVIÇO
  const handleConsultaCnpj = async (e) => {
    const cnpjLimpo = changeToString(e.target.value);
    if (!cnpjLimpo || cnpjLimpo.length !== 14) return;

    try {
      setBuscandoCnpj(true);
      setErro("");
      
      const data = await integracoesService.buscarCnpj(cnpjLimpo);

      if (data) {
        setFormData(prev => ({
          ...prev,
          razao_social: data.razao_social || prev.razao_social,
          nome_fantasia: data.nome_fantasia || prev.nome_fantasia,
          cep: data.cep ? data.cep.replace(/\D/g, '') : prev.cep,
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

  // 📍 CONSULTA DE CEP VIA SERVIÇO
  const handleConsultaCep = async (e) => {
    const cepLimpo = changeToString(e.target.value);
    if (!cepLimpo || cepLimpo.length !== 8) return;

    try {
      setBuscandoCep(true);
      setErro("");

      const data = await integracoesService.buscarCep(cepLimpo);

      if (data) {
        setFormData(prev => ({
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

    const dadosHigienizados = {
      nome_fantasia: formData.nome_fantasia,
      razao_social: formData.razao_social || undefined,
      email: formData.email,
      cnpj: changeToString(formData.cnpj) || undefined,
      whatsapp: changeToString(formData.whatsapp) || undefined,
      cep: changeToString(formData.cep) || undefined,
      logradouro: formData.logradouro || undefined,
      numero: formData.numero || undefined,
      complemento: formData.complemento || undefined,
      bairro: formData.bairro || undefined,
      cidade: formData.cidade || undefined,
      estado: formData.estado || undefined,
    };

    try {
      if (isEdicao) {
        await companyApi.update(restauranteParaEditar.id, dadosHigienizados);
        alert("Estabelecimento atualizado com sucesso!");
      } else {
        const dadosCriacao = {
          ...dadosHigienizados,
          nomeDono: formData.nomeDono,
          cpf: changeToString(formData.cpf),
          senha: formData.senha
        };
        await companyApi.create(dadosCriacao);
        alert("Estabelecimento e Dono Mestre criados com sucesso!");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* MODAL CONTAINER - Ajustado para max-w-4xl e flex flex-col para ter cabeçalho/rodape fixos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* HEADER (Fixo no topo) */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-2 text-blue-500">
            <Store size={20} />
            <h2 className="text-lg font-bold text-white">
              {isEdicao ? "Editar Informações do Parceiro" : "Cadastrar Novo Parceiro"}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 transition p-1.5 rounded-lg hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        {/* FORMULÁRIO COM ROLAGEM AUMENTADA E CUSTOMIZADA */}
        <form id="form-restaurante" onSubmit={handleSalvar} className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6">
          
          {erro && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl font-medium">
              {erro}
            </div>
          )}

          {/* SEÇÃO 1: DADOS DO ESTABELECIMENTO */}
          <div>
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">1. Informações da Empresa</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">CNPJ (opicional)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input
                    type="text"
                    name="cnpj"
                    value={formData.cnpj}
                    onChange={handleInputChange}
                    onBlur={handleConsultaCnpj}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                    placeholder="00.000.000/0000-00"
                  />
                  {buscandoCnpj && <Loader2 size={16} className="absolute right-3.5 top-3 animate-spin text-blue-400" />}
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome Fantasia</label>
                <div className="relative">
                  <Store className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input
                    required
                    type="text"
                    name="nome_fantasia"
                    value={formData.nome_fantasia}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    placeholder="Ex: Burger House"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Razão Social</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input
                    type="text"
                    name="razao_social"
                    value={formData.razao_social}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    placeholder="Ex: Burger House Alimentação LTDA"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">E-mail Comercial</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    placeholder="comercial@restaurante.com"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 font-medium block mb-1.5">WhatsApp de Atendimento</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input
                    required
                    type="text"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

            </div>
          </div>

          {/* SEÇÃO 2: ENDEREÇO DA EMPRESA */}
          <div className="border-t border-slate-800/60 pt-4">
            <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">2. Endereço e Localização</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">CEP</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3 text-slate-500" size={16} />
                  <input
                    type="text"
                    name="cep"
                    value={formData.cep}
                    onChange={handleInputChange}
                    onBlur={handleConsultaCep}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                    placeholder="00000-000"
                  />
                  {buscandoCep && <Loader2 size={16} className="absolute right-3.5 top-3 animate-spin text-blue-400" />}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Logradouro / Rua</label>
                <input
                  type="text"
                  name="logradouro"
                  value={formData.logradouro}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  placeholder="Rua, Avenida, Alameda..."
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Número</label>
                <input
                  type="text"
                  name="numero"
                  value={formData.numero}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  placeholder="123"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Complemento</label>
                <input
                  type="text"
                  name="complemento"
                  value={formData.complemento}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  placeholder="Apto, Sala, Bloco"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Bairro</label>
                <input
                  type="text"
                  name="bairro"
                  value={formData.bairro}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  placeholder="Centro"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 font-medium block mb-1.5">Cidade</label>
                <input
                  type="text"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  placeholder="Cidade"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1.5">UF</label>
                <input
                  type="text"
                  name="estado"
                  maxLength={2}
                  value={formData.estado}
                  onChange={handleInputChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl text-center py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition uppercase"
                  placeholder="UF"
                />
              </div>

            </div>
          </div>

          {/* SEÇÃO 3: DADOS DO DONO MESTRE (Ocultada se for Edição) */}
          {!isEdicao && (
            <div className="border-t border-slate-800/60 pt-4">
              <h3 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-3">3. Responsável Legal (Dono)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Nome Completo do Dono</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 text-slate-500" size={16} />
                    <input
                      required
                      type="text"
                      name="nomeDono"
                      value={formData.nomeDono}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                      placeholder="Ex: João Silva Costa"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">CPF do Dono</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-3 text-slate-500" size={16} />
                    <input
                      required
                      type="text"
                      name="cpf"
                      value={formData.cpf}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition font-mono"
                      placeholder="000.000.000-00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-medium block mb-1.5">Senha Provisória de Acesso</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 text-slate-500" size={16} />
                    <input
                      required
                      type="password"
                      name="senha"
                      value={formData.senha}
                      onChange={handleInputChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition"
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* RODAPÉ DO MODAL (Fixo na parte inferior) */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            disabled={carregando}
            className="px-5 py-2 text-sm font-medium text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="form-restaurante"
            disabled={carregando || buscandoCnpj || buscandoCep}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Salvando no Banco...
              </>
            ) : isEdicao ? (
              "Salvar Alterações"
            ) : (
              "Concluir Cadastro"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}