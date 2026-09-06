import { apiFetch } from "./httpClient";
import type {
  Ingredient,
  CreateIngredientPayload,
  UpdateIngredientPayload,
} from "@/types/catalog";

// Ingredientes / matéria-prima do estabelecimento logado.
// Substituiu o antigo /stock. Escopo resolvido pelo companyId do token.
// Permissões backend: stock.view / stock.create / stock.update / stock.delete.

export const ingredientsApi = {
  list: () => apiFetch<Ingredient[]>("/ingredients"),

  create: (payload: CreateIngredientPayload) =>
    apiFetch<Ingredient>("/ingredients", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  update: (id: string, payload: UpdateIngredientPayload) =>
    apiFetch<Ingredient>(`/ingredients/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // Ajuste incremental de quantidade (entrada/saída de estoque).
  // delta negativo maior que a quantidade disponível -> 400.
  adjust: (id: string, delta: number) =>
    apiFetch<Ingredient>(`/ingredients/${id}/adjust`, {
      method: "PATCH",
      body: JSON.stringify({ delta }),
    }),

  remove: (id: string) =>
    apiFetch<{ message: string }>(`/ingredients/${id}`, {
      method: "DELETE",
    }),
};
