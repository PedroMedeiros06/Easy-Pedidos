import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { authApi } from "../api/base/auth";
import { limparSessao } from "../api/httpClient";

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

// Estados da validação de sessão feita ao abrir o app.
const CHECANDO = "checando";
const OK = "ok";
const INVALIDA = "invalida";

export function ClientProtectedRoute() {
  const token = localStorage.getItem("@App:token");
  const memberRaw = localStorage.getItem("@App:member");

  // Checagem síncrona: nem tem credencial local -> nem tenta validar.
  const temCredencialLocal = (() => {
    if (!token || !memberRaw) return false;
    try {
      const member = JSON.parse(memberRaw);
      return ["owner", "employee"].includes(member.member_access);
    } catch {
      return false;
    }
  })();

  const [estado, setEstado] = useState(temCredencialLocal ? CHECANDO : INVALIDA);

  useEffect(() => {
    if (!temCredencialLocal) return;

    let vivo = true;
    // Bate no backend uma vez ao montar: se o token expirou, cai aqui e desloga.
    authApi
      .me()
      .then(() => {
        if (vivo) setEstado(OK);
      })
      .catch((err) => {
        // 401/403 já limpam a sessão e redirecionam via httpClient em chamadas normais,
        // mas authApi.me() não passa pelo httpClient — então limpamos aqui.
        if (err?.status === 401 || err?.status === 403) {
          limparSessao();
          if (vivo) setEstado(INVALIDA);
          return;
        }
        // Erro de rede / backend fora do ar: não desloga por isso, deixa entrar
        // e as telas tratam seus próprios erros de fetch.
        if (vivo) setEstado(OK);
      });

    return () => {
      vivo = false;
    };
  }, [temCredencialLocal]);

  if (estado === INVALIDA) {
    return <Navigate to="/login" replace />;
  }

  if (estado === CHECANDO) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-brand" size={28} />
      </div>
    );
  }

  return <Outlet />;
}
