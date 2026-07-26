/**
 * Ponte tipada para dados/marcas.json + tudo que a página de marca DERIVA.
 *
 * A regra aqui é a mesma do resto do site: o editorial é curto e a página se
 * sustenta em dado real já colhido — materiais do catálogo, faixa de preço,
 * escala declarada nas fichas e quais profissionais usam a marca. Nada disso é
 * digitado à mão (D-16).
 */
import dados from '@/dados/marcas.json';
import { MATERIAIS, type MaterialCatalogo } from './dados-materiais';
import { fabricantePorId } from './dados-fabricante';
import { PROFISSIONAIS, type Profissional } from './dados-profissionais';
import { escalaDoTexto } from '@/src/logica/escalas';
import { slug } from '@/src/logica/filtros';

export interface MarcaEditorial {
  pais: string;
  descricao: string;
  site: string;
}

const EDITORIAL = dados.marcas as Record<string, MarcaEditorial>;

export const AVISO_MARCAS: string = dados.aviso;

export interface Marca {
  /** Rótulo canônico, como aparece no catálogo ("Butterfly"). */
  nome: string;
  /** Slug de URL ("butterfly"). */
  slug: string;
  editorial?: MarcaEditorial;
  materiais: MaterialCatalogo[];
  /** Faixa de preço REAL entre os materiais da marca no catálogo. */
  precoMin: number;
  precoMax: number;
  /** Escalas de dureza que as fichas desta marca declaram (ex.: ['dhs']). */
  escalas: string[];
  /** Profissionais do nosso dado que usam alguma peça desta marca. */
  profissionais: Profissional[];
}

/** Marcas presentes no CATÁLOGO — a lista nunca é digitada. */
function nomesDeMarca(): string[] {
  return [...new Set(MATERIAIS.map((m) => m.marca))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

function montar(nome: string): Marca {
  const materiais = MATERIAIS.filter((m) => m.marca === nome);
  const precos = materiais.map((m) => m.preco);

  // Escalas de dureza que as fichas de fabricante desta marca realmente citam.
  const escalas = new Set<string>();
  for (const m of materiais) {
    const linha = fabricantePorId(m.id)?.ficha?.find((l) => /dureza/i.test(l.rotulo));
    const e = linha ? escalaDoTexto(linha.valor) : null;
    if (e) escalas.add(e);
  }

  // Um pro entra se QUALQUER peça do setup dele é desta marca. Compara pelo
  // nome da peça porque o setup de pro inclui equipamento fora do catálogo.
  const profissionais = PROFISSIONAIS.filter((p) =>
    p.pecas.some((peca) => peca.nome.toLowerCase().includes(nome.toLowerCase())),
  );

  return {
    nome,
    slug: slug(nome),
    editorial: EDITORIAL[nome],
    materiais,
    precoMin: precos.length ? Math.min(...precos) : 0,
    precoMax: precos.length ? Math.max(...precos) : 0,
    escalas: [...escalas],
    profissionais,
  };
}

export const MARCAS: Marca[] = nomesDeMarca().map(montar);

export const marcaPorSlug = (s: string): Marca | undefined =>
  MARCAS.find((m) => m.slug === s);
