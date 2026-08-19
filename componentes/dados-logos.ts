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
}

const LOGOS = dados.logos as Record<string, LogoDeMarca>;

export const logoDaMarca = (marca: string): LogoDeMarca | undefined => LOGOS[marca];

export const QUANTAS_COM_LOGO = Object.keys(LOGOS).length;
