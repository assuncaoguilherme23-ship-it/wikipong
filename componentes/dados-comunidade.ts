/**
 * Ponte tipada para dados/comunidade.json — "Sinal da comunidade" (D-19, feature 2).
 *
 * É a nota AGREGADA de uma comunidade EXTERNA (Revspin), com contagem, fonte e data.
 * Não é avaliação da WikiPong — as nossas, estruturadas e moderadas, vêm com o D-11.
 * Duas regras de honestidade moram AQUI, no código (não na disciplina):
 *   · `sinalDaComunidade` só devolve material com amostra suficiente — o JSON já é
 *     curado com ≥ MIN_AVALIACOES, e a UI nunca apresenta 1 voto como "a comunidade".
 *   · `ehFavoritoDaComunidade` exige nota alta E volume — um pico de poucos votos
 *     não vira selo (D-16).
 */
import dados from '@/dados/comunidade.json';

export interface SinalComunidade {
  /** Comunidade de origem (ex.: "Revspin") — sempre com atribuição visível. */
  fonte: string;
  url: string;
  /** Nota agregada na escala da fonte. */
  nota: number;
  /** Escala da nota (ex.: 10 = "de 10"). */
  escala: number;
  /** Quantas avaliações sustentam a média — mostrada sempre, para dar peso à nota. */
  avaliacoes: number;
  /** Data REAL da checagem (ISO). */
  consultadoEm: string;
}

const SINAIS = dados.sinais as Record<string, SinalComunidade>;

export const AVISO_COMUNIDADE: string = dados.aviso;

/** Limiares do selo "Favorito da comunidade": nota alta E volume. */
export const NOTA_FAVORITO = 9.0;
export const VOLUME_FAVORITO = 50;

/** Sinal de um material, ou undefined quando não temos amostra suficiente. */
export function sinalDaComunidade(id: string): SinalComunidade | undefined {
  return SINAIS[id];
}

/** "Favorito da comunidade": nota ≥ 9,0 sustentada por ≥ 50 avaliações. */
export function ehFavoritoDaComunidade(id: string): boolean {
  const s = SINAIS[id];
  return !!s && s.nota >= NOTA_FAVORITO && s.avaliacoes >= VOLUME_FAVORITO;
}

/** Data legível pt-BR a partir do ISO. */
export function dataLegivel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
}

/** Domínio da fonte, para exibir "revspin.net ↗". */
export function dominioDaFonte(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
