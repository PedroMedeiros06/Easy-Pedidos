const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/company";


export const companyApi = {

  list: async (Limit) => {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error("Erro ao buscar companias");
    return res.json();
  },

  create: async (dados) => {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message?.[0] || "Erro ao criar copania");
    }
    return res.json();
  },

  delet: async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Erro ao deletar compania");
    }
    return res.json();
  },

  changeState: async (id, ativo, motivo) => {
    const res = await fetch(`${BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ativo, motivo }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Erro ao alterar status");
    }
    return res.json();
  },

  update: async (id, dados) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message?.[0] || "Erro ao atualizar compania");
    }

    return res.json();
  }
};