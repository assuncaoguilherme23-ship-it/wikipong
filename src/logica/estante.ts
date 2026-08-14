/**
 * WikiPong · A estante — o que a pessoa usou antes, e por que trocou
 * ------------------------------------------------------------------------------
 * É a coisa mais valiosa que existe em fórum de tênis de mesa e que ninguém
 * guarda direito: "saí da Mark V pra Rakza 7 porque queria mais giro no saque".
 * Sem isto, o perfil mostra só o presente.
 *
 * FATO E PROSA MORAM SEPARADOS (D-14). Material e período são verificáveis e
 * aparecem na hora; o motivo é texto livre num lugar público, nasce pendente e
 * só aparece pra terceiro depois de aprovado. O dono vê o próprio motivo
 * sempre — ninguém precisa sentir que o que escreveu sumiu.
 *
 * No banco isso são duas tabelas (`estante` e `estante_motivos`), porque a RLS
 * do Postgres filtra LINHAS e não colunas. Aqui em cima elas viram um objeto só.
 */
import { materialPorId } from '../../componentes/dados-materiais';

export type StatusMotivo = 'pendente' | 'aprovada' | 'descartada';

export interface EntradaDeEstante {
  id: string;
  materialId: string;
  /** ISO `aaaa-mm-dd`. Ausente = a pessoa não lembra, e tudo bem. */
  de?: string;
  /** Ausente = usa até hoje. */
  ate?: string;
  motivo?: string;
  motivoStatus?: StatusMotivo;
}

export const MOTIVO_MINIMO = 10;
export const MOTIVO_MAXIMO = 280;

/**
 * "Em uso hoje" exige pelo menos o início declarado (`de`) e nenhum fim (`ate`).
 * Uma entrada sem `de` NEM `ate` não é "em uso hoje" — é uma entrada sem data
 * nenhuma, e essa é outra categoria (vai pro fim da estante, não pro topo).
 */
export const emUsoHoje = (e: EntradaDeEstante): boolean => e.de !== undefined && !e.ate;

/**
 * Em uso primeiro; depois o mais recente. Sem data nenhuma vai pro fim: colocar
 * no meio seria afirmar uma cronologia que a pessoa não deu.
 */
export function ordenarEstante(es: readonly EntradaDeEstante[]): EntradaDeEstante[] {
  return [...es].sort((a, b) => {
    if (emUsoHoje(a) !== emUsoHoje(b)) return emUsoHoje(a) ? -1 : 1;
    const da = a.ate ?? a.de ?? '';
    const db = b.ate ?? b.de ?? '';
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return db.localeCompare(da);
  });
}

/** Lista de problemas em PT-BR, pronta pra tela. Vazia = pode gravar. */
export function problemasDaEntrada(e: EntradaDeEstante): string[] {
  const problemas: string[] = [];

  if (!materialPorId(e.materialId)) {
    problemas.push('Esse material não está no catálogo.');
  }
  if (e.de && e.ate && e.de > e.ate) {
    problemas.push('A data de início vem depois da de fim.');
  }
  if (e.motivo !== undefined) {
    const t = e.motivo.trim();
    if (t.length > 0 && t.length < MOTIVO_MINIMO) {
      problemas.push(`O motivo precisa de pelo menos ${MOTIVO_MINIMO} caracteres.`);
    }
    if (t.length > MOTIVO_MAXIMO) {
      problemas.push(`O motivo passa de ${MOTIVO_MAXIMO} caracteres — isso já é uma avaliação.`);
    }
  }
  return problemas;
}

/**
 * O que terceiro pode ler. TODA tela pública tem que passar por aqui em vez de
 * ler `.motivo` direto — é esta função que aplica a regra do D-14.
 */
export const motivoVisivel = (e: EntradaDeEstante, souODono: boolean): string | undefined =>
  souODono || e.motivoStatus === 'aprovada' ? e.motivo : undefined;

export interface RepositorioEstante {
  readonly somenteLocal: boolean;
  /** Sem argumento, lê a própria. Com id, lê a de outra pessoa (leitura pública). */
  listar(usuarioId?: string): Promise<EntradaDeEstante[]>;
  adicionar(e: Omit<EntradaDeEstante, 'id'>): Promise<void>;
  remover(id: string): Promise<void>;
}

const CHAVE_LOCAL = 'wikipong:estante:v1';

export function repositorioEstanteLocal(): RepositorioEstante {
  const ler = (): EntradaDeEstante[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(CHAVE_LOCAL) ?? '[]') as EntradaDeEstante[];
    } catch {
      return [];
    }
  };
  const gravar = (es: EntradaDeEstante[]) => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CHAVE_LOCAL, JSON.stringify(es));
    } catch {
      /* Quota estourada não pode virar tela branca. */
    }
  };
  return {
    somenteLocal: true,
    async listar() { return ler(); },
    async adicionar(e) {
      /* Deslogado, o segundo par de olhos é o dono do navegador: o motivo já
         nasce aprovado porque não sai deste aparelho. */
      gravar([...ler(), { ...e, id: crypto.randomUUID(), motivoStatus: 'aprovada' }]);
    },
    async remover(id) { gravar(ler().filter((e) => e.id !== id)); },
  };
}

export function repositorioEstanteSupabase(
  url: string, chave: string, token: string | null, usuarioId: string | null,
): RepositorioEstante {
  const raiz = url.replace(/\/$/, '');
  const cabecalhos = (): Record<string, string> => {
    const h: Record<string, string> = { apikey: chave, 'Content-Type': 'application/json' };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  type LinhaEstante = {
    id: string; usuario_id: string; material_id: string;
    de: string | null; ate: string | null;
    estante_motivos: { texto: string; status: string }[] | null;
  };

  return {
    somenteLocal: false,
    async listar(deQuem) {
      const quem = deQuem ?? usuarioId;
      if (!quem) return [];
      /* O motivo vem por embed. Quem não pode lê-lo recebe lista vazia ali —
         a RLS filtra, e a tela não precisa saber de nada disso. */
      const res = await fetch(
        `${raiz}/rest/v1/estante?usuario_id=eq.${encodeURIComponent(quem)}` +
        `&select=*,estante_motivos(texto,status)&order=criado_em.desc`,
        { headers: cabecalhos() },
      );
      if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
      return ((await res.json()) as LinhaEstante[]).map((l) => {
        const m = l.estante_motivos?.[0];
        return {
          id: l.id,
          materialId: l.material_id,
          de: l.de ?? undefined,
          ate: l.ate ?? undefined,
          motivo: m?.texto,
          motivoStatus: m?.status as StatusMotivo | undefined,
        };
      });
    },
    async adicionar(e) {
      if (!usuarioId) throw new Error('Entre para guardar sua estante.');
      const res = await fetch(`${raiz}/rest/v1/estante`, {
        method: 'POST',
        headers: { ...cabecalhos(), Prefer: 'return=representation' },
        body: JSON.stringify({
          usuario_id: usuarioId, material_id: e.materialId,
          de: e.de ?? null, ate: e.ate ?? null,
        }),
      });
      if (!res.ok) throw new Error(`Supabase recusou a entrada (${res.status})`);

      const texto = e.motivo?.trim();
      if (!texto) return;
      const criada = ((await res.json()) as { id: string }[])[0];
      /* `status` vai explícito e igual ao que a política exige. Mandar outra
         coisa aqui é 403 — e é assim que tem que ser. */
      await fetch(`${raiz}/rest/v1/estante_motivos`, {
        method: 'POST',
        headers: { ...cabecalhos(), Prefer: 'return=minimal' },
        body: JSON.stringify({
          estante_id: criada.id, usuario_id: usuarioId, texto, status: 'pendente',
        }),
      });
    },
    async remover(id) {
      /* O motivo cai junto pelo `on delete cascade`. */
      const res = await fetch(`${raiz}/rest/v1/estante?id=eq.${encodeURIComponent(id)}`, {
        method: 'DELETE', headers: cabecalhos(),
      });
      if (!res.ok) throw new Error(`Supabase recusou a remoção (${res.status})`);
    },
  };
}

/** Sem servidor, a estante mora no navegador — igual ao perfil. */
export function repositorioEstante(token?: string | null, usuarioId?: string | null): RepositorioEstante {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return repositorioEstanteLocal();
  return repositorioEstanteSupabase(url, chave, token ?? chave, usuarioId ?? null);
}
