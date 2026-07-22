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
import dadosLojas from '@/dados/lojas.json';

export interface Oferta {
  materialId: string;
  loja: string;
  /** OPCIONAL: só existe quando um preço foi realmente conferido. Sem preço
   *  conferido, a oferta ainda vale como link — mas nunca se inventa número. */
  preco?: number;
  url: string;
  /** Data REAL da checagem (ISO). Nunca fingir frescor — D-16. */
  atualizadoEm: string;
  /** Loja com acordo comercial: exige tag PARCEIRO visível. */
  parceiro?: boolean;
}

/** Loja do diretório: onde PROCURAR. Não afirma estoque nem preço do item. */
export interface Loja {
  id: string;
  nome: string;
  url: string;
  /** Template de busca com {q} — só onde o padrão é confiável. */
  buscaTemplate?: string;
  nota?: string;
}

export const LOJAS = dadosLojas.lojas as Loja[];
export const AVISO_LOJAS: string = dadosLojas.aviso;

/** URL de busca da loja para um termo, quando ela tem template; senão, a loja. */
export function urlDeBusca(loja: Loja, termo: string): string {
  if (!loja.buscaTemplate) return loja.url;
  const q = termo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return loja.buscaTemplate.replace('{q}', q);
}

const OFERTAS = dados.ofertas as Oferta[];

export const AVISO_OFERTAS: string = dados.aviso;

/** Ofertas de um material, SEMPRE da mais barata para a mais cara (D-13).
 *  Ofertas sem preço conferido vão para o fim — nunca ganham posição por serem
 *  de parceiro, e nunca fingem ser a mais barata. */
export function ofertasDoMaterial(materialId: string): Oferta[] {
  return OFERTAS.filter((o) => o.materialId === materialId).sort((a, b) => {
    if (a.preco === undefined && b.preco === undefined) return 0;
    if (a.preco === undefined) return 1;
    if (b.preco === undefined) return -1;
    return a.preco - b.preco;
  });
}

/** Média das ofertas COM preço conferido — o "preço médio" do D-13.
 *  null quando nenhuma oferta tem preço: aí a UI mostra estimativa, não média. */
export function precoMedio(materialId: string): number | null {
  const comPreco = ofertasDoMaterial(materialId).filter(
    (o): o is Oferta & { preco: number } => typeof o.preco === 'number',
  );
  if (comPreco.length === 0) return null;
  return comPreco.reduce((soma, o) => soma + o.preco, 0) / comPreco.length;
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
