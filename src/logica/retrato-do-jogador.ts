/**
 * WikiPong · O que dá pra saber de alguém sem perguntar mais nada
 * ------------------------------------------------------------------------------
 * O perfil pedia dez campos e mostrava dez campos. Este módulo é a outra metade:
 * o que o site JÁ SABE sobre a pessoa e nunca tinha dito.
 *
 * Tudo aqui é derivado do que já existe — as avaliações que ela escreveu, a
 * estante que ela montou, o ano que ela informou. Nenhuma pergunta nova.
 *
 * TRÊS REGRAS QUE VALEM PRO ARQUIVO INTEIRO:
 *
 * 1. NADA DE MÉDIA COM AMOSTRA PEQUENA. A nota média que a pessoa costuma dar
 *    só sai a partir de `PISO_PARA_MEDIA` avaliações — o mesmo piso que o site
 *    já usa pra publicar a média de um material. Média de duas notas engana mais
 *    que informa, e isso não muda por ser de gente em vez de borracha.
 *
 * 2. O ANO DE HOJE ENTRA POR PARÂMETRO. `new Date()` dentro de função pura é
 *    armadilha de teste: a asserção passa hoje e quebra em janeiro. Quem chama
 *    diz que ano é.
 *
 * 3. A MARCA VEM POR RESOLVEDOR, não por import. O catálogo mora em
 *    `componentes/`, e `src/logica/` não pode depender da UI — é a regra que
 *    mantém estes módulos testáveis sem framework.
 */
import { PISO_PARA_MEDIA, type Avaliacao } from './avaliacoes';
import { emUsoHoje, type EntradaDeEstante } from './estante';

export interface RetratoDoJogador {
  /** Anos completos desde que começou a jogar. */
  anosDeRaquete?: number;
  quantasAvaliacoes: number;
  /** Só com amostra suficiente. Uma casa decimal. */
  notaQueCostumaDar?: number;
  /** Marcas que já passaram pela mão dela, em ordem alfabética. */
  marcas: string[];
  /** O material em uso há mais tempo, com o ano em que entrou. */
  companheiroMaisAntigo?: { materialId: string; desde: number };
}

export interface EntradaDoRetrato {
  jogaDesde?: number;
  anoAtual: number;
  avaliacoes: readonly Avaliacao[];
  estante: readonly EntradaDeEstante[];
  equipamento: { lamina?: string; fh?: string; bh?: string };
  marcaDe: (materialId: string) => string | undefined;
}

const ano = (iso?: string): number | undefined => {
  if (!iso) return undefined;
  const n = Number(iso.slice(0, 4));
  return Number.isFinite(n) ? n : undefined;
};

export function retratoDoJogador(e: EntradaDoRetrato): RetratoDoJogador {
  const { jogaDesde, anoAtual, avaliacoes, estante, equipamento, marcaDe } = e;

  /* Ano no futuro ou anterior ao mínimo do banco não vira número negativo nem
     "0 anos de raquete": vira ausência. Dado impossível é dado que falta. */
  const anosDeRaquete =
    jogaDesde && jogaDesde <= anoAtual ? anoAtual - jogaDesde : undefined;

  const notas = avaliacoes.map((a) => a.nota).filter((n) => Number.isFinite(n));
  const notaQueCostumaDar =
    notas.length >= PISO_PARA_MEDIA
      ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10
      : undefined;

  /* A raquete atual conta junto com a estante e com o que ela avaliou: as três
     são material que passou pela mão dela. Set, porque a mesma borracha aparece
     nas três listas o tempo todo. */
  const ids = new Set<string>([
    ...avaliacoes.map((a) => a.materialId),
    ...estante.map((x) => x.materialId),
    ...[equipamento.lamina, equipamento.fh, equipamento.bh].filter(
      (id): id is string => Boolean(id),
    ),
  ]);

  const marcas = [
    ...new Set(
      [...ids].map(marcaDe).filter((m): m is string => Boolean(m && m.trim())),
    ),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  /* "Em uso há mais tempo" precisa das duas coisas: estar em uso HOJE e ter ano
     de entrada. Sem `emUsoHoje`, uma peça abandonada em 2015 ganharia o posto. */
  let companheiroMaisAntigo: RetratoDoJogador['companheiroMaisAntigo'];
  for (const x of estante) {
    const desde = ano(x.de);
    if (desde === undefined || !emUsoHoje(x)) continue;
    if (!companheiroMaisAntigo || desde < companheiroMaisAntigo.desde) {
      companheiroMaisAntigo = { materialId: x.materialId, desde };
    }
  }

  return {
    anosDeRaquete,
    quantasAvaliacoes: avaliacoes.length,
    notaQueCostumaDar,
    marcas,
    companheiroMaisAntigo,
  };
}
