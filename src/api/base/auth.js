const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const API_URL = BASE_URL + "/auth";

export const authApi = {
  async login(payload) {
    console.log("[authApi.login] URL:", `${API_URL}/login`);
    console.log("[authApi.login] payload:", payload);

    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    console.log("[authApi.login] status:", response.status);
    console.log("[authApi.login] response body:", data);

    if (!response.ok) {
      const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;

      console.error("[authApi.login] erro:", message);

      throw new Error(message || "Falha ao realizar login.");
    }

    return data;
  },

  // Valida a sessão atual. Lança se o token estiver expirado/inválido (401).
  async me() {
    const token = localStorage.getItem("@App:token");

    const response = await fetch(`${API_URL}/me`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      const err = new Error(message || "Sessão inválida.");
      err.status = response.status;
      throw err;
    }

    return data;
  },

  async adminLogin(payload) {
    const response = await fetch(`${BASE_URL}/admin/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      const message = Array.isArray(data.message) ? data.message.join(", ") : data.message;

      throw new Error(message || "Falha ao realizar login.");
    }

    return data;
  },
};
