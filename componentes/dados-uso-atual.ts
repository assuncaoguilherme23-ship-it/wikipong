/**
 * Ponte do levantamento de uso atual (tabletennis-reference, agosto/2026).
 *
 * O QUE ESTE NÚMERO É: quanto uma borracha aparece no levantamento deles, em
 * pontos. O QUE ELE NÃO É: venda, participação de mercado, nem nota. A página
 * de origem publica os pontos e **não declara como os calcula** — a ressalva
 * está no `aviso` do JSON e tem que aparecer em toda tela que usar isto (D-16).
 *
 * Os pontos só são comparáveis ENTRE SI. Misturá-los com a escala 0–10 da
 * comunidade seria repetir o erro que a régua da Megaspin já ensinou aqui: um
 * 118 e um 9.0 na mesma coluna.
 */
import dados from '@/dados/uso-atual.json';

export interface UsoAtual {
  /** Pontos no ranking de forehand, quando aparece nele. */
  fh?: number;
  /** Pontos no ranking de backhand, quando aparece nele. */
  bh?: number;
  posFh?: number;
  posBh?: number;
}

const USO = dados.uso as Record<string, UsoAtual>;

export const PERIODO_DO_USO = dados.periodo;
export const CONSULTADO_EM_USO = dados.consultadoEm;
export const FONTE_USO_FH = dados.fonteFh;
export const FONTE_USO_BH = dados.fonteBh;

export const usoDoMaterial = (id: string): UsoAtual | undefined => USO[id];

/**
 * O peso de uso de um material: o MAIOR dos dois lados.
 *
 * Máximo e não soma: uma borracha que é forte só no backhand (a Zyre 03, por
 * exemplo) não pode ficar atrás de uma mediana nos dois lados só porque somar
 * dois números medianos dá mais que um número alto. O que se quer saber é
 * "quanto ela aparece", e ela aparece pelo lado mais forte.
 */
export function pontosDeUso(id: string): number | undefined {
  const u = USO[id];
  if (!u) return undefined;
  const valores = [u.fh, u.bh].filter((n): n is number => typeof n === 'number');
  return valores.length ? Math.max(...valores) : undefined;
}

export const QUANTAS_COM_USO = Object.keys(USO).length;
