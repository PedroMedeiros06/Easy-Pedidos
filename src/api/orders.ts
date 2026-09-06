import { apiFetch } from "./httpClient";
import type {
  Order,
  OrderOrigin,
  OrderStatus,
  CreateOrderPayload,
} from "@/types/catalog";

// Pedidos do próprio estabelecimento logado (PDV + vitrine pública, tudo junto).
// Escopo resolvido pelo companyId do token — nunca precisa passar companyId aqui.

interface ListParams {
  origin?: OrderOrigin;
  status?: OrderStatus;
  limit?: number;
}

export const ordersApi = {
  list: ({ origin, status, limit = 50 }: ListParams = {}) => {
    const params = new URLSearchParams();
    if (origin) params.set("origin", origin);
    if (status) params.set("status", status);
    params.set("limit", String(limit));
    return apiFetch<Order[]>(`/orders?${params.toString()}`);
  },

  create: (payload: CreateOrderPayload) =>
    apiFetch<Order>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateStatus: (id: string, status: OrderStatus) =>
    apiFetch<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
