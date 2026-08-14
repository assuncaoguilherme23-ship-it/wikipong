/**
 * WikiPong · Quem é a pessoa que escreveu aquela avaliação
 * ------------------------------------------------------------------------------
 * A Regra da Voz de Dados aplicada a gente em vez de a material: isto NÃO
 * devolve selo, nota nem "avaliador confiável". Devolve os números, e quem lê
 * julga sozinho.
 *
 * O QUE NÃO TEM AQUI, e por quê: "tempo médio de uso" não existe porque
 * `tempoDeUso` é uma FAIXA, não um número — tirar média exigiria carimbar um
 * valor no meio de cada intervalo, que é precisão inventada. No lugar vai a
 * faixa mais frequente, que é um fato sobre os dados. "Usou os dois lados"
 * também não existe: a avaliação não guarda lado nenhum.
 */
import { TEMPOS_DE_USO, type Avaliacao, type TempoDeUso } from './avaliacoes';
import { materialPorId } from '../../componentes/dados-materiais';

export interface ProcedenciaDoAvaliador {
  quantas: number;
  materiaisDistintos: number;
  borrachas: number;
  laminas: number;
  /** A faixa mais frequente. Ausente quando não há avaliação. */
  faixaTipica?: TempoDeUso;
}

export function procedenciaDe(avaliacoes: readonly Avaliacao[]): ProcedenciaDoAvaliador {
  const ids = new Set(avaliacoes.map((a) => a.materialId));
  const tipos = [...ids].map((id) => materialPorId(id)?.tipo);

  /* Empate vai pra faixa mais longa: entre "1 a 6 meses" e "mais de 1 ano" com
     a mesma contagem, a informação honesta é a que exige mais compromisso.
     Depende de TEMPOS_DE_USO estar em ordem crescente — se aquela ordem mudar,
     este comportamento muda junto, e é o teste da faixa típica que avisa. */
  let faixaTipica: TempoDeUso | undefined;
  let maior = 0;
  for (const faixa of TEMPOS_DE_USO) {
    const quantas = avaliacoes.filter((a) => a.tempoDeUso === faixa).length;
    if (quantas >= maior && quantas > 0) { maior = quantas; faixaTipica = faixa; }
  }

  return {
    quantas: avaliacoes.length,
    materiaisDistintos: ids.size,
    borrachas: tipos.filter((t) => t === 'Borracha').length,
    laminas: tipos.filter((t) => t === 'Lâmina').length,
    faixaTipica,
  };
}
