import React, { useState, useEffect, useRef } from "react";
import { X, Loader2, Crown, ChevronDown, Search } from "lucide-react";
import { funcionarioApi } from "../../api/funcionario";

export default function ModalCriarFuncionario({ isOpen, onClose, onSuccess, funcionarioParaEditar = null }) {
  if (!isOpen) return null;

  const modoEdicao = !!funcionarioParaEditar;

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    email: "",
    senha: "",
    telefone: ""
  });

  const [restauranteId, setRestauranteId] = useState("");
  const [restauranteNomeSelecionado, setRestauranteNomeSelecionado] = useState("");
  const [pesquisaRestaurante, setPesquisaRestaurante] = useState("");
  const [isDropdownRestauranteOpen, setIsDropdownRestauranteOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [isOwner, setIsOwner] = useState(false);
  const [verFinanceiro, setVerFinanceiro] = useState(false);
  const [gerenciarProdutos, setGerenciarProdutos] = useState(false);
  const [caixaPedidos, setCaixaPedidos] = useState(false);

  const [restaurantes, setRestaurantes] = useState([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    fetch("http://localhost:3000/restaurantes")
      .then((res) => res.json())
      .then((dados) => setRestaurantes(dados))
      .catch((err) => console.error("Erro ao carregar restaurantes:", err));
  }, []);

  useEffect(() => {
    if (modoEdicao && funcionarioParaEditar) {
      setFormData({
        nome: funcionarioParaEditar.nome || "",
        cpf: funcionarioParaEditar.cpf || "",
        email: funcionarioParaEditar.email || "",
        senha: "", 
        telefone: funcionarioParaEditar.telefone || ""
      });
      setRestauranteId(funcionarioParaEditar.restauranteId || "");
      setRestauranteNomeSelecionado(funcionarioParaEditar.restauranteNome || funcionarioParaEditar.restaurante?.nome || "");
      
      const perms = funcionarioParaEditar.permissoes || {};
      setIsOwner(funcionarioParaEditar.isOwner || perms.isOwner || false);
      setVerFinanceiro(perms.verFinanceiro || false);
      setGerenciarProdutos(perms.gerenciarProdutos || false);
      setCaixaPedidos(perms.caixaPedidos || false);
    } else {
      setFormData({ nome: "", cpf: "", email: "", senha: "", telefone: "" });
      setRestauranteId(""); setRestauranteNomeSelecionado("");
      setIsOwner(false); setVerFinanceiro(false); setGerenciarProdutos(false); setCaixaPedidos(false);
    }
  }, [funcionarioParaEditar, modoEdicao, isOpen]);

  useEffect(() => {
    function clicarFora(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownRestauranteOpen(false);
      }
    }
    document.addEventListener("mousedown", clicarFora);
    return () => document.removeEventListener("mousedown", clicarFora);
  }, []);

  const stringToCpf = (v) => v.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").substring(0, 14);
  const stringToWhatsapp = (v) => v.replace(/\D/g, "").replace(/^(\d{2})(\d)/g, "($1) $2").replace(/(\d)(\d{4})$/, "$1-$2").substring(0, 15);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let valorFormatado = value;

    if (name === "cpf") valorFormatado = stringToCpf(value);
    if (name === "telefone") valorFormatado = stringToWhatsapp(value);

    setFormData(prev => ({ ...prev, [name]: valorFormatado }));
  };

  const restaurantesFiltrados = restaurants => restaurantes.filter((res) => {
    const termo = pesquisaRestaurante.toLowerCase();
    const nomeRes = (res.nome || "").toLowerCase();
    const codigoRes = (res.codigo || "").toLowerCase();
    return nomeRes.includes(termo) || codigoRes.includes(termo);
  });

  const lidarComEnvio = async (e) => {
    e.preventDefault();
    if (!restauranteId) {
      alert("Por favor, selecione um estabelecimento.");
      return;
    }

    try {
      setEnviando(true);

      const payload = {
        nome: formData.nome,
        cpf: formData.cpf,
        email: formData.email,
        telefone: formData.telefone ? formData.telefone.replace(/\D/g, "") : undefined, 
        restauranteId: Number(restauranteId),
        permissoes: {
          isOwner,
          verFinanceiro: isOwner ? true : verFinanceiro,
          gerenciarProdutos: isOwner ? true : gerenciarProdutos,
          caixaPedidos: isOwner ? true : caixaPedidos,
        },
      };

      if (modoEdicao) {
        if (formData.senha && formData.senha.trim() !== "") {
          payload.senhaHash = formData.senha;
        }
        await funcionarioApi.atualizar(funcionarioParaEditar.id, payload);
      } else {
        payload.senhaHash = formData.senha;
        await funcionarioApi.criar(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      // 🔥 MELHORIA: Mostra o erro real detalhado enviado pelo NestJS em vez do "E" cortado
      console.error("Erro completo capturado no Form:", err);
      alert(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-950/40">
          <h2 className="text-lg font-bold text-white">
            {modoEdicao ? `Editar Dados: ${formData.nome}` : "Adicionar Novo Colaborador"}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={lidarComEnvio} className="p-5 space-y-4">
          
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Nome Completo</label>
            <input required type="text" name="nome" value={formData.nome} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition" placeholder="Ex: João da Silva" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Telefone / WhatsApp</label>
            <input type="text" name="telefone" value={formData.telefone} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition" placeholder="(00) 00000-0000" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">CPF</label>
              <input required type="text" name="cpf" value={formData.cpf} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition" placeholder="000.000.000-00" />
            </div>

            <div className="relative" ref={dropdownRef}>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Estabelecimento</label>
              
              <button
                type="button"
                onClick={() => setIsDropdownRestauranteOpen(!isDropdownRestauranteOpen)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-left text-slate-200 flex justify-between items-center focus:outline-none focus:border-blue-500 transition"
              >
                <span className={restauranteNomeSelecionado ? "text-slate-200" : "text-slate-500"}>
                  {restauranteNomeSelecionado || "Selecione..."}
                </span>
                <ChevronDown size={14} className="text-slate-500" />
              </button>

              {isDropdownRestauranteOpen && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl z-30 overflow-hidden max-h-56 flex flex-col">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900/40">
                    <Search size={12} className="text-slate-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="Pesquisar nome ou código..."
                      value={pesquisaRestaurante}
                      onChange={(e) => setPesquisaRestaurante(e.target.value)}
                      className="bg-transparent focus:outline-none w-full text-slate-200 placeholder-slate-600 text-[11px]"
                    />
                  </div>

                  <div className="overflow-y-auto divide-y divide-slate-900 text-[11px]">
                    {restaurantesFiltrados().length > 0 ? (
                      restaurantesFiltrados().map((res) => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => {
                            setRestauranteId(res.id);
                            setRestauranteNomeSelecionado(res.nome);
                            setIsDropdownRestauranteOpen(false);
                            setPesquisaRestaurante("");
                          }}
                          className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 transition flex flex-col gap-0.5"
                        >
                          <span className="font-medium text-slate-200">{res.nome}</span>
                          <span className="text-[10px] text-slate-500 font-mono">Cód: {res.codigo || res.id}</span>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-slate-600 italic">Nenhum restaurante encontrado.</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">E-mail de Acesso</label>
            <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition" placeholder="joao@restaurante.com" />
          </div>

          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Senha de Entrada {modoEdicao && <span className="text-blue-400 normal-case">(Deixe vazio para manter a atual)</span>}
            </label>
            <input required={!modoEdicao} type="password" name="senha" value={formData.senha} onChange={handleInputChange} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition" placeholder={modoEdicao ? "••••••••" : "Nova senha"} />
          </div>

          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-3">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-purple-400">Painéis e Telas Liberadas</span>
            <div className="space-y-2.5">
              
              <label className="flex items-center gap-3 bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 hover:border-amber-500/30 transition cursor-pointer select-none">
                <input type="checkbox" checked={isOwner} onChange={(e) => { setIsOwner(e.target.checked); if (e.target.checked) { setVerFinanceiro(true); setGerenciarProdutos(true); setCaixaPedidos(true); } }} className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer" />
                <div>
                  <div className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1"><Crown size={12}/> Administrador Geral</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Acesso irrestrito a todas as configurações da loja.</div>
                </div>
              </label>

              <div className={`space-y-2 ${isOwner ? 'opacity-40 pointer-events-none' : ''}`}>
                <label className="flex items-center gap-3 p-2 hover:bg-slate-900/60 rounded-lg cursor-pointer transition select-none">
                  <input type="checkbox" disabled={isOwner} checked={verFinanceiro} onChange={(e) => setVerFinanceiro(e.target.checked)} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer" />
                  <span className="text-xs font-medium text-slate-300">Visualizar Fluxo Financeiro e Relatórios</span>
                </label>

                <label className="flex items-center gap-3 p-2 hover:bg-slate-900/60 rounded-lg cursor-pointer transition select-none">
                  <input type="checkbox" disabled={isOwner} checked={gerenciarProdutos} onChange={(e) => setGerenciarProdutos(e.target.checked)} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer" />
                  <span className="text-xs font-medium text-slate-300">Gerenciar Cardápio (Produtos e Categorias)</span>
                </label>

                <label className="flex items-center gap-3 p-2 hover:bg-slate-900/60 rounded-lg cursor-pointer transition select-none">
                  <input type="checkbox" disabled={isOwner} checked={caixaPedidos} onChange={(e) => setCaixaPedidos(e.target.checked)} className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer" />
                  <span className="text-xs font-medium text-slate-300">Operar Painel de Pedidos (Frente de Caixa)</span>
                </label>
              </div>

            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 transition text-xs font-semibold rounded-xl text-slate-300">Cancelar</button>
            <button type="submit" disabled={enviando} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 transition text-xs font-semibold rounded-xl text-white">
              {enviando && <Loader2 size={12} className="animate-spin" />} {modoEdicao ? "Salvar Alterações" : "Salvar Membro"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}