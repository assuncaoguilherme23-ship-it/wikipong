/**
 * WikiPong · O que dá para confrontar entre dois materiais
 * ==============================================================================
 * Módulo puro, extraído de `/comparar` depois de um defeito que só existia
 * porque a regra morava dentro do componente e ninguém podia testá-la.
 *
 * ── O DEFEITO ────────────────────────────────────────────────────────────────
 *
 * A página montava DUAS listas em paralelo: os rótulos dos eixos do radar e os
 * números. Duas listas que precisam ter o mesmo tamanho são duas listas que um
 * dia não têm — e não tinham. O JSX passava quatro rótulos fixos enquanto a
 * função de valores devolvia três para lâmina. O radar distribui os pontos por
 * `valores.length`, então três números viravam um triângulo a 120° sobre eixos
 * desenhados a 90°: cada valor plotado no eixo errado. Não quebrava. Mentia.
 *
 * Pior: o tipo `MaterialComparavel` declarava `durabilidade` e `durezaUnificada`
 * como obrigatórios, mas a guarda só chamava `temDesempenho`, que não olha
 * nenhum dos dois. O TypeScript acreditou e parou de exigir checagem, e
 * `durabilidade.toFixed(1)` estourava em `undefined`. Como TODAS as 94 lâminas
 * estão sem durabilidade, toda comparação lâmina × lâmina quebrava: 4.371 dos
 * 10.588 pares do mesmo tipo.
 *
 * ── A REGRA ──────────────────────────────────────────────────────────────────
 *
 * Uma métrica entra na comparação quando OS DOIS materiais a têm. Rótulo, eixo
 * e valores nascem no mesmo objeto — não dá mais para acrescentar um sem o
 * outro.
 *
 * O que é da BORRACHA e por isso falta na lâmina:
 *   · efeito       — propriedade da borracha; a madeira não tem
 *   · durabilidade — esponja gasta; madeira não gasta assim
 *
 * Comparar borracha com lâmina continua proibido, e isso é decisão de produto:
 * velocidade de borracha e velocidade de lâmina medem realidades diferentes.
 * Esta função não julga tipo — quem chama já garantiu o par.
 */
import type { Specs } from './metricas';
import { mesmaRegua } from './metricas';

/**
 * O mínimo que este módulo precisa saber de um material.
 *
 * `specs` é OPCIONAL desde que a comparação foi aberta aos materiais sem perfil
 * de desempenho — 470 dos 678. Eles não têm velocidade nem controle, mas têm
 * ficha do fabricante, construção traduzida e preço, e isso já é comparação.
 * Aqui a consequência é simples: sem specs, nenhuma métrica numérica sai, e a
 * tela cai no confronto de ficha (ver `/comparar`).
 */
export interface Comparavel {
  specs?: Specs;
  durabilidade?: number;
  durezaUnificada?: number;
}

export interface Metrica {
  /** Nome na tabela. */
  rotulo: string;
  /** Sigla no radar (3 letras, é o que cabe). */
  eixo: string;
  /** [a, b], na ordem em que o par foi passado. */
  valores: [number, number];
  /** Para o modo Simples traduzir em bolinhas + palavra. `null` = só número. */
  atributo: 'velocidade' | 'spin' | 'controle' | 'durabilidade' | null;
  /** O preço fica de fora do radar: o eixo mede 0–10, e reais não são isso. */
  noRadar: boolean;
}

/** Menos de 3 vértices não é polígono — é traço, e traço não se lê. */
export const MINIMO_PARA_RADAR = 3;

/**
 * As métricas que os DOIS materiais têm, na ordem em que aparecem na tabela.
 * `rotuloEfeito` existe porque o modo Simples chama "Spin" de "Efeito" (D-08).
 */
export function metricasComparaveis(
  a: Comparavel,
  b: Comparavel,
  rotuloEfeito = 'Spin',
): Metrica[] {
  /* Sem perfil dos DOIS lados não há métrica numérica nenhuma — nem velocidade,
     que é a única que todo material com specs tem. Devolver lista vazia é o
     certo: quem chama já sabe cair no confronto de ficha. */
  const sa = a.specs;
  const sb = b.specs;
  if (!sa || !sb) return [];

  /* RÉGUAS DIFERENTES NÃO SE COMPARAM, e isto é tão importante quanto o teste
     acima. Um 118 da régua Megaspin ao lado de um 9.0 da semente não é "o
     primeiro é mais rápido": são medidas de bases diferentes, e a tabela daria
     a entender que uma esmaga a outra. Devolver lista vazia manda a tela para o
     confronto de ficha — que continua verdadeiro — em vez de publicar uma
     comparação que não existe. */
  if (!mesmaRegua(sa, sb)) return [];

  const m: Metrica[] = [
    {
      rotulo: 'Velocidade',
      eixo: 'VEL',
      valores: [sa.velocidade, sb.velocidade],
      atributo: 'velocidade',
      noRadar: true,
    },
  ];

  if (sa.spin !== undefined && sb.spin !== undefined) {
    m.push({
      rotulo: rotuloEfeito,
      eixo: 'EFE',
      valores: [sa.spin, sb.spin],
      atributo: 'spin',
      noRadar: true,
    });
  }

  m.push({
    rotulo: 'Controle',
    eixo: 'CTR',
    valores: [sa.controle, sb.controle],
    atributo: 'controle',
    noRadar: true,
  });

  if (a.durabilidade !== undefined && b.durabilidade !== undefined) {
    m.push({
      rotulo: 'Durabilidade',
      eixo: 'DUR',
      valores: [a.durabilidade, b.durabilidade],
      atributo: 'durabilidade',
      noRadar: true,
    });
  }

  /* O PERDÃO ficava aqui. Saiu em 2026-08-03: aparecia em 10 materiais de 678
     (dependia da dureza unificada) e era um composto de pesos nossos
     apresentado ao lado de índices que as marcas publicam. A durabilidade, que
     já estava logo acima, assumiu o lugar dele como quarto índice. */

  return m;
}

/** Só as que vão ao radar. Rótulos e valores saem daqui juntos, sempre. */
export const metricasDoRadar = (metricas: readonly Metrica[]): Metrica[] =>
  metricas.filter((m) => m.noRadar);

/** Dá para desenhar o radar deste par? */
export const temRadar = (metricas: readonly Metrica[]): boolean =>
  metricasDoRadar(metricas).length >= MINIMO_PARA_RADAR;
