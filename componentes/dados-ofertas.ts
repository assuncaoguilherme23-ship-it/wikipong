/**
 * Ponte tipada para dados/ofertas.json — ofertas reais por material (D-13).
 *
 * Duas regras do D-13 vivem AQUI, no código, para não dependerem de disciplina:
 *   · `ofertasDoMaterial` devolve SEMPRE ordenado por preço — nunca por parceiro.
 *     Dinheiro pode decidir quem entra na lista; a posição é do preço.
 *   · `precoMedio` é DERIVADO (média das ofertas), nunca digitado.
 *
 * Enquanto não houver oferta real, `precoMedio` devolve null — e a UI mostra o
 * preço-semente rotulado como estimativa, em vez de fingir um preço apurado.
 */
import dados from '@/dados/ofertas.json';

export interface Oferta {
  materialId: string;
  loja: string;
  preco: number;
  url: string;
  /** Data REAL da checagem (ISO). Nunca fingir frescor — D-16. */
  atualizadoEm: string;
  /** Loja com acordo comercial: exige tag PARCEIRO visível. */
  parceiro?: boolean;
}

const OFERTAS = dados.ofertas as Oferta[];

export const AVISO_OFERTAS: string = dados.aviso;

/** Ofertas de um material, SEMPRE da mais barata para a mais cara (D-13). */
export function ofertasDoMaterial(materialId: string): Oferta[] {
  return OFERTAS.filter((o) => o.materialId === materialId).sort((a, b) => a.preco - b.preco);
}

/** Média das ofertas ativas — o "preço médio" do D-13. null quando não há oferta. */
export function precoMedio(materialId: string): number | null {
  const lista = ofertasDoMaterial(materialId);
  if (lista.length === 0) return null;
  return lista.reduce((soma, o) => soma + o.preco, 0) / lista.length;
}

/** id estável de uma oferta, usado na rota /ir/[id] (link no nosso domínio). */
export const idDaOferta = (o: Oferta): string =>
  `${o.materialId}--${o.loja.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;

export const TODAS_AS_OFERTAS: Oferta[] = OFERTAS;

export const ofertaPorId = (id: string): Oferta | undefined =>
  OFERTAS.find((o) => idDaOferta(o) === id);

/** Data legível pt-BR a partir do ISO. */
export function dataLegivel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
}
