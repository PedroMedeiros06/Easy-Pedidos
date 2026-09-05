import { apiFetch } from "./httpClient";

export const integracoesService = {
  buscarCnpj: (cnpj) => apiFetch(`/integrations/cnpj/${cnpj}`),
  buscarCep: (cep) => apiFetch(`/integrations/cep/${cep}`),
};
