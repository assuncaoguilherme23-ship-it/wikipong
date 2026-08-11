/**
 * WikiPong · A fila de notícias que chegam sozinhas
 * ------------------------------------------------------------------------------
 * A coleta é automática (scripts/colher-noticias.mjs, disparado pela rotina do
 * GitHub); a publicação não é, e a separação é o ponto do desenho.
 *
 * O robô traz o que é FATO — título, endereço, data, fonte — e mais a linha fina
 * que a CBTM publica embaixo do título de cada notícia. Essa linha resolve o
 * resumo de graça, mas ela é palavra DELES: `origemResumo` guarda isso, e a tela
 * atribui. Publicar frase alheia sem dizer de quem é seria o erro da GEWO com
 * roupa melhor.
 *
 * `aprovar` continua EXIGINDO resumo. Não é validação de formulário — é a regra
 * do produto: manchete pelada não vai ao ar, nem por engano. O que mudou é que
 * agora quase sempre já existe um texto ali quando a notícia chega.
 */
import { tokenGuardado } from './sessao';

export type StatusNoticia = 'pendente' | 'aprovada' | 'descartada';

/** 'fonte' = a linha fina da CBTM, atribuída na tela. 'wikipong' = nossa. */
export type OrigemResumo = 'fonte' | 'wikipong';

export interface NoticiaRecebida {
  id: string;
  titulo: string;
  url: string;
  fonte: string;
  publicadoEm: string;
  /** A linha fina da fonte, ou o que se escreveu na moderação por cima dela. */
  resumo?: string;
  /** De quem é o `resumo`. Ausente nas notícias anteriores à coluna. */
  origemResumo?: OrigemResumo;
  tag?: string;
  colhidoEm: string;
  status: StatusNoticia;
}

export const RESUMO_MINIMO = 40;

/** Pronta para ir ao ar: alguém leu, escreveu e aprovou. */
export const publicavel = (n: NoticiaRecebida): boolean =>
  n.status === 'aprovada' && Boolean(n.resumo && n.resumo.trim().length >= RESUMO_MINIMO);

/** Mais recente primeiro — notícia velha no topo da fila é fila mal ordenada. */
export const ordenarNoticias = (ns: readonly NoticiaRecebida[]): NoticiaRecebida[] =>
  [...ns].sort((a, b) => b.publicadoEm.localeCompare(a.publicadoEm));

export const esperando = (ns: readonly NoticiaRecebida[]): NoticiaRecebida[] =>
  ns.filter((n) => n.status === 'pendente');

export interface RepositorioNoticias {
  readonly disponivel: boolean;
  listar(): Promise<NoticiaRecebida[]>;
  /** Publica. Recusa sem resumo — a regra mora aqui, não só no formulário. */
  aprovar(id: string, resumo: string, tag?: string, origem?: OrigemResumo): Promise<void>;
  descartar(id: string): Promise<void>;
  /** Devolve à fila, para reescrever o resumo depois. */
  devolver(id: string): Promise<void>;
}

type Linha = {
  id: string; titulo: string; url: string; fonte: string; publicado_em: string;
  resumo: string | null; origem_resumo: string | null;
  tag: string | null; colhido_em: string; status: string;
};

const daLinha = (l: Linha): NoticiaRecebida => ({
  id: l.id, titulo: l.titulo, url: l.url, fonte: l.fonte,
  publicadoEm: l.publicado_em, resumo: l.resumo ?? undefined,
  origemResumo: (l.origem_resumo as OrigemResumo | null) ?? undefined,
  tag: l.tag ?? undefined,
  colhidoEm: l.colhido_em, status: l.status as StatusNoticia,
});

export function repositorioNoticiasSupabase(url: string, chave: string): RepositorioNoticias {
  const base = `${url.replace(/\/$/, '')}/rest/v1/noticias_recebidas`;
  const chaveEhJwt = chave.startsWith('ey');
  const cabecalhos = (): Record<string, string> => {
    const h: Record<string, string> = { apikey: chave, 'Content-Type': 'application/json' };
    const token = tokenGuardado() ?? (chaveEhJwt ? chave : undefined);
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };
  const remendar = async (id: string, corpo: object) => {
    const res = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { ...cabecalhos(), Prefer: 'return=minimal' },
      body: JSON.stringify(corpo),
    });
    if (!res.ok) throw new Error(`Supabase recusou a mudança (${res.status})`);
  };

  return {
    disponivel: true,
    async listar() {
      const res = await fetch(`${base}?select=*&order=publicado_em.desc&limit=200`, { headers: cabecalhos() });
      if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
      return ((await res.json()) as Linha[]).map(daLinha);
    },
    async aprovar(id, resumo, tag, origem) {
      /* A recusa é aqui e não só na tela: quem chamar esta função de outro lugar
         continua impedido de publicar manchete sem resumo. */
      if (resumo.trim().length < RESUMO_MINIMO) {
        throw new Error(`O resumo precisa de pelo menos ${RESUMO_MINIMO} caracteres — é ele que a pessoa lê.`);
      }
      await remendar(id, {
        resumo: resumo.trim(), status: 'aprovada',
        ...(tag ? { tag } : {}), ...(origem ? { origem_resumo: origem } : {}),
      });
    },
    descartar: (id) => remendar(id, { status: 'descartada' }),
    devolver: (id) => remendar(id, { status: 'pendente' }),
  };
}

/** Sem backend, a fila não existe — e a tela diz isso em vez de aparecer vazia. */
export const repositorioNoticias = (): RepositorioNoticias => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) {
    return {
      disponivel: false,
      async listar() { return []; },
      async aprovar() { throw new Error('sem servidor'); },
      async descartar() { throw new Error('sem servidor'); },
      async devolver() { throw new Error('sem servidor'); },
    };
  }
  return repositorioNoticiasSupabase(url, chave);
};
