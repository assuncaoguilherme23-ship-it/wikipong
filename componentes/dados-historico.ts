/**
 * Ponte tipada para dados/historico-precos.json — a série temporal que o git
 * já guardava sem a gente perceber (D-13).
 *
 * O que a UI pode dizer com este dado depende de quantos pontos existem, e a
 * distinção importa (D-16):
 *   1 ponto  → "conferido uma vez, nesta data" — NÃO é acompanhamento
 *   2+ pontos → dá pra falar em variação, com o antes e o depois
 */
import dados from '@/dados/historico-precos.json';

export interface PontoPreco {
  data: string;
  preco: number;
}

export interface SerieLoja {
  loja: string;
  pontos: PontoPreco[];
}

const MATERIAIS = dados.materiais as Record<string, SerieLoja[]>;

export const GERADO_EM: string = dados.geradoEm;

export function serieDoMaterial(materialId: string, loja: string): PontoPreco[] {
  return MATERIAIS[materialId]?.find((s) => s.loja === loja)?.pontos ?? [];
}

export interface Variacao {
  /** Quantas checagens com preço DIFERENTE já houve. 1 = nunca variou. */
  observacoes: number;
  primeiro: PontoPreco;
  atual: PontoPreco;
  /** Diferença em reais entre o primeiro e o atual. 0 quando só há um ponto. */
  delta: number;
  /** Variação percentual, arredondada. */
  percentual: number;
}

/** Resumo da série. null quando não há histórico nenhum para o par. */
export function variacao(materialId: string, loja: string): Variacao | null {
  const pontos = serieDoMaterial(materialId, loja);
  if (pontos.length === 0) return null;
  const primeiro = pontos[0];
  const atual = pontos[pontos.length - 1];
  const delta = atual.preco - primeiro.preco;
  return {
    observacoes: pontos.length,
    primeiro,
    atual,
    delta,
    percentual: primeiro.preco === 0 ? 0 : Math.round((delta / primeiro.preco) * 100),
  };
}

/** Data legível pt-BR. */
export function dataCurta(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
