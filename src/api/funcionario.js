const BASE_URL = "http://localhost:3000/funcionarios";

export const funcionarioApi = {
  listar: async () => {
    const res = await fetch(BASE_URL);
    if (!res.ok) throw new Error("Erro ao buscar funcionários");
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
      throw new Error(err.message?.[0] || "Erro ao criar funcionário");
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
      throw new Error(err.message?.[0] || "Erro ao atualizar funcionário");
    }
    return res.json();
  },

  alternarStatus: async (id, statusAtual, motivo) => {
    const res = await fetch(`${BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusAtual, motivo }),
    });
    if (!res.ok) throw new Error("Erro ao alterar status do funcionário");
    return res.json();
  }
};