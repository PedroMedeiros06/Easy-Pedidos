const BASE_URL = "http://localhost:3000/restaurantes";

export const restauranteApi = {
  listar: async (Limite) => {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error("Erro ao buscar restaurantes");
    return res.json();
  },

  criar: async (dados) => {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message?.[0] || "Erro ao criar restaurante");
    }
    return res.json();
  },

  deletar: async (id) => {
    const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Erro ao deletar restaurante");
    }
    return res.json();
  },

  alterarStatus: async (id, ativo, motivo) => {
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

  atualizar: async (id, dados) => {
    const res = await fetch(`${BASE_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message?.[0] || "Erro ao atualizar restaurante");
    }

    return res.json();
  }
};