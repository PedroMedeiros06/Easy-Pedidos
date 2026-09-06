import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { Boxes, Loader2 } from "lucide-react";
import { ingredientsApi } from "@/api/ingredients";
import type { Ingredient, IngredientUnit } from "@/types/catalog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UNIDADES: { value: IngredientUnit; label: string }[] = [
  { value: "g", label: "Gramas (g)" },
  { value: "ml", label: "Mililitros (ml)" },
  { value: "unid", label: "Unidades (unid)" },
];

interface FormState {
  ingredientName: string;
  unit: IngredientUnit;
  quantity: string;
  lowStockAt: string;
}

const FORM_INICIAL: FormState = {
  ingredientName: "",
  unit: "g",
  quantity: "",
  lowStockAt: "",
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ingredienteParaEditar?: Ingredient | null;
}

export default function ModalIngrediente({
  isOpen,
  onClose,
  onSuccess,
  ingredienteParaEditar = null,
}: Props) {
  const isEdicao = !!ingredienteParaEditar;

  const [formData, setFormData] = useState<FormState>(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (ingredienteParaEditar) {
      setFormData({
        ingredientName: ingredienteParaEditar.ingredientName || "",
        unit: ingredienteParaEditar.unit,
        quantity: String(ingredienteParaEditar.quantity ?? ""),
        lowStockAt:
          ingredienteParaEditar.lowStockAt != null
            ? String(ingredienteParaEditar.lowStockAt)
            : "",
      });
    } else {
      setFormData(FORM_INICIAL);
    }
    setErro("");
  }, [isOpen, ingredienteParaEditar]);

  const setCampo = <K extends keyof FormState>(campo: K, valor: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  };

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();

    const nome = formData.ingredientName.trim();
    if (!nome) {
      setErro("Informe um nome para o ingrediente.");
      return;
    }

    const quantidade = Number(formData.quantity);
    if (!Number.isFinite(quantidade) || quantidade < 0) {
      setErro("Quantidade inválida.");
      return;
    }

    const alerta = formData.lowStockAt.trim();
    let lowStockAt: number | null = null;
    if (alerta !== "") {
      const n = Number(alerta);
      if (!Number.isFinite(n) || n < 0) {
        setErro("Alerta de estoque baixo inválido.");
        return;
      }
      lowStockAt = n;
    }

    setSalvando(true);
    setErro("");

    try {
      if (isEdicao && ingredienteParaEditar) {
        await ingredientsApi.update(ingredienteParaEditar.ingredientId, {
          ingredientName: nome,
          unit: formData.unit,
          quantity: quantidade,
          lowStockAt,
        });
      } else {
        await ingredientsApi.create({
          ingredientName: nome,
          unit: formData.unit,
          quantity: quantidade,
          lowStockAt,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar ingrediente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Boxes size={18} className="text-brand" />
            {isEdicao ? "Editar Ingrediente" : "Novo Ingrediente"}
          </DialogTitle>
        </DialogHeader>

        <form id="form-ingrediente" onSubmit={handleSalvar} className="px-6 space-y-4">
          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ingredientName">Nome do Ingrediente</Label>
            <Input
              required
              id="ingredientName"
              type="text"
              value={formData.ingredientName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setCampo("ingredientName", e.target.value)
              }
              placeholder="Ex: Queijo mussarela"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="unit">Unidade de Medida</Label>
            <Select
              value={formData.unit}
              onValueChange={(valor: string) => setCampo("unit", valor as IngredientUnit)}
            >
              <SelectTrigger id="unit" className="h-10! w-full">
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {UNIDADES.map((u) => (
                  <SelectItem key={u.value} value={u.value}>
                    {u.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantidade em estoque</Label>
              <Input
                required
                id="quantity"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={formData.quantity}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCampo("quantity", e.target.value)
                }
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lowStockAt">Alerta de estoque baixo</Label>
              <Input
                id="lowStockAt"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={formData.lowStockAt}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCampo("lowStockAt", e.target.value)
                }
                placeholder="Opcional"
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground pb-6">
            Para entradas e saídas de estoque no dia a dia, use o botão de ajuste na listagem — este
            formulário substitui o valor total.
          </p>
        </form>

        <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-ingrediente"
            disabled={salvando}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {salvando && <Loader2 size={16} className="animate-spin" />}
            {salvando ? "Salvando..." : isEdicao ? "Salvar Alterações" : "Criar Ingrediente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
