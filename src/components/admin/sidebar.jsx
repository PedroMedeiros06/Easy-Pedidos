import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  DollarSign,
  LogOut,
  UserCircle,
} from "lucide-react";

export default function Sidebar() {
  const navigate = useNavigate();

  const baseLink =
    "flex items-center gap-3 rounded-lg px-3 py-2.5 transition text-sm font-medium";

  const linkClass = ({ isActive }) =>
    `${baseLink} ${
      isActive
        ? "bg-brand text-brand-foreground font-semibold"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  let admin = null;
  try {
    admin = JSON.parse(localStorage.getItem("@App:admin") || "null");
  } catch {
    admin = null;
  }

  const handleLogout = () => {
    localStorage.removeItem("@App:token");
    localStorage.removeItem("@App:refresh_token");
    localStorage.removeItem("@App:user");
    localStorage.removeItem("@App:admin");
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-card text-card-foreground border-r border-border flex flex-col justify-between">
      <div>
        <div className="border-b border-border p-6">
          <h1 className="text-lg font-bold tracking-tight text-foreground">Pedidos App</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Painel Administrativo</p>
        </div>

        <nav className="flex flex-col gap-1 p-4">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mb-1 block">
            Geral
          </span>

          <NavLink to="dashboard" end className={linkClass}>
            <LayoutDashboard size={16} />
            Início
          </NavLink>

          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-1 block">
            Clientes
          </span>

          <NavLink to="restaurantes" className={linkClass}>
            <Store size={16} />
            Restaurantes
          </NavLink>

          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-1 block">
            Negócios
          </span>

          <NavLink to="financeiro" className={linkClass}>
            <DollarSign size={16} />
            Faturamento Global
          </NavLink>
        </nav>
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-2.5 rounded-xl bg-muted/50 border border-border p-2">
          <div className="size-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <UserCircle size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold truncate text-foreground">
              {admin?.name || admin?.email || "Administrador"}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">administrador</p>
          </div>

          <button
            onClick={handleLogout}
            title="Sair"
            className="shrink-0 size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
