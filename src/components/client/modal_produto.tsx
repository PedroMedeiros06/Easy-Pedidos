import { useState, useEffect, useRef, type ChangeEvent, type FormEvent } from "react";
import {
  Package,
  Loader2,
  Plus,
  Trash2,
  Boxes,
  ImagePlus,
  Star,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react";
import { catalogItemsApi } from "../../api/catalog";
import { ingredientsApi } from "@/api/ingredients";
import {
  MAX_FOTOS_PRODUTO,
  MAX_UPLOAD_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
} from "@/types/catalog";
import type {
  CatalogItem,
  CatalogItemImage,
  Category,
  CatalogItemIngredientInput,
  Ingredient,
} from "@/types/catalog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TipoDesconto = "value" | "percentage";

interface FormState {
  itemName: string;
  itemDescription: string;
  categoryId: string;
  preco: string; // reais (string), convertido pra priceCents ao salvar
  descontoValor: string;
  tipoDesconto: TipoDesconto;
  active: boolean;
}

// Linha da UI de ingredientes. addonPreco em reais (string), só usado quando role === "addon".
// removable só vale pra role === "included" (cliente pode tirar no pedido).
interface LinhaIngrediente {
  ingredientId: string;
  role: "included" | "addon";
  quantityUsed: string;
  addonPreco: string;
  removable: boolean;
}

const FORM_INICIAL: FormState = {
  itemName: "",
  itemDescription: "",
  categoryId: "",
  preco: "",
  descontoValor: "",
  tipoDesconto: "value",
  active: true,
};

type AbaId = "geral" | "ingredientes" | "fotos";

const ABAS: { id: AbaId; rotulo: string; Icone: typeof Package }[] = [
  { id: "geral", rotulo: "Geral", Icone: SlidersHorizontal },
  { id: "ingredientes", rotulo: "Ingredientes", Icone: Boxes },
  { id: "fotos", rotulo: "Fotos", Icone: ImagePlus },
];

function centavosParaReais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

function reaisParaCentavos(valor: string): number {
  return Math.round((Number(String(valor).replace(",", ".")) || 0) * 100);
}

// Valida um arquivo de foto no client antes de mandar pro backend.
// Retorna mensagem de erro ou null se ok.
function validarFoto(file: File): string | null {
  if (!(TIPOS_FOTO_ACEITOS as readonly string[]).includes(file.type)) {
    return `"${file.name}": formato inválido. Envie JPEG, PNG ou WebP.`;
  }
  if (file.size > MAX_UPLOAD_FOTO_BYTES) {
    return `"${file.name}": excede 5 MB. Envie um arquivo menor.`;
  }
  return null;
}

function calcularPrecoFinalCentavos(
  precoCentavos: number,
  descontoValor: number,
  tipoDesconto: TipoDesconto,
): number {
  const desconto =
    tipoDesconto === "percentage"
      ? precoCentavos * (Math.min(descontoValor, 100) / 100)
      : descontoValor;
  return Math.max(precoCentavos - desconto, 0);
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  produtoParaEditar?: CatalogItem | null;
  categorias?: Category[];
}

export default function ModalProduto({
  isOpen,
  onClose,
  onSuccess,
  produtoParaEditar = null,
  categorias = [],
}: Props) {
  const isEdicao = !!produtoParaEditar;

  const [formData, setFormData] = useState<FormState>(FORM_INICIAL);
  const [linhas, setLinhas] = useState<LinhaIngrediente[]>([]);
  const [ingredientesDisponiveis, setIngredientesDisponiveis] = useState<Ingredient[]>([]);
  const [carregandoIngredientes, setCarregandoIngredientes] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [aba, setAba] = useState<AbaId>("geral");

  // ---- Fotos (só em edição; precisa de itemId) ----
  const [fotos, setFotos] = useState<CatalogItemImage[]>([]);
  const [fotosBusy, setFotosBusy] = useState(false);
  const [erroFoto, setErroFoto] = useState("");
  const inputFotoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (produtoParaEditar) {
      setFormData({
        itemName: produtoParaEditar.itemName || "",
        itemDescription: produtoParaEditar.itemDescription || "",
        categoryId: produtoParaEditar.categoryId || "",
        preco: centavosParaReais(produtoParaEditar.priceCents ?? 0),
        descontoValor:
          produtoParaEditar.discountType === "percentage"
            ? String(produtoParaEditar.discountValue ?? "")
            : centavosParaReais(produtoParaEditar.discountValue ?? 0),
        tipoDesconto: produtoParaEditar.discountType || "value",
        active: produtoParaEditar.active ?? true,
      });

      const ing = produtoParaEditar.ingredients;
      const todas = [...(ing?.included ?? []), ...(ing?.addons ?? [])];
      setLinhas(
        todas.map((v) => ({
          ingredientId: v.ingredientId,
          role: v.role,
          quantityUsed: v.quantityUsed != null ? String(v.quantityUsed) : "",
          addonPreco: v.addonPriceCents != null ? centavosParaReais(v.addonPriceCents) : "",
          removable: !!v.removable,
        })),
      );
      const imgs = [...(produtoParaEditar.images ?? [])].sort(
        (a, b) => a.sortOrder - b.sortOrder,
      );
      setFotos(imgs);
    } else {
      setFormData(FORM_INICIAL);
      setLinhas([]);
      setFotos([]);
    }
    setErro("");
    setErroFoto("");
    setAba("geral");
  }, [isOpen, produtoParaEditar]);

  useEffect(() => {
    if (!isOpen) return;
    setCarregandoIngredientes(true);
    ingredientsApi
      .list()
      .then(setIngredientesDisponiveis)
      .catch(() => setIngredientesDisponiveis([]))
      .finally(() => setCarregandoIngredientes(false));
  }, [isOpen]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const unidadeDe = (ingredientId: string): string =>
    ingredientesDisponiveis.find((i) => i.ingredientId === ingredientId)?.unit ?? "";

  const adicionarLinha = () => {
    setLinhas((prev) => [
      ...prev,
      { ingredientId: "", role: "included", quantityUsed: "", addonPreco: "", removable: false },
    ]);
  };

  const removerLinha = (index: number) => {
    setLinhas((prev) => prev.filter((_, i) => i !== index));
  };

  const atualizarLinha = <K extends keyof LinhaIngrediente>(
    index: number,
    campo: K,
    valor: LinhaIngrediente[K],
  ) => {
    setLinhas((prev) => prev.map((l, i) => (i === index ? { ...l, [campo]: valor } : l)));
  };

  // ---- Handlers de fotos (edição). Cada ação chama onSuccess pra a lista
  // externa refletir a nova capa/ordem; o estado local `fotos` fica em sincronia
  // com o retorno do backend. ----

  const itemId = produtoParaEditar?.itemId ?? null;

  const handleSelecionarFotos = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite re-selecionar o mesmo arquivo depois
    if (!itemId || arquivos.length === 0) return;

    setErroFoto("");

    const vagas = MAX_FOTOS_PRODUTO - fotos.length;
    if (vagas <= 0) {
      setErroFoto(`Máximo de ${MAX_FOTOS_PRODUTO} fotos por produto.`);
      return;
    }
    const paraEnviar = arquivos.slice(0, vagas);
    if (arquivos.length > vagas) {
      setErroFoto(
        `Só cabem mais ${vagas} foto(s). As demais foram ignoradas.`,
      );
    }

    for (const file of paraEnviar) {
      const msg = validarFoto(file);
      if (msg) {
        setErroFoto(msg);
        return;
      }
    }

    setFotosBusy(true);
    try {
      for (const file of paraEnviar) {
        const { images } = await catalogItemsApi.addImage(itemId, file);
        setFotos(images);
      }
      onSuccess();
    } catch (err) {
      setErroFoto(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setFotosBusy(false);
    }
  };

  const handleRemoverFoto = async (imageId: string) => {
    if (!itemId) return;
    setErroFoto("");
    setFotosBusy(true);
    try {
      const { images } = await catalogItemsApi.removeImage(itemId, imageId);
      setFotos(images);
      onSuccess();
    } catch (err) {
      setErroFoto(err instanceof Error ? err.message : "Erro ao remover foto.");
    } finally {
      setFotosBusy(false);
    }
  };

  const reordenarFotos = async (novaOrdem: CatalogItemImage[]) => {
    if (!itemId) return;
    setErroFoto("");
    setFotos(novaOrdem); // otimista
    setFotosBusy(true);
    try {
      const { images } = await catalogItemsApi.reorderImages(
        itemId,
        novaOrdem.map((f) => f.imageId),
      );
      setFotos(images);
      onSuccess();
    } catch (err) {
      setErroFoto(err instanceof Error ? err.message : "Erro ao reordenar fotos.");
      // reverte pro que o backend tinha
      onSuccess();
    } finally {
      setFotosBusy(false);
    }
  };

  const moverFoto = (index: number, dir: -1 | 1) => {
    const alvo = index + dir;
    if (alvo < 0 || alvo >= fotos.length) return;
    const copia = [...fotos];
    [copia[index], copia[alvo]] = [copia[alvo], copia[index]];
    void reordenarFotos(copia);
  };

  const definirCapa = (index: number) => {
    if (index === 0) return;
    const copia = [...fotos];
    const [f] = copia.splice(index, 1);
    copia.unshift(f);
    void reordenarFotos(copia);
  };

  const precoCentavos = reaisParaCentavos(formData.preco);
  const descontoCentavosOuPercentual =
    formData.tipoDesconto === "percentage"
      ? Number(String(formData.descontoValor).replace(",", ".")) || 0
      : reaisParaCentavos(formData.descontoValor);
  const precoFinalCentavos = calcularPrecoFinalCentavos(
    precoCentavos,
    descontoCentavosOuPercentual,
    formData.tipoDesconto,
  );

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.itemName.trim()) {
      setAba("geral");
      setErro("Informe o nome do produto.");
      return;
    }

    if (!formData.preco || precoCentavos <= 0) {
      setAba("geral");
      setErro("Informe um preço válido.");
      return;
    }

    // Validação das linhas de ingrediente (só as preenchidas contam).
    const linhasPreenchidas = linhas.filter((l) => l.ingredientId);
    const ids = linhasPreenchidas.map((l) => l.ingredientId);
    if (new Set(ids).size !== ids.length) {
      setAba("ingredientes");
      setErro("Há ingredientes repetidos na receita. Cada ingrediente só pode aparecer uma vez.");
      return;
    }

    const ingredients: CatalogItemIngredientInput[] = [];
    for (const l of linhasPreenchidas) {
      const qtd = Number(String(l.quantityUsed).replace(",", "."));
      if (!Number.isFinite(qtd) || qtd <= 0) {
        setAba("ingredientes");
        setErro("Informe a quantidade usada de cada ingrediente (maior que zero).");
        return;
      }
      const entrada: CatalogItemIngredientInput = {
        ingredientId: l.ingredientId,
        role: l.role,
        quantityUsed: qtd,
      };
      if (l.role === "addon") {
        entrada.addonPriceCents = reaisParaCentavos(l.addonPreco);
      } else if (l.removable) {
        // Só included pode ser removível; backend ignora removable em addon.
        entrada.removable = true;
      }
      ingredients.push(entrada);
    }

    setSalvando(true);
    setErro("");

    try {
      const payload: Record<string, unknown> = {
        itemName: formData.itemName.trim(),
        itemDescription: formData.itemDescription.trim() || undefined,
        categoryId: formData.categoryId || undefined,
        priceCents: precoCentavos,
        discountValue: descontoCentavosOuPercentual,
        discountType: formData.tipoDesconto,
        active: formData.active,
      };

      // Na edição sempre mandamos ingredients (inclusive [] pra limpar).
      // Na criação, só se houver alguma linha — evita enviar array vazio à toa.
      if (isEdicao || ingredients.length > 0) {
        payload.ingredients = ingredients;
      }

      if (isEdicao && produtoParaEditar) {
        await catalogItemsApi.update(produtoParaEditar.itemId, payload);
      } else {
        await catalogItemsApi.create(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar produto.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Package size={18} className="text-brand" />
            {isEdicao ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        {/* Navegação por abas */}
        <div className="px-6 border-b border-border flex gap-1">
          {ABAS.map(({ id, rotulo, Icone }) => {
            const contador =
              id === "ingredientes"
                ? linhas.filter((l) => l.ingredientId).length
                : id === "fotos"
                  ? fotos.length
                  : 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setAba(id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                  aba === id
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icone size={15} />
                {rotulo}
                {contador > 0 && (
                  <span className="ml-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-semibold px-1.5 py-0.5 leading-none">
                    {contador}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <form
          id="form-produto"
          onSubmit={handleSalvar}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
        >
          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {/* ===================== Aba: Geral ===================== */}
          <div className={aba === "geral" ? "space-y-4" : "hidden"}>
          <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="itemName">Nome do Produto</Label>
            <Input
              required
              id="itemName"
              type="text"
              name="itemName"
              value={formData.itemName}
              onChange={handleInputChange}
              placeholder="Ex: X-Bacon"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="itemDescription">Descrição (opcional)</Label>
            <Input
              id="itemDescription"
              type="text"
              name="itemDescription"
              value={formData.itemDescription}
              onChange={handleInputChange}
              placeholder="Ex: Pão, carne, queijo, bacon crocante"
            />
          </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(valor: string) =>
                setFormData((prev) => ({ ...prev, categoryId: valor }))
              }
            >
              <SelectTrigger id="categoryId" className="h-10! w-full">
                <SelectValue placeholder="Selecione uma categoria">
                  {(valor: string) =>
                    categorias.find((c) => c.categoryId === valor)?.categoryName ??
                    "Selecione uma categoria"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.categoryId} value={cat.categoryId}>
                    {cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preco">Preço (R$)</Label>
            <Input
              required
              id="preco"
              type="text"
              inputMode="decimal"
              name="preco"
              value={formData.preco}
              onChange={handleInputChange}
              placeholder="0,00"
            />
          </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descontoValor">Desconto do Produto</Label>
            <div className="flex h-10 rounded-md border border-input bg-transparent overflow-hidden focus-within:ring-1 focus-within:ring-ring">
              <Input
                id="descontoValor"
                type="text"
                inputMode="decimal"
                name="descontoValor"
                value={formData.descontoValor}
                onChange={handleInputChange}
                placeholder="0"
                className="h-10 flex-1 min-w-0 border-0 bg-transparent focus-visible:ring-0 rounded-none"
              />
              <div className="flex shrink-0 border-l border-input">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, tipoDesconto: "value" }))}
                  title="Desconto em reais"
                  className={`px-2.5 text-xs font-semibold transition ${
                    formData.tipoDesconto === "value"
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  R$
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, tipoDesconto: "percentage" }))}
                  title="Desconto em porcentagem"
                  className={`px-2.5 text-xs font-semibold transition border-l border-input ${
                    formData.tipoDesconto === "percentage"
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  %
                </button>
              </div>
            </div>
            {formData.preco && (
              <p className="text-xs text-muted-foreground">
                Preço final com desconto:{" "}
                <span className="font-semibold text-brand">
                  {(precoFinalCentavos / 100).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </span>
              </p>
            )}
          </div>

          <label className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/40 transition cursor-pointer select-none">
            <Checkbox
              checked={formData.active}
              onCheckedChange={(checked: boolean) =>
                setFormData((prev) => ({ ...prev, active: !!checked }))
              }
            />
            <div>
              <div className="text-sm font-medium text-foreground">Disponível no cardápio</div>
              <div className="text-xs text-muted-foreground">
                Desmarque para ocultar o produto sem excluí-lo.
              </div>
            </div>
          </label>
          </div>

          {/* ===================== Aba: Fotos ===================== */}
          <div className={aba === "fotos" ? "space-y-2" : "hidden"}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImagePlus size={16} className="text-brand" />
                <Label className="text-sm">Fotos do Produto</Label>
              </div>
              {isEdicao && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => inputFotoRef.current?.click()}
                  disabled={fotosBusy || fotos.length >= MAX_FOTOS_PRODUTO}
                >
                  {fotosBusy ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  Adicionar
                </Button>
              )}
            </div>

            <input
              ref={inputFotoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              onChange={handleSelecionarFotos}
            />

            {!isEdicao ? (
              <p className="text-xs text-muted-foreground py-2">
                Salve o produto primeiro para adicionar fotos.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Até {MAX_FOTOS_PRODUTO} fotos (JPEG, PNG ou WebP, máx 5 MB cada).
                  A primeira é a <span className="font-medium">capa</span>. O
                  servidor comprime automaticamente.
                </p>

                {erroFoto && (
                  <Alert variant="destructive">
                    <AlertDescription>{erroFoto}</AlertDescription>
                  </Alert>
                )}

                {fotos.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Nenhuma foto adicionada.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {fotos.map((foto, index) => (
                      <div
                        key={foto.imageId}
                        className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted/20"
                      >
                        <img
                          src={foto.url}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />

                        {index === 0 && (
                          <span className="absolute top-1 left-1 flex items-center gap-1 rounded bg-brand text-brand-foreground text-[10px] font-semibold px-1.5 py-0.5">
                            <Star size={10} className="fill-current" />
                            Capa
                          </span>
                        )}

                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-0.5 bg-black/55 p-1 opacity-0 group-hover:opacity-100 transition">
                          <div className="flex gap-0.5">
                            <button
                              type="button"
                              title="Mover para a esquerda"
                              disabled={fotosBusy || index === 0}
                              onClick={() => moverFoto(index, -1)}
                              className="text-white/90 hover:text-white disabled:opacity-30 p-0.5"
                            >
                              <ArrowLeft size={14} />
                            </button>
                            <button
                              type="button"
                              title="Mover para a direita"
                              disabled={fotosBusy || index === fotos.length - 1}
                              onClick={() => moverFoto(index, 1)}
                              className="text-white/90 hover:text-white disabled:opacity-30 p-0.5"
                            >
                              <ArrowRight size={14} />
                            </button>
                            {index !== 0 && (
                              <button
                                type="button"
                                title="Definir como capa"
                                disabled={fotosBusy}
                                onClick={() => definirCapa(index)}
                                className="text-white/90 hover:text-white disabled:opacity-30 p-0.5"
                              >
                                <Star size={14} />
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            title="Remover foto"
                            disabled={fotosBusy}
                            onClick={() => handleRemoverFoto(foto.imageId)}
                            className="text-rose-300 hover:text-rose-200 disabled:opacity-30 p-0.5"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* ===================== Aba: Ingredientes ===================== */}
          <div className={aba === "ingredientes" ? "space-y-2" : "hidden"}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes size={16} className="text-brand" />
                <Label className="text-sm">Ingredientes</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarLinha}
                disabled={ingredientesDisponiveis.length === 0}
              >
                <Plus size={14} /> Adicionar
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Receita</span> é consumido em todo pedido do item.{" "}
              <span className="font-medium">Adicional</span> o cliente escolhe na hora e pode ter
              preço extra.
            </p>

            {carregandoIngredientes ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                <Loader2 size={14} className="animate-spin" /> Carregando ingredientes...
              </div>
            ) : ingredientesDisponiveis.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Nenhum ingrediente cadastrado. Cadastre em Ingredientes para vincular à receita.
              </p>
            ) : linhas.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Nenhum ingrediente vinculado a este produto.
              </p>
            ) : (
              <div className="space-y-2">
                {linhas.map((linha, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-border p-2.5 space-y-2 bg-muted/20"
                  >
                    <div className="flex gap-2">
                      <Select
                        value={linha.ingredientId}
                        onValueChange={(valor: string) =>
                          atualizarLinha(index, "ingredientId", valor)
                        }
                      >
                        <SelectTrigger className="h-9! flex-1">
                          <SelectValue placeholder="Ingrediente">
                            {(valor: string) => {
                              const ing = ingredientesDisponiveis.find(
                                (i) => i.ingredientId === valor,
                              );
                              return ing ? `${ing.ingredientName} (${ing.unit})` : "Ingrediente";
                            }}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {ingredientesDisponiveis.map((ing) => (
                            <SelectItem key={ing.ingredientId} value={ing.ingredientId}>
                              {ing.ingredientName} ({ing.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9! w-9! shrink-0 text-rose-500 hover:text-rose-500"
                        onClick={() => removerLinha(index)}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => atualizarLinha(index, "role", "included")}
                        className={`h-8 rounded-md text-xs font-semibold transition border ${
                          linha.role === "included"
                            ? "bg-brand text-brand-foreground border-brand"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Receita
                      </button>
                      <button
                        type="button"
                        onClick={() => atualizarLinha(index, "role", "addon")}
                        className={`h-8 rounded-md text-xs font-semibold transition border ${
                          linha.role === "addon"
                            ? "bg-brand text-brand-foreground border-brand"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        Adicional
                      </button>
                    </div>

                    <div
                      className={`grid gap-2 ${linha.role === "addon" ? "grid-cols-2" : "grid-cols-1"}`}
                    >
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Qtd. usada {unidadeDe(linha.ingredientId) && `(${unidadeDe(linha.ingredientId)})`}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          step="any"
                          inputMode="decimal"
                          className="h-9!"
                          value={linha.quantityUsed}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            atualizarLinha(index, "quantityUsed", e.target.value)
                          }
                          placeholder="0"
                        />
                      </div>

                      {linha.role === "addon" && (
                        <div className="space-y-1">
                          <Label className="text-[11px] text-muted-foreground">
                            Preço extra (R$)
                          </Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            className="h-9!"
                            value={linha.addonPreco}
                            onChange={(e: ChangeEvent<HTMLInputElement>) =>
                              atualizarLinha(index, "addonPreco", e.target.value)
                            }
                            placeholder="0,00"
                          />
                        </div>
                      )}
                    </div>

                    {linha.role === "included" && (
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none pt-0.5">
                        <Checkbox
                          checked={linha.removable}
                          onCheckedChange={(checked: boolean) =>
                            atualizarLinha(index, "removable", !!checked)
                          }
                        />
                        Cliente pode remover este ingrediente no pedido
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-produto"
            disabled={salvando}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {salvando && <Loader2 size={16} className="animate-spin" />}
            {salvando ? "Salvando..." : isEdicao ? "Salvar Alterações" : "Criar Produto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
