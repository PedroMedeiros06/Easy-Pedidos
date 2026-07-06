import React, { useState, useEffect } from "react";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  DollarSign, 
  ShieldAlert, 
  UserX, 
  ArrowUpRight, 
  Activity,
  ChevronRight
} from "lucide-react";

export default function DashboardAdmin() {
  // Estados para os dados da Dashboard
  const [metricas, setMetricas] = useState({
    mrr: 0,
    totalRestaurantes: 0,
    funcionariosAtivos: 0,
    pedidosHoje: 0
  });
  const [churnRisk, setChurnRisk] = useState([]);
  const [ultimosBloqueios, setUltimosBloqueios] = useState([]);
  const [carregando, setCarregando] = useState(true);

  // Simulação/Busca de dados da API NestJS
  useEffect(() => {
    // Aqui você conectará com seu endpoint futuramente: fetch("http://localhost:3000/admin/dashboard")
    setTimeout(() => {
      setMetricas({
        mrr: 14850,
        totalRestaurantes: 38,
        funcionariosAtivos: 214,
        pedidosHoje: 1104
      });

      // Restaurantes que não acessam há mais de 5 dias (Risco de Churn)
      setChurnRisk([
        { id: 1, nome: "Pizzaria Bella Itália", diasInativo: 8, plano: "Premium" },
        { id: 3, nome: "Burger & Co.", diasInativo: 6, plano: "Basic" },
        { id: 7, nome: "Sushi Wave", diasInativo: 5, plano: "Premium" },
      ]);

      // Últimos funcionários bloqueados na plataforma para auditoria visual rápida
      setUltimosBloqueios([
        { id: 102, nome: "Marcos Souza", restaurante: "Pastel do Japa", motivo: "Abuso de cancelamento de pedidos", data: "Hoje às 11:24" },
        { id: 89, nome: "Ana Costa", restaurante: "Cantina di Capri", motivo: "Fim do contrato de estágio", data: "Ontem às 18:45" },
      ]);

      setCarregando(false);
    }, 800);
  }, []);

  if (carregando) {
    return (
      <div className="p-8 min-h-screen text-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400 font-medium">Consolidando métricas da plataforma...</span>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-slate-950 text-slate-100 space-y-8 animate-in fade-in duration-200">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Master</h1>
          <p className="text-sm text-slate-400 mt-1">Visão geral da saúde, crescimento e estabilidade do seu ecossistema de restaurantes.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Sistemas Operacionais Normais
        </div>
      </div>

      {/* 1️⃣ SEÇÃO: CARDS DE METRICAS PRINCIPAIS (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1 - MRR */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/40 transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Faturamento Mensal (MRR)</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl"><DollarSign size={16} /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">R$ {metricas.mrr.toLocaleString('pt-BR')}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center bg-emerald-500/10 px-1.5 py-0.5 rounded">+12%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Previsão recorrente baseada em assinaturas</p>
        </div>

        {/* Card 2 - Restaurantes */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Estabelecimentos Ativos</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl"><Building2 size={16} /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{metricas.totalRestaurantes}</span>
            <span className="text-xs font-semibold text-purple-400 flex items-center bg-purple-500/10 px-1.5 py-0.5 rounded">+3 novos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Lojas com contratos ativos no Supabase</p>
        </div>

        {/* Card 3 - Funcionários */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Membros de Equipe</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl"><Users size={16} /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{metricas.funcionariosAtivos}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Colaboradores operando painéis neste momento</p>
        </div>

        {/* Card 4 - Volume de Pedidos */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Pedidos Transacionados Hoje</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl"><Activity size={16} /></div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight">{metricas.pedidosHoje}</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center gap-0.5"><TrendingUp size={12} /> Alta</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Volume de requisições do checkout das lojas</p>
        </div>

      </div>

      {/* 2️⃣ SEÇÃO: GRÁFICO E INSIGHT DE RISCO DE PROATIVIDADE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAFICO: Faturamento de Lojas Mais Relevantes */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Top Estabelecimentos por Uso</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ranking volumétrico de movimentação na sua API</p>
              </div>
              <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider">Mês Atual</span>
            </div>

            {/* Barras de Gráfico Feitas à mão com CSS Tailwind */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5 text-slate-300">
                  <span>McDonald's Franquia Centro</span>
                  <span className="font-mono text-slate-400">R$ 48.200,00</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full" style={{ width: "85%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5 text-slate-300">
                  <span>Domino's Pizza Shopping</span>
                  <span className="font-mono text-slate-400">R$ 39.150,00</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full" style={{ width: "70%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1.5 text-slate-300">
                  <span>Coco Bambu Express</span>
                  <span className="font-mono text-slate-400">R$ 22.900,00</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full" style={{ width: "42%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t border-slate-800/60">
            <button className="text-xs font-bold text-blue-400 hover:text-blue-300 transition flex items-center gap-1">
              Ver Relatório Completo de Transações <ArrowUpRight size={14} />
            </button>
          </div>
        </div>

        {/* INSIGHT PROATIVO: Alerta de Inatividade (Risco de Cancelamento) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-red-500/10 text-red-400 rounded-lg"><ShieldAlert size={14} /></div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Atenção: Risco de Churn</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">Lojas que pararam de registrar logins. Ideal entrar em contato para suporte preventivo.</p>
            
            <div className="divide-y divide-slate-800/50">
              {churnRisk.map((res) => (
                <div key={res.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{res.nome}</h4>
                    <span className="text-[10px] bg-slate-950 px-1.5 py-0.5 rounded text-slate-500 font-mono border border-slate-800">Plano: {res.plano}</span>
                  </div>
                  <span className="text-xs font-bold text-red-400 bg-red-500/5 px-2.5 py-1 border border-red-500/10 rounded-xl font-mono">
                    {res.diasInativo} dias off
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full mt-4 py-2.5 bg-slate-950 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-xl text-xs font-bold text-slate-400 transition flex items-center justify-center gap-1">
            Visualizar Todos os Inativos <ChevronRight size={14} />
          </button>
        </div>

      </div>

      {/* 3️⃣ SEÇÃO: LISTAGEM DE AUDITORIA DE SEGURANÇA */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Histórico de Segurança e Bloqueios Rápidos</h3>
          <p className="text-xs text-slate-400 mt-0.5">Auditoria master de acessos suspensos por administradores de lojas locais</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="text-[11px] uppercase text-slate-500 font-bold border-b border-slate-800 bg-slate-950/20">
                <th className="pb-3 pl-4">Colaborador Suspenso</th>
                <th className="pb-3">Estabelecimento</th>
                <th className="pb-3">Motivação Declarada</th>
                <th className="pb-3 pr-4 text-right">Data/Horário</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-300 divide-y divide-slate-800/50">
              {ultimosBloqueios.map((bloqueio) => (
                <tr key={bloqueio.id} className="hover:bg-slate-800/10 transition group">
                  <td className="py-3.5 pl-4">
                    <div className="flex items-center gap-2">
                      <UserX size={14} className="text-red-400" />
                      <span className="font-semibold text-slate-200">{bloqueio.nome}</span>
                      <span className="text-[10px] font-mono text-slate-600">ID: {bloqueio.id}</span>
                    </div>
                  </td>
                  <td className="py-3.5 text-slate-400 font-medium">{bloqueio.restaurante}</td>
                  <td className="py-3.5 italic text-slate-400 max-w-xs truncate" title={bloqueio.motivo}>
                    "{bloqueio.motivo}"
                  </td>
                  <td className="py-3.5 pr-4 text-right font-mono text-slate-500 text-[11px]">{bloqueio.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}