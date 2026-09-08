import { apiFetch } from "./httpClient";
import type { CatalogItem, CatalogItemImage, Category } from "@/types/catalog";

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

  // ---- Fotos do item (upload separado do POST/PUT) ----

  // Adiciona uma foto. Backend recomprime (WebP 1200×1200 q80). Máx 4 fotos.
  // Retorna a foto criada + a lista completa já ordenada.
  addImage: (itemId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<{ image: CatalogItemImage; images: CatalogItemImage[] }>(
      `/catalog-items/${itemId}/images`,
      { method: "POST", body: form },
    );
  },

  removeImage: (itemId: string, imageId: string) =>
    apiFetch<{ message: string; images: CatalogItemImage[] }>(
      `/catalog-items/${itemId}/images/${imageId}`,
      { method: "DELETE" },
    ),

  // imageIds = todas as fotos atuais na ordem desejada; a 1ª vira capa.
  reorderImages: (itemId: string, imageIds: string[]) =>
    apiFetch<{ images: CatalogItemImage[] }>(
      `/catalog-items/${itemId}/images/reorder`,
      { method: "PATCH", body: JSON.stringify({ imageIds }) },
    ),
};
