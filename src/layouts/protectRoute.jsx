import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute() {
  const token = localStorage.getItem("@App:token");
  const memberRaw = localStorage.getItem("@App:member");


  // =========================================
  // NÃO AUTENTICADO
  // =========================================

  if (!token || !memberRaw) {
    return (<Navigate to="/login" replace /> );
  }

  try {
    const member = JSON.parse(memberRaw);

    // =========================================
    // VERIFICA PERMISSÃO
    // =========================================

    if (member.member_access !== "administrator") {

      return ( <Navigate to="/app" replace /> );
    }

    // =========================================
    // AUTORIZADO
    // =========================================

    return <Outlet />;

  } catch (error) {

    localStorage.removeItem("@App:token");
    localStorage.removeItem("@App:refresh_token");
    localStorage.removeItem("@App:user");
    localStorage.removeItem("@App:member");

    return ( <Navigate to="/login" replace /> );
  }
}