export const API_URL: string = import.meta.env.VITE_API_URL || "http://localhost:3000";

function getToken(): string | null {
  return localStorage.getItem("@App:token");
}

// Erro lançado quando o backend barra a request porque o estabelecimento
// foi bloqueado durante a sessão (CompanyAuthGuard, 403, desde 2026-09-06).
export class EstabelecimentoBloqueadoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EstabelecimentoBloqueadoError";
  }
}

// Erro lançado quando o token expirou / é inválido (401) e a sessão foi encerrada.
export class SessaoExpiradaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessaoExpiradaError";
  }
}

// Motivo pendente pra tela de login mostrar depois do redirect (bloqueio ou expiração).
const CHAVE_AVISO_LOGIN = "@App:loginNotice";

const CHAVES_SESSAO = [
  "@App:token",
  "@App:refresh_token",
  "@App:user",
  "@App:member",
  "@App:company",
  "@App:permissions",
] as const;

// Limpa toda a sessão do company user. Exportado pra ser reusado por guard/layout.
export function limparSessao(): void {
  try {
    for (const chave of CHAVES_SESSAO) localStorage.removeItem(chave);
  } catch {
    // localStorage indisponível — nada a fazer.
  }
}

// Encerra a sessão e manda pro login, guardando o aviso pra exibir lá.
function encerrarSessao(aviso: string): void {
  limparSessao();
  try {
    localStorage.setItem(CHAVE_AVISO_LOGIN, aviso);
  } catch {
    /* segue pro redirect mesmo assim */
  }
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

// Lê e consome o aviso pendente (a tela de login mostra e apaga).
export function consumirAvisoLogin(): string | null {
  try {
    const aviso = localStorage.getItem(CHAVE_AVISO_LOGIN);
    if (aviso) localStorage.removeItem(CHAVE_AVISO_LOGIN);
    return aviso;
  } catch {
    return null;
  }
}

// Compat: nome antigo usado pelo login.jsx.
export const consumirMotivoBloqueio = consumirAvisoLogin;

function ehErroDeBloqueio(status: number, message: string | undefined): boolean {
  return status === 403 && !!message && /estabelecimento bloqueado/i.test(message);
}

async function parseResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const raw = (data as { message?: unknown }).message;
    const message = Array.isArray(raw) ? raw.join(", ") : (raw as string | undefined);

    if (ehErroDeBloqueio(res.status, message)) {
      encerrarSessao(message as string);
      throw new EstabelecimentoBloqueadoError(message as string);
    }

    if (res.status === 401) {
      const aviso = "Sua sessão expirou. Entre novamente.";
      encerrarSessao(aviso);
      throw new SessaoExpiradaError(aviso);
    }

    throw new Error(message || "Ocorreu um erro na requisição.");
  }

  return data as T;
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  // Com FormData o browser precisa definir o próprio Content-Type (com boundary).
  // Forçar application/json aqui quebraria o upload multipart.
  const ehFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(ehFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  return parseResponse<T>(res);
}
