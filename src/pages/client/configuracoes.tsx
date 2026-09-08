import { useState, type ComponentType } from "react";
import {
  Store,
  Clock,
  Plug,
  ScrollText,
  Info,
  Camera,
  MessageCircle,
  CreditCard,
  Truck,
  MapPin,
  Link2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

type AbaId = "geral" | "horarios" | "integracoes" | "atividades";

const ABAS: { id: AbaId; rotulo: string; Icone: ComponentType<{ size?: number }> }[] = [
  { id: "geral", rotulo: "Geral", Icone: Store },
  { id: "horarios", rotulo: "Horários", Icone: Clock },
  { id: "integracoes", rotulo: "Integrações", Icone: Plug },
  { id: "atividades", rotulo: "Atividades", Icone: ScrollText },
];

// Enquanto o backend não expõe rotas pro dono editar essas configurações, tudo
// fica visível porém desabilitado. Ao liberar, é só remover `disabled` e ligar a API.
const AVISO_EM_BREVE =
  "Esta seção ainda não pode ser salva — o backend não expõe essa configuração para o estabelecimento. Os campos ficam visíveis para referência.";

const DIAS = [
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
  "Domingo",
] as const;

function lerCompany(): { company_name?: string } | null {
  try {
    return JSON.parse(localStorage.getItem("@App:company") || "null");
  } catch {
    return null;
  }
}

export default function ClientConfiguracoes() {
  const [aba, setAba] = useState<AbaId>("geral");
  const company = lerCompany();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ajustes do estabelecimento, horários, integrações e histórico de atividades.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Navegação por abas (mesmo padrão do modal de produto) */}
        <div className="px-4 sm:px-6 border-b border-border flex flex-wrap gap-1">
          {ABAS.map(({ id, rotulo, Icone }) => (
            <button
              key={id}
              type="button"
              onClick={() => setAba(id)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition ${
                aba === id
                  ? "border-brand text-brand"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icone size={15} />
              {rotulo}
            </button>
          ))}
        </div>

        {/* altura fixa pra a página não pular ao trocar de aba; cada aba preenche via flex */}
        <div className="p-4 sm:p-6 min-h-140 flex flex-col">
          {aba === "geral" && <AbaGeral companyName={company?.company_name} />}
          {aba === "horarios" && <AbaHorarios />}
          {aba === "integracoes" && <AbaIntegracoes />}
          {aba === "atividades" && <AbaAtividades />}
        </div>
      </div>
    </div>
  );
}

function AvisoEmBreve() {
  return (
    <Alert>
      <Info size={16} />
      <AlertDescription>{AVISO_EM_BREVE}</AlertDescription>
    </Alert>
  );
}

/* ===================== Geral ===================== */

function AbaGeral({ companyName }: { companyName?: string }) {
  return (
    <div className="flex flex-col flex-1 gap-5 w-full">
      <AvisoEmBreve />

      <div className="space-y-5 flex-1">
        <div className="space-y-1.5">
          <Label htmlFor="nomeVisual">Nome visual do estabelecimento</Label>
          <Input
            id="nomeVisual"
            defaultValue={companyName || ""}
            placeholder="Ex: Lanchonete do Zé"
            disabled
          />
          <p className="text-xs text-muted-foreground">
            É o nome que aparece na vitrine pública e no topo do painel.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slogan">Slogan / descrição curta</Label>
          <Input
            id="slogan"
            placeholder="Ex: O melhor hambúrguer artesanal da região"
            disabled
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="contatoTelefone">Telefone de contato</Label>
            <Input id="contatoTelefone" placeholder="(00) 00000-0000" inputMode="tel" disabled />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contatoEmail">E-mail de contato</Label>
            <Input id="contatoEmail" type="email" placeholder="contato@exemplo.com" disabled />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <MapPin size={13} className="text-muted-foreground" />
            Endereço exibido na vitrine
          </Label>
          <Input placeholder="Rua, número — bairro" disabled />
          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <Input placeholder="Cidade" disabled />
            <Input placeholder="CEP" inputMode="numeric" disabled />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5">
            <Link2 size={13} className="text-muted-foreground" />
            Redes sociais
          </Label>
          <Input placeholder="Instagram (@usuario)" disabled />
          <Input placeholder="Site ou outro link" disabled />
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <Button disabled>Salvar alterações</Button>
      </div>
    </div>
  );
}

/* ===================== Horários ===================== */

function AbaHorarios() {
  return (
    <div className="flex flex-col flex-1 gap-5 w-full">
      <AvisoEmBreve />

      <div className="space-y-4 flex-1">
        <p className="text-sm text-muted-foreground">
          Defina os horários em que a vitrine aceita pedidos. Fora desses horários, o
          cliente vê a loja como fechada.
        </p>

        <div className="rounded-xl border border-border divide-y divide-border">
          {DIAS.map((dia) => (
            <div key={dia} className="flex items-center gap-3 p-3">
              <span className="w-24 text-sm font-medium text-foreground">{dia}</span>
              <label className="flex items-center gap-2 text-xs text-muted-foreground select-none">
                <input type="checkbox" disabled className="accent-brand" defaultChecked />
                Aberto
              </label>
              <div className="flex items-center gap-2 ml-auto">
                <Input type="time" defaultValue="08:00" disabled className="w-28" />
                <span className="text-muted-foreground text-sm">até</span>
                <Input type="time" defaultValue="18:00" disabled className="w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <Button disabled>Salvar horários</Button>
      </div>
    </div>
  );
}

/* ===================== Integrações ===================== */

const INTEGRACOES = [
  {
    nome: "WhatsApp",
    descricao: "Receba e responda pedidos direto no WhatsApp do estabelecimento.",
    Icone: MessageCircle,
  },
  {
    nome: "Instagram",
    descricao: "Link da vitrine na bio e divulgação automática de promoções.",
    Icone: Camera,
  },
  {
    nome: "Pagamento online",
    descricao: "Aceite Pix e cartão na vitrine, com repasse automático.",
    Icone: CreditCard,
  },
  {
    nome: "Entrega / logística",
    descricao: "Integre com apps de motoboy para despachar pedidos de entrega.",
    Icone: Truck,
  },
];

function AbaIntegracoes() {
  return (
    <div className="flex flex-col flex-1 gap-5 w-full">
      <AvisoEmBreve />

      <div className="grid sm:grid-cols-2 gap-3 flex-1 auto-rows-fr">
        {INTEGRACOES.map(({ nome, descricao, Icone }) => (
          <div
            key={nome}
            className="rounded-xl border border-border p-4 flex items-start gap-3"
          >
            <div className="size-9 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0">
              <Icone size={18} />
            </div>
            <div className="min-w-0 flex-1 flex flex-col">
              <p className="text-sm font-semibold text-foreground">{nome}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{descricao}</p>
              <Button variant="outline" size="sm" className="mt-3 self-start" disabled>
                Conectar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ===================== Atividades ===================== */

function AbaAtividades() {
  return (
    <div className="flex flex-col flex-1 gap-5 w-full">
      <AvisoEmBreve />

      <p className="text-sm text-muted-foreground">
        Histórico de alterações no estabelecimento — produtos criados ou editados,
        mudanças de preço, membros adicionados, configurações alteradas.
      </p>

      <div className="rounded-xl border border-border flex-1 flex items-center justify-center p-8">
        <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <ScrollText size={24} />
          <p className="text-sm max-w-xs">
            Nenhum registro para exibir ainda. Quando o log de atividades estiver ativo,
            as ações da equipe aparecerão aqui em ordem cronológica.
          </p>
        </div>
      </div>
    </div>
  );
}
