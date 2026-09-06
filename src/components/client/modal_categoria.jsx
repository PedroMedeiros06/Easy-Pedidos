import { useState, useEffect } from "react";
import { Tag, Loader2 } from "lucide-react";
import { categoriesApi } from "../../api/catalog";
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

const FORM_INICIAL = { categoryName: "" };

export default function ModalCategoria({ isOpen, onClose, onSuccess, categoriaParaEditar = null }) {
  const isEdicao = !!categoriaParaEditar;

  const [formData, setFormData] = useState(FORM_INICIAL);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (isEdicao) {
      setFormData({
        categoryName: categoriaParaEditar.categoryName || "",
      });
    } else {
      setFormData(FORM_INICIAL);
    }
    setErro("");
  }, [isOpen, categoriaParaEditar, isEdicao]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSalvar = async (e) => {
    e.preventDefault();

    if (!formData.categoryName.trim()) {
      setErro("Informe um nome para a categoria.");
      return;
    }

    setSalvando(true);
    setErro("");

    try {
      const payload = { categoryName: formData.categoryName.trim() };

      if (isEdicao) {
        await categoriesApi.update(categoriaParaEditar.categoryId, payload);
      } else {
        await categoriesApi.create(payload);
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErro(err.message || "Erro ao salvar categoria.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Tag size={18} className="text-brand" />
            {isEdicao ? "Editar Categoria" : "Nova Categoria"}
          </DialogTitle>
        </DialogHeader>

        <form id="form-categoria" onSubmit={handleSalvar} className="px-6 space-y-4">
          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5 pb-6">
            <Label htmlFor="categoryName">Nome da Categoria</Label>
            <Input
              required
              id="categoryName"
              type="text"
              name="categoryName"
              value={formData.categoryName}
              onChange={handleInputChange}
              placeholder="Ex: Lanches"
            />
          </div>
        </form>

        <DialogFooter className="mx-0 mb-0 px-6 py-4 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={salvando}>
            Cancelar
          </Button>
          <Button
            type="submit"
            form="form-categoria"
            disabled={salvando}
            className="bg-brand text-brand-foreground hover:bg-brand/90"
          >
            {salvando && <Loader2 size={16} className="animate-spin" />}
            {salvando ? "Salvando..." : isEdicao ? "Salvar Alterações" : "Criar Categoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
