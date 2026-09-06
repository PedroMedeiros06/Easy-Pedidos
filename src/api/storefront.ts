import type {
  Category,
  CatalogItem,
  Order,
  CreateStorefrontOrderPayload,
} from "@/types/catalog";

const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Rotas públicas da vitrine digital — sem autenticação, sem token.
// :companyCode precisa vir com o prefixo "E-" (igual login), ex: "E-1002".

export interface StorefrontData {
  company: {
    companyId: number;
    companyCode: string;
    companyName: string;
    companyLocation: {
      city?: string;
      state?: string;
      [key: string]: unknown;
    } | null;
  };
  categories: Category[];
  catalogItems: CatalogItem[];
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const raw = (data as { message?: unknown }).message;
    const message = Array.isArray(raw) ? raw.join(", ") : (raw as string | undefined);
    throw new Error(message || "Ocorreu um erro na requisição.");
  }

  return data as T;
}

function normalizarCompanyCode(companyCode: string | undefined): string {
  const codigo = (companyCode || "").trim().toUpperCase();
  return codigo.startsWith("E-") ? codigo : `E-${codigo}`;
}

export const storefrontApi = {
  get: async (companyCode: string | undefined): Promise<StorefrontData> => {
    const codigo = normalizarCompanyCode(companyCode);
    const res = await fetch(`${API_URL}/storefront/${codigo}`);
    return parseResponse<StorefrontData>(res);
  },

  createOrder: async (
    companyCode: string | undefined,
    payload: CreateStorefrontOrderPayload,
  ): Promise<Order> => {
    const codigo = normalizarCompanyCode(companyCode);
    const res = await fetch(`${API_URL}/storefront/${codigo}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return parseResponse<Order>(res);
  },
};
