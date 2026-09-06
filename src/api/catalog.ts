import { apiFetch } from "./httpClient";
import type { CatalogItem, Category } from "@/types/catalog";

// Categorias e itens de catálogo do próprio estabelecimento logado.
// Escopo resolvido pelo companyId do token — nunca precisa passar companyId aqui.

export const categoriesApi = {
  list: (limit = 50) => apiFetch<Category[]>(`/categories?limit=${limit}`),

  create: (payload: Record<string, unknown>) =>
    apiFetch<Category>("/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Record<string, unknown>) =>
    apiFetch<Category>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    apiFetch<{ message: string }>(`/categories/${id}`, {
      method: "DELETE",
    }),
};

export const catalogItemsApi = {
  list: (categoryId?: string) =>
    apiFetch<CatalogItem[]>(
      `/catalog-items${categoryId ? `?categoryId=${categoryId}` : ""}`,
    ),

  create: (payload: Record<string, unknown>) =>
    apiFetch<CatalogItem>("/catalog-items", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: Record<string, unknown>) =>
    apiFetch<CatalogItem>(`/catalog-items/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  remove: (id: string) =>
    apiFetch<{ message: string }>(`/catalog-items/${id}`, {
      method: "DELETE",
    }),
};
