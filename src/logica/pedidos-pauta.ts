/**
 * WikiPong · Pedidos de pauta — o que o leitor quer aprender
 * ------------------------------------------------------------------------------
 * Módulo PURO + repositório, no mesmo desenho das avaliações e das discussões.
 *
 * ESTE NÃO É UM CAMPO DE COMENTÁRIO. A diferença importa para o desenho inteiro:
 * comentário é conversa e vive no /comunidade; aqui a pessoa está pedindo um
 * GUIA que ainda não existe. Isso tem três consequências:
 *
 *  · o pedido nasce OUVIDO, não respondido. Não há resposta, não há linha de
 *    conversa — a resposta certa a "explica dureza de esponja" é um guia, e
 *    guia leva dias. Fingir um fórum aqui prometeria conversa que não vem;
 *  · o pedido tem um DESFECHO visível: quando o guia sai, o pedido aponta para
 *    ele (`guiaSlug`). Um pedido que some sem sinal ensina que pedir não serve;
 *  · pedido repetido é SINAL, não sujeira. Quinze pessoas pedindo a mesma coisa
 *    é a informação mais valiosa desta tela. Por isso `parecidos()` mostra o que
 *    já foi pedido ANTES de enviar — quem quiser somar voz soma no mesmo tema,
 *    em vez de abrir o décimo sexto pedido idêntico.
 *
 * HONESTIDADE (D-16): o pedido só aparece na lista depois de lido, como toda
 * escrita do site. A tela diz isso antes de a pessoa digitar, e o repositório
 * carrega `somenteLocal` para ela não descobrir depois que ninguém recebeu.
 */
import { tokenGuardado } from './sessao';

export interface PedidoDePauta {
  id: string;
  /** O tema, na palavra de quem pediu. É o que a lista mostra. */
  tema: string;
  /** Opcional: o contexto que ajuda a escrever o guia certo. */
  detalhe?: string;
  autor: string;
  usuarioId?: string;
  criadoEm: string;
  status: 'pendente' | 'aprovado' | 'removido';
  /** Slug do guia que nasceu deste pedido. Só o fundador preenche. */
  guiaSlug?: string;
}

export const TEMA_MINIMO = 10;
export const TEMA_MAXIMO = 160;
export const DETALHE_MAXIMO = 800;

export interface ProblemaPedido {
  campo: 'tema' | 'autor' | 'detalhe';
  mensagem: string;
}

export function validarPedido(p: Partial<PedidoDePauta>): ProblemaPedido[] {
  const problemas: ProblemaPedido[] = [];
  const tema = (p.tema ?? '').trim();
  const autor = (p.autor ?? '').trim();
  const detalhe = (p.detalhe ?? '').trim();

  if (tema.length < TEMA_MINIMO) {
    problemas.push({
      campo: 'tema',
      mensagem: `Diga o tema em pelo menos ${TEMA_MINIMO} caracteres — "cola" não dá pra transformar em guia.`,
    });
  } else if (tema.length > TEMA_MAXIMO) {
    problemas.push({
      campo: 'tema',
      mensagem: `O tema passou de ${TEMA_MAXIMO} caracteres. O que sobrar cabe no detalhe.`,
    });
  }
  if (autor.length < 2) {
    problemas.push({ campo: 'autor', mensagem: 'Diga como quer assinar.' });
  }
  if (detalhe.length > DETALHE_MAXIMO) {
    problemas.push({
      campo: 'detalhe',
      mensagem: `O detalhe passou de ${DETALHE_MAXIMO} caracteres.`,
    });
  }
  return problemas;
}

/** Sem acento, sem caixa, sem pontuação — para comparar tema com tema. */
const chave = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

/* Palavras que aparecem em quase todo pedido e não distinguem um do outro.
   Sem esta lista, "como escolher borracha" e "como escolher lâmina" ficam
   parecidos por causa de "como" e "escolher". */
const VAZIAS = new Set([
  'a', 'as', 'o', 'os', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em', 'no',
  'na', 'nos', 'nas', 'por', 'para', 'pra', 'com', 'sem', 'que', 'e', 'ou', 'se',
  'mais', 'meu', 'minha', 'sobre', 'como', 'qual', 'quais', 'quero', 'saber',
  'aprender', 'entender', 'melhor', 'melhores', 'ser', 'estar', 'tem', 'ter',
]);

const relevantes = (s: string) => chave(s).filter((p) => p.length > 2 && !VAZIAS.has(p));

/**
 * Pedidos já feitos que falam do mesmo assunto que `tema`.
 *
 * Serve a UMA coisa: mostrar, enquanto a pessoa digita, que alguém já pediu
 * isso. Não é busca — é a pergunta "já pediram?" respondida antes do envio.
 *
 * Basta UMA palavra relevante em comum. O limiar é baixo de propósito: aqui o
 * erro caro é esconder um pedido parecido e ganhar um duplicado; mostrar um
 * pedido que não era bem aquele custa uma linha a mais na tela.
 */
export function parecidos(
  pedidos: readonly PedidoDePauta[],
  tema: string,
  limite = 3,
): PedidoDePauta[] {
  const alvo = relevantes(tema);
  if (alvo.length === 0) return [];
  const alvoSet = new Set(alvo);

  return pedidos
    .map((p) => ({
      pedido: p,
      comuns: relevantes(p.tema).filter((palavra) => alvoSet.has(palavra)).length,
    }))
    .filter((x) => x.comuns > 0)
    .sort((a, b) => b.comuns - a.comuns || (a.pedido.criadoEm < b.pedido.criadoEm ? -1 : 1))
    .slice(0, limite)
    .map((x) => x.pedido);
}

export type OrdemPedido = 'recentes' | 'atendidos';

/**
 * `atendidos` põe na frente o que já virou guia. É a ordem que responde
 * "pedir aqui adianta?" — e a resposta é a primeira coisa que se vê.
 */
export function ordenarPedidos(
  pedidos: readonly PedidoDePauta[],
  ordem: OrdemPedido,
): PedidoDePauta[] {
  const lista = [...pedidos];
  if (ordem === 'atendidos') {
    return lista.sort((a, b) => {
      const pa = a.guiaSlug ? 0 : 1;
      const pb = b.guiaSlug ? 0 : 1;
      return pa - pb || (a.criadoEm > b.criadoEm ? -1 : 1);
    });
  }
  return lista.sort((a, b) => (a.criadoEm > b.criadoEm ? -1 : 1));
}

export const atendidos = (ps: readonly PedidoDePauta[]): PedidoDePauta[] =>
  ps.filter((p) => Boolean(p.guiaSlug));

// ───────────────────────── Onde os pedidos moram ─────────────────────────

export interface RepositorioPedidos {
  /** Nome curto pra UI dizer a verdade sobre onde isto está indo. */
  readonly rotulo: string;
  /** true quando o que se escreve não sai deste navegador. */
  readonly somenteLocal: boolean;
  listar(): Promise<PedidoDePauta[]>;
  gravar(p: PedidoDePauta): Promise<void>;
}

const CHAVE = 'wikipong:pedidos-pauta:v1';

export function repositorioPedidosLocal(): RepositorioPedidos {
  const ler = (): PedidoDePauta[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
      const cru = localStorage.getItem(CHAVE);
      return cru ? (JSON.parse(cru) as PedidoDePauta[]) : [];
    } catch {
      /* Storage cheio, desativado ou com lixo de outra versão. Perder a lista é
         ruim; derrubar a página é pior. */
      return [];
    }
  };

  return {
    rotulo: 'este navegador',
    somenteLocal: true,
    async listar() {
      return ler();
    },
    async gravar(p) {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(CHAVE, JSON.stringify([...ler().filter((x) => x.id !== p.id), p]));
      } catch {
        /* Quota estourada não pode virar tela branca. */
      }
    },
  };
}

/**
 * Supabase, por `fetch` puro — mesma decisão do repositório de avaliações: o
 * site é export estático e não vai carregar um SDK para fazer duas requisições.
 *
 * Schema em supabase/009-pedidos-de-pauta.sql. Colunas em snake_case, campos em
 * camelCase, e a tradução acontece nas duas funções abaixo e em lugar nenhum
 * mais.
 *
 * `status` e `guia_slug` NÃO são enviados daqui. O banco põe 'pendente' por
 * DEFAULT, e a política recusa insert que traga qualquer um dos dois — senão
 * bastaria montar a requisição na mão para publicar já aprovado, ou para
 * carimbar o próprio pedido como "virou guia" apontando para um guia que ninguém
 * escreveu.
 */
export function repositorioPedidosSupabase(url: string, chave: string): RepositorioPedidos {
  const base = `${url.replace(/\/$/, '')}/rest/v1/pedidos_de_pauta`;
  const chaveEhJwt = chave.startsWith('ey');

  type Linha = {
    id: string; tema: string; detalhe: string | null; autor: string;
    usuario_id: string | null; guia_slug: string | null;
    criado_em: string; status: string;
  };

  const daLinha = (l: Linha): PedidoDePauta => ({
    id: l.id,
    tema: l.tema,
    detalhe: l.detalhe ?? undefined,
    autor: l.autor,
    usuarioId: l.usuario_id ?? undefined,
    guiaSlug: l.guia_slug ?? undefined,
    criadoEm: l.criado_em,
    status: l.status as PedidoDePauta['status'],
  });

  return {
    rotulo: 'WikiPong',
    somenteLocal: false,
    async listar() {
      const res = await fetch(`${base}?select=*&order=criado_em.desc&limit=200`, {
        headers: cabecalhos(chave, chaveEhJwt),
      });
      if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
      return ((await res.json()) as Linha[]).map(daLinha);
    },
    async gravar(p) {
      const res = await fetch(base, {
        method: 'POST',
        headers: { ...cabecalhos(chave, chaveEhJwt), Prefer: 'return=minimal' },
        body: JSON.stringify({
          tema: p.tema,
          detalhe: p.detalhe && p.detalhe.trim() ? p.detalhe : null,
          autor: p.autor,
          ...(p.usuarioId ? { usuario_id: p.usuarioId } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Supabase recusou o pedido (${res.status})`);
    },
  };
}

/** A mesma regra de cabeçalho do repositório de avaliações: `apikey` sempre;
 *  `Authorization` só quando existe algo que é de fato um token. */
function cabecalhos(chave: string, chaveEhJwt: boolean): Record<string, string> {
  const h: Record<string, string> = { apikey: chave, 'Content-Type': 'application/json' };
  const token = tokenGuardado() ?? (chaveEhJwt ? chave : undefined);
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/** O ponto único de troca. Nada na UI sabe qual das duas está em uso. */
export const repositorioPedidos = (): RepositorioPedidos => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && chave ? repositorioPedidosSupabase(url, chave) : repositorioPedidosLocal();
};

export const novoIdPedido = (): string =>
  `pd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
