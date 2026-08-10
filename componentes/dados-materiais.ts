/**
 * Ponte tipada entre o JSON estático (D-17) e o tipo canônico Material (filtros.ts).
 * `simples` (tag + "pra quem é") é conteúdo de exibição do modo Simples (D-08),
 * por isso estende Material aqui na UI em vez de poluir o módulo puro.
 *
 * ── DUREZA UNIFICADA É DERIVADA, NÃO DIGITADA (D-09) ──────────────────────────
 * Havia duas fontes para o mesmo conceito: o campo `durezaUnificada` do JSON
 * (proposta v1 digitada à mão, sem derivação rastreável) e a ficha do FABRICANTE
 * (grau + régua, com fonte e data em fabricantes.json). Duas fontes discordavam —
 * e o pior caso não dependia da tabela de conversão: a semente dizia que a
 * Dignics 05 (40° na régua Butterfly) era MAIS MACIA que a Tenergy 05 (36° na
 * mesma régua), invertendo a ordem que o próprio fabricante publica.
 *
 * Resolução: onde o fabricante declara grau E régua, `durezaUnificada` passa a
 * ser CALCULADA (ficha → conversão → ESN-equivalente). Onde não declara, o valor
 * da semente continua valendo como estimativa — e `origemDureza` diz qual é o
 * caso, para a UI poder ser honesta sobre a procedência.
 */
import type { Material } from '@/src/logica/filtros';
import dados from '@/dados/materiais.json';
import { fabricantePorId } from './dados-fabricante';
import { escalaDoTexto, grauRepresentativo, paraESN } from '@/src/logica/escalas';
import { MOEDAS, type Moeda } from '@/src/logica/moedas';
import type { Specs } from '@/src/logica/metricas';

export type OrigemDureza = 'fabricante' | 'semente';

/**
 * De onde vêm velocidade/efeito/controle:
 *  · 'comunidade' — médias do Revspin, na mesma escala 0–10, com amostra e URL
 *  · 'semente'    — proposta do protótipo, sem fonte rastreável (A VALIDAR)
 * As duas não valem o mesmo, e a ficha diz qual é qual (D-16).
 */
export type OrigemSpecs = 'comunidade' | 'semente';

export interface MaterialCatalogo extends Material {
  simples: { tag: string; frase: string };
  /** De onde veio a `durezaUnificada`: convertida da ficha do fabricante, ou
   *  estimativa-semente porque o fabricante não declara grau/régua. */
  origemDureza: OrigemDureza;
  /** O que o fabricante publica, quando publica — para a UI mostrar a origem. */
  durezaFabricante?: { grau: number; escala: string };
  /** Ausente = 'semente' (os materiais antigos, anteriores a esta distinção). */
  origemSpecs?: OrigemSpecs;
}

/** Converte a ficha do fabricante em grau ESN-equivalente. null quando não dá. */
function durezaDaFicha(id: string): { unificada: number; grau: number; escala: string } | null {
  const linha = fabricantePorId(id)?.ficha?.find((l) => /dureza/i.test(l.rotulo));
  if (!linha) return null;
  const grau = grauRepresentativo(linha.valor);
  const escala = escalaDoTexto(linha.valor);
  if (grau === null || escala === null) return null;
  const faixa = paraESN(grau, escala);
  return {
    // Centro da faixa, arredondado: a régua unificada trabalha em graus inteiros.
    unificada: Math.round((faixa.min + faixa.max) / 2),
    grau,
    escala,
  };
}

/* A lista vive em src/logica/moedas.ts — uma moeda nova se declara lá, e este
   arquivo e o formatador passam a conhecê-la juntos. */

/**
 * `moeda` do JSON de volta ao tipo estreito — ou um erro que quebra o build.
 *
 * Um código errado aqui não pode passar calado: ou a página vai tentar formatar
 * uma moeda que não existe e quebrar longe da causa, ou — pior — o valor sai
 * como se fosse real, e o leitor lê US$ 800 como R$ 800. Falhar no build é a
 * hora certa de descobrir isso.
 */
function moedaDo(m: { id: string; moeda?: string }): Moeda | undefined {
  if (m.moeda === undefined) return undefined;
  const achada = MOEDAS.find((c) => c === m.moeda);
  if (!achada) {
    throw new Error(
      `Material "${m.id}": moeda "${m.moeda}" não é uma das conhecidas (${MOEDAS.join(', ')}).`,
    );
  }
  return achada;
}

/**
 * `specs` do JSON de volta ao tipo estreito — ou um erro que quebra o build.
 *
 * Mesma razão da `moedaDo`: o JSON infere `regua` como string, e uma régua que o
 * código não conhece não pode passar calado. Publicar 118 como se fosse a régua
 * 0–10 é o defeito exato que este campo existe para impedir, e ele só é útil se
 * um valor errado falhar AQUI, e não silenciosamente numa tabela.
 */
function specsDe(m: { id: string; specs?: { velocidade: number; spin?: number; controle: number; regua?: string } }) {
  if (!m.specs) return undefined;
  const { regua, ...resto } = m.specs;
  if (regua === undefined) return resto as Specs;
  const achada = REGUAS.find((r) => r === regua);
  if (!achada) {
    throw new Error(
      `Material "${m.id}": régua "${regua}" não é uma das conhecidas (${REGUAS.join(', ')}).`,
    );
  }
  return { ...resto, regua: achada } as Specs;
}

const REGUAS = ['semente', 'megaspin'] as const;

function resolver(m: (typeof dados.materiais)[number]): MaterialCatalogo {
  /* O JSON infere `origemSpecs` como string; aqui ela volta ao tipo estreito.
     Ausente = 'semente' (os materiais anteriores a esta distinção). */
  const origemSpecs = ((m as { origemSpecs?: string }).origemSpecs ?? 'semente') as OrigemSpecs;
  const base = { ...m, origemSpecs, moeda: moedaDo(m), specs: specsDe(m) };

  const doFabricante = durezaDaFicha(m.id);
  if (!doFabricante) return { ...base, origemDureza: 'semente' };
  return {
    ...base,
    durezaUnificada: doFabricante.unificada,
    origemDureza: 'fabricante',
    durezaFabricante: { grau: doFabricante.grau, escala: doFabricante.escala },
  };
}

export const MATERIAIS: MaterialCatalogo[] = dados.materiais.map(resolver);

/** Aviso A VALIDAR do arquivo de dados (exibido junto das derivadas — D-09/D-16). */
export const AVISO_DADOS: string = dados.aviso;

export const materialPorId = (id: string): MaterialCatalogo | undefined =>
  MATERIAIS.find((m) => m.id === id);
