/**
 * WikiPong · Avaliações da comunidade (D-11, com a emenda do estilo de jogo)
 * ------------------------------------------------------------------------------
 * Módulo PURO: sem DOM, sem framework, sem rede. Entra dado, sai dado.
 *
 * O D-11 decide que avaliação aqui é ESTRUTURADA, não comentário livre, e diz o
 * porquê numa frase que vale repetir: "uma Tenergy vale 5★ pro avançado e 2★ pro
 * iniciante — sem contexto de nível, a média mente". Este módulo existe pra que
 * a média nunca seja publicada sem esse contexto junto.
 *
 * O que é DERIVADO aqui e nunca digitado (regra do D-11): média, contagem,
 * distribuição por estrela, recortes por nível e por estilo, e a ordenação.
 *
 * O que este módulo NÃO faz: guardar, buscar, autenticar, moderar. Isso é do
 * repositório (repositorio-avaliacoes.ts), que troca de implementação sem
 * encostar aqui — hoje local, amanhã Supabase (D-17).
 */

// ───────────────────────── Vocabulário ─────────────────────────

/**
 * Estilo de jogo de QUEM avalia. Os três nomes não foram inventados: são os do
 * guia /aprender/estilos-de-jogo, que o site já publica. Manter idênticos, pra
 * que a tag no comentário e o guia falem a mesma língua.
 */
export type EstiloJogador = 'atacante' | 'allround' | 'defensor';

export const ROTULO_ESTILO: Readonly<Record<EstiloJogador, string>> = {
  atacante: 'Atacante',
  allround: 'All-round',
  defensor: 'Defensor',
};

/**
 * A ponte entre o estilo de QUEM JOGA e a intenção do MATERIAL, que o catálogo
 * já usa ('atacar' | 'equilibrado' | 'controlar'). É o que permite perguntar
 * "o que os atacantes acham desta borracha de controle?" sem inventar campo
 * novo no catálogo.
 */
export const INTENCAO_DO_ESTILO: Readonly<Record<EstiloJogador, string>> = {
  atacante: 'atacar',
  allround: 'equilibrado',
  defensor: 'controlar',
};

/** Mesmos três níveis do catálogo (materiais.json) — não criar um quarto. */
export type NivelJogador = 'Iniciante' | 'Intermediário' | 'Avançado';

export const NIVEIS: readonly NivelJogador[] = ['Iniciante', 'Intermediário', 'Avançado'];

/**
 * Faixas de tempo de uso DO MATERIAL (não de jogo — o quiz é que pergunta tempo
 * de jogo). Larga de propósito: ninguém lembra a semana em que colou a borracha.
 */
export type TempoDeUso = 'menos de 1 mês' | '1 a 6 meses' | '6 meses a 1 ano' | 'mais de 1 ano';

export const TEMPOS_DE_USO: readonly TempoDeUso[] = [
  'menos de 1 mês',
  '1 a 6 meses',
  '6 meses a 1 ano',
  'mais de 1 ano',
];

/** Fila de moderação do D-11: pré-moderação enquanto o volume for baixo. */
export type StatusAvaliacao = 'pendente' | 'aprovado' | 'removido';

// ───────────────────────── O registro ─────────────────────────

/**
 * O modelo do D-11, campo a campo, mais o `estilo` da emenda do fundador.
 * `usuarioId` fica opcional enquanto não há login (D-17): sem backend não há
 * conta, e um id falso seria pior que a ausência.
 */
export interface Avaliacao {
  id: string;
  materialId: string;
  usuarioId?: string;
  /** Nome de exibição. Sem conta ainda, é o que a pessoa digita. */
  autor: string;
  /** 1 a 5 estrelas — inteiro. Meia-estrela não entra: convida a precisão falsa. */
  nota: number;
  texto: string;
  nivel: NivelJogador;
  tempoDeUso: TempoDeUso;
  estilo: EstiloJogador;
  /** ISO 8601. */
  criadoEm: string;
  status: StatusAvaliacao;
}

export const NOTA_MINIMA = 1;
export const NOTA_MAXIMA = 5;

/**
 * Piso de amostra pra PUBLICAR média, herdado do que a colheita já pratica com o
 * Revspin: abaixo disto o site mostra as avaliações uma a uma, e não a média.
 * Uma nota não é "a comunidade", e média de duas pessoas engana mais que informa.
 */
export const PISO_PARA_MEDIA = 3;

// ───────────────────────── Validação ─────────────────────────

export interface ProblemaCampo {
  campo: keyof Avaliacao;
  mensagem: string;
}

export const TEXTO_MINIMO = 15;
export const TEXTO_MAXIMO = 1500;

/**
 * Valida o que a pessoa escreveu ANTES de virar registro. Devolve a lista de
 * problemas (vazia = pode gravar), porque formulário bom mostra tudo que falta
 * de uma vez, não um erro por tentativa.
 */
export function validar(rascunho: Partial<Avaliacao>): ProblemaCampo[] {
  const problemas: ProblemaCampo[] = [];

  const nome = (rascunho.autor ?? '').trim();
  if (nome.length < 2) {
    problemas.push({ campo: 'autor', mensagem: 'Diga como quer assinar (2 letras ou mais).' });
  }

  const nota = rascunho.nota;
  if (nota === undefined || !Number.isInteger(nota) || nota < NOTA_MINIMA || nota > NOTA_MAXIMA) {
    problemas.push({ campo: 'nota', mensagem: 'Escolha de 1 a 5 estrelas.' });
  }

  const texto = (rascunho.texto ?? '').trim();
  if (texto.length < TEXTO_MINIMO) {
    problemas.push({
      campo: 'texto',
      mensagem: `Conte um pouco mais — pelo menos ${TEXTO_MINIMO} caracteres.`,
    });
  } else if (texto.length > TEXTO_MAXIMO) {
    problemas.push({ campo: 'texto', mensagem: `Passou de ${TEXTO_MAXIMO} caracteres.` });
  }

  if (!rascunho.nivel || !NIVEIS.includes(rascunho.nivel)) {
    problemas.push({ campo: 'nivel', mensagem: 'Diga seu nível — é o que dá sentido à nota.' });
  }
  if (!rascunho.tempoDeUso || !TEMPOS_DE_USO.includes(rascunho.tempoDeUso)) {
    problemas.push({ campo: 'tempoDeUso', mensagem: 'Há quanto tempo você usa este material?' });
  }
  if (!rascunho.estilo || !(rascunho.estilo in ROTULO_ESTILO)) {
    problemas.push({ campo: 'estilo', mensagem: 'Escolha seu estilo de jogo.' });
  }

  return problemas;
}

// ───────────────────────── Agregados (sempre derivados) ─────────────────────────

export interface Resumo {
  /** Quantas avaliações aprovadas entraram na conta. */
  total: number;
  /** Média aritmética, ou null quando a amostra não chega ao piso. */
  media: number | null;
  /** Quantas em cada estrela, de 1 a 5 (índice 0 = 1★). */
  distribuicao: readonly number[];
  /** Média por nível — só aparece o nível que tiver alguém. */
  porNivel: Readonly<Partial<Record<NivelJogador, { total: number; media: number }>>>;
  /** Média por estilo de quem avaliou. */
  porEstilo: Readonly<Partial<Record<EstiloJogador, { total: number; media: number }>>>;
}

const media = (ns: readonly number[]): number =>
  Math.round((ns.reduce((s, n) => s + n, 0) / ns.length) * 10) / 10;

/** Só avaliação aprovada conta em qualquer número público (D-11: pré-moderação). */
export const aprovadas = (as: readonly Avaliacao[]): Avaliacao[] =>
  as.filter((a) => a.status === 'aprovado');

export function resumir(todas: readonly Avaliacao[]): Resumo {
  const as = aprovadas(todas);
  const distribuicao = [1, 2, 3, 4, 5].map((n) => as.filter((a) => a.nota === n).length);

  const agrupar = <C extends string>(chave: (a: Avaliacao) => C) => {
    const fora: Partial<Record<C, { total: number; media: number }>> = {};
    for (const a of as) {
      const k = chave(a);
      const doGrupo = as.filter((x) => chave(x) === k);
      fora[k] = { total: doGrupo.length, media: media(doGrupo.map((x) => x.nota)) };
    }
    return fora;
  };

  return {
    total: as.length,
    media: as.length >= PISO_PARA_MEDIA ? media(as.map((a) => a.nota)) : null,
    distribuicao,
    porNivel: as.length ? agrupar((a) => a.nivel) : {},
    porEstilo: as.length ? agrupar((a) => a.estilo) : {},
  };
}

// ───────────────────────── Ordenação ─────────────────────────

/**
 * Limite inferior do intervalo de Wilson (95%), que o D-11 pede no lugar da
 * contagem bruta.
 *
 * O problema que ele resolve: 1 avaliação de 5★ dá média 5,0 e 200 avaliações
 * com média 4,6 perdem pra ela em qualquer ordenação ingênua. O Wilson pergunta
 * outra coisa — "qual a MENOR proporção de aprovação compatível com o que eu
 * vi?" — e amostra pequena empurra essa resposta pra baixo sozinha. Nada de
 * constante mágica pra desempatar.
 */
export function wilson(positivas: number, total: number): number {
  if (total === 0) return 0;
  const z = 1.96;
  const p = positivas / total;
  const z2 = z * z;
  const centro = p + z2 / (2 * total);
  const margem = z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total);
  return (centro - margem) / (1 + z2 / total);
}

/** 4★ e 5★ contam como aprovação; 3★ é morno e não sustenta recomendação. */
export const pontuacaoWilson = (as: readonly Avaliacao[]): number => {
  const boas = aprovadas(as);
  return wilson(boas.filter((a) => a.nota >= 4).length, boas.length);
};

export type Ordem = 'recentes' | 'uteis' | 'nota-alta' | 'nota-baixa';

export function ordenar(as: readonly Avaliacao[], ordem: Ordem): Avaliacao[] {
  const fora = [...as];
  switch (ordem) {
    case 'recentes':
      return fora.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    case 'nota-alta':
      return fora.sort((a, b) => b.nota - a.nota || b.criadoEm.localeCompare(a.criadoEm));
    case 'nota-baixa':
      return fora.sort((a, b) => a.nota - b.nota || b.criadoEm.localeCompare(a.criadoEm));
    /* "Mais úteis" sem votos de utilidade ainda: a avaliação que mais ajuda é a
       que traz contexto, então texto longo e tempo de uso alto sobem. Quando o
       voto 👍 existir, ele entra aqui pelo Wilson, como o D-11 manda. */
    case 'uteis': {
      const peso = (a: Avaliacao) =>
        Math.min(a.texto.length, 600) / 600 + TEMPOS_DE_USO.indexOf(a.tempoDeUso) / 10;
      return fora.sort((a, b) => peso(b) - peso(a) || b.criadoEm.localeCompare(a.criadoEm));
    }
  }
}

// ───────────────────────── Recortes ─────────────────────────

export interface Recorte {
  nivel?: NivelJogador;
  estilo?: EstiloJogador;
}

/**
 * O filtro que o D-11 pede na UI, com default = perfil do quiz da pessoa. Ler
 * a nota de quem joga como você é o ponto inteiro da avaliação estruturada.
 */
export const recortar = (as: readonly Avaliacao[], r: Recorte): Avaliacao[] =>
  as.filter((a) => (!r.nivel || a.nivel === r.nivel) && (!r.estilo || a.estilo === r.estilo));

/** Feed do /comunidade: as mais recentes de todo o site, já aprovadas. */
export const maisRecentes = (as: readonly Avaliacao[], quantas = 20): Avaliacao[] =>
  ordenar(aprovadas(as), 'recentes').slice(0, quantas);

export interface LinhaRanking {
  materialId: string;
  total: number;
  media: number;
  pontuacao: number;
}

/**
 * Ranking derivado, nunca digitado. Ordena por Wilson e não por média, pelo
 * mesmo motivo de sempre: sem isso, o material com uma única nota 5 lidera.
 */
export function ranking(as: readonly Avaliacao[], r: Recorte = {}): LinhaRanking[] {
  const boas = recortar(aprovadas(as), r);
  const porMaterial = new Map<string, Avaliacao[]>();
  for (const a of boas) {
    const lista = porMaterial.get(a.materialId);
    if (lista) lista.push(a);
    else porMaterial.set(a.materialId, [a]);
  }
  return [...porMaterial.entries()]
    .map(([materialId, lista]) => ({
      materialId,
      total: lista.length,
      media: media(lista.map((a) => a.nota)),
      pontuacao: pontuacaoWilson(lista),
    }))
    .sort((a, b) => b.pontuacao - a.pontuacao || b.total - a.total);
}
