import type { CatalogItem, DiscountType, OrderItemInput } from "@/types/catalog";

// Adicional escolhido numa linha do carrinho (subconjunto de item.addons).
export interface AddonEscolhido {
  ingredientId: string;
  ingredientName: string;
  priceCents: number;
}

// Ingrediente da receita que o cliente tirou nessa linha ("sem cebola").
export interface RemovidoEscolhido {
  ingredientId: string;
  ingredientName: string;
}

// Item genérico de carrinho, usado no PDV e na vitrine.
export interface LinhaCarrinho {
  lineId: string;
  itemId: string;
  itemName: string;
  priceCents: number;
  discountValue: number;
  discountType: DiscountType;
  quantidade: number;
  addons: AddonEscolhido[];
  removidos: RemovidoEscolhido[];
}

// Formato mínimo de "addon" que o backend devolve em catalog-items / storefront.
export interface AddonDisponivel {
  ingredientId: string;
  ingredientName: string;
  priceCents: number | null;
}

export function precoItemComDescontoCentavos(
  priceCents: number,
  discountValue: number,
  discountType: DiscountType,
): number {
  const desconto =
    discountType === "percentage"
      ? priceCents * (Math.min(discountValue, 100) / 100)
      : discountValue;
  return Math.max(priceCents - desconto, 0);
}

// Preço unitário da linha = item com desconto + soma dos adicionais.
// Remover ingrediente NÃO muda preço (regra do backend).
export function precoUnitarioLinhaCentavos(linha: LinhaCarrinho): number {
  const base = precoItemComDescontoCentavos(
    linha.priceCents,
    linha.discountValue,
    linha.discountType,
  );
  const extras = linha.addons.reduce((soma, a) => soma + a.priceCents, 0);
  return base + extras;
}

export function subtotalLinhaCentavos(linha: LinhaCarrinho): number {
  return precoUnitarioLinhaCentavos(linha) * linha.quantidade;
}

// Chave que separa o mesmo item com adicionais/remoções diferentes em linhas distintas.
// "X-Bacon sem cebola" e "X-Bacon normal" precisam de lineIds diferentes.
export function montarLineId(
  itemId: string,
  addonIds: string[],
  removidoIds: string[] = [],
): string {
  const addons = [...addonIds].sort().join(",");
  const removidos = [...removidoIds].sort().join(",");
  return `${itemId}|${addons}|${removidos}`;
}

// Adiciona um item ao carrinho, agrupando com a linha existente se item+addons+remoções forem iguais.
export function adicionarLinha(
  carrinho: LinhaCarrinho[],
  item: CatalogItem,
  addons: AddonEscolhido[],
  removidos: RemovidoEscolhido[] = [],
): LinhaCarrinho[] {
  const lineId = montarLineId(
    item.itemId,
    addons.map((a) => a.ingredientId),
    removidos.map((r) => r.ingredientId),
  );
  const existente = carrinho.find((l) => l.lineId === lineId);
  if (existente) {
    return carrinho.map((l) =>
      l.lineId === lineId ? { ...l, quantidade: l.quantidade + 1 } : l,
    );
  }
  return [
    ...carrinho,
    {
      lineId,
      itemId: item.itemId,
      itemName: item.itemName,
      priceCents: item.priceCents,
      discountValue: item.discountValue ?? 0,
      discountType: item.discountType ?? "value",
      quantidade: 1,
      addons,
      removidos,
    },
  ];
}

export function alterarQuantidadeLinha(
  carrinho: LinhaCarrinho[],
  lineId: string,
  delta: number,
): LinhaCarrinho[] {
  return carrinho
    .map((l) => (l.lineId === lineId ? { ...l, quantidade: l.quantidade + delta } : l))
    .filter((l) => l.quantidade > 0);
}

export function removerLinha(carrinho: LinhaCarrinho[], lineId: string): LinhaCarrinho[] {
  return carrinho.filter((l) => l.lineId !== lineId);
}

// Quantas unidades de um item já estão no carrinho, somando todas as linhas
// desse itemId (variações de addon/remoção consomem a mesma receita).
export function quantidadeNoCarrinho(carrinho: LinhaCarrinho[], itemId: string): number {
  return carrinho
    .filter((l) => l.itemId === itemId)
    .reduce((soma, l) => soma + l.quantidade, 0);
}

// Ainda dá pra adicionar +1 desse item? maxQuantity null/undefined = sem limite.
export function podeAdicionarMais(
  carrinho: LinhaCarrinho[],
  itemId: string,
  maxQuantity: number | null | undefined,
): boolean {
  if (maxQuantity == null) return true;
  return quantidadeNoCarrinho(carrinho, itemId) < maxQuantity;
}

// Troca os adicionais E as remoções de uma linha existente. Recalcula o lineId;
// se o novo lineId colidir com outra linha igual, funde as quantidades.
export function editarPersonalizacaoDaLinha(
  carrinho: LinhaCarrinho[],
  lineId: string,
  novosAddons: AddonEscolhido[],
  novosRemovidos: RemovidoEscolhido[],
): LinhaCarrinho[] {
  const alvo = carrinho.find((l) => l.lineId === lineId);
  if (!alvo) return carrinho;

  const novoLineId = montarLineId(
    alvo.itemId,
    novosAddons.map((a) => a.ingredientId),
    novosRemovidos.map((r) => r.ingredientId),
  );

  if (novoLineId === lineId) {
    return carrinho.map((l) =>
      l.lineId === lineId ? { ...l, addons: novosAddons, removidos: novosRemovidos } : l,
    );
  }

  const irmao = carrinho.find((l) => l.lineId === novoLineId);
  const semAlvo = carrinho.filter((l) => l.lineId !== lineId);

  if (irmao) {
    return semAlvo.map((l) =>
      l.lineId === novoLineId ? { ...l, quantidade: l.quantidade + alvo.quantidade } : l,
    );
  }

  return [
    ...semAlvo,
    { ...alvo, lineId: novoLineId, addons: novosAddons, removidos: novosRemovidos },
  ];
}

// Payload de items[] pro POST /orders e POST /storefront/:code/orders.
export function itemsParaPayload(carrinho: LinhaCarrinho[]): OrderItemInput[] {
  return carrinho.map((l) => {
    const base: OrderItemInput = {
      itemId: l.itemId,
      quantity: l.quantidade,
    };
    if (l.addons.length > 0) {
      base.addonIngredientIds = l.addons.map((a) => a.ingredientId);
    }
    if (l.removidos.length > 0) {
      base.removedIngredientIds = l.removidos.map((r) => r.ingredientId);
    }
    return base;
  });
}
