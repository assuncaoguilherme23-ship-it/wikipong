/**
 * Ponte tipada para dados/conjuntos.json — montagens (lâmina + 2 borrachas).
 *
 * As peças são REFERÊNCIAS por id ao catálogo: aqui não se duplica spec nenhuma.
 * O preço total é DERIVADO (soma real das três peças) — é o único número que dá
 * pra calcular com honestidade numa montagem; desempenho combinado não existe
 * como fórmula defensável e por isso não é publicado (D-16).
 */
import dados from '@/dados/conjuntos.json';
import { materialPorId, type MaterialCatalogo } from './dados-materiais';
import type { Moeda } from '@/src/logica/moedas';

export interface ConjuntoBruto {
  id: string;
  nome: string;
  resumo: string;
  nivel: string;
  intencao: string;
  lamina: string;
  borrachaFH: string;
  borrachaBH: string;
  porque: string;
}

export interface PecaResolvida {
  papel: 'Lâmina' | 'Forehand' | 'Backhand';
  material: MaterialCatalogo;
}

export interface Conjunto extends ConjuntoBruto {
  pecas: PecaResolvida[];
  /** Soma real dos preços das peças. Só vale quando `misturaMoedas` é falso. */
  precoTotal: number;
  /**
   * Moeda comum das três peças. `undefined` = real (a ausência de moeda é o
   * real, em todo o catálogo).
   */
  moeda?: Moeda;
  /**
   * true quando as peças NÃO estão todas na mesma moeda — e aí o total não
   * existe como número honesto.
   *
   * Não é hipótese: o catálogo tem material em dólar e em coroa, e montar um
   * conjunto com uma lâmina em reais e uma borracha em dólar somaria 338 + 60 e
   * publicaria "R$ 398". Quem lesse pagaria a conta da invenção.
   */
  misturaMoedas: boolean;
}

const BRUTOS = dados.conjuntos as ConjuntoBruto[];

/** Resolve as referências e soma o preço. Peça inexistente é ignorada em vez de
 *  quebrar a página — e a soma reflete só o que existe (nunca um total fantasma). */
function resolver(c: ConjuntoBruto): Conjunto {
  const pares: [PecaResolvida['papel'], string][] = [
    ['Lâmina', c.lamina],
    ['Forehand', c.borrachaFH],
    ['Backhand', c.borrachaBH],
  ];

  const pecas: PecaResolvida[] = [];
  for (const [papel, id] of pares) {
    const material = materialPorId(id);
    if (material) pecas.push({ papel, material });
  }

  const moedas = new Set(pecas.map((p) => p.material.moeda));

  return {
    ...c,
    pecas,
    precoTotal: pecas.reduce((soma, p) => soma + p.material.preco, 0),
    moeda: pecas[0]?.material.moeda,
    misturaMoedas: moedas.size > 1,
  };
}

export const CONJUNTOS: Conjunto[] = BRUTOS.map(resolver);

export const AVISO_CONJUNTOS: string = dados.aviso;

export const conjuntoPorId = (id: string): Conjunto | undefined =>
  CONJUNTOS.find((c) => c.id === id);
