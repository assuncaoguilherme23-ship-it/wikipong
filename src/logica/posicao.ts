/**
 * WikiPong · Onde este material cai dentro do catálogo
 * ==============================================================================
 * POR QUE ESTE MÓDULO EXISTE
 *
 * A tela de detalhe tinha UM gráfico: o radar. Ele precisa de três eixos para
 * ser polígono, e medindo o catálogo o alcance dele é este:
 *
 *     com radar .......... 114 de 678  (17%)
 *     só 2 eixos ......... 94          (todas as lâminas)
 *     sem spec nenhuma ... 470
 *
 * Ou seja: NENHUMA das 393 lâminas tem gráfico, e a maioria do catálogo também
 * não. Radar é bom para comparar formas entre dois materiais — é o que ele faz
 * no /comparar — mas é péssimo para responder a pergunta que a pessoa faz
 * sozinha na ficha: **8,2 é muito?**
 *
 * ── O QUE ESTE MÓDULO RESPONDE ───────────────────────────────────────────────
 *
 * "Velocidade 8,2" não significa nada isolado. "Mais rápida que 78% das
 * borrachas do catálogo" significa. A conta é a posição do valor dentro do
 * universo comparável, e o universo é sempre declarado — comparar a velocidade
 * de uma borracha com a de uma lâmina seria o mesmo erro que o /comparar já
 * proíbe.
 *
 * Alcance: funciona com UM índice, então serve a lâmina (velocidade e controle)
 * e serve o preço, que existe em 678 de 678. Todo material passa a ter gráfico.
 *
 * Módulo PURO: recebe números, devolve números.
 */

export interface Posicao {
  /** O valor deste material. */
  valor: number;
  /** Menor e maior do universo comparável — as pontas da régua desenhada. */
  min: number;
  max: number;
  /** 0 a 100: quantos % do universo ficam ABAIXO deste valor. */
  percentil: number;
  /** Quantos materiais formaram a régua. Vai na tela: régua de 3 não é régua. */
  base: number;
}

/** Abaixo disto a régua não se sustenta e a tela não deve desenhá-la. */
export const BASE_MINIMA = 8;

/**
 * Posição de `valor` dentro de `universo`.
 *
 * `null` quando não há régua honesta: universo pequeno demais, ou todo mundo com
 * o mesmo número (aí não há "mais que" nem "menos que" a dizer).
 *
 * O percentil conta quantos ficam ESTRITAMENTE abaixo — empate não conta como
 * superado. Sem isso, o material mais lento de um grupo com muitos empates
 * apareceria como "mais rápido que 40%", o que é o oposto do que se vê na lista.
 */
export function posicaoNaFaixa(valor: number, universo: readonly number[]): Posicao | null {
  const validos = universo.filter((v) => Number.isFinite(v));
  if (validos.length < BASE_MINIMA) return null;

  const min = Math.min(...validos);
  const max = Math.max(...validos);
  if (min === max) return null;

  const abaixo = validos.filter((v) => v < valor).length;
  return {
    valor,
    min,
    max,
    percentil: Math.round((abaixo / validos.length) * 100),
    base: validos.length,
  };
}

/**
 * Onde o marcador fica na régua, de 0 a 1 — POSIÇÃO REAL no intervalo, não o
 * percentil.
 *
 * Os dois são diferentes de propósito. O percentil responde "quantos ficam para
 * trás" e vira frase; a fração responde "onde no intervalo" e vira desenho. Usar
 * o percentil para desenhar faria dois materiais de 9,4 e 9,5 aparecerem em
 * pontas opostas da régua só porque há muita gente entre eles.
 */
export const fracaoNaFaixa = (p: Posicao): number =>
  Math.min(1, Math.max(0, (p.valor - p.min) / (p.max - p.min)));

/**
 * A frase que acompanha a régua. Fala em português, não em percentil cru:
 * "mais que 78%" é número; "está entre as mais rápidas" é resposta.
 *
 * `maiorEhMais` existe porque em PREÇO o eixo é o mesmo mas a leitura não: 90%
 * de velocidade é "das mais rápidas"; 90% de preço é "das mais caras".
 */
export function leituraDaPosicao(p: Posicao, rotulo: string): string {
  const q = p.percentil;
  if (q >= 90) return `entre os 10% de maior ${rotulo} do catálogo`;
  if (q >= 75) return `acima de ${q}% do catálogo em ${rotulo}`;
  if (q >= 55) return `um pouco acima da média do catálogo em ${rotulo}`;
  if (q >= 45) return `na média do catálogo em ${rotulo}`;
  if (q >= 25) return `um pouco abaixo da média do catálogo em ${rotulo}`;
  if (q >= 10) return `abaixo de ${100 - q}% do catálogo em ${rotulo}`;
  return `entre os 10% de menor ${rotulo} do catálogo`;
}
