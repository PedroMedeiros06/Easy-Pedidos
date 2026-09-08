import { apiFetch } from "./httpClient";

// Visão geral do sistema pro painel do system admin (GET /admin/dashboard).
// Agregação calculada na hora no backend. Tudo em centavos, inteiro.

export interface AdminDashboardOverview {
  companies: { total: number; active: number; blocked: number };
  members: { total: number };
  orders: { total: number; last30Days: number; cancelled: number };
  revenue: {
    totalCents: number;
    last30DaysCents: number;
    averageTicketCents: number;
  };
}

export const dashboardApi = {
  overview: () => apiFetch<AdminDashboardOverview>("/admin/dashboard"),
};

// Ping/pong de disponibilidade da API (GET /admin/health).
// Sempre 200 se autenticado — `status: "degraded"` é resposta válida, não erro.

export type HealthStatus = "up" | "down";
export type HealthGroup = "infra" | "area";

export interface HealthCheck {
  service: string;
  group: HealthGroup;
  status: HealthStatus;
  latencyMs: number;
  error?: string;
}

export interface HealthReport {
  status: "up" | "degraded";
  checkedAt: string;
  checks: HealthCheck[];
}

export const healthApi = {
  get: () => apiFetch<HealthReport>("/admin/health"),
};
