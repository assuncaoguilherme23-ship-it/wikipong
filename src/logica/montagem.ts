/**
 * WikiPong · Montagem de raquete (lâmina + borracha FH + borracha BH)
 * ------------------------------------------------------------------------------
 * O que ESTE módulo pode afirmar, e o que se recusa a afirmar:
 *
 *  ✔ preço total — soma real das peças, o único número defensável de uma montagem
 *  ✔ observações estruturais — nível desencontrado, lados assimétricos, dureza
 *    muito diferente entre os lados. Tudo derivado de campo do catálogo, com o
 *    critério visível.
 *  ✘ NOTA DE DESEMPENHO COMBINADA — não existe fórmula defensável: lâmina e as
 *    duas borrachas interagem, cada lado faz um trabalho diferente, e o resultado
 *    não é soma nem média. Publicar isso seria invenção com cara de medição
 *    (mesma decisão já tomada em /conjuntos — D-16).
 */
import { perdao, type Specs } from './metricas';

export interface PecaMontagem {
  id: string;
  nome: string;
  marca: string;
  tipo: string;
  nivel: string;
  intencao: string;
  preco: number;
  specs: Specs;
  durezaUnificada: number;
}

export type PapelPeca = 'lamina' | 'fh' | 'bh';

export const ROTULO_PAPEL: Readonly<Record<PapelPeca, string>> = {
  lamina: 'Lâmina',
  fh: 'Borracha do forehand',
  bh: 'Borracha do backhand',
};

export interface Montagem {
  lamina?: PecaMontagem;
  fh?: PecaMontagem;
  bh?: PecaMontagem;
}

/** Peças escolhidas, na ordem em que se monta a raquete. */
export function pecasDe(m: Montagem): { papel: PapelPeca; peca: PecaMontagem }[] {
  const saida: { papel: PapelPeca; peca: PecaMontagem }[] = [];
  if (m.lamina) saida.push({ papel: 'lamina', peca: m.lamina });
  if (m.fh) saida.push({ papel: 'fh', peca: m.fh });
  if (m.bh) saida.push({ papel: 'bh', peca: m.bh });
  return saida;
}

/** Soma real das peças escolhidas. Montagem parcial soma o que já tem. */
export function precoTotal(m: Montagem): number {
  return pecasDe(m).reduce((s, { peca }) => s + peca.preco, 0);
}

export const completa = (m: Montagem): boolean => Boolean(m.lamina && m.fh && m.bh);

export type TipoObservacao = 'info' | 'atencao';

export interface Observacao {
  tipo: TipoObservacao;
  titulo: string;
  texto: string;
}

const ORDEM_NIVEL: Readonly<Record<string, number>> = {
  Iniciante: 1,
  Intermediário: 2,
  Avançado: 3,
};

/**
 * Observações derivadas — critério aberto, nunca veredito de qualidade.
 * Cada uma cita o dado que a gerou, para o leitor poder discordar.
 */
export function observacoes(m: Montagem): Observacao[] {
  const obs: Observacao[] = [];
  const pecas = pecasDe(m);
  if (pecas.length === 0) return obs;

  // 1) Nível desencontrado: a peça mais exigente é que dita o conjunto.
  const niveis = pecas
    .map(({ papel, peca }) => ({ papel, peca, ordem: ORDEM_NIVEL[peca.nivel] ?? 0 }))
    .filter((x) => x.ordem > 0);
  if (niveis.length >= 2) {
    const menor = niveis.reduce((a, b) => (a.ordem <= b.ordem ? a : b));
    const maior = niveis.reduce((a, b) => (a.ordem >= b.ordem ? a : b));
    if (maior.ordem - menor.ordem >= 2) {
      obs.push({
        tipo: 'atencao',
        titulo: 'Níveis muito diferentes',
        texto: `${ROTULO_PAPEL[menor.papel]} é de nível ${menor.peca.nivel} e ${ROTULO_PAPEL[maior.papel].toLowerCase()} é ${maior.peca.nivel}. Numa raquete, a peça mais exigente puxa o conjunto: você vai sentir a dificuldade da ${maior.peca.nome} sem ganhar tudo o que ela oferece.`,
      });
    }
  }

  // 2) Lados assimétricos: fato comum e intencional, dito sem julgamento.
  if (m.fh && m.bh && m.fh.intencao !== m.bh.intencao) {
    obs.push({
      tipo: 'info',
      titulo: 'Lados com propósitos diferentes',
      texto: `Forehand voltado a ${m.fh.intencao} e backhand a ${m.bh.intencao}. Montagem assimétrica é escolha comum — muita gente usa um lado pra abrir o ponto e outro pra segurar a troca.`,
    });
  }

  // 3) Diferença grande de dureza entre os lados (a régua unificada, A VALIDAR).
  if (m.fh && m.bh) {
    const dif = Math.abs(m.fh.durezaUnificada - m.bh.durezaUnificada);
    if (dif >= 6) {
      const maisDura = m.fh.durezaUnificada > m.bh.durezaUnificada ? m.fh : m.bh;
      const maisMacia = maisDura === m.fh ? m.bh : m.fh;
      obs.push({
        tipo: 'info',
        titulo: 'Um lado bem mais duro que o outro',
        texto: `${maisDura.nome} é cerca de ${dif}° mais dura que ${maisMacia.nome} na nossa régua unificada. Os dois lados vão responder diferente à mesma batida — o que pode ser exatamente o que você quer, mas exige adaptação.`,
      });
    }
  }

  // 4) Perdão baixo dos dois lados: a montagem cobra técnica em toda bola.
  if (m.fh && m.bh) {
    const pFH = perdao(m.fh.specs, m.fh.durezaUnificada);
    const pBH = perdao(m.bh.specs, m.bh.durezaUnificada);
    if (pFH < 5 && pBH < 5) {
      obs.push({
        tipo: 'atencao',
        titulo: 'Conjunto que perdoa pouco dos dois lados',
        texto: `Perdão* ${pFH.toFixed(1)} no forehand e ${pBH.toFixed(1)} no backhand. Erro de toque vira erro de bola nos dois lados — é montagem pra quem já tem consistência.`,
      });
    }
  }

  return obs;
}
