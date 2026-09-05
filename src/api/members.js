import { apiFetch } from "./httpClient";

// Usado pelo painel do próprio dono/funcionário logado (company user).
export const membersApi = {
  list: (limit = 10) => apiFetch(`/members?limit=${limit}`),

  create: (payload) =>
    apiFetch("/members", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id, payload) =>
    apiFetch(`/members/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateStatus: (id, active) =>
    apiFetch(`/members/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
};

// Usado pelo painel do system admin, que enxerga membros de qualquer empresa.
export const adminMembersApi = {
  list: (companyId, limit = 10) =>
    apiFetch(`/companies/${companyId}/members?limit=${limit}`),

  create: (companyId, payload) =>
    apiFetch(`/companies/${companyId}/members`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (companyId, memberId, payload) =>
    apiFetch(`/companies/${companyId}/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateStatus: (companyId, memberId, active) =>
    apiFetch(`/companies/${companyId}/members/${memberId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ active }),
    }),
};
