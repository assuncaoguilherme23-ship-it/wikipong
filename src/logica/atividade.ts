/**
 * WikiPong · O que a pessoa fez na comunidade
 * ------------------------------------------------------------------------------
 * Avaliação, tópico e resposta são coisas diferentes no banco e a mesma coisa
 * pro leitor: "isto aqui foi ela que escreveu, nesta data". Este módulo faz a
 * tradução e devolve uma lista só, já ordenada.
 *
 * PEDIDO DE PAUTA FICA DE FORA, de propósito. Pedir um assunto é um recado pra
 * casa, não uma contribuição pública — e quem pediu pode não querer aquilo
 * exposto no próprio perfil.
 */
import type { Avaliacao } from './avaliacoes';
import type { Mensagem, Topico } from './discussoes';

export interface Atividade {
  tipo: 'avaliacao' | 'topico' | 'resposta';
  id: string;
  /** ISO 8601. */
  quando: string;
  /** A linha que a tela mostra. */
  titulo: string;
  /** Para onde o item leva. Sempre começa com `/`. */
  para: string;
}

type RespostaComTopico = Mensagem & { topicoId?: string };

export function linhaDoTempo(
  avaliacoes: readonly Avaliacao[],
  topicos: readonly Topico[],
  respostas: readonly RespostaComTopico[],
  usuarioId: string,
): Atividade[] {
  const meu = <T extends { usuarioId?: string }>(x: T) => x.usuarioId === usuarioId;

  const itens: Atividade[] = [
    ...avaliacoes.filter(meu).map((a): Atividade => ({
      tipo: 'avaliacao', id: a.id, quando: a.criadoEm,
      titulo: a.texto, para: `/materiais/${a.materialId}/`,
    })),
    ...topicos.filter(meu).map((t): Atividade => ({
      tipo: 'topico', id: t.id, quando: t.criadoEm,
      titulo: t.titulo, para: `/comunidade/discussoes/?t=${t.id}`,
    })),
    ...respostas.filter(meu).map((r): Atividade => ({
      tipo: 'resposta', id: r.id, quando: r.criadoEm,
      titulo: r.texto,
      para: r.topicoId ? `/comunidade/discussoes/?t=${r.topicoId}` : '/comunidade/discussoes/',
    })),
  ];

  return itens.sort((a, b) => b.quando.localeCompare(a.quando));
}

export const ROTULO_ATIVIDADE: Readonly<Record<Atividade['tipo'], string>> = {
  avaliacao: 'avaliou',
  topico: 'abriu a discussão',
  resposta: 'respondeu',
};
