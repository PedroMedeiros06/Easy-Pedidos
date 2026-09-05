import { Search, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function FiltrosRestaurante({
  pesquisa,
  setPesquisa,
  ordem,
  alternarOrdem,
  filtraStatus,
  setFiltraStatus,
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3 items-center justify-between">
      <div className="relative flex-1 min-w-72">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          size={16}
        />
        <Input
          type="text"
          placeholder="Pesquisar por restaurante, dono ou código..."
          value={pesquisa}
          onChange={(e) => setPesquisa(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={alternarOrdem} className="h-10!">
          <ArrowUpDown size={15} />
          Ordem: {ordem}
        </Button>

        <Select value={filtraStatus} onValueChange={setFiltraStatus}>
          <SelectTrigger className="h-10! w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            <SelectItem value="liberado">Liberados</SelectItem>
            <SelectItem value="suspenso">Suspensos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
