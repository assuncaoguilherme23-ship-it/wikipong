/**
 * Ponte do calendário nacional da CBTM.
 *
 * O JSON é transcrição do calendário oficial — nada aqui é estimado, e o que a
 * fonte não publica (horário, ginásio, taxa, prazo de inscrição) esta base
 * também não publica.
 */
import dados from '@/dados/competicoes.json';
import type { Competicao, TipoDeCompeticao } from '@/src/logica/competicoes';

export const COMPETICOES: Competicao[] = (dados.eventos as {
  nome: string; inicio: string; fim: string; cidade: string; uf: string;
  tipo: string; nota?: string;
}[]).map((e) => ({ ...e, tipo: e.tipo as TipoDeCompeticao }));

export const TEMPORADA = dados.temporada;
export const FONTE_CALENDARIO = dados.fonte;
export const CONSULTADO_EM_CALENDARIO = dados.consultadoEm;
export const AVISO_CALENDARIO: string = dados.aviso;

/**
 * Quantas etapas a CBTM ANUNCIOU de cada série, com a fonte do anúncio.
 *
 * Existe pra que a tela possa comparar o anunciado com o listado — e hoje eles
 * não batem: a Prata tem 9 no calendário e 10 no anúncio. Guardar o número
 * anunciado é o que transforma "faltou uma" de suspeita em fato verificável.
 */
export const ETAPAS_ANUNCIADAS = dados.etapasAnunciadas;
