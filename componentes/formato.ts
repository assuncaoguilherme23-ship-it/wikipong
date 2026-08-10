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

/**
 * Nome com a marca na frente, sem repeti-la.
 *
 * O catálogo tem duas convenções, e isso não é bagunça a corrigir: 789 dos 862
 * materiais guardam o nome NU ("Rozena", "Rakza 7") porque a marca é campo
 * próprio e as telas a mostram à parte; os 73 mais antigos, da semente, trazem a
 * marca embutida ("Yasaka Mark V"). Mudar os dados renomearia material em todo o
 * site por um problema de exibição.
 *
 * Serve onde o nome aparece SOZINHO, sem a linha de marca ao lado — aí "Rozena"
 * ao lado de "Xiom Vega Intro" fica desalinhado, e quem está começando não tem
 * como saber que a primeira é uma Butterfly.
 */
export const nomeComMarca = (marca: string, nome: string): string =>
  nome.toLowerCase().startsWith(marca.toLowerCase()) ? nome : `${marca} ${nome}`;

export const brl = (v: number, centavos = false): string =>
  v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: centavos ? 2 : 0,
  });
