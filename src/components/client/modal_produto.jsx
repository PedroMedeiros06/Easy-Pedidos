import { useState, useEffect } from "react";
import { Package, Loader2 } from "lucide-react";
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

const FORM_INICIAL = {
  nome: "",
  categoriaId: "",
  preco: "",
  descontoValor: "",
  tipoDesconto: "valor", // "valor" (R$) ou "percentual" (%)
  estoque: "",
  ativo: true,
};

function calcularPrecoFinal(preco, descontoValor, tipoDesconto) {
  const precoNum = Number(String(preco).replace(",", ".")) || 0;
  const descontoNum = Number(String(descontoValor).replace(",", ".")) || 0;

  const desconto =
    tipoDesconto === "percentual" ? precoNum * (Math.min(descontoNum, 100) / 100) : descontoNum;

  return Math.max(precoNum - desconto, 0);
}

export default function ModalProduto({ isOpen, onClose, onSalvar, produtoParaEditar = null, categorias = [] }) {
  const isEdicao = !!produtoParaEditar;

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (isEdicao) {
      setFormData({
        nome: produtoParaEditar.nome || "",
        categoriaId: produtoParaEditar.categoriaId || "",
        preco: String(produtoParaEditar.preco ?? ""),
        descontoValor: String(produtoParaEditar.descontoValor ?? ""),
        tipoDesconto: produtoParaEditar.tipoDesconto || "valor",
        estoque: String(produtoParaEditar.estoque ?? ""),
        ativo: produtoParaEditar.ativo ?? true,
      });
    } else {
      setFormData(FORM_INICIAL);
    }
    setErro("");
  }, [isOpen, produtoParaEditar, isEdicao]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const precoFinal = calcularPrecoFinal(formData.preco, formData.descontoValor, formData.tipoDesconto);

  const handleSalvar = async (e) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      setErro("Informe o nome do produto.");
      return;
    }

    const precoNum = Number(String(formData.preco).replace(",", "."));
    if (!formData.preco || Number.isNaN(precoNum) || precoNum < 0) {
      setErro("Informe um preço válido.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      await onSalvar({
        id: produtoParaEditar?.id,
        nome: formData.nome.trim(),
        categoriaId: formData.categoriaId || null,
        preco: precoNum,
        descontoValor: Number(String(formData.descontoValor).replace(",", ".")) || 0,
        tipoDesconto: formData.tipoDesconto,
        estoque: formData.estoque === "" ? null : Number(formData.estoque),
        ativo: formData.ativo,
      });
      onClose();
    } catch (err) {
      setErro(err.message || "Erro ao salvar produto.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Package size={18} className="text-brand" />
            {isEdicao ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form id="form-produto" onSubmit={handleSalvar} className="flex-1 overflow-y-auto px-6 space-y-4">
          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome do Produto</Label>
            <Input
              required
              id="nome"
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleInputChange}
              placeholder="Ex: X-Bacon"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoriaId">Categoria</Label>
            <Select
              value={formData.categoriaId}
              onValueChange={(valor) => setFormData((prev) => ({ ...prev, categoriaId: valor }))}
            >
              <SelectTrigger id="categoriaId" className="h-10! w-full">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="estoque">Estoque (opcional)</Label>
              <Input
                id="estoque"
                type="text"
                inputMode="numeric"
                name="estoque"
                value={formData.estoque}
                onChange={handleInputChange}
                placeholder="Ilimitado"
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
                  onClick={() => setFormData((prev) => ({ ...prev, tipoDesconto: "valor" }))}
                  title="Desconto em reais"
                  className={`px-2.5 text-xs font-semibold transition ${
                    formData.tipoDesconto === "valor"
                      ? "bg-brand text-brand-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  R$
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, tipoDesconto: "percentual" }))}
                  title="Desconto em porcentagem"
                  className={`px-2.5 text-xs font-semibold transition border-l border-input ${
                    formData.tipoDesconto === "percentual"
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
                  {precoFinal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </p>
            )}
          </div>

          <Separator />

          <label className="flex items-center gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/40 transition cursor-pointer select-none pb-6">
            <Checkbox
              checked={formData.ativo}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, ativo: !!checked }))}
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
