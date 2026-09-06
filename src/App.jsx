import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// LAYOUTS
import AdminLayout from "./layouts/adminLayout";
import ClientLayout from "./layouts/clientLayout";

// PROTETORES DE ROTA
import { AdminProtectedRoute, ClientProtectedRoute } from "./layouts/protectRoute";

// PÁGINAS DO SUPER ADMIN (Você e seu amigo)
import Dashboard from "./pages/admin/dashboard";
import Restaurantes from "./pages/admin/restaurantes";
import AdminFuncionarios from "./pages/admin/workers";
import AdminFinance from "./pages/admin/finance";

// PÁGINAS DO CLIENTE (Donos de Restaurante / Funcionários)
import Login from "./pages/login";
import AdminLogin from "./pages/adminLogin";
import ClientDashboard from "./pages/client/dashboard";
import ClientPdv from "./pages/client/pdv";
import ClientComandas from "./pages/client/comandas";
import ClientPedidos from "./pages/client/pedidos";
import ClientProdutos from "./pages/client/produtos";
import ClientCategorias from "./pages/client/categorias";
import ClientIngredientes from "./pages/client/ingredientes";
import ClientEquipe from "./pages/client/equipe";

// PÁGINA PÚBLICA (Cliente Final / Vitrine do Estabelecimento)
import CatalogoLoja from "./pages/public/catalogoLoja";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* =======================================================
            1️⃣ ROTAS PÚBLICAS
           ======================================================= */}
        {/* Qualquer pessoa acessando a raiz ou /login cai na tela de entrada */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Vitrine pública do estabelecimento — sem autenticação, acessada pelo cliente final */}
        <Route path="/loja/:companyCode" element={<CatalogoLoja />} />

        {/* =======================================================
            2️⃣ ROTAS DO SUPER ADMIN (PROTEGIDAS)
           ======================================================= */}
        {/* AdminProtectedRoute barra quem não tem token de system admin (@App:admin) */}
        <Route element={<AdminProtectedRoute />}>

          <Route path="/admin" element={<AdminLayout />}>
            {/* Se você digitar apenas /admin, ele te joga direto para o dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />

            {/* URL final: http://localhost:5173/admin/dashboard */}
            <Route path="dashboard" element={<Dashboard />} />

            {/* URL final: http://localhost:5173/admin/restaurantes */}
            <Route path="restaurantes" element={<Restaurantes />} />

            {/* URL final: http://localhost:5173/admin/restaurantes/:companyId/usuarios */}
            <Route path="restaurantes/:companyId/usuarios" element={<AdminFuncionarios />} />

            {/* URL final: http://localhost:5173/admin/financeiro */}
            <Route path="financeiro" element={<AdminFinance />} />
          </Route>

        </Route>

        {/* =======================================================
            3️⃣ ROTAS DO CLIENTE / MULTI-TENANT (Painel das Lojas)
           ======================================================= */}
        {/* ClientProtectedRoute barra quem não tem token de company user (@App:member, owner/employee) */}
        <Route element={<ClientProtectedRoute />}>

          <Route path="/app" element={<ClientLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<ClientDashboard />} />
            <Route path="pdv" element={<ClientPdv />} />
            <Route path="comandas" element={<ClientComandas />} />
            <Route path="pedidos" element={<ClientPedidos />} />
            <Route path="produtos" element={<ClientProdutos />} />
            <Route path="categorias" element={<ClientCategorias />} />
            <Route path="ingredientes" element={<ClientIngredientes />} />
            <Route path="equipe" element={<ClientEquipe />} />
          </Route>

        </Route>

        {/* =======================================================
            4️⃣ REDIRECIONAMENTO GLOBAL
           ======================================================= */}
        {/* Se o usuário tentar acessar qualquer rota inexistente, volta para o login */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}
