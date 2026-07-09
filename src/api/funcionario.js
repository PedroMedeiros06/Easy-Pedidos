export const BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/funcionarios";
console.log(BASE_URL)

export const funcionarioApi = {
listar: async (limite) => {
  const res = await fetch(`${BASE_URL}?limite=${limite}`);
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
        // Se err.message for um array, pega o primeiro. Se for string, usa ela toda.
        const mensagemCompleta = Array.isArray(err.message) 
          ? err.message[0] 
          : (err.message || "Erro ao criar funcionário");
        throw new Error(mensagemCompleta);
      }
      return res.json();
    },

  atualizar: async (id, dados) => {
    console.log(dados)
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

  alternarStatus: async (id, ativo, motivo) => {
    const res = await fetch(`${BASE_URL}/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ativo: Boolean(ativo), // Força a ser booleano puro
        motivo: motivo ? String(motivo).trim() : undefined // Evita enviar string vazia se não houver motivo
      }),
    });
    
    if (!res.ok) {
      const err = await res.json();
      // Se o erro for do class-validator, ele vem em um array dentro de err.message
      const mensagemErro = Array.isArray(err.message) ? err.message.join(', ') : err.message;
      throw new Error(mensagemErro || "Erro ao alterar status");
    }
    return res.json();
  }
};