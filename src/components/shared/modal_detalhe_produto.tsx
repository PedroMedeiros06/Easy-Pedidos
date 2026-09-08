import { useEffect, useMemo, useState } from "react";
import { X, Plus, Check, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import type { CatalogItem, StorefrontAddon, RemovableIngredient } from "@/types/catalog";
import { extrairAddons, extrairRemoviveis } from "@/types/catalog";
import type { AddonEscolhido, RemovidoEscolhido } from "@/lib/carrinho";
import { precoItemComDescontoCentavos } from "@/lib/carrinho";
import type { PersonalizacaoEscolhida } from "@/components/shared/seletor_adicionais";

function formatarMoeda(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface Props {
  // Item em exibição. null = modal fechado.
  item: CatalogItem | null;
  // Item indisponível (esgotado) ou já no teto do carrinho — desabilita o botão.
  bloqueado?: boolean;
  rotuloBotao?: string;
  onFechar: () => void;
  // Adiciona ao carrinho com os adicionais/remoções já escolhidos aqui no modal.
  onAdicionar: (escolha: PersonalizacaoEscolhida) => void;
  tema?: "dark" | "light";
  // Seleção inicial (edição de uma linha do carrinho). undefined = novo item.
  addonsIniciais?: string[];
  removidosIniciais?: string[];
}

// Modal central: fotos, descrição, e escolha de adicionais/remoções direto aqui.
// Não depende mais do SeletorAdicionais — o cliente monta tudo num lugar só.
export default function ModalDetalheProduto({
  item,
  bloqueado = false,
  rotuloBotao = "Adicionar ao carrinho",
  onFechar,
  onAdicionar,
  tema = "light",
  addonsIniciais,
  removidosIniciais,
}: Props) {
  const [fotoAtual, setFotoAtual] = useState(0);
  const [addonsSel, setAddonsSel] = useState<Set<string>>(new Set());
  const [removidosSel, setRemovidosSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFotoAtual(0);
    setAddonsSel(new Set(addonsIniciais ?? []));
    setRemovidosSel(new Set(removidosIniciais ?? []));
  }, [item, addonsIniciais, removidosIniciais]);

  const fotos = useMemo(
    () => [...(item?.images ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [item],
  );
  const addons: StorefrontAddon[] = useMemo(
    () => (item ? extrairAddons(item) : []),
    [item],
  );
  const removiveis: RemovableIngredient[] = useMemo(
    () => (item ? extrairRemoviveis(item) : []),
    [item],
  );

  const precoBaseCentavos = item
    ? precoItemComDescontoCentavos(item.priceCents, item.discountValue, item.discountType)
    : 0;
  const extrasCentavos = addons
    .filter((a) => addonsSel.has(a.ingredientId))
    .reduce((soma, a) => soma + a.priceCents, 0);
  const precoTotalCentavos = precoBaseCentavos + extrasCentavos;

  if (!item) return null;

  const temDesconto = precoBaseCentavos < item.priceCents;
  const modoEdicao = addonsIniciais !== undefined || removidosIniciais !== undefined;

  const escuro = tema === "dark";
  const cardCls = escuro
    ? "bg-zinc-900 border-white/10 text-zinc-50"
    : "bg-card border-border text-foreground";
  const subCls = escuro ? "text-zinc-400" : "text-muted-foreground";
  const linhaCls = escuro ? "border-white/10 hover:bg-white/5" : "border-border hover:bg-muted/40";

  const irFoto = (delta: number) =>
    setFotoAtual((i) => (i + delta + fotos.length) % fotos.length);

  const toggle = (set: React.Dispatch<React.SetStateAction<Set<string>>>, id: string) => {
    set((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirmar = () => {
    const escolha: PersonalizacaoEscolhida = {
      addons: addons
        .filter((a) => addonsSel.has(a.ingredientId))
        .map<AddonEscolhido>((a) => ({
          ingredientId: a.ingredientId,
          ingredientName: a.ingredientName,
          priceCents: a.priceCents,
        })),
      removidos: removiveis
        .filter((r) => removidosSel.has(r.ingredientId))
        .map<RemovidoEscolhido>((r) => ({
          ingredientId: r.ingredientId,
          ingredientName: r.ingredientName,
        })),
    };
    onAdicionar(escolha);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div
        className={`relative w-full max-w-md rounded-2xl border overflow-hidden flex flex-col max-h-[90vh] ${cardCls}`}
      >
        <button
          onClick={onFechar}
          className="absolute top-3 right-3 z-10 size-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
          aria-label="Fechar"
        >
          <X size={16} />
        </button>

        {/* Carrossel de fotos */}
        <div className={`relative aspect-4/3 shrink-0 ${escuro ? "bg-white/5" : "bg-muted"}`}>
          {fotos.length > 0 ? (
            <>
              <img
                src={fotos[fotoAtual].url}
                alt={`${item.itemName} — foto ${fotoAtual + 1}`}
                className="w-full h-full object-cover"
              />
              {fotos.length > 1 && (
                <>
                  <button
                    onClick={() => irFoto(-1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => irFoto(1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 size-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition"
                    aria-label="Próxima foto"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5">
                    {fotos.map((f, i) => (
                      <button
                        key={f.imageId}
                        onClick={() => setFotoAtual(i)}
                        className={`size-1.5 rounded-full transition ${
                          i === fotoAtual ? "bg-white w-4" : "bg-white/50"
                        }`}
                        aria-label={`Ir para foto ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${subCls}`}>
              <ImageOff size={32} />
              <span className="text-xs">Sem foto</span>
            </div>
          )}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <h3 className="text-lg font-bold leading-tight">{item.itemName}</h3>
            {item.itemDescription && (
              <p className={`text-sm mt-1.5 ${subCls}`}>{item.itemDescription}</p>
            )}
          </div>

          {addons.length > 0 && (
            <div className="space-y-2">
              <p className={`text-[11px] font-bold uppercase tracking-wider ${subCls}`}>
                Adicionais
              </p>
              {addons.map((addon) => {
                const ativo = addonsSel.has(addon.ingredientId);
                return (
                  <button
                    key={addon.ingredientId}
                    type="button"
                    onClick={() => toggle(setAddonsSel, addon.ingredientId)}
                    className={`w-full flex items-center justify-between gap-2 rounded-lg border p-3 text-left transition ${linhaCls} ${
                      ativo ? "border-brand ring-1 ring-brand" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                          ativo
                            ? "bg-brand border-brand text-brand-foreground"
                            : "border-current opacity-40"
                        }`}
                      >
                        {ativo && <Plus size={12} />}
                      </span>
                      <span className="text-sm font-medium truncate">{addon.ingredientName}</span>
                    </span>
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
                O que vem nele — desmarque para remover
              </p>
              {removiveis.map((ing) => {
                const removido = removidosSel.has(ing.ingredientId);
                return (
                  <button
                    key={ing.ingredientId}
                    type="button"
                    onClick={() => toggle(setRemovidosSel, ing.ingredientId)}
                    className={`w-full flex items-center justify-between gap-2 rounded-lg border p-3 text-left transition ${linhaCls} ${
                      removido ? "border-rose-500 ring-1 ring-rose-500" : ""
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span
                        className={`size-4 rounded border flex items-center justify-center shrink-0 ${
                          removido
                            ? "bg-rose-500 border-rose-500 text-white"
                            : "bg-brand border-brand text-brand-foreground"
                        }`}
                      >
                        {removido ? <X size={12} /> : <Check size={12} />}
                      </span>
                      <span
                        className={`text-sm font-medium truncate ${
                          removido ? "line-through opacity-70" : ""
                        }`}
                      >
                        {ing.ingredientName}
                      </span>
                    </span>
                    <span
                      className={`text-xs font-semibold shrink-0 ${removido ? "text-rose-500" : subCls}`}
                    >
                      {removido ? "sem" : "com"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {addons.length === 0 && removiveis.length === 0 && (
            <p className={`text-sm ${subCls}`}>Este item não tem opções de personalização.</p>
          )}
        </div>

        {/* Rodapé: preço + adicionar */}
        <div className={`shrink-0 border-t p-4 flex items-center justify-between gap-3 ${linhaCls}`}>
          <div>
            {temDesconto && extrasCentavos === 0 && (
              <span className={`text-xs line-through block ${subCls}`}>
                {formatarMoeda(item.priceCents)}
              </span>
            )}
            <span className="text-lg font-bold text-brand">
              {formatarMoeda(precoTotalCentavos)}
            </span>
          </div>
          <button
            type="button"
            disabled={bloqueado}
            onClick={confirmar}
            className="h-10 px-5 rounded-lg bg-brand text-brand-foreground hover:bg-brand/90 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Plus size={15} />
            {modoEdicao ? "Salvar" : rotuloBotao}
          </button>
        </div>
      </div>
    </div>
  );
}
