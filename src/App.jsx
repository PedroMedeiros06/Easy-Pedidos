import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// LAYOUTS
import AdminLayout from "./layouts/AdminLayout";
// import ClientLayout from "./layouts/clientLayout"; // Descomente quando for usar

// PROTETOR DE ROTAS
import ProtectedRoute from "./layouts/protectRoute";

// PÁGINAS DO SUPER ADMIN (Você e seu amigo)
import Dashboard from "./pages/admin/dashboard";
import Restaurantes from "./pages/admin/Restaurantes";
import AdminFuncionarios from "./pages/admin/workers";
import AdminFinance from "./pages/admin/Finance";

// PÁGINAS DO CLIENTE (Donos de Restaurante / Funcionários)
import Login from "./pages/login";
// import ClienteDashboard from "./pages/cliente/Dashboard";
// import CardapioProdutos from "./pages/cliente/Produtos";
// import CaixaPedidos from "./pages/cliente/Pedidos";

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

        {/* =======================================================
            2️⃣ ROTAS DO SUPER ADMIN (PROTEGIDAS)
           ======================================================= */}
        {/* O ProtectedRoute barra quem não tem o token ou quem não é super_admin */}
        <Route element={<ProtectedRoute />}>
          
          <Route path="/admin" element={<AdminLayout />}>
            {/* Se você digitar apenas /admin, ele te joga direto para o dashboard */}
            <Route index element={<Navigate to="dashboard" replace />} />

            {/* URL final: http://localhost:5173/admin/dashboard */}
            <Route path="dashboard" element={<Dashboard />} />
            
            {/* URL final: http://localhost:5173/admin/restaurantes */}
            <Route path="restaurantes" element={<Restaurantes />} />

            {/* URL final: http://localhost:5173/admin/usuarios */}
            <Route path="usuarios" element={<AdminFuncionarios />} />
            
            {/* URL final: http://localhost:5173/admin/financeiro */}
            <Route path="financeiro" element={<AdminFinance />} />
          </Route>

        </Route>

        {/* =======================================================
            3️⃣ ROTAS DO CLIENTE / MULTI-TENANT (Painel das Lojas)
           ======================================================= */}
        {/* Descomente este bloco quando for trabalhar no painel dos restaurantes comuns */}
        {/* <Route path="/app" element={<ClientLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ClienteDashboard />} />
          <Route path="pedidos" element={<CaixaPedidos />} />
          <Route path="produtos" element={<CardapioProdutos />} />
        </Route> 
        */}

        {/* =======================================================
            4️⃣ REDIRECIONAMENTO GLOBAL
           ======================================================= */}
        {/* Se o usuário tentar acessar qualquer rota inexistente, volta para o login */}
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    </BrowserRouter>
  );
}