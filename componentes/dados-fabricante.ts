/**
 * Ponte tipada para dados/fabricantes.json — o que o FABRICANTE publica.
 * Fica separado de materiais.json de propósito (D-14): ali vive a derivação do
 * WikiPong (a estimativa unificada 0–10); aqui vive o fato de fonte externa,
 * com fonte, data e confiança. Valor não confirmado nunca é preenchido (D-16).
 */
import dados from '@/dados/fabricantes.json';

export type Confianca = 'oficial' | 'revendedor' | 'pendente';

export interface LinhaFicha {
  rotulo: string;
  valor: string;
}

export interface IndicesFabricante {
  /** A escala é interna da marca — NÃO comparável entre fabricantes (D-09). */
  escala: string;
  valores: { rotulo: string; valor: number }[];
}

export interface DadoFabricante {
  confianca: Confianca;
  fonte: string;
  consultadoEm: string;
  ficha?: LinhaFicha[];
  indices?: IndicesFabricante;
  nota?: string;
}

const MAPA = dados.fabricantes as Record<string, DadoFabricante>;

export const ROTULO_CONFIANCA: Record<Confianca, string> = {
  oficial: 'Fonte oficial do fabricante',
  revendedor: 'Revendedor oficial',
  pendente: 'Ainda não confirmado',
};

export const fabricantePorId = (id: string): DadoFabricante | undefined => MAPA[id];

/** Domínio legível da fonte, pra mostrar no link (ex.: butterfly-global.com). */
export function dominioDaFonte(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
