/**
 * WikiPong · Sessão (duas portas: link no e-mail e senha)
 * ------------------------------------------------------------------------------
 * A PRIMEIRA VERSÃO SÓ TINHA LINK NO E-MAIL, e o argumento era bom: senha exige
 * tela de cadastro, tela de "esqueci", política de força. O fundador decidiu o
 * contrário em 2026-08-15 (spec `cadastro-e-perfil-como-espaco`), e o custo
 * daquele argumento continua real — ele foi PAGO, não refutado. As duas portas
 * vivem lado a lado:
 *
 *   link no e-mail  `pedirLink`      → não tem senha pra esquecer
 *   senha           `criarConta` / `entrarComSenha` → entra sem esperar e-mail
 *
 * E, porque a segunda existe, existe também `pedirRecuperacao` + `trocarSenha`:
 * sem elas, senha esquecida vira conta perdida.
 *
 * NADA DE POLÍTICA DE SENHA INVENTADA. Quem decide o que é senha aceitável é o
 * servidor (Authentication → Policies). `SENHA_MINIMA` aqui só evita uma ida à
 * rede para o caso óbvio — ver o comentário sobre ela.
 *
 * COMO FUNCIONA O LINK, ponta a ponta:
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

/** O que o servidor devolveu quando recusou, já desembrulhado do JSON. */
export interface FalhaDoServidor {
  status: number;
  /** `error_code` do Supabase, ou a mensagem crua quando não há código. */
  codigo: string;
  /** A frase do servidor, em inglês. Só serve pra extrair número, não pra exibir. */
  mensagem: string;
}

/**
 * Traduz a recusa do servidor para uma frase que a pessoa entenda.
 *
 * A primeira versão jogava o JSON cru na tela — `{"code":429,"error_code":
 * "over_email_send_rate_limit",...}`. Quem lê isso não descobre nem o que houve
 * nem o que fazer. E o pior é que o mais comum dos erros, o limite de envio, tem
 * uma solução simples: esperar.
 *
 * A ORDEM DOS TESTES É A PARTE FRÁGIL, e por isso tem asserção em cima dela.
 * O caso concreto: `invalid_credentials` (senha errada) CONTÉM a palavra
 * "invalid", e a versão anterior tinha um `codigo.includes('invalid')` genérico
 * lá em cima. Quem errasse a senha lia "esse e-mail não foi aceito" e ia
 * conferir o e-mail, que estava certo. Código específico vem SEMPRE antes do
 * genérico — mexer nesta ordem quebra o teste de propósito.
 *
 * Função pura de propósito: é a única parte disto que dá pra testar sem rede.
 */
export function mensagemDeErro(f: FalhaDoServidor): string {
  const { status, codigo, mensagem } = f;

  /* ── Específicos primeiro ── */

  /* Nunca dizer QUAL dos dois está errado: separar "e-mail não existe" de
     "senha errada" entrega a lista de quem tem conta a quem estiver fuçando. */
  if (codigo.includes('invalid_credentials') || codigo.includes('invalid_grant')) {
    return 'E-mail ou senha não conferem. Se você criou a conta pelo link no e-mail, ela ainda não tem senha — use "esqueci minha senha" pra definir uma.';
  }
  if (codigo.includes('email_not_confirmed')) {
    return 'Falta confirmar seu e-mail. Procure a mensagem que enviamos e clique no link dela — depois a senha funciona.';
  }
  if (codigo.includes('weak_password')) {
    /* O número vem da MENSAGEM do servidor, não daqui: quem manda na regra é o
       painel, e chutar um número seria inventar política (o spec proíbe). */
    const minimo = mensagem.match(/\d+/)?.[0];
    return minimo
      ? `Essa senha é curta demais: o servidor exige pelo menos ${minimo} caracteres.`
      : 'Essa senha foi recusada por ser fraca demais. Tente uma mais longa.';
  }
  if (codigo.includes('same_password')) {
    return 'Essa é a senha que você já tinha. Escolha uma diferente.';
  }
  if (codigo.includes('user_already_exists') || codigo.includes('email_exists')) {
    /* Isto entrega que o e-mail tem conta — mas o servidor JÁ entrega, no
       status da resposta. Esconder na tela não esconderia de quem olha a rede,
       e esconderia de quem só quer saber por que o cadastro não foi. */
    return 'Esse e-mail já tem conta. Entre com a sua senha, ou peça um link no e-mail.';
  }
  if (codigo.includes('signup_disabled')) {
    return 'O cadastro está fechado no momento.';
  }
  if (codigo.includes('over_request_rate_limit')) {
    return 'Muitas tentativas seguidas. Espere um minuto e tente de novo.';
  }
  if (status === 429 || codigo.includes('rate_limit')) {
    return (
      'O servidor de e-mail manda poucas mensagens por hora, e a cota acabou. ' +
      'Espere uns minutos e peça de novo — não é problema no seu e-mail.'
    );
  }

  /* ── Genéricos depois ── */
  if (status === 422 || codigo.includes('invalid')) {
    return 'Esse e-mail não foi aceito. Confira se está escrito certo.';
  }
  if (status === 401 || status === 403) {
    return 'A chave do projeto não foi aceita. Confira o NEXT_PUBLIC_SUPABASE_ANON_KEY.';
  }
  return `O servidor recusou (erro ${status}${codigo ? `: ${codigo}` : ''}).`;
}

async function explicar(res: Response): Promise<string> {
  let codigo = '';
  let mensagem = '';
  try {
    const d = (await res.json()) as { error_code?: string; msg?: string; message?: string };
    mensagem = d.msg ?? d.message ?? '';
    codigo = d.error_code ?? '';
    if (!codigo && mensagem) codigo = mensagem;
  } catch {
    /* Sem corpo legível: sobra o status. */
  }
  return mensagemDeErro({ status: res.status, codigo, mensagem });
}

// ───────────────────────── Para onde voltar ─────────────────────────

/** Onde alguém cai quando não pediu lugar nenhum. */
export const DEPOIS_DE_ENTRAR = '/comunidade/perfil/';

/**
 * Filtra o `?volta=` da tela de entrar: só CAMINHO INTERNO passa.
 *
 * Sem isto, a tela de entrar vira um redirecionador aberto — alguém manda
 * `/comunidade/entrar/?volta=//site-falso`, a pessoa entra de verdade no
 * WikiPong, vê o cadeado e o domínio certos, e é cuspida noutro site ainda
 * confiando no que está vendo. É o formato clássico de phishing por link de
 * login, e ele custa uma linha pra fechar.
 *
 * DUAS FORMAS DISFARÇADAS, e as duas começam com barra:
 *   `//site-falso.com`   URL absoluta sem protocolo — vai pra fora.
 *   `/\site-falso.com`   o navegador normaliza `\` pra `/`, e vira a de cima.
 *
 * Por isso o teste não é "começa com barra": é "começa com barra E o segundo
 * caractere não é outra barra, nem invertida".
 */
export function caminhoInterno(
  v: string | null | undefined,
  padrao: string = DEPOIS_DE_ENTRAR,
): string {
  if (!v || v[0] !== '/') return padrao;
  if (v[1] === '/' || v[1] === '\\') return padrao;
  return v;
}

// ───────────────────────── A porta com senha ─────────────────────────

/**
 * Só evita uma ida à rede pro caso óbvio (campo com três letras). Quem decide
 * de verdade é o servidor: se o painel exigir mais, a recusa dele chega
 * traduzida por `mensagemDeErro`, com o número que ELE disse.
 *
 * 6 é o padrão do Supabase. Não é regra do WikiPong e não deve virar uma.
 */
export const SENHA_MINIMA = 6;

type RespostaDeToken = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  user?: { email?: string };
};

/** Transforma a resposta de token numa Sessão e guarda. Devolve o que guardou. */
function daResposta(d: RespostaDeToken, email?: string): Sessao {
  const s: Sessao = {
    accessToken: d.access_token!,
    refreshToken: d.refresh_token ?? '',
    expiraEm: Math.floor(Date.now() / 1000) + (d.expires_in ?? 3600),
    email: d.user?.email ?? email,
  };
  guardar(s);
  return s;
}

function endereco(): { base: string; anon: string } {
  const base = url();
  const anon = chave();
  if (!base || !anon) throw new Error('Supabase não configurado.');
  return { base, anon };
}

/** O que aconteceu ao criar a conta — as duas saídas são sucesso. */
export type ResultadoDoCadastro = 'entrou' | 'confirme-o-email';

/**
 * Cria conta com e-mail e senha.
 *
 * DUAS SAÍDAS, e a tela precisa das duas: com "Confirm email" ligado no painel,
 * o Supabase devolve só o usuário e manda um e-mail — não há sessão ainda.
 * Desligado, ele já devolve os tokens e a pessoa entra na hora. Tratar as duas
 * como iguais deixaria metade das pessoas olhando uma tela que diz "pronto"
 * sem ter entrado.
 *
 * Quando o e-mail JÁ TEM CONTA e a confirmação está ligada, o Supabase responde
 * 200 com um usuário falso, de propósito, e manda um aviso pra caixa da pessoa.
 * Não desmascaramos isso aqui: a resposta honesta continua sendo "olhe seu
 * e-mail", que é verdade nos dois casos.
 */
export async function criarConta(
  email: string,
  senha: string,
  redirecionar: string,
): Promise<ResultadoDoCadastro> {
  const { base, anon } = endereco();
  const destino = `${base}/auth/v1/signup?redirect_to=${encodeURIComponent(redirecionar)}`;
  const res = await fetch(destino, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha }),
  });
  if (!res.ok) throw new Error(await explicar(res));

  const d = (await res.json()) as RespostaDeToken;
  if (!d.access_token) return 'confirme-o-email';
  daResposta(d, email);
  return 'entrou';
}

/** Entra com e-mail e senha. Guarda a sessão e devolve ela. */
export async function entrarComSenha(email: string, senha: string): Promise<Sessao> {
  const { base, anon } = endereco();
  const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha }),
  });
  if (!res.ok) throw new Error(await explicar(res));
  return daResposta((await res.json()) as RespostaDeToken, email);
}

/**
 * Manda o link de recuperação. `redirecionar` tem que ser a tela de trocar a
 * senha — o link volta com os tokens no fragmento, e é `capturarDaURL` lá que
 * transforma isso em sessão.
 *
 * A resposta é sempre 200, exista conta ou não. Isso é do Supabase e está
 * certo: responder diferente diria quem tem conta aqui.
 */
export async function pedirRecuperacao(email: string, redirecionar: string): Promise<void> {
  const { base, anon } = endereco();
  const destino = `${base}/auth/v1/recover?redirect_to=${encodeURIComponent(redirecionar)}`;
  const res = await fetch(destino, {
    method: 'POST',
    headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(await explicar(res));
}

/**
 * Define a senha de quem está logado. Serve pros dois casos, que são o mesmo
 * por dentro: quem chegou pelo link de recuperação e quem já estava dentro e
 * quer trocar.
 *
 * Serve TAMBÉM pra dar senha a quem só tinha link no e-mail — a conta existe,
 * só não tinha senha. Por isso "esqueci minha senha" é a resposta certa pra
 * quem entrou por link e agora quer usar senha.
 */
export async function trocarSenha(nova: string): Promise<void> {
  const { base, anon } = endereco();
  const s = await sessaoAtual();
  if (!s) throw new Error('Sua sessão expirou. Peça um link novo pra trocar a senha.');

  const res = await fetch(`${base}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: anon,
      Authorization: `Bearer ${s.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: nova }),
  });
  if (!res.ok) throw new Error(await explicar(res));
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

export interface Usuario {
  id: string;
  email?: string;
}

/**
 * Quem está logado. O `id` é o que importa pro banco — é ele que assina a
 * avaliação e é a chave do perfil. O e-mail serve pra tela dizer o nome.
 */
export async function usuarioAtual(s: Sessao): Promise<Usuario | null> {
  const base = url();
  const anon = chave();
  if (!base || !anon) return null;
  try {
    const res = await fetch(`${base}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${s.accessToken}` },
    });
    if (!res.ok) return null;
    const d = (await res.json()) as { id?: string; email?: string };
    return d.id ? { id: d.id, email: d.email } : null;
  } catch {
    return null;
  }
}

/** Só o e-mail, pra quem só quer mostrar o nome na tela. */
export const quemSou = async (s: Sessao): Promise<string | null> =>
  (await usuarioAtual(s))?.email ?? null;

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
