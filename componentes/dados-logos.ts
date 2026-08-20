/**
 * Logos das marcas — arquivo oficial, com crédito e URL de origem.
 *
 * Mesma regra das fotos de produto (D-16): imagem sem origem clara não entra, e
 * não desenhamos uma parecida. Marca sem entrada aqui cai no selo tipográfico
 * do `LogoMarca`, que é visivelmente NOSSO — e isso é melhor que um logo
 * inventado que passaria por verdadeiro.
 */
import dados from '@/dados/logos-marcas.json';

export interface LogoDeMarca {
  arquivo: string;
  fonte: string;
  fonteUrl: string;
  consultadoEm: string;
  /**
   * Sobre que fundo a marca desenhou o logo. Ausente = claro (placa branca).
   *
   * Existe porque algumas marcas publicam SÓ a versão reversa: a Yinhe entrega
   * um wordmark branco, que na placa branca vira um quadrado vazio. Recolorir
   * seria alterar a marca de outra pessoa; dar a ela o fundo escuro que ela
   * mesma usa é usar o asset como o dono pretendia.
   */
  fundo?: 'claro' | 'escuro';
}

const LOGOS = dados.logos as Record<string, LogoDeMarca>;

export const logoDaMarca = (marca: string): LogoDeMarca | undefined => LOGOS[marca];

export const QUANTAS_COM_LOGO = Object.keys(LOGOS).length;
