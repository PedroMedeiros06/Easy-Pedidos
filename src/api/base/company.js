import { apiFetch } from "../httpClient";

export const companyApi = {
  list: (limit = 10) => apiFetch(`/companies?limit=${limit}`),

  findById: (id) => apiFetch(`/companies/${id}`),

  create: (payload) =>
    apiFetch("/companies", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    apiFetch(`/companies/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateStatus: (id, blocked, reason) =>
    apiFetch(`/companies/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ blocked, reason }),
    }),
};
