// Tipos compartilhados do domínio de cardápio (ingredientes, itens, categorias).
// Fonte de verdade: notas do backend em ClaudeContexts/MesaFlow/Backend.

export type IngredientUnit = "ml" | "g" | "unid";

export interface Ingredient {
  ingredientId: string;
  companyId: number;
  ingredientName: string;
  unit: IngredientUnit;
  quantity: number;
  lowStockAt: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientPayload {
  ingredientName: string;
  unit: IngredientUnit;
  quantity: number;
  lowStockAt?: number | null;
}

// PUT: partial update, manda só o que muda.
export type UpdateIngredientPayload = Partial<CreateIngredientPayload>;

// Vínculo ingrediente <-> item de catálogo.
// included = faz parte da receita (consumido sempre).
// addon = opcional, cliente escolhe; pode ter preço extra.
export type CatalogItemIngredientRole = "included" | "addon";

export interface CatalogItemIngredientInput {
  ingredientId: string;
  role: CatalogItemIngredientRole;
  quantityUsed?: number;
  addonPriceCents?: number;
  // Só faz sentido em role "included": se true, o cliente pode tirar ("sem cebola").
  // Backend ignora/força false pra addon. Default false.
  removable?: boolean;
}

// Como cada ingrediente vinculado volta em GET /catalog-items.
export interface CatalogItemIngredientRef {
  ingredientId: string;
  ingredientName: string;
  unit: IngredientUnit;
  role: CatalogItemIngredientRole;
  quantityUsed: number | null;
  addonPriceCents: number | null;
  // true só em included que o dono marcou como removível pelo cliente.
  removable: boolean;
}

// Ingrediente da receita que o cliente pode remover, como vem na vitrine pública
// (GET /storefront → catalogItems[].removableIngredients). Só id + nome, sem quantidade.
export interface RemovableIngredient {
  ingredientId: string;
  ingredientName: string;
}

export type DiscountType = "value" | "percentage";

export type OrderOrigin = "pdv" | "storefront";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

// Máquina de estados do pedido (backend, desde 2026-09-06).
// Fluxo linear pending -> confirmed -> preparing -> ready -> completed.
// cancelled alcançável de qualquer status não-terminal.
// completed e cancelled são terminais. Transição inválida = 400.
const FLUXO_LINEAR: OrderStatus[] = [
  "pending",
  "confirmed",
  "preparing",
  "ready",
  "completed",
];

export const STATUS_TERMINAIS: OrderStatus[] = ["completed", "cancelled"];

export function statusEhTerminal(status: OrderStatus): boolean {
  return STATUS_TERMINAIS.includes(status);
}

// Status para os quais o pedido pode transicionar a partir do atual.
// Não inclui o próprio status atual (mandar o mesmo é no-op, não uma transição).
export function proximosStatusValidos(atual: OrderStatus): OrderStatus[] {
  if (statusEhTerminal(atual)) return [];
  const idx = FLUXO_LINEAR.indexOf(atual);
  const proximo = idx >= 0 && idx < FLUXO_LINEAR.length - 1 ? [FLUXO_LINEAR[idx + 1]] : [];
  return [...proximo, "cancelled"];
}

export interface OrderItemAddon {
  ingredientId: string;
  ingredientName: string;
  priceCents: number;
}

export interface OrderItem {
  orderItemId: string;
  itemId: string;
  itemName: string;
  unitPriceCents: number;
  quantity: number;
  totalCents: number;
  addons?: OrderItemAddon[];
  // Ingredientes `included` que o cliente tirou nessa linha ("sem cebola").
  // Não afeta preço. `[]` se nenhum.
  removed?: OrderItemAddon[];
}

export interface Order {
  orderId: string;
  companyId: number;
  origin: OrderOrigin;
  status: OrderStatus;
  customerName: string | null;
  customerPhone: string | null;
  paymentMethod: string | null;
  discountValue: number;
  discountType: DiscountType;
  subtotalCents: number;
  totalCents: number;
  notes: string | null;
  createdByMemberId: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

export interface OrderItemInput {
  itemId: string;
  quantity: number;
  addonIngredientIds?: string[];
  // ids de ingrediente `included` + `removable` daquele item que o cliente tirou.
  removedIngredientIds?: string[];
}

export interface CreateOrderPayload {
  items: OrderItemInput[];
  customerName?: string;
  customerPhone?: string;
  paymentMethod?: string;
  discountValue?: number;
  discountType?: DiscountType;
  notes?: string;
}

export interface CreateStorefrontOrderPayload {
  items: OrderItemInput[];
  customerName: string;
  customerPhone: string;
  notes?: string;
}

// Foto de um item de catálogo. `sortOrder` 0 = capa.
// Gerenciada pelos endpoints POST/DELETE/PATCH /catalog-items/:id/images
// (upload é separado do POST/PUT do item). Máx 4 por item.
export interface CatalogItemImage {
  imageId: string;
  url: string;
  sortOrder: number;
  createdAt?: string;
}

export const MAX_FOTOS_PRODUTO = 4;
// Limite do arquivo cru aceito pelo backend antes da recompressão (sharp).
export const MAX_UPLOAD_FOTO_BYTES = 5 * 1024 * 1024;
export const TIPOS_FOTO_ACEITOS = ["image/jpeg", "image/png", "image/webp"] as const;

export interface CatalogItem {
  itemId: string;
  companyId: number;
  itemName: string;
  itemDescription: string | null;
  priceCents: number;
  categoryId: string | null;
  categoryName: string | null;
  // Sempre igual à `url` da foto de sortOrder 0, ou null se sem foto (retrocompat).
  imageUrl: string | null;
  // Fotos do item, ordenadas por sortOrder (0 = capa). Até 4.
  images?: CatalogItemImage[];
  discountValue: number;
  discountType: DiscountType;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  ingredients?: {
    included: CatalogItemIngredientRef[];
    addons: CatalogItemIngredientRef[];
  };
  // Shape reduzido usado pela vitrine pública (GET /storefront/:code).
  addons?: StorefrontAddon[];
  // Vitrine pública: dá pra montar >= 1 unidade agora? (todo `included` com estoque).
  // Item sem ingrediente rastreado vem sempre true. Ausente fora da vitrine.
  available?: boolean;
  // Quantas unidades da receita cheia cabem no estoque atual (menor floor(quantity/quantityUsed)
  // entre os `included`). null = sem ingrediente rastreado, sem limite. Vem em GET /catalog-items
  // e GET /storefront. Teto conservador — remover ingrediente sobe o teto real, mas o backend
  // não recalcula por combinação; o POST revalida.
  maxQuantity?: number | null;
  // Só na vitrine pública: ingredientes da receita que o cliente pode tirar ("sem X").
  // `[]` se o item não tem nenhum removível. Ausente fora da vitrine.
  removableIngredients?: RemovableIngredient[];
}

export interface StorefrontAddon {
  ingredientId: string;
  ingredientName: string;
  priceCents: number;
}

// Normaliza os adicionais de um item, venha do endpoint autenticado
// (ingredients.addons) ou do público (addons flat).
export function extrairAddons(item: CatalogItem): StorefrontAddon[] {
  if (item.addons && item.addons.length > 0) {
    return item.addons.map((a) => ({
      ingredientId: a.ingredientId,
      ingredientName: a.ingredientName,
      priceCents: a.priceCents ?? 0,
    }));
  }
  const fromIngredients = item.ingredients?.addons ?? [];
  return fromIngredients.map((a) => ({
    ingredientId: a.ingredientId,
    ingredientName: a.ingredientName,
    priceCents: a.addonPriceCents ?? 0,
  }));
}

// Normaliza os ingredientes removíveis de um item, venha do endpoint autenticado
// (ingredients.included com removable: true) ou do público (removableIngredients flat).
export function extrairRemoviveis(item: CatalogItem): RemovableIngredient[] {
  if (item.removableIngredients) {
    return item.removableIngredients.map((r) => ({
      ingredientId: r.ingredientId,
      ingredientName: r.ingredientName,
    }));
  }
  const incluidos = item.ingredients?.included ?? [];
  return incluidos
    .filter((i) => i.removable)
    .map((i) => ({ ingredientId: i.ingredientId, ingredientName: i.ingredientName }));
}

export interface Category {
  categoryId: string;
  companyId: number;
  categoryName: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
