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
  /**
   * Moeda do `preco`. Ausente = real, que é o caso de 99% do catálogo.
   *
   * Existe porque o catálogo passou a aceitar material que NÃO se vende no
   * Brasil (D-13, emenda de 2026-08-02). Publicar o preço em dólar dito como
   * dólar é honesto; converter para real seria inventar — o câmbio muda todo
   * dia e não é o custo real de importar.
   */
  moeda?: 'USD' | 'EUR';
  /**
   * PERFIL DE DESEMPENHO — opcional de propósito. Nem todo material tem um:
   * uma bola não tem "controle 9.0", e inventar o número só para preencher a
   * coluna seria exatamente a precisão fingida que o produto combate (D-16).
   * Sem specs, o material continua no catálogo (tem preço, marca, foto) mas
   * não entra em filtro de spec, ordenação por spec, radar nem Perdão.
   */
  specs?: Specs;
  durabilidade?: number; // 0–10 (4º eixo do radar)
  durezaUnificada?: number; // grau ESN-equivalente; insumo do Perdão (D-09)
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

/**
 * Material COM perfil de desempenho. A UI usa isto para decidir se mostra ficha
 * de specs, radar, Perdão e comparação — em vez de espalhar `if (m.specs)`.
 */
export type MaterialComDesempenho = Material & { specs: Specs };

/**
 * Tem perfil de desempenho = tem `specs`. Só isso.
 *
 * `durabilidade` e `durezaUnificada` NÃO entram no critério: lâmina é de madeira
 * e não tem dureza de esponja — o "47 neutro" que as lâminas carregavam era
 * placeholder, e o Perdão (que deriva da maciez da esponja) não se aplica a elas.
 * Quem depende desses campos checa cada um por conta, e some quando não há.
 */
export const temDesempenho = (m: Material): m is MaterialComDesempenho =>
  m.specs !== undefined;

// ───────────────────── Busca textual ─────────────────────

/**
 * Normaliza para busca: minúsculas e SEM acento — quem digita no celular escreve
 * "lamina", não "lâmina", e o catálogo tem que achar do mesmo jeito.
 */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

/**
 * Busca por nome, marca, tipo e nível. Vive AQUI (módulo puro) e não na tela,
 * como o resto da lógica do projeto.
 *
 * Decisões: termos separados por espaço combinam em E ("butterfly borracha" tem
 * de casar os dois), e não há `FiltroEstado` novo — busca é ortogonal às facetas,
 * então compõe com `aplicar` em vez de virar mais um campo do estado.
 * Termo vazio devolve tudo (nunca esconde catálogo por engano).
 */
export function buscar<T extends Material>(materiais: readonly T[], termo: string): T[] {
  const termos = normalizar(termo).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return [...materiais];
  return materiais.filter((m) => {
    const alvo = normalizar(`${m.nome} ${m.marca} ${m.tipo} ${m.nivel}`);
    return termos.every((t) => alvo.includes(t));
  });
}

// ───────────────────── Aplicação (filtra + ordena) ─────────────────────

/** Faixa nula = filtro desligado (passa todo mundo). Faixa ativa com valor
 *  ausente = NÃO passa: material sem perfil de desempenho não pode alegar estar
 *  dentro de uma faixa de velocidade. */
const dentro = (v: number | undefined, f: Faixa | null): boolean =>
  f === null || (v !== undefined && v >= f.min && v <= f.max);

const contemSlug = (slugs: readonly string[], valor: string): boolean =>
  slugs.length === 0 || slugs.includes(slug(valor));

/** Perdão exige perfil completo; sem ele não há o que derivar. */
const perdaoDe = (m: Material): number | null =>
  m.specs && m.durezaUnificada !== undefined ? perdao(m.specs, m.durezaUnificada) : null;

function comparador(ordenar: Ordenacao): (a: Material, b: Material) => number {
  /** Valor que ordena. null = material sem esse dado (ex.: bola não tem spec). */
  const chave = (m: Material): number | null => {
    switch (ordenar) {
      case 'velocidade':
        return m.specs?.velocidade ?? null;
      case 'spin':
        return m.specs?.spin ?? null;
      case 'controle':
        return m.specs?.controle ?? null;
      case 'perdao':
        return perdaoDe(m);
      case 'preco-asc':
      case 'preco-desc':
        /* Material em moeda estrangeira não entra na ordenação por preço:
           comparar R$ 300 com US$ 149 exigiria câmbio, e câmbio é chute. Vai
           pro fim da lista nas duas direções, com o Infinity do sort. */
        return m.moeda ? Number.POSITIVE_INFINITY : m.preco;
      default:
        return m.rating; // relevancia
    }
  };
  const crescente = ordenar === 'preco-asc';

  return (a, b) => {
    const va = chave(a);
    const vb = chave(b);
    // Sem o dado, o material afunda — nunca lidera uma ordenação da qual não participa.
    if (va === null && vb === null) return a.id.localeCompare(b.id);
    if (va === null) return 1;
    if (vb === null) return -1;
    const base = crescente ? va - vb : vb - va;
    // Desempate estável por id → ordenação determinística (bom p/ testes e p/ URLs).
    return base || a.id.localeCompare(b.id);
  };
}

/** Filtra pelas facetas/faixas e ordena. PURO: não muta o array de entrada. */
export function aplicar(materiais: readonly Material[], estado: FiltroEstado): Material[] {
  const filtrados = materiais.filter(
    (m) =>
      contemSlug(estado.tipos, m.tipo) &&
      contemSlug(estado.marcas, m.marca) &&
      contemSlug(estado.niveis, m.nivel) &&
      contemSlug(estado.intencoes, m.intencao) &&
      dentro(m.specs?.velocidade, estado.velocidade) &&
      dentro(m.specs?.spin, estado.spin) &&
      dentro(m.specs?.controle, estado.controle) &&
      /* Pelo mesmo motivo da ordenação: quem está em moeda estrangeira sai do
         filtro de preço em vez de entrar com um valor comparado errado. */
      (estado.preco === null || m.moeda !== undefined
        ? m.moeda === undefined
        : dentro(m.preco, estado.preco)),
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
