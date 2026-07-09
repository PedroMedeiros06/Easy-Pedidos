import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  // 1. Busca o usuário salvo no localStorage na hora do login
  const token = localStorage.getItem("@App:token");
  const userRaw = localStorage.getItem("@App:user");

  // Se não houver token ou dados do usuário, barra o acesso imediatamente
  if (!token || !userRaw) {
    return <Navigate to="/login" replace />;
  }

  const usuario = JSON.parse(userRaw);

  // 2. Verifica se a permissão gravada é exatamente a de administrador do sistema
  if (usuario.permissao !== "super_admin") {
    // Se for um cliente comum tentando invadir o painel admin, joga ele para o painel dele ou login
    return <Navigate to="/login" replace />;
  }

  // Se passou em todas as validações, renderiza as rotas filhas normalmente
  return <Outlet />;
}