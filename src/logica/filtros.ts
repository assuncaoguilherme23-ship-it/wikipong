/**
 * WikiPong · Motor de filtros do catálogo (colheita do protótipo — D-15)
 * ------------------------------------------------------------------------------
 * Portado do wikipong-home-v2.html (state + applyFilters + buildFacets). Como o
 * quiz, é módulo PURO e IMUTÁVEL: entra dado, sai dado; sem DOM, sem framework;
 * cada updater devolve um FiltroEstado novo.
 *
 * O estado do filtro é a FONTE ÚNICA DE VERDADE e vive na URL (D-12): parseQuery /
 * serializeQuery convertem de/para query string no MESMO formato dos presetURL que
 * o quiz gera — ex.: "/catalogo?nivel=iniciante&ctrl=8-10&vel=3-6&ordenar=perdao".
 *
 * Divergências conscientes vs. protótipo (exigidas pelos presets do D-12):
 *   · numéricos viram FAIXAS {min,max} — o threshold do protótipo é o caso min-only;
 *   · Controle entra como faceta numérica (o protótipo só filtrava vel/spin);
 *   · a ordenação ganha 'controle' e 'perdao'. Perdão reusa a fórmula de metricas.ts
 *     (D-09) — fonte única; por isso o Material carrega `durezaUnificada`.
 */
import { perdao, type Specs } from './metricas';

// ───────────────────────── Tipos ─────────────────────────

export interface Material {
  id: string;
  nome: string;
  marca: string; // canônico: 'Butterfly', 'Stiga'…
  tipo: string; // canônico: 'Borracha', 'Lâmina', 'Raquete', 'Bola'
  nivel: string; // canônico: 'Iniciante', 'Intermediário', 'Avançado'
  intencao: string; // 'atacar' | 'controlar' | 'equilibrado' (plain.intent do protótipo)
  preco: number;
  specs: Specs; // { velocidade, spin, controle } — mesmo tipo canônico de metricas
  durabilidade: number; // 0–10 (4º eixo do radar)
  durezaUnificada: number; // grau ESN-equivalente; insumo do Perdão (D-09)
  rating: number;
  reviews: number;
}

export interface Faixa {
  min: number;
  max: number;
}

export type Ordenacao =
  | 'relevancia'
  | 'velocidade'
  | 'spin'
  | 'controle'
  | 'perdao'
  | 'preco-asc'
  | 'preco-desc';

export interface FiltroEstado {
  readonly tipos: readonly string[]; // slugs
  readonly marcas: readonly string[]; // slugs
  readonly niveis: readonly string[]; // slugs
  readonly intencoes: readonly string[]; // slugs
  readonly velocidade: Faixa | null;
  readonly spin: Faixa | null;
  readonly controle: Faixa | null;
  readonly preco: Faixa | null;
  readonly ordenar: Ordenacao;
}

const ORDENACOES: readonly Ordenacao[] = [
  'relevancia',
  'velocidade',
  'spin',
  'controle',
  'perdao',
  'preco-asc',
  'preco-desc',
];

/** Specs vão de 0–10; é o teto de uma faixa "min-only" (ex.: ctrl=7 → {7,10}). */
const TETO_SPEC = 10;

// ───────────────────── Utilitários puros ─────────────────────

/** 'Intermediário' → 'intermediario'; 'Lâmina' → 'lamina'. Casa rótulo canônico com slug de URL. */
export function slug(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos combinantes
    .trim()
    .replace(/\s+/g, '-');
}

function parseFaixa(valor: string | null, modo: 'min' | 'max', teto: number): Faixa | null {
  if (!valor) return null;
  const m = valor.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (m) {
    const min = Number(m[1]);
    const max = Number(m[2]);
    return Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null;
  }
  const n = Number(valor);
  if (!Number.isFinite(n)) return null;
  // Valor único: para specs é PISO (min, teto no topo); para preço é TETO (max).
  return modo === 'min' ? { min: n, max: teto } : { min: 0, max: n };
}

const faixaStr = (f: Faixa): string => `${f.min}-${f.max}`;

function parseOrdenacao(valor: string | null): Ordenacao {
  return valor && (ORDENACOES as readonly string[]).includes(valor)
    ? (valor as Ordenacao)
    : 'relevancia';
}

function listaParam(p: URLSearchParams, chave: string): string[] {
  const v = p.get(chave);
  return v
    ? v
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
}

// ───────────────────── Estado + URL (D-12) ─────────────────────

export function filtroVazio(): FiltroEstado {
  return {
    tipos: [],
    marcas: [],
    niveis: [],
    intencoes: [],
    velocidade: null,
    spin: null,
    controle: null,
    preco: null,
    ordenar: 'relevancia',
  };
}

/**
 * Query string (ou presetURL inteiro) → FiltroEstado. Tolerante: aceita
 * "/catalogo?…" e ignora parâmetros desconhecidos. `modo` (Simples/Técnico, D-08)
 * é ignorado DE PROPÓSITO — é estado de exibição, não filtro; pertence a outro módulo.
 */
export function parseQuery(entrada: string): FiltroEstado {
  const qs = entrada.includes('?') ? entrada.slice(entrada.indexOf('?') + 1) : entrada;
  const p = new URLSearchParams(qs);
  return {
    tipos: listaParam(p, 'tipo'),
    marcas: listaParam(p, 'marca'),
    niveis: listaParam(p, 'nivel'),
    intencoes: listaParam(p, 'intencao'),
    velocidade: parseFaixa(p.get('vel'), 'min', TETO_SPEC),
    spin: parseFaixa(p.get('spin'), 'min', TETO_SPEC),
    controle: parseFaixa(p.get('ctrl'), 'min', TETO_SPEC),
    preco: parseFaixa(p.get('preco'), 'max', TETO_SPEC),
    ordenar: parseOrdenacao(p.get('ordenar')),
  };
}

/** FiltroEstado → query string. Omite vazios e a ordenação default (URLs limpas).
 *  Invariante: parseQuery(serializeQuery(e)) é igual a e. */
export function serializeQuery(estado: FiltroEstado): string {
  const p = new URLSearchParams();
  if (estado.niveis.length) p.set('nivel', estado.niveis.join(','));
  if (estado.marcas.length) p.set('marca', estado.marcas.join(','));
  if (estado.tipos.length) p.set('tipo', estado.tipos.join(','));
  if (estado.intencoes.length) p.set('intencao', estado.intencoes.join(','));
  if (estado.velocidade) p.set('vel', faixaStr(estado.velocidade));
  if (estado.spin) p.set('spin', faixaStr(estado.spin));
  if (estado.controle) p.set('ctrl', faixaStr(estado.controle));
  if (estado.preco) p.set('preco', faixaStr(estado.preco));
  if (estado.ordenar !== 'relevancia') p.set('ordenar', estado.ordenar);
  return p.toString();
}

// ───────────────────── Aplicação (filtra + ordena) ─────────────────────

const dentro = (v: number, f: Faixa | null): boolean => f === null || (v >= f.min && v <= f.max);

const contemSlug = (slugs: readonly string[], valor: string): boolean =>
  slugs.length === 0 || slugs.includes(slug(valor));

const perdaoDe = (m: Material): number => perdao(m.specs, m.durezaUnificada);

function comparador(ordenar: Ordenacao): (a: Material, b: Material) => number {
  const base: (a: Material, b: Material) => number =
    ordenar === 'velocidade'
      ? (a, b) => b.specs.velocidade - a.specs.velocidade
      : ordenar === 'spin'
        ? (a, b) => b.specs.spin - a.specs.spin
        : ordenar === 'controle'
          ? (a, b) => b.specs.controle - a.specs.controle
          : ordenar === 'perdao'
            ? (a, b) => perdaoDe(b) - perdaoDe(a)
            : ordenar === 'preco-asc'
              ? (a, b) => a.preco - b.preco
              : ordenar === 'preco-desc'
                ? (a, b) => b.preco - a.preco
                : (a, b) => b.rating - a.rating; // relevancia (default)
  // Desempate estável por id → ordenação determinística (bom p/ testes e p/ URLs).
  return (a, b) => base(a, b) || a.id.localeCompare(b.id);
}

/** Filtra pelas facetas/faixas e ordena. PURO: não muta o array de entrada. */
export function aplicar(materiais: readonly Material[], estado: FiltroEstado): Material[] {
  const filtrados = materiais.filter(
    (m) =>
      contemSlug(estado.tipos, m.tipo) &&
      contemSlug(estado.marcas, m.marca) &&
      contemSlug(estado.niveis, m.nivel) &&
      contemSlug(estado.intencoes, m.intencao) &&
      dentro(m.specs.velocidade, estado.velocidade) &&
      dentro(m.specs.spin, estado.spin) &&
      dentro(m.specs.controle, estado.controle) &&
      dentro(m.preco, estado.preco),
  );
  return filtrados.sort(comparador(estado.ordenar));
}

// ───────────────────── Updaters imutáveis (como responder/voltar) ─────────────────────

export function alternarFaceta(
  estado: FiltroEstado,
  campo: 'tipos' | 'marcas' | 'niveis' | 'intencoes',
  valorSlug: string,
): FiltroEstado {
  const alterna = (atual: readonly string[]): string[] =>
    atual.includes(valorSlug) ? atual.filter((s) => s !== valorSlug) : [...atual, valorSlug];
  switch (campo) {
    case 'tipos':
      return { ...estado, tipos: alterna(estado.tipos) };
    case 'marcas':
      return { ...estado, marcas: alterna(estado.marcas) };
    case 'niveis':
      return { ...estado, niveis: alterna(estado.niveis) };
    case 'intencoes':
      return { ...estado, intencoes: alterna(estado.intencoes) };
    default:
      return estado;
  }
}

export function comFaixa(
  estado: FiltroEstado,
  campo: 'velocidade' | 'spin' | 'controle' | 'preco',
  faixa: Faixa | null,
): FiltroEstado {
  switch (campo) {
    case 'velocidade':
      return { ...estado, velocidade: faixa };
    case 'spin':
      return { ...estado, spin: faixa };
    case 'controle':
      return { ...estado, controle: faixa };
    case 'preco':
      return { ...estado, preco: faixa };
    default:
      return estado;
  }
}

export function comOrdenacao(estado: FiltroEstado, ordenar: Ordenacao): FiltroEstado {
  return { ...estado, ordenar };
}

export function limpar(): FiltroEstado {
  return filtroVazio();
}

// ───────────────────── Facetas derivadas (como buildFacets) ─────────────────────

export interface FacetaContagem {
  slug: string;
  rotulo: string;
  contagem: number;
}

function contarPor(
  materiais: readonly Material[],
  chave: (m: Material) => string,
): FacetaContagem[] {
  const mapa = new Map<string, FacetaContagem>();
  for (const m of materiais) {
    const rotulo = chave(m);
    const s = slug(rotulo);
    const existente = mapa.get(s);
    if (existente) existente.contagem++;
    else mapa.set(s, { slug: s, rotulo, contagem: 1 });
  }
  return [...mapa.values()].sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}

/** Contadores por tipo/marca/nível derivados dos dados (nunca digitados — D-12). */
export function facetas(materiais: readonly Material[]): {
  tipos: FacetaContagem[];
  marcas: FacetaContagem[];
  niveis: FacetaContagem[];
} {
  return {
    tipos: contarPor(materiais, (m) => m.tipo),
    marcas: contarPor(materiais, (m) => m.marca),
    niveis: contarPor(materiais, (m) => m.nivel),
  };
}
