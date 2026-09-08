import { useState, useEffect } from "react";
import { Plus, X, Check } from "lucide-react";
import type { CatalogItem, StorefrontAddon, RemovableIngredient } from "@/types/catalog";
import { extrairAddons, extrairRemoviveis } from "@/types/catalog";
import type { AddonEscolhido, RemovidoEscolhido } from "@/lib/carrinho";

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export interface PersonalizacaoEscolhida {
  addons: AddonEscolhido[];
  removidos: RemovidoEscolhido[];
}

interface Props {
  // Item cuja personalização está sendo escolhida. null = modal fechado.
  item: CatalogItem | null;
  onCancelar: () => void;
  onConfirmar: (escolha: PersonalizacaoEscolhida) => void;
  // Aparência: "dark" pro PDV (painel escuro), "light" pra vitrine.
  tema?: "dark" | "light";
  // Seleção já feita (edição de uma linha do carrinho). undefined = novo item.
  addonsIniciais?: string[];
  removidosIniciais?: string[];
}

export default function SeletorAdicionais({
  item,
  onCancelar,
  onConfirmar,
  tema = "light",
  addonsIniciais,
  removidosIniciais,
}: Props) {
  const modoEdicao = addonsIniciais !== undefined || removidosIniciais !== undefined;
  const [addonsSel, setAddonsSel] = useState<Set<string>>(new Set());
  const [removidosSel, setRemovidosSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    setAddonsSel(new Set(addonsIniciais ?? []));
    setRemovidosSel(new Set(removidosIniciais ?? []));
  }, [item, addonsIniciais, removidosIniciais]);

  if (!item) return null;

  const addons: StorefrontAddon[] = extrairAddons(item);
  const removiveis: RemovableIngredient[] = extrairRemoviveis(item);

  const toggleAddon = (id: string) => {
    setAddonsSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleRemovido = (id: string) => {
    setRemovidosSel((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmar = () => {
    onConfirmar({
      addons: addons
        .filter((a) => addonsSel.has(a.ingredientId))
        .map((a) => ({
          ingredientId: a.ingredientId,
          ingredientName: a.ingredientName,
          priceCents: a.priceCents,
        })),
      removidos: removiveis
        .filter((r) => removidosSel.has(r.ingredientId))
        .map((r) => ({ ingredientId: r.ingredientId, ingredientName: r.ingredientName })),
    });
  };

  const escuro = tema === "dark";
  const cardCls = escuro
    ? "bg-zinc-900 border-white/10 text-zinc-50"
    : "bg-card border-border text-foreground";
  const linhaCls = escuro
    ? "border-white/10 hover:bg-white/5"
    : "border-border hover:bg-muted/40";
  const subCls = escuro ? "text-zinc-400" : "text-muted-foreground";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancelar} />
      <div className={`relative w-full max-w-sm rounded-2xl border p-5 space-y-4 ${cardCls}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold leading-tight">{item.itemName}</h3>
            <p className={`text-xs mt-0.5 ${subCls}`}>
              {modoEdicao ? "Ajuste este item" : "Personalize seu item (opcional)"}
            </p>
          </div>
          <button
            onClick={onCancelar}
            className={escuro ? "text-zinc-400 hover:text-zinc-50" : "text-muted-foreground hover:text-foreground"}
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3 max-h-72 overflow-y-auto">
          {addons.length > 0 && (
            <div className="space-y-2">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${subCls}`}>Adicionais</p>
              {addons.map((addon) => {
                const ativo = addonsSel.has(addon.ingredientId);
                return (
                  <button
                    key={addon.ingredientId}
                    type="button"
                    onClick={() => toggleAddon(addon.ingredientId)}
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
          )}

          {removiveis.length > 0 && (
            <div className="space-y-2">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${subCls}`}>
                Remover da receita
              </p>
              {removiveis.map((ing) => {
                const removido = removidosSel.has(ing.ingredientId);
                return (
                  <button
                    key={ing.ingredientId}
                    type="button"
                    onClick={() => toggleRemovido(ing.ingredientId)}
                    className={`w-full flex items-center justify-between gap-2 rounded-lg border p-3 text-left transition ${linhaCls} ${
                      removido ? "border-rose-500 ring-1 ring-rose-500" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                          removido
                            ? "bg-rose-500 border-rose-500 text-white"
                            : "border-current opacity-40"
                        }`}
                      >
                        {removido && <Check size={12} />}
                      </span>
                      <span
                        className={`text-sm font-medium truncate ${removido ? "line-through opacity-70" : ""}`}
                      >
                        {ing.ingredientName}
                      </span>
                    </div>
                    <span className={`text-xs font-semibold shrink-0 ${removido ? "text-rose-500" : subCls}`}>
                      {removido ? "sem" : "com"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {addons.length === 0 && removiveis.length === 0 && (
            <p className={`text-sm text-center py-4 ${subCls}`}>
              Este item não tem opções de personalização.
            </p>
          )}
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
