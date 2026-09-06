import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { ArrowDownUp, Loader2, Minus, Plus } from "lucide-react";
import { ingredientsApi } from "@/api/ingredients";
import type { Ingredient } from "@/types/catalog";
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

type Direcao = "entrada" | "saida";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ingrediente: Ingredient | null;
}

export default function ModalAjusteEstoque({ isOpen, onClose, onSuccess, ingrediente }: Props) {
  const [direcao, setDirecao] = useState<Direcao>("entrada");
  const [valor, setValor] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setDirecao("entrada");
    setValor("");
    setErro("");
  }, [isOpen]);

  const handleSalvar = async (e: FormEvent) => {
    e.preventDefault();
    if (!ingrediente) return;

    const n = Number(valor);
    if (!Number.isFinite(n) || n <= 0) {
      setErro("Informe uma quantidade maior que zero.");
      return;
    }

    const delta = direcao === "entrada" ? n : -n;

    setSalvando(true);
    setErro("");
    try {
      await ingredientsApi.adjust(ingrediente.ingredientId, delta);
      onSuccess();
      onClose();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao ajustar estoque.");
    } finally {
      setSalvando(false);
    }
  };

  const resultado =
    ingrediente && valor !== "" && Number.isFinite(Number(valor))
      ? ingrediente.quantity + (direcao === "entrada" ? Number(valor) : -Number(valor))
      : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ArrowDownUp size={18} className="text-brand" />
            Ajustar Estoque
          </DialogTitle>
        </DialogHeader>

        <form id="form-ajuste" onSubmit={handleSalvar} className="px-6 space-y-4">
          {ingrediente && (
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{ingrediente.ingredientName}</span> —
              atual: {ingrediente.quantity} {ingrediente.unit}
            </p>
          )}

          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={direcao === "entrada" ? "default" : "outline"}
              onClick={() => setDirecao("entrada")}
              className={direcao === "entrada" ? "bg-brand text-brand-foreground hover:bg-brand/90" : ""}
            >
              <Plus size={16} /> Entrada
            </Button>
            <Button
              type="button"
              variant={direcao === "saida" ? "default" : "outline"}
              onClick={() => setDirecao("saida")}
              className={direcao === "saida" ? "bg-rose-500 text-white hover:bg-rose-500/90" : ""}
            >
              <Minus size={16} /> Saída
            </Button>
          </div>

          <div className="space-y-1.5 pb-2">
            <Label htmlFor="valor">Quantidade ({ingrediente?.unit ?? ""})</Label>
            <Input
              required
              autoFocus
              id="valor"
              type="number"
              min="0"
              step="any"
              inputMode="decimal"
              value={valor}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setValor(e.target.value)}
              placeholder="0"
            />
            {resultado != null && (
              <p className={`text-xs ${resultado < 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                Novo total: {resultado} {ingrediente?.unit}
                {resultado < 0 && " — saída maior que o estoque disponível"}
              </p>
            )}
          </div>
        </form>

        <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-ajuste"
            disabled={salvando}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {salvando && <Loader2 size={16} className="animate-spin" />}
            {salvando ? "Ajustando..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
