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
  spin: number;
  controle: number;
}

export type ClasseBorracha = 'tensor' | 'classica' | 'aderente';
export type Trajetoria = 'baixa' | 'media' | 'alta';

// ───────────────── Tabelas de configuração (A VALIDAR) ─────────────────

/** Faixa de tradução número → palavra (modo Simples). Ordenar por `min` decrescente. */
type Faixa = { min: number; palavra: string };

/** A VALIDAR: limiares propostos na v1 (consistentes com as telas do Figma) */
export const PALAVRAS: Record<'velocidade' | 'spin' | 'controle' | 'perdao', Faixa[]> = {
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
  perdao: [
    { min: 6.0, palavra: 'Perdoa bem' },
    { min: 4.0, palavra: 'Perdoa pouco' },
    { min: 0,   palavra: 'Impiedosa' },
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

/**
 * PERDÃO (0–10) — tolerância a erro. A métrica que o iniciante precisa e
 * nenhum fabricante publica. A VALIDAR (pesos v1):
 *   perdao = 0.5·controle + 0.3·(10 − velocidade) + 0.2·maciez
 */
export function perdao(specs: Specs, durezaUnificada: number): number {
  const p = 0.5 * specs.controle + 0.3 * (10 - specs.velocidade) + 0.2 * maciez(durezaUnificada);
  return Math.round(p * 10) / 10;
}

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
