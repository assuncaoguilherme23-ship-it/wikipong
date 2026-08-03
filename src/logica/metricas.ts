/**
 * WikiPong · Métricas derivadas e traduções de modo (D-08, D-09 do DECISOES.md)
 * ------------------------------------------------------------------------------
 * Módulo PURO: sem DOM, sem framework. Entra dado, sai dado.
 *
 * Arquitetura: um modelo canônico (specs numéricas de fabricante) + TABELAS de
 * lookup + funções de renderização. As tabelas são CONFIGURAÇÃO — é o que o
 * especialista valida e edita, sem tocar em lógica (D-07).
 *
 * ⚠️ Tudo marcado "A VALIDAR" é PROPOSTA V1 (ver board "Métricas · Derivadas"
 * no Figma). Não remover os carimbos até a assinatura do especialista.
 */

// ───────────────────────── Tipos ─────────────────────────

export interface Specs {
  /** 0–10, escala do fabricante (não comparável entre marcas — por isso as derivadas) */
  velocidade: number;
  /**
   * OPCIONAL: efeito é propriedade da BORRACHA, não da lâmina. Nem o Revspin
   * nem a própria Butterfly publicam 'spin' de lâmina — e não é lacuna das
   * fontes, é a realidade física: a lâmina contribui indiretamente. Lâmina
   * entra sem este campo em vez de carregar número inventado (D-16).
   */
  spin?: number;
  controle: number;
}

export type ClasseBorracha = 'tensor' | 'classica' | 'aderente';
export type Trajetoria = 'baixa' | 'media' | 'alta';

// ───────────────── Tabelas de configuração (A VALIDAR) ─────────────────

/** Faixa de tradução número → palavra (modo Simples). Ordenar por `min` decrescente. */
type Faixa = { min: number; palavra: string };

/**
 * A VALIDAR: limiares propostos na v1 (consistentes com as telas do Figma)
 *
 * ── O PERDÃO SAIU DAQUI (2026-08-03, decisão do fundador) ────────────────────
 *
 * Ele era o quarto índice e o diferencial anunciado na home: "a métrica que o
 * iniciante precisa e nenhum fabricante publica". Duas coisas o derrubaram.
 *
 * A primeira é cobertura, e foi medida: o Perdão dependia da dureza unificada,
 * e ela existe em DEZ materiais de 678. O índice que a home apresentava como
 * razão de ser do site aparecia em 1,5% do catálogo.
 *
 * A segunda é natureza: ele era um composto inventado por nós
 * (0.5·controle + 0.3·(10−velocidade) + 0.2·maciez), com pesos que nunca foram
 * validados por ninguém. Publicar número derivado é aceitável quando a
 * derivação é rastreável e o insumo é declarado — é o caso da dureza unificada.
 * Não era o caso aqui: os pesos eram escolha nossa apresentada como medida.
 *
 * No lugar entrou DURABILIDADE, que já estava no dado (114 materiais), já era o
 * quarto eixo do radar e conversa com o custo/mês — borracha é consumível, e
 * quanto ela dura muda a conta de qual é cara.
 */
export const PALAVRAS: Record<'velocidade' | 'spin' | 'controle' | 'durabilidade', Faixa[]> = {
  velocidade: [
    { min: 8.5, palavra: 'Muito rápida' },
    { min: 7.5, palavra: 'Rápida' },
    { min: 5.5, palavra: 'Moderada' },
    { min: 0,   palavra: 'Tranquila' },
  ],
  spin: [ // exibido como "Efeito" no modo Simples (D-08)
    { min: 9.0, palavra: 'Altíssimo' },
    { min: 7.0, palavra: 'Bom' },
    { min: 5.0, palavra: 'Moderado' },
    { min: 0,   palavra: 'Baixo' },
  ],
  controle: [
    { min: 8.5, palavra: 'Muito fácil' },
    { min: 7.5, palavra: 'Fácil' },
    { min: 6.0, palavra: 'Exige atenção' },
    { min: 0,   palavra: 'Difícil de domar' },
  ],
  /* Quanto a peça aguenta antes de perder o que tinha de fábrica. Alto é bom —
     ao contrário do preço, e igual aos outros três desta tabela. */
  durabilidade: [
    { min: 8.5, palavra: 'Vida longa' },
    { min: 7.0, palavra: 'Dura bem' },
    { min: 5.0, palavra: 'Vida média' },
    { min: 0,   palavra: 'Gasta rápido' },
  ],
};

/** A VALIDAR: durabilidade de referência (meses), jogador 3×/semana (D-09) */
export const DURABILIDADE_MESES: Record<ClasseBorracha, number> = {
  tensor: 4,
  classica: 10,
  aderente: 6,
};

// ───────────────────────── Funções puras ─────────────────────────

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Número → palavra, via tabela. O "renderer Simples" das tabelas (D-08). */
export function paraPalavra(atributo: keyof typeof PALAVRAS, valor: number): string {
  const faixa = PALAVRAS[atributo].find(f => valor >= f.min);
  return faixa ? faixa.palavra : PALAVRAS[atributo][PALAVRAS[atributo].length - 1].palavra;
}

/** Número (0–10) → bolinhas (0–5), o renderer dos cards Simples. round(v/2): 9.0→5, 7.0→4. */
export function paraBolinhas(valor: number): number {
  return clamp(Math.round(valor / 2), 0, 5);
}

/**
 * Maciez (0–10) a partir da dureza UNIFICADA (graus, escala ESN-equivalente).
 * A VALIDAR — mapeamento linear v1: maciez = (67 − dureza) / 5, limitado a [0,10].
 * Nota honesta: o board do Figma publicou exemplos (Tenergy→4.6, Mark V→6.4) sem
 * definir este mapeamento; codificar forçou a definição — esta reproduz ambos
 * os exemplos exatamente (47°→4, 42°→5). Código é a revisão final da spec.
 */
export function maciez(durezaUnificada: number): number {
  return clamp((67 - durezaUnificada) / 5, 0, 10);
}

/* O PERDÃO ficava aqui. Foi removido em 2026-08-03 — o porquê está no cabeçalho
   de PALAVRAS, acima. `maciez` continua: ela é insumo da tradução de dureza
   (traduzir.ts) e da ficha do material, e sai de um grau declarado pelo
   fabricante, não de pesos escolhidos por nós. */

/**
 * CUSTO ESTIMADO POR MÊS (R$) — o grande equalizador (D-09).
 * Referência: jogador 3×/semana. Devolve número; formatação é da camada de UI.
 */
export function custoMensal(precoMedio: number, durabilidadeMeses: number): number {
  if (durabilidadeMeses <= 0) throw new Error('durabilidadeMeses deve ser > 0');
  return precoMedio / durabilidadeMeses;
}

export function custoMensalPorClasse(precoMedio: number, classe: ClasseBorracha): number {
  return custoMensal(precoMedio, DURABILIDADE_MESES[classe]);
}

/** Destaque factual: índices do MAIOR valor por linha (empates destacam todos).
 *  Convenção D-09: "maior ≠ melhor". NÃO aplicar em custo (maior = pior). */
export function indicesDoMaximo(valores: number[]): number[] {
  const max = Math.max(...valores);
  return valores.flatMap((v, i) => (v === max ? [i] : []));
}
