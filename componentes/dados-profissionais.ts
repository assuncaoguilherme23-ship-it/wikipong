/**
 * Ponte tipada para dados/profissionais.json — "O que os profissionais usam".
 *
 * Cada peça do setup é uma REFERÊNCIA opcional ao catálogo: quando o `materialId`
 * casa com um material nosso, a peça vira link pra ficha; quando não, é só o nome
 * (nunca se inventa ficha — D-16). A honestidade do dado (setup muda, versão
 * National ≠ varejo) vive no `aviso` e nas notas por jogador (D-14).
 */
import dados from '@/dados/profissionais.json';
import { materialPorId, type MaterialCatalogo } from './dados-materiais';

export type Papel = 'Lâmina' | 'Forehand' | 'Backhand';

export interface PecaBruta {
  nome: string;
  /** OPCIONAL: id de um material do catálogo, quando há equivalente honesto. */
  materialId?: string;
}

export interface ProfissionalBruto {
  id: string;
  nome: string;
  pais: string;
  bandeira: string;
  mao: string;
  estilo: string;
  destaque: string;
  lamina: PecaBruta;
  forehand: PecaBruta;
  backhand: PecaBruta;
  fonte: string;
  consultadoEm: string;
  nota: string;
}

export interface PecaResolvida {
  papel: Papel;
  nome: string;
  /** Preenchido só quando o materialId casa com o catálogo. */
  material?: MaterialCatalogo;
}

export interface Profissional extends ProfissionalBruto {
  pecas: PecaResolvida[];
}

const BRUTOS = dados.profissionais as ProfissionalBruto[];

function resolverPeca(papel: Papel, peca: PecaBruta): PecaResolvida {
  const material = peca.materialId ? materialPorId(peca.materialId) : undefined;
  return { papel, nome: peca.nome, material };
}

function resolver(p: ProfissionalBruto): Profissional {
  return {
    ...p,
    pecas: [
      resolverPeca('Lâmina', p.lamina),
      resolverPeca('Forehand', p.forehand),
      resolverPeca('Backhand', p.backhand),
    ],
  };
}

export const PROFISSIONAIS: Profissional[] = BRUTOS.map(resolver);

export const AVISO_PROFISSIONAIS: string = dados.aviso;

export const profissionalPorId = (id: string): Profissional | undefined =>
  PROFISSIONAIS.find((p) => p.id === id);

/** Uso reverso: quais profissionais usam um material, e em qual papel.
 *  Alimenta a linha "Quem usa" na ficha do material. */
export interface UsoProfissional {
  profissional: Profissional;
  papeis: Papel[];
}

export function profissionaisQueUsam(materialId: string): UsoProfissional[] {
  const usos: UsoProfissional[] = [];
  for (const profissional of PROFISSIONAIS) {
    const papeis = profissional.pecas
      .filter((peca) => peca.material?.id === materialId)
      .map((peca) => peca.papel);
    if (papeis.length > 0) usos.push({ profissional, papeis });
  }
  return usos;
}
