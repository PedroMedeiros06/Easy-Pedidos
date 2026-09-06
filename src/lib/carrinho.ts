import type { CatalogItem, DiscountType } from "@/types/catalog";

// Adicional escolhido numa linha do carrinho (subconjunto de item.addons).
export interface AddonEscolhido {
  ingredientId: string;
  ingredientName: string;
  priceCents: number;
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

// Chave que separa o mesmo item com adicionais diferentes em linhas distintas.
export function montarLineId(itemId: string, addonIds: string[]): string {
  return `${itemId}|${[...addonIds].sort().join(",")}`;
}

// Adiciona um item ao carrinho, agrupando com a linha existente se item+addons forem iguais.
export function adicionarLinha(
  carrinho: LinhaCarrinho[],
  item: CatalogItem,
  addons: AddonEscolhido[],
): LinhaCarrinho[] {
  const lineId = montarLineId(
    item.itemId,
    addons.map((a) => a.ingredientId),
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

// Troca os adicionais de uma linha existente. Recalcula o lineId; se o novo
// lineId colidir com outra linha igual, funde as quantidades.
export function editarAddonsDaLinha(
  carrinho: LinhaCarrinho[],
  lineId: string,
  novosAddons: AddonEscolhido[],
): LinhaCarrinho[] {
  const alvo = carrinho.find((l) => l.lineId === lineId);
  if (!alvo) return carrinho;

  const novoLineId = montarLineId(
    alvo.itemId,
    novosAddons.map((a) => a.ingredientId),
  );

  if (novoLineId === lineId) {
    return carrinho.map((l) => (l.lineId === lineId ? { ...l, addons: novosAddons } : l));
  }

  const irmao = carrinho.find((l) => l.lineId === novoLineId);
  const semAlvo = carrinho.filter((l) => l.lineId !== lineId);

  if (irmao) {
    return semAlvo.map((l) =>
      l.lineId === novoLineId ? { ...l, quantidade: l.quantidade + alvo.quantidade } : l,
    );
  }

  return [...semAlvo, { ...alvo, lineId: novoLineId, addons: novosAddons }];
}

// Payload de items[] pro POST /orders e POST /storefront/:code/orders.
export function itemsParaPayload(carrinho: LinhaCarrinho[]) {
  return carrinho.map((l) => {
    const base: { itemId: string; quantity: number; addonIngredientIds?: string[] } = {
      itemId: l.itemId,
      quantity: l.quantidade,
    };
    if (l.addons.length > 0) {
      base.addonIngredientIds = l.addons.map((a) => a.ingredientId);
    }
    return base;
  });
}
