import React from "react";
import { Navigate, Outlet } from "react-router-dom";

export function AdminProtectedRoute() {
  const token = localStorage.getItem("@App:token");
  const adminRaw = localStorage.getItem("@App:admin");

  if (!token || !adminRaw) {
    return <Navigate to="/admin/login" replace />;
  }

  try {
    JSON.parse(adminRaw);

    return <Outlet />;
  } catch (error) {
    localStorage.removeItem("@App:token");
    localStorage.removeItem("@App:refresh_token");
    localStorage.removeItem("@App:user");
    localStorage.removeItem("@App:admin");

    return <Navigate to="/admin/login" replace />;
  }
}

export function ClientProtectedRoute() {
  const token = localStorage.getItem("@App:token");
  const memberRaw = localStorage.getItem("@App:member");

  if (!token || !memberRaw) {
    return <Navigate to="/login" replace />;
  }

  try {
    const member = JSON.parse(memberRaw);

    if (!["owner", "employee"].includes(member.member_access)) {
      throw new Error("Acesso inválido para company user.");
    }

    return <Outlet />;
  } catch (error) {
    localStorage.removeItem("@App:token");
    localStorage.removeItem("@App:refresh_token");
    localStorage.removeItem("@App:user");
    localStorage.removeItem("@App:member");
    localStorage.removeItem("@App:company");
    localStorage.removeItem("@App:permissions");

    return <Navigate to="/login" replace />;
  }
}
