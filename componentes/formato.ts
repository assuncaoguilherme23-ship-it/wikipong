import type { Moeda } from '@/src/logica/moedas';

/** Formatação de exibição (camada de UI — os módulos puros devolvem números).
 *  `centavos: true` para valores derivados (ex.: custo/mês = R$ 112,50);
 *  o default inteiro serve preços de catálogo. Fonte única — não duplicar. */
/**
 * Preço na moeda em que ele foi conferido.
 *
 * Material vendido no Brasil sai em real; o que só existe lá fora sai em dólar
 * ou euro, dito como tal. Converter seria publicar um número que muda todo dia
 * e que ninguém vai pagar — importação tem frete e imposto que o câmbio não
 * cobre.
 */
export const dinheiro = (v: number, moeda?: Moeda): string =>
  moeda
    ? v.toLocaleString('pt-BR', { style: 'currency', currency: moeda, maximumFractionDigits: 0 })
    : brl(v);

export const brl = (v: number, centavos = false): string =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: centavos ? 2 : 0,
  });
