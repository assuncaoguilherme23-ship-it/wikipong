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

export type OrigemDureza = 'fabricante' | 'semente';

export interface MaterialCatalogo extends Material {
  simples: { tag: string; frase: string };
  /** De onde veio a `durezaUnificada`: convertida da ficha do fabricante, ou
   *  estimativa-semente porque o fabricante não declara grau/régua. */
  origemDureza: OrigemDureza;
  /** O que o fabricante publica, quando publica — para a UI mostrar a origem. */
  durezaFabricante?: { grau: number; escala: string };
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

function resolver(m: (typeof dados.materiais)[number]): MaterialCatalogo {
  const doFabricante = durezaDaFicha(m.id);
  if (!doFabricante) return { ...m, origemDureza: 'semente' };
  return {
    ...m,
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
