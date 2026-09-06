import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { Package, Loader2, Plus, Trash2, Boxes } from "lucide-react";
import { catalogItemsApi } from "../../api/catalog";
import { ingredientsApi } from "@/api/ingredients";
import type {
  CatalogItem,
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
import { Separator } from "@/components/ui/separator";
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
interface LinhaIngrediente {
  ingredientId: string;
  role: "included" | "addon";
  quantityUsed: string;
  addonPreco: string;
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

function centavosParaReais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

function reaisParaCentavos(valor: string): number {
  return Math.round((Number(String(valor).replace(",", ".")) || 0) * 100);
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
        })),
      );
    } else {
      setFormData(FORM_INICIAL);
      setLinhas([]);
    }
    setErro("");
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
      { ingredientId: "", role: "included", quantityUsed: "", addonPreco: "" },
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
      setErro("Informe o nome do produto.");
      return;
    }

    if (!formData.preco || precoCentavos <= 0) {
      setErro("Informe um preço válido.");
      return;
    }

    // Validação das linhas de ingrediente (só as preenchidas contam).
    const linhasPreenchidas = linhas.filter((l) => l.ingredientId);
    const ids = linhasPreenchidas.map((l) => l.ingredientId);
    if (new Set(ids).size !== ids.length) {
      setErro("Há ingredientes repetidos na receita. Cada ingrediente só pode aparecer uma vez.");
      return;
    }

    const ingredients: CatalogItemIngredientInput[] = [];
    for (const l of linhasPreenchidas) {
      const qtd = Number(String(l.quantityUsed).replace(",", "."));
      if (!Number.isFinite(qtd) || qtd <= 0) {
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Package size={18} className="text-brand" />
            {isEdicao ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="form-produto"
          onSubmit={handleSalvar}
          className="flex-1 overflow-y-auto px-6 space-y-4"
        >
          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

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

          <div className="space-y-1.5">
            <Label htmlFor="categoryId">Categoria</Label>
            <Select
              value={formData.categoryId}
              onValueChange={(valor: string) =>
                setFormData((prev) => ({ ...prev, categoryId: valor }))
              }
            >
              <SelectTrigger id="categoryId" className="h-10! w-full">
                <SelectValue placeholder="Selecione uma categoria" />
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

          <Separator />

          {/* ===================== Ingredientes ===================== */}
          <div className="space-y-2">
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
                          <SelectValue placeholder="Ingrediente" />
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
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <label className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/40 transition cursor-pointer select-none pb-6">
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
