/**
 * WikiPong · Sessão (login por link no e-mail)
 * ------------------------------------------------------------------------------
 * POR QUE LINK NO E-MAIL, e não senha: senha exige tela de cadastro, tela de
 * "esqueci", política de força, e um lugar seguro pra guardar hash. Nada disso
 * existe aqui e nada disso é o produto. O link no e-mail troca tudo isso por
 * "digite seu e-mail" — e a caixa de entrada já é a prova de identidade.
 *
 * COMO FUNCIONA, ponta a ponta:
 *   1. a pessoa digita o e-mail e o site chama /auth/v1/otp;
 *   2. o Supabase manda um link;
 *   3. o link volta pro site com os tokens no FRAGMENTO da URL (#access_token=…);
 *   4. este módulo lê o fragmento, guarda a sessão e LIMPA a barra de endereço.
 *
 * O passo 4 não é frescura: token em fragmento fica no histórico do navegador e
 * em qualquer print da tela. Trocar por uma URL limpa assim que se lê é o mínimo.
 *
 * O QUE ESTE MÓDULO NÃO FAZ: decidir se alguém é administrador. Isso é do banco
 * (tabela `admins` + políticas, em supabase/002-login.sql). Confiar num "sou
 * admin" vindo do navegador seria confiar em quem se apresenta.
 */

export interface Sessao {
  accessToken: string;
  refreshToken: string;
  /** Epoch em segundos. */
  expiraEm: number;
  email?: string;
}

const CHAVE = 'wikipong:sessao:v1';

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL;
const chave = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const loginDisponivel = (): boolean => Boolean(url() && chave());

// ───────────────────────── Guardar e ler ─────────────────────────

function guardar(s: Sessao | null) {
  if (typeof localStorage === 'undefined') return;
  try {
    if (s) localStorage.setItem(CHAVE, JSON.stringify(s));
    else localStorage.removeItem(CHAVE);
  } catch {
    /* Quota ou storage desativado: melhor ficar deslogado que quebrar a tela. */
  }
}

function guardada(): Sessao | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const cru = localStorage.getItem(CHAVE);
    return cru ? (JSON.parse(cru) as Sessao) : null;
  } catch {
    return null;
  }
}

/**
 * O token guardado, sem renovar. É o que o repositório usa a cada requisição:
 * ler o storage é síncrono e barato, e um token vencido devolve 401 — que a
 * tela já sabe tratar pedindo login de novo. Renovar aqui obrigaria toda
 * chamada do PostgREST a virar assíncrona duas vezes.
 */
export const tokenGuardado = (): string | undefined => guardada()?.accessToken;

/** Meio minuto de folga: token que expira no meio da requisição é erro estranho. */
const expirada = (s: Sessao) => s.expiraEm * 1000 < Date.now() + 30_000;

// ───────────────────────── Entrar ─────────────────────────

/**
 * Pede o link. `redirecionar` precisa estar na lista de URLs permitidas do
 * projeto (Authentication → URL Configuration), senão o Supabase manda o link
 * mas ele volta pra outro lugar.
 */
export async function pedirLink(email: string, redirecionar: string): Promise<void> {
  const base = url();
  const anon = chave();
  if (!base || !anon) throw new Error('Supabase não configurado.');

  /*
   * O `redirect_to` vai na QUERY STRING, não no corpo.
   *
   * A primeira versão mandava `{ email, options: { email_redirect_to } }` no
   * JSON, imitando a forma do SDK. A API REST ignora isso em silêncio: não dá
   * erro, manda o e-mail normalmente, e o link volta pro "Site URL" do projeto
   * em vez do endereço pedido. O sintoma aparece longe da causa — a pessoa
   * clica no link e cai noutro site, sem nada indicando o porquê.
   */
  const destino = `${base}/auth/v1/otp?redirect_to=${encodeURIComponent(redirecionar)}`;
  const res = await fetch(destino, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, create_user: true }),
  });
  if (!res.ok) throw new Error(await explicar(res));
}

/**
 * Traduz a resposta de erro do Supabase para uma frase que a pessoa entenda.
 *
 * A primeira versão jogava o JSON cru na tela — `{"code":429,"error_code":
 * "over_email_send_rate_limit",...}`. Quem lê isso não descobre nem o que houve
 * nem o que fazer. E o pior é que o mais comum dos erros, o limite de envio, tem
 * uma solução simples: esperar.
 */
async function explicar(res: Response): Promise<string> {
  let codigo = '';
  try {
    const d = (await res.json()) as { error_code?: string; msg?: string; message?: string };
    codigo = d.error_code ?? '';
    if (!codigo && (d.msg ?? d.message)) codigo = (d.msg ?? d.message)!;
  } catch {
    /* Sem corpo legível: sobra o status. */
  }

  if (res.status === 429 || codigo.includes('rate_limit')) {
    return (
      'O Supabase gratuito manda poucos e-mails por hora, e a cota acabou. ' +
      'Espere uns minutos e peça de novo — não é problema no seu e-mail.'
    );
  }
  if (res.status === 422 || codigo.includes('invalid')) {
    return 'Esse e-mail não foi aceito. Confira se está escrito certo.';
  }
  if (res.status === 401 || res.status === 403) {
    return 'A chave do projeto não foi aceita. Confira o NEXT_PUBLIC_SUPABASE_ANON_KEY.';
  }
  return `Não deu pra enviar o link (erro ${res.status}${codigo ? `: ${codigo}` : ''}).`;
}

/**
 * Lê os tokens que voltaram no fragmento da URL, guarda e limpa a barra.
 * Devolve a sessão quando havia uma; null quando a URL não trazia nada.
 */
export function capturarDaURL(): Sessao | null {
  if (typeof window === 'undefined') return null;
  const bruto = window.location.hash.replace(/^#/, '');
  if (!bruto) return null;

  const p = new URLSearchParams(bruto);
  const accessToken = p.get('access_token');
  const refreshToken = p.get('refresh_token');
  if (!accessToken || !refreshToken) return null;

  const s: Sessao = {
    accessToken,
    refreshToken,
    expiraEm: Math.floor(Date.now() / 1000) + Number(p.get('expires_in') ?? 3600),
  };
  guardar(s);

  /* Tira o token da barra de endereço sem recarregar nem sujar o histórico. */
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return s;
}

/** Troca o refresh token por um access token novo. */
async function renovar(s: Sessao): Promise<Sessao | null> {
  const base = url();
  const anon = chave();
  if (!base || !anon) return null;

  try {
    const res = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { apikey: anon, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refreshToken }),
    });
    if (!res.ok) {
      /* Refresh recusado = sessão morta de vez. Limpar em vez de insistir. */
      guardar(null);
      return null;
    }
    const d = (await res.json()) as {
      access_token: string; refresh_token: string; expires_in: number;
      user?: { email?: string };
    };
    const nova: Sessao = {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      expiraEm: Math.floor(Date.now() / 1000) + d.expires_in,
      email: d.user?.email ?? s.email,
    };
    guardar(nova);
    return nova;
  } catch {
    return null;
  }
}

/**
 * A sessão válida agora, renovando se preciso. É o que todo mundo deve chamar —
 * ninguém lê o localStorage direto.
 */
export async function sessaoAtual(): Promise<Sessao | null> {
  const s = capturarDaURL() ?? guardada();
  if (!s) return null;
  return expirada(s) ? renovar(s) : s;
}

/** Quem está logado, pra tela dizer o nome. Uma chamada, sem cache. */
export async function quemSou(s: Sessao): Promise<string | null> {
  const base = url();
  const anon = chave();
  if (!base || !anon) return null;
  try {
    const res = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${s.accessToken}` },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { email?: string };
    return d.email ?? null;
  } catch {
    return null;
  }
}

export async function sair(): Promise<void> {
  const base = url();
  const anon = chave();
  const s = guardada();
  guardar(null);
  /* Avisa o servidor pra invalidar o refresh token. Se falhar, tudo bem: o
     token local já foi embora, que é o que o usuário desta máquina esperava. */
  if (base && anon && s) {
    try {
      await fetch(`${base}/auth/v1/logout`, {
        method: 'POST',
        headers: { apikey: anon, Authorization: `Bearer ${s.accessToken}` },
      });
    } catch {
      /* silêncio proposital */
    }
  }
}

/**
 * Sou administrador? Quem responde é o BANCO, não o navegador: a política de
 * `admins` só devolve linha pra quem está lá dentro. Se alguém forjar um "true"
 * aqui, a tela abre e o banco continua recusando toda operação — a mentira não
 * vira poder.
 */
export async function souAdmin(s: Sessao): Promise<boolean> {
  const base = url();
  const anon = chave();
  if (!base || !anon) return false;
  try {
    const res = await fetch(`${base}/rest/v1/admins?select=usuario_id&limit=1`, {
      headers: { apikey: anon, Authorization: `Bearer ${s.accessToken}` },
    });
    if (!res.ok) return false;
    return ((await res.json()) as unknown[]).length > 0;
  } catch {
    return false;
  }
}
