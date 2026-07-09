import { NavLink } from "react-router-dom";

import { 
  LayoutDashboard, 
  Store, 
  UserPlus, 
  DollarSign, 
  LifeBuoy, 
  Settings,
  Layers
} from "lucide-react";

export default function Sidebar() {
  const baseLink = "flex items-center gap-3 rounded-lg px-4 py-3 transition text-sm font-medium";

  const linkClass = ({ isActive }) =>
    `${baseLink} ${
      isActive
        ? "bg-blue-600 text-white font-semibold"
        : "text-slate-400 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-slate-900 text-white border-r border-slate-800/60 flex flex-col justify-between">
      <div>
        {/* Header do Painel */}
        <div className="border-b border-slate-800/60 p-6">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
            Painel de Admin
          </h1>
          <p className="text-xs text-slate-500 mt-1">Gestão da Plataforma</p>
        </div>

        {/* Links de Navegação */}
        <nav className="flex flex-col gap-1 p-4">
          <span className="text-xxs font-bold text-slate-600 uppercase tracking-wider px-4 mb-2 block">
            Geral
          </span>

          <NavLink to="dashboard  " end className={linkClass}>
            <LayoutDashboard size={18} />
            Início
          </NavLink>

          <span className="text-xxs font-bold text-slate-600 uppercase tracking-wider px-4 mt-4 mb-2 block">
            Clientes
          </span>

          <NavLink to="restaurantes" className={linkClass}>
            <Store size={18} />
            Restaurantes
          </NavLink>

          <NavLink to="usuarios" className={linkClass}>
            <UserPlus size={18} />
            Acessos
          </NavLink>

          <span className="text-xxs font-bold text-slate-600 uppercase tracking-wider px-4 mt-4 mb-2 block">
            Negócios
          </span>

          <NavLink to="planos" className={linkClass}>
            <Layers size={18} />
            Planos & Assinaturas
          </NavLink>

          <NavLink to="finance" className={linkClass}>
            <DollarSign size={18} />
            Faturamento Global
          </NavLink>

          <NavLink to="support" className={linkClass}>
            <LifeBuoy size={18} />
            Suporte Técnico
          </NavLink>
        </nav>
      </div>

      {/* Rodapé da Sidebar */}
      <div className="p-4 border-t border-slate-900">
        <NavLink to="/settings" className={linkClass}>
          <Settings size={18} />
          Configurações do Sistema
        </NavLink>
      </div>
    </aside>
  );
}