/**
 * WikiPong · Preset de filtros → etiquetas legíveis em português
 * ------------------------------------------------------------------------------
 * Existe porque despejar a query string na tela é linguagem de máquina: quem fez
 * o teste quer ler "Nível: Intermediário · Avançado", não
 * "nivel=intermediario,avancado". A URL continua sendo a fonte da verdade (D-12);
 * isto é só a leitura humana dela.
 *
 * Puro e sem DOM. Os mapas de rótulo são configuração exportada (convenção do
 * projeto) — traduzem os enums canônicos do modelo de dados, que são estáveis.
 */
import { parseQuery, type Faixa, type FiltroEstado } from './filtros';
import { ROTULO_INTENCAO } from './recomendacao';

export const ROTULO_NIVEL: Record<string, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export const ROTULO_TIPO: Record<string, string> = {
  borracha: 'Borracha',
  lamina: 'Lâmina',
  raquete: 'Raquete',
  bola: 'Bola',
};

/** Só as marcas cuja capitalização não é "primeira maiúscula". */
export const ROTULO_MARCA: Record<string, string> = { dhs: 'DHS' };

export const ROTULO_ORDEM: Record<string, string> = {
  relevancia: 'Relevância',
  velocidade: 'Velocidade',
  spin: 'Efeito',
  controle: 'Controle',
  perdao: 'Perdão',
  'preco-asc': 'Menor preço',
  'preco-desc': 'Maior preço',
};

export interface EtiquetaFiltro {
  rotulo: string;
  valor: string;
}

const capitalizar = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

const traduzirLista = (
  slugs: readonly string[],
  mapa: Readonly<Record<string, string>>,
): string => slugs.map((s) => mapa[s] ?? capitalizar(s)).join(' · ');

/** Faixa de spec (escala 0–10). No teto, "8 ou mais" lê melhor que "8 a 10". */
const faixaSpec = (f: Faixa): string => (f.max >= 10 ? `${f.min} ou mais` : `${f.min} a ${f.max}`);

/** Preço: o caso comum do quiz é teto ("até R$ 200"); faixa fechada também serve. */
const faixaPreco = (f: Faixa): string =>
  f.min > 0 ? `R$ ${f.min} a R$ ${f.max}` : `até R$ ${f.max}`;

/**
 * Etiquetas de um estado de filtro, na ordem em que fazem sentido ler.
 * Devolve [] quando não há filtro nenhum (ex.: o perfil Explorador) — a UI
 * decide o que dizer nesse caso, em vez de mostrar uma caixa vazia.
 */
export function etiquetasDoFiltro(estado: FiltroEstado): EtiquetaFiltro[] {
  const etiquetas: EtiquetaFiltro[] = [];

  if (estado.niveis.length)
    etiquetas.push({ rotulo: 'Nível', valor: traduzirLista(estado.niveis, ROTULO_NIVEL) });
  if (estado.tipos.length)
    etiquetas.push({ rotulo: 'Tipo', valor: traduzirLista(estado.tipos, ROTULO_TIPO) });
  if (estado.marcas.length)
    etiquetas.push({ rotulo: 'Marca', valor: traduzirLista(estado.marcas, ROTULO_MARCA) });
  if (estado.intencoes.length)
    etiquetas.push({ rotulo: 'Estilo', valor: traduzirLista(estado.intencoes, ROTULO_INTENCAO) });
  if (estado.velocidade)
    etiquetas.push({ rotulo: 'Velocidade', valor: faixaSpec(estado.velocidade) });
  if (estado.spin) etiquetas.push({ rotulo: 'Efeito', valor: faixaSpec(estado.spin) });
  if (estado.controle) etiquetas.push({ rotulo: 'Controle', valor: faixaSpec(estado.controle) });
  if (estado.preco) etiquetas.push({ rotulo: 'Preço', valor: faixaPreco(estado.preco) });
  if (estado.ordenar !== 'relevancia')
    etiquetas.push({
      rotulo: 'Ordem',
      valor: ROTULO_ORDEM[estado.ordenar] ?? estado.ordenar,
    });

  return etiquetas;
}

/** Conveniência: direto do preset URL que o quiz gera. */
export const etiquetasDoPreset = (presetURL: string): EtiquetaFiltro[] =>
  etiquetasDoFiltro(parseQuery(presetURL));
