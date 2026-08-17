/**
 * WikiPong · Popularidade — o que a comunidade acha, e o que ela está usando
 * ==============================================================================
 * Dois sinais DIFERENTES, que o site nunca pode somar num número só:
 *
 *   NOTA        o que quem usou achou. Escala 0–5, do Revspin, com amostra.
 *   USO ATUAL   quanto o material aparece no levantamento de agosto/2026 do
 *               tabletennis-reference. Pontos, sem escala declarada.
 *
 * Somar os dois produziria um "score" que ninguém consegue defender depois — o
 * erro que a régua da Megaspin já ensinou a este projeto (um 118 e um 9.0 na
 * mesma coluna). Por isso a ordenação é LEXICOGRÁFICA: primeiro quem está no
 * levantamento de uso, por pontos; depois todo o resto, por nota. Cada linha da
 * tela pode dizer qual dos dois a colocou ali.
 *
 * ── POR QUE A NOTA CRUA NÃO SERVE PRA ORDENAR ────────────────────────────────
 * O catálogo tem 230 borrachas com `reviews: 0` e `rating: 4.5` — 4.5 ali é
 * preenchimento, não opinião de ninguém. Ordenar pela nota crua colocaria essas
 * 4.5 fantasma acima de uma 4.4 com 96 avaliações reais.
 *
 * `notaBayesiana` conserta isso do jeito clássico: puxa toda nota em direção à
 * média do catálogo com força proporcional à FALTA de amostra. Quem tem 200
 * avaliações quase não se move; quem tem zero vira a média e para de ganhar
 * disputa que não merece.
 */

/**
 * Quantas avaliações "de mentira", na média geral, entram no cálculo de toda
 * nota. É a força do puxão: com 20, uma borracha precisa de ~20 avaliações
 * reais pra que a nota dela pese tanto quanto o palpite médio.
 *
 * Não é um número sagrado — é uma escolha declarada, num lugar só, pra poder
 * ser revista sem caçar constante espalhada pelo código.
 */
export const PESO_DA_MEDIA = 20;

export interface Avaliado {
  rating: number;
  reviews: number;
}

/**
 * Média bayesiana: `(n·nota + K·média) / (n + K)`.
 *
 * Sem amostra, devolve a média do catálogo — nunca a nota de preenchimento.
 */
export const notaBayesiana = (m: Avaliado, mediaGeral: number, peso = PESO_DA_MEDIA): number =>
  (m.reviews * m.rating + peso * mediaGeral) / (m.reviews + peso);

/** A média das notas que TÊM amostra. Nota sem avaliação não vota na média. */
export function mediaDoCatalogo(itens: readonly Avaliado[]): number {
  const comAmostra = itens.filter((m) => m.reviews > 0);
  if (comAmostra.length === 0) return 0;
  return comAmostra.reduce((s, m) => s + m.rating, 0) / comAmostra.length;
}

export interface Popular extends Avaliado {
  /** Pontos do levantamento de uso. Ausente = fora do levantamento. */
  usoAtual?: number;
}

/**
 * A chave de ordenação da relevância, maior primeiro.
 *
 * Devolve um PAR, não um número: `[temUso, valor]`. É o par que mantém os dois
 * sinais separados — quem está no levantamento vence quem não está, sempre, e a
 * nota só desempata dentro de cada grupo. Um número só exigiria escolher quanto
 * "vale" um ponto de uso em nota, e essa taxa de câmbio não existe.
 */
export function chaveDeRelevancia(m: Popular, mediaGeral: number): [number, number] {
  return m.usoAtual !== undefined
    ? [1, m.usoAtual]
    : [0, notaBayesiana(m, mediaGeral)];
}

/** Compara duas chaves: mais relevante primeiro. */
export const compararRelevancia = (a: [number, number], b: [number, number]): number =>
  b[0] - a[0] || b[1] - a[1];

export function ordenarPorRelevancia<T extends Popular>(
  itens: readonly T[],
  mediaGeral: number,
): T[] {
  return [...itens].sort((a, b) =>
    compararRelevancia(chaveDeRelevancia(a, mediaGeral), chaveDeRelevancia(b, mediaGeral)),
  );
}

// ───────────────────────── As três famílias ─────────────────────────

/**
 * O que separa uma borracha da outra na hora de escolher NÃO é o país: é o
 * topsheet.
 *
 *   aderente  capa pegajosa sobre esponja dura, do jeito chinês. Gira muito e
 *             cobra técnica — a bola não sai sozinha.
 *   hibrida   capa aderente sobre esponja tensionada. O giro do estilo chinês
 *             com a energia da moderna.
 *   tensora   capa lisa, não-aderente, sobre esponja tensionada. É a família
 *             das europeias E das japonesas, que se jogam igual.
 *
 * ── POR QUE NÃO "EUROPEIA" ───────────────────────────────────────────────────
 * O fundador pediu "chinesas, híbridas e europeias", que é como a comunidade
 * fala. Mas Tenergy, Dignics 05, Fastarc e Rozena são JAPONESAS, e uma
 * enciclopédia que as chama de europeias está errada numa palavra que ela mesma
 * escolheu. O agrupamento dele está certo — o rótulo é que precisava ser
 * verdadeiro, e a tela diz as duas coisas.
 */
export type Familia = 'aderente' | 'hibrida' | 'tensora';

export const FAMILIAS: readonly Familia[] = ['aderente', 'hibrida', 'tensora'];

export const ROTULO_FAMILIA: Readonly<Record<Familia, string>> = {
  aderente: 'Chinesas',
  hibrida: 'Híbridas',
  tensora: 'Tensoras',
};

export const SUBTITULO_FAMILIA: Readonly<Record<Familia, string>> = {
  aderente: 'capa pegajosa, esponja dura',
  hibrida: 'capa aderente, esponja tensionada',
  tensora: 'capa lisa, esponja tensionada — europeias e japonesas',
};

export const EXPLICA_FAMILIA: Readonly<Record<Familia, string>> = {
  aderente:
    'A bola gruda na capa e sai com muito giro, mas não sai sozinha: quem joga com elas põe a velocidade no braço. É o material da escola chinesa.',
  hibrida:
    'Capa aderente por cima, esponja moderna por baixo. Nasceram pra dar o giro do estilo chinês sem exigir o braço inteiro — e é a família que mais cresceu no alto nível.',
  tensora:
    'Capa lisa e esponja tensionada: a bola sai mais fácil e o arco é mais alto. Aqui moram as alemãs e as japonesas, que se jogam do mesmo jeito apesar do passaporte.',
};
