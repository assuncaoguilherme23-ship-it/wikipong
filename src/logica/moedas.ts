/**
 * As moedas em que um preço pode ter sido conferido — em um lugar só.
 *
 * O real não está aqui de propósito: ele é a ausência de moeda. Material com
 * `moeda` indefinida é material vendido no Brasil, e é ele que entra no filtro
 * e na ordenação por preço. As moedas desta lista são estrangeiras por
 * definição, e o que está nelas fica fora dessas duas coisas (D-13, emenda de
 * 2026-08-02).
 *
 * O preço é sempre o que a loja publica na moeda dela. Uma loja sueca que mostra
 * "26,36 €" ao lado de "449 SEK" está convertendo pelo câmbio do dia; publicar
 * essa conversão seria publicar um número que muda todo dia e que ninguém vai
 * pagar. Vale o valor estruturado, na moeda de origem.
 */
export const MOEDAS = ['USD', 'EUR', 'SEK'] as const;

export type Moeda = (typeof MOEDAS)[number];
