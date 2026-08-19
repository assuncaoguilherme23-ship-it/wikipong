/**
 * WikiPong · O calendário nacional
 * ==============================================================================
 * Módulo puro: sabe ordenar, separar o que vem do que passou e contar etapas —
 * e não sabe de onde os eventos vêm nem como são desenhados.
 *
 * `hoje` ENTRA POR PARÂMETRO em tudo que depende de tempo. É a mesma disciplina
 * do retrato do jogador, e aqui ela vale dobrado: o site é export estático
 * (D-17), então "hoje" no build é uma data congelada que envelhece sozinha. Quem
 * chama decide qual data vale — a do build, no HTML, ou a de verdade, no
 * navegador.
 */

export type TipoDeCompeticao = 'ouro' | 'prata' | 'brasileirao' | 'seletiva' | 'outro';

export const TIPOS: readonly TipoDeCompeticao[] = [
  'ouro', 'prata', 'brasileirao', 'seletiva', 'outro',
];

export const ROTULO_TIPO: Readonly<Record<TipoDeCompeticao, string>> = {
  ouro: 'Copa Brasil Ouro',
  prata: 'Copa Brasil Prata',
  brasileirao: 'Brasileirão Interclubes',
  seletiva: 'Seletiva Nacional',
  outro: 'Outros torneios',
};

export const EXPLICA_TIPO: Readonly<Record<TipoDeCompeticao, string>> = {
  ouro: 'A divisão de cima da Copa Brasil. As duas piores federações da temporada caem para a Prata.',
  prata: 'A divisão de acesso. As duas melhores federações sobem para a Ouro; as duas últimas ficam fora no ano seguinte.',
  brasileirao: 'O interclubes, olímpico e paralímpico na mesma competição. Dois por ano: Inverno e Verão.',
  seletiva: 'Onde se definem as seleções de base e as vagas para os campeonatos internacionais.',
  outro: 'Torneios de calendário nacional organizados por outras entidades.',
};

export interface Competicao {
  nome: string;
  /** ISO 8601, só a data. */
  inicio: string;
  fim: string;
  cidade: string;
  uf: string;
  tipo: TipoDeCompeticao;
  /** Ressalva desta linha — divergência da fonte, organizador diferente. */
  nota?: string;
}

/** Cronológica: a próxima primeiro dentro de cada grupo. */
export const ordenarCompeticoes = (cs: readonly Competicao[]): Competicao[] =>
  [...cs].sort((a, b) => a.inicio.localeCompare(b.inicio) || a.nome.localeCompare(b.nome));

/**
 * Já terminou? Compara pelo FIM, não pelo início: uma competição que começa
 * hoje e acaba domingo está acontecendo agora, não no passado. Um Brasileirão
 * dura dez dias, e chamá-lo de "já aconteceu" no segundo dia seria mandar a
 * pessoa embora de um ginásio que está cheio.
 */
export const jaTerminou = (c: Competicao, hoje: string): boolean => c.fim < hoje;

/** Está rolando agora — começou e ainda não acabou. */
export const aconteceAgora = (c: Competicao, hoje: string): boolean =>
  c.inicio <= hoje && hoje <= c.fim;

export interface CalendarioPartido {
  /** Acontecendo hoje, primeiro de tudo. */
  agora: Competicao[];
  /** Ainda vai acontecer, a mais próxima primeiro. */
  vem: Competicao[];
  /** Já terminou, a mais recente primeiro — é arquivo, lê-se de trás pra frente. */
  passou: Competicao[];
}

export function partirCalendario(
  cs: readonly Competicao[],
  hoje: string,
): CalendarioPartido {
  const ordenadas = ordenarCompeticoes(cs);
  return {
    agora: ordenadas.filter((c) => aconteceAgora(c, hoje)),
    vem: ordenadas.filter((c) => c.inicio > hoje),
    passou: ordenadas.filter((c) => jaTerminou(c, hoje)).reverse(),
  };
}

/** Quantos dias faltam para começar. Negativo = já começou. */
export function diasAte(c: Competicao, hoje: string): number {
  const ms = Date.parse(`${c.inicio}T12:00:00Z`) - Date.parse(`${hoje}T12:00:00Z`);
  return Math.round(ms / 86_400_000);
}

/**
 * O período em uma linha, em português — e sem repetir o que não muda.
 *
 *   mesmo mês      "19 a 22 de março"
 *   meses vizinhos "30 de abril a 3 de maio"
 */
export function periodo(c: Competicao): string {
  const [, mi, di] = c.inicio.split('-').map(Number);
  const [, mf, df] = c.fim.split('-').map(Number);
  const nome = (m: number) =>
    ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho',
      'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][m - 1];
  return mi === mf
    ? `${di} a ${df} de ${nome(mf)}`
    : `${di} de ${nome(mi)} a ${df} de ${nome(mf)}`;
}

/** Quantas etapas de cada tipo o calendário traz. */
export function contarPorTipo(
  cs: readonly Competicao[],
): Record<TipoDeCompeticao, number> {
  const conta = { ouro: 0, prata: 0, brasileirao: 0, seletiva: 0, outro: 0 };
  for (const c of cs) conta[c.tipo] += 1;
  return conta;
}
