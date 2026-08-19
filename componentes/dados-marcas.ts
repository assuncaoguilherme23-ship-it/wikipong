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
  /**
   * OPCIONAL desde 2026-08-16: marca cujo site oficial saiu do ar entra SEM
   * link, em vez de com um link morto (D-16). A Friendship 729 e a Yinhe são
   * os dois casos — os domínios delas não resolvem mais em DNS, e não achamos
   * endereço novo. Quando achar, o campo volta.
   */
  site?: string;
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
  /* A faixa é em REAIS, então só entra nela quem tem preço em reais. Material
     internacional (D-13, emenda de 2026-08-02) traz o preço na moeda de origem;
     jogar US$ 218 num "a partir de R$" daria um mínimo falso E na moeda errada. */
  const precos = materiais.filter((m) => m.moeda === undefined).map((m) => m.preco);

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
