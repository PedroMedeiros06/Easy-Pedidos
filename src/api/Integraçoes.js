const API_URL = "http://localhost:3000" + "/integracoes";

function LimparDados(dado) {
    const dadoLimpo = dado.replace(/\D/g, '');
    return dadoLimpo
}

export const integracoesService = {
  // 🏢 Consulta CNPJ no NestJS
  async buscarCnpj(cnpj) {
    let Cnpj = LimparDados(cnpj)
    if (Cnpj.length !== 14) return null;

    const response = await fetch(`${API_URL}/cnpj/${Cnpj}`);
    if (!response.ok) {
      throw new Error('CNPJ não encontrado ou indisponível no momento.');
    }
    return response.json();
  },

  // 📍 Consulta CEP no NestJS
  async buscarCep(cep) {
    let Cep = LimparDados(cep)
    if (Cep.length !== 8) return null;

    const response = await fetch(`${API_URL}/cep/${Cep}`);
    if (!response.ok) {
      throw new Error('CEP não encontrado.');
    }
    return response.json();
  },
};