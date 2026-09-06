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
}

// Como cada ingrediente vinculado volta em GET /catalog-items.
export interface CatalogItemIngredientRef {
  ingredientId: string;
  ingredientName: string;
  unit: IngredientUnit;
  role: CatalogItemIngredientRole;
  quantityUsed: number | null;
  addonPriceCents: number | null;
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

export interface CatalogItem {
  itemId: string;
  companyId: number;
  itemName: string;
  itemDescription: string | null;
  priceCents: number;
  categoryId: string | null;
  categoryName: string | null;
  imageUrl: string | null;
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

export interface Category {
  categoryId: string;
  companyId: number;
  categoryName: string;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
