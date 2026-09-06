// Classifica a mensagem de erro do POST /orders e /storefront/:code/orders
// em algo acionável pro usuário. O backend manda tudo como texto em `message`.

export type CategoriaErroPedido =
  | "estoque"
  | "adicional"
  | "item_indisponivel"
  | "item_inexistente"
  | "desconto"
  | "pedido_vazio"
  | "loja_nao_encontrada"
  | "generico";

export interface ErroPedidoTratado {
  categoria: CategoriaErroPedido;
  titulo: string;
  detalhe: string;
  // Dica de ação. Vazio quando não há nada útil a sugerir.
  acao: string;
}

function texto(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "";
}

export function tratarErroPedido(err: unknown): ErroPedidoTratado {
  const msg = texto(err).trim();
  const lower = msg.toLowerCase();

  if (lower.includes("estoque insuficiente")) {
    return {
      categoria: "estoque",
      titulo: "Sem estoque para este pedido",
      detalhe: msg,
      acao: "Reduza a quantidade, remova o item, ou reponha o estoque do ingrediente em Ingredientes.",
    };
  }

  if (lower.includes("adicional")) {
    return {
      categoria: "adicional",
      titulo: "Adicional inválido",
      detalhe: msg,
      acao: "Recarregue o cardápio — um adicional pode ter sido alterado. Refaça a seleção do item.",
    };
  }

  if (lower.includes("não está disponível")) {
    return {
      categoria: "item_indisponivel",
      titulo: "Item indisponível",
      detalhe: msg,
      acao: "Esse produto foi desativado. Remova-o do carrinho para continuar.",
    };
  }

  if (lower.includes("não encontrado no cardápio")) {
    return {
      categoria: "item_inexistente",
      titulo: "Item fora do cardápio",
      detalhe: msg,
      acao: "Esse produto não existe mais. Remova-o do carrinho e recarregue o cardápio.",
    };
  }

  if (lower.includes("desconto percentual")) {
    return {
      categoria: "desconto",
      titulo: "Desconto inválido",
      detalhe: msg,
      acao: "O desconto em porcentagem não pode passar de 100%.",
    };
  }

  if (lower.includes("ao menos um item")) {
    return {
      categoria: "pedido_vazio",
      titulo: "Carrinho vazio",
      detalhe: msg,
      acao: "Adicione ao menos um item antes de finalizar.",
    };
  }

  if (lower.includes("estabelecimento não encontrado")) {
    return {
      categoria: "loja_nao_encontrada",
      titulo: "Loja indisponível",
      detalhe: msg,
      acao: "O link da loja pode estar errado ou a loja está fora do ar. Confira o endereço.",
    };
  }

  return {
    categoria: "generico",
    titulo: "Não foi possível finalizar",
    detalhe: msg || "Ocorreu um erro ao enviar o pedido.",
    acao: "",
  };
}
