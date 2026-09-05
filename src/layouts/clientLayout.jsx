import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LogOut,
  UserCircle,
  ShoppingCart,
  ClipboardList,
  ReceiptText,
  Package,
  Tag,
  Users,
} from "lucide-react";

export default function ClientLayout() {
  const navigate = useNavigate();

  const baseLink = "flex items-center gap-3 rounded-lg px-3 py-2.5 transition text-sm font-medium";

  const linkClass = ({ isActive }) =>
    `${baseLink} ${
      isActive
        ? "bg-brand text-brand-foreground font-semibold"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    }`;

  let member = null;
  try {
    member = JSON.parse(localStorage.getItem("@App:member") || "null");
  } catch {
    member = null;
  }

  const handleLogout = () => {
    localStorage.removeItem("@App:token");
    localStorage.removeItem("@App:refresh_token");
    localStorage.removeItem("@App:user");
    localStorage.removeItem("@App:member");
    localStorage.removeItem("@App:company");
    localStorage.removeItem("@App:permissions");
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed top-0 left-0 h-screen w-64 bg-card text-card-foreground border-r border-border flex flex-col justify-between">
        <div>
          <div className="border-b border-border p-6">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Pedidos App</h1>
            <p className="text-xs text-muted-foreground mt-1">Painel do Estabelecimento</p>
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
              Operação
            </span>

            <NavLink to="pdv" className={linkClass}>
              <ShoppingCart size={16} />
              PDV
            </NavLink>

            <NavLink to="comandas" className={linkClass}>
              <ReceiptText size={16} />
              Comandas
            </NavLink>

            <NavLink to="pedidos" className={linkClass}>
              <ClipboardList size={16} />
              Pedidos
            </NavLink>

            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-1 block">
              Cardápio
            </span>

            <NavLink to="produtos" className={linkClass}>
              <Package size={16} />
              Produtos
            </NavLink>

            <NavLink to="categorias" className={linkClass}>
              <Tag size={16} />
              Categorias
            </NavLink>

            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-1 block">
              Administração
            </span>

            <NavLink to="equipe" className={linkClass}>
              <Users size={16} />
              Equipe
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
                {member?.member_name || member?.email || "Usuário"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate capitalize">
                {member?.member_access || "membro"}
              </p>
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

      <main className="flex-1 ml-64 p-6">
        <Outlet />
      </main>
    </div>
  );
}
