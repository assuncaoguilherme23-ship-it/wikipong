/**
 * Ponte tipada entre o JSON estático (D-17) e o tipo canônico Material (filtros.ts).
 * `simples` (tag + "pra quem é") é conteúdo de exibição do modo Simples (D-08),
 * por isso estende Material aqui na UI em vez de poluir o módulo puro.
 */
import type { Material } from '@/src/logica/filtros';
import dados from '@/dados/materiais.json';

export interface MaterialCatalogo extends Material {
  simples: { tag: string; frase: string };
}

export const MATERIAIS: MaterialCatalogo[] = dados.materiais;

/** Aviso A VALIDAR do arquivo de dados (exibido junto das derivadas — D-09/D-16). */
export const AVISO_DADOS: string = dados.aviso;

export const materialPorId = (id: string): MaterialCatalogo | undefined =>
  MATERIAIS.find((m) => m.id === id);
