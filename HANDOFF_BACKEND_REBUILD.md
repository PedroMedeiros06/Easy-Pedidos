# Contexto: reconstrução do backend do Pedidos App

## Passo 0 — teste de acesso
Antes de qualquer coisa, confirme que você tem acesso ao MCP do Supabase (projeto `anujomdyzlkpcakbuwhx`). Rode uma query simples de leitura (ex: listar tabelas do schema `public`) e reporte o resultado antes de prosseguir. Se não tiver acesso ao MCP, pare e avise.

## Projeto
"Pedidos App" — SaaS de gestão para restaurantes. Frontend React+Vite em `c:\Users\pedro\Pedidos_App`, backend NestJS em `c:\Users\pedro\Pedidos_App\backend`, banco Supabase (Postgres + Supabase Auth). Repositório git, branch atual `feat/brasil-api-front`.

Sistema inteiro está sendo refeito. O frontend já foi parcialmente ajustado numa rodada anterior (não mexer nele agora, só backend). O backend será **reescrito do zero** — o código atual em `backend/src` deve ser tratado como descartável, mas confirme com o usuário antes de apagar qualquer coisa (ele é cauteloso com ações destrutivas).

## Decisão de stack (já validada com o usuário, não reabrir)
- Mantém **NestJS + Supabase** (Auth + Postgres). Não trocar por outro framework/ORM.
- Sem Prisma — acesso a dado via `@supabase/supabase-js` direto (`adminClient` no backend).

## Modelo de domínio (já validado com o usuário nesta conversa, não reabrir)

O sistema tem **duas populações de usuário completamente separadas**, com login e permissões independentes:

### 1. System Admins (donos da plataforma)
- São o usuário e pessoas que ele eventualmente adicionar. Donos do SaaS em si, não de um restaurante.
- Não pertencem a nenhuma `company`.
- Painel próprio: estatísticas globais do sistema, criar/bloquear estabelecimentos, gerenciar planos, gerenciar todos os estabelecimentos e funcionários de todos eles.
- **Tabela separada**: `admin_users` (não reaproveitar `members`). Login por **CPF + senha** (atualizado — decisão original era email+senha, usuário pediu troca pra CPF).
- `admin_users` tem coluna `cpf` (unique) além de `admin_id`, `auth_id`, `name`, `email`, `active`, `created_at`.
- RPC própria `get_admin_login_email(p_cpf)` resolve o email a partir do CPF (mesmo padrão do `get_login_email` de company user, mas sem `company_code` pois admin não pertence a empresa).
- Rota de login dedicada: `/admin/login` (backend) — separada do login de empresa.

### 2. Company users (donos de restaurante + funcionários)
- Pertencem a uma `company` (`company_id` obrigatório).
- `member_access` tem só dois valores: `owner` | `employee` (remover `administrator` — isso era usado errado antes para representar system admin, o que causou a confusão).
- **Owner**: acesso irrestrito ao painel daquele estabelecimento (todas as permissões, sem precisar configurar `member_permissions`).
- **Employee**: só as permissões que o owner conceder, via `member_permissions` (jsonb granular, ver `common/permissions/permissions.ts` do código antigo para o formato usado antes — pode reaproveitar a lista de permissões, ela estava ok).
- Login por **company_code + CPF + senha** (RPC `get_login_email` resolve o email antes de autenticar — esse mecanismo pode ser mantido, só ajustar para não vazar para admin).
- Rota de login dedicada: `/login` (backend, distinta de `/admin/login`).

### Por que separar (contexto do porquê, para decisões futuras)
O modelo antigo misturava tudo em `members.member_access` com um valor `"administrator"` fazendo o papel de super-admin da plataforma dentro da mesma tabela usada para funcionário de restaurante. Isso causou bugs de permissão (guards que checavam `administrator` sem saber se era admin de plataforma ou só um cargo dentro da empresa) e confusão de escopo (rotas de `/companies` sem guard de verdade, porque não havia um jeito de dizer "isso é operação de super-admin"). Separar em duas tabelas com dois guards resolve isso na raiz.

## O que já existe hoje (para referência, pode reaproveitar conceitos mas reescrever o código)

Schema atual já aplicado no Supabase (rodar `SELECT` para conferir o estado real antes de assumir):
- `plans` (plan_id bigint, plan_name, price_cents, max_catalog_items, max_categories, max_members)
- `companies` (company_id bigint identity, company_code, company_name, company_email, company_legal jsonb, company_location jsonb, plan_id FK, blocked, block_reason, created_at, updated_at)
- `members` (member_id uuid, auth_id uuid → auth.users, company_id bigint FK, member_name, member_cpf, member_email, member_access text, member_active bool, member_permissions jsonb)
- `categories`, `catalog_items`, `stock` — já feitos na rodada anterior, escopados por `company_id`, com RLS. Provavelmente ficam como estão (não fazem parte do escopo desta reconstrução de auth), mas confirme se ainda fazem sentido depois que `admin_users` existir.
- RLS ativado em tudo, função `auth_company_id()` e `auth_member_access()` de apoio.
- RPC `get_login_email(p_company_code, p_member_cpf)` usada no login de company user.

Arquivo `backend/schema.sql` no repo tem o SQL histórico (pode estar desatualizado vs. o banco real — sempre confirme via MCP antes de assumir).

Módulos NestJS existentes (a serem reescritos): `auth`, `companies`, `members`, `common/guards` (`SupabaseAuthGuard`, `PermissionsGuard`), `common/decorators` (`CurrentUser`, `RequirePermission`), `common/permissions/permissions.ts`, `common/types/current-user.ts`, `supabase/supabase.service.ts` (tem `authClient` e `adminClient` do Supabase, pode reaproveitar como está — não tinha problema).

## O que fazer agora (escopo desta sessão)

1. Confirmar acesso MCP (passo 0).
2. Ler o schema real do banco via MCP para não assumir nada errado.
3. Desenhar e aplicar via MCP as mudanças de schema necessárias:
   - Nova tabela `admin_users` (admin_id uuid, auth_id uuid → auth.users, name, email, cpf unique, active, created_at).
   - Nova RPC `get_admin_login_email(p_cpf)` para resolver email do admin a partir do CPF (login `/admin/login` por CPF+senha).
   - Ajustar `members.member_access` para aceitar só `owner`/`employee` (remover uso de `administrator` ali).
   - Ajustar RLS/policies conforme necessário para `admin_users` (provavelmente admin_client do backend acessa com service role, sem RLS necessária para admin agir sobre outras tabelas — mas pensar com cuidado).
4. Reescrever backend NestJS do zero para:
   - `admin-auth` module: login `/admin/login` (CPF+senha, via `get_admin_login_email`), guard próprio (`AdminAuthGuard`) que não deve aceitar token de company user e vice-versa.
   - `auth` module: login `/login` (company_code+cpf+senha) para company users, mantém formato de resposta similar ao anterior.
   - `companies` module: CRUD de estabelecimentos, agora protegido pelo `AdminAuthGuard` (só system admin pode criar/bloquear empresas — isso não tinha guard nenhum antes, era uma falha).
   - `members` module: CRUD de funcionários da empresa do usuário logado (company user), continua com `SupabaseAuthGuard` + `PermissionsGuard`.
   - Ajustar `common/permissions/permissions.ts`, guards e decorators para o novo modelo de dois tipos de usuário.
5. Build limpo (`npm run build` dentro de `backend/`) antes de considerar qualquer módulo pronto.
6. Não mexer no frontend nesta etapa — o usuário vai tratar disso depois, noutra sessão/chat.

## Estilo de trabalho que o usuário espera (importante)
- Perguntar antes de decisões de modelagem ambíguas, não assumir.
- Avisar antes de qualquer ação destrutiva (apagar tabelas/dados, `DROP`, etc.) e confirmar escopo exato.
- Não reintroduzir nomenclatura em português no código novo (variáveis/campos/rotas em inglês; strings de erro para usuário final podem ficar em português).
- Preferir simplicidade: não construir abstrações genéricas além do que os dois tipos de login realmente precisam.
