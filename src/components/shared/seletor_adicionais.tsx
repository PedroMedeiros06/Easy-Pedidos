import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import type { CatalogItem, StorefrontAddon } from "@/types/catalog";
import { extrairAddons } from "@/types/catalog";
import type { AddonEscolhido } from "@/lib/carrinho";

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Props {
  // Item cujos adicionais estão sendo escolhidos. null = modal fechado.
  item: CatalogItem | null;
  onCancelar: () => void;
  onConfirmar: (addons: AddonEscolhido[]) => void;
  // Aparência: "dark" pro PDV (painel escuro), "light" pra vitrine.
  tema?: "dark" | "light";
  // Ids de addon já escolhidos (edição de uma linha do carrinho). undefined = novo item.
  selecaoInicial?: string[];
}

export default function SeletorAdicionais({
  item,
  onCancelar,
  onConfirmar,
  tema = "light",
  selecaoInicial,
}: Props) {
  const modoEdicao = selecaoInicial !== undefined;
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());

  useEffect(() => {
    setSelecionados(new Set(selecaoInicial ?? []));
  }, [item, selecaoInicial]);

  if (!item) return null;

  const addons: StorefrontAddon[] = extrairAddons(item);

  const toggle = (id: string) => {
    setSelecionados((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmar = () => {
    const escolhidos: AddonEscolhido[] = addons
      .filter((a) => selecionados.has(a.ingredientId))
      .map((a) => ({
        ingredientId: a.ingredientId,
        ingredientName: a.ingredientName,
        priceCents: a.priceCents,
      }));
    onConfirmar(escolhidos);
  };

  const escuro = tema === "dark";
  const cardCls = escuro
    ? "bg-zinc-900 border-white/10 text-zinc-50"
    : "bg-card border-border text-foreground";
  const linhaCls = escuro
    ? "border-white/10 hover:bg-white/5"
    : "border-border hover:bg-muted/40";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancelar} />
      <div className={`relative w-full max-w-sm rounded-2xl border p-5 space-y-4 ${cardCls}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold leading-tight">{item.itemName}</h3>
            <p className={`text-xs mt-0.5 ${escuro ? "text-zinc-400" : "text-muted-foreground"}`}>
              {modoEdicao ? "Ajuste os adicionais deste item" : "Escolha os adicionais (opcional)"}
            </p>
          </div>
          <button
            onClick={onCancelar}
            className={escuro ? "text-zinc-400 hover:text-zinc-50" : "text-muted-foreground hover:text-foreground"}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {addons.map((addon) => {
            const ativo = selecionados.has(addon.ingredientId);
            return (
              <button
                key={addon.ingredientId}
                type="button"
                onClick={() => toggle(addon.ingredientId)}
                className={`w-full flex items-center justify-between gap-2 rounded-lg border p-3 text-left transition ${linhaCls} ${
                  ativo ? "border-brand ring-1 ring-brand" : ""
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                      ativo ? "bg-brand border-brand text-brand-foreground" : "border-current opacity-40"
                    }`}
                  >
                    {ativo && <Plus size={12} />}
                  </span>
                  <span className="text-sm font-medium truncate">{addon.ingredientName}</span>
                </div>
                <span className="text-xs font-semibold text-brand shrink-0">
                  {addon.priceCents > 0 ? `+ ${formatarMoeda(addon.priceCents)}` : "grátis"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancelar}
            className={`flex-1 h-10 rounded-lg text-sm font-semibold transition ${
              escuro ? "bg-white/5 text-zinc-300 hover:bg-white/10" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            className="flex-1 h-10 rounded-lg bg-brand text-brand-foreground hover:bg-brand/90 text-sm font-semibold transition"
          >
            {modoEdicao ? "Salvar" : "Adicionar ao carrinho"}
          </button>
        </div>
      </div>
    </div>
  );
}
