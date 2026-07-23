/**
 * Ponte tipada para dados/noticias.json — "Notícias" (D-19, feature 3).
 *
 * Digest curado: cada item é resumo curto + atribuição + link externo + data.
 * Não hospedamos o artigo de terceiros — a lista É o produto, e cada item leva
 * pra fonte (D-14/D-16). A ordenação por data (mais nova primeiro) mora AQUI,
 * para a página nunca depender da ordem do arquivo.
 */
import dados from '@/dados/noticias.json';

export interface Noticia {
  id: string;
  titulo: string;
  resumo: string;
  /** Fonte creditada (ex.: "CBTM", "@perfil"). */
  fonte: string;
  /** Link pro original. */
  url: string;
  /** Data REAL da publicação (ISO). */
  publicadoEm: string;
  /** Categoria curta opcional (ex.: "Torneio", "Seleção", "Paralímpico"). */
  tag?: string;
}

const BRUTAS = dados.noticias as Noticia[];

/** Da mais nova pra mais antiga — a data é a régua, não a ordem do arquivo. */
export const NOTICIAS: Noticia[] = [...BRUTAS].sort((a, b) =>
  b.publicadoEm.localeCompare(a.publicadoEm),
);

export const AVISO_NOTICIAS: string = dados.aviso;

/** Data legível pt-BR a partir do ISO. */
export function dataLegivel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
}

/** Domínio da fonte, para exibir "cbtm.org.br ↗". */
export function dominioDaFonte(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
