/**
 * WikiPong · Tradução entre escalas de dureza de esponja
 * ------------------------------------------------------------------------------
 * O problema que este módulo resolve é a tese do produto em miniatura: "39°" não
 * quer dizer nada sem a régua. Uma Hurricane de 39° na escala DHS é MUITO mais
 * dura que uma europeia de 39° na escala ESN — são réguas diferentes, e nenhum
 * fabricante publica a conversão.
 *
 * ⚠️ A VALIDAR (D-07/D-09). Estes deslocamentos são REGRA COMUNITÁRIA de
 * aproximação, não medição de laboratório nem declaração de fabricante. Ficam
 * aqui como configuração exportada, com carimbo, até o especialista assinar.
 *
 * Por que devolvemos FAIXA e não número: a conversão varia com lote, temperatura
 * e método de medição. Publicar "51,0°" seria precisão fingida (D-16); publicar
 * "≈ 49–53°" é o que dá pra defender.
 */

export type Escala = 'esn' | 'dhs' | 'butterfly';

export interface EscalaInfo {
  id: Escala;
  nome: string;
  /** De onde vem a régua — ajuda o leitor a reconhecer no rótulo do produto. */
  origem: string;
  exemplos: string;
}

export const ESCALAS: readonly EscalaInfo[] = [
  {
    id: 'esn',
    nome: 'ESN (europeia)',
    origem: 'Alemanha — fábrica que produz para Tibhar, Andro, Xiom, Donic e outras',
    exemplos: 'Tibhar Evolution MX-P, Xiom Vega, Andro Rasanter',
  },
  {
    id: 'dhs',
    nome: 'DHS (chinesa)',
    origem: 'China — a régua das borrachas pegajosas',
    exemplos: 'DHS Hurricane 3 e variantes',
  },
  {
    id: 'butterfly',
    nome: 'Butterfly (japonesa)',
    origem: 'Japão — escala própria, revisada em fev/2023',
    exemplos: 'Tenergy, Dignics, Rozena',
  },
];

/**
 * Deslocamento aproximado ATÉ a escala ESN, que o WikiPong usa como régua comum.
 * A VALIDAR — v1, regra comunitária.
 *
 * Referência: uma Hurricane 3 de 39° DHS é largamente descrita como equivalente
 * a algo em torno de 51° ESN; daí o +12. A escala Butterfly fica entre as duas.
 */
export const DESLOCAMENTO_ATE_ESN: Readonly<Record<Escala, number>> = {
  esn: 0,
  dhs: 12,
  butterfly: 11,
};

/** Incerteza (± graus) que a conversão carrega. Vira a largura da faixa. */
export const INCERTEZA = 2;

export interface FaixaGraus {
  min: number;
  max: number;
}

/** Converte um grau de qualquer escala para a faixa ESN-equivalente. */
export function paraESN(valor: number, de: Escala): FaixaGraus {
  const centro = valor + DESLOCAMENTO_ATE_ESN[de];
  return { min: centro - INCERTEZA, max: centro + INCERTEZA };
}

/** Converte entre duas escalas quaisquer, passando pela ESN. */
export function converter(valor: number, de: Escala, para: Escala): FaixaGraus {
  const emESN = valor + DESLOCAMENTO_ATE_ESN[de];
  const centro = emESN - DESLOCAMENTO_ATE_ESN[para];
  return { min: centro - INCERTEZA, max: centro + INCERTEZA };
}

/** "49 a 53°" — leitura humana da faixa. Sem casas decimais: seria falsa precisão. */
export function faixaLegivel(f: FaixaGraus): string {
  return `${Math.round(f.min)} a ${Math.round(f.max)}°`;
}

/**
 * Onde o grau cai na experiência de jogo. Os limiares são os mesmos que o guia
 * "dureza da esponja" usa, na régua ESN.
 */
export interface Sensacao {
  rotulo: string;
  descricao: string;
}

export function sensacao(esn: number): Sensacao {
  if (esn < 40)
    return {
      rotulo: 'Muito macia',
      descricao: 'A bola afunda e sai devagar. Perdoa muito, mas rende pouco no ataque forte.',
    };
  if (esn < 45)
    return {
      rotulo: 'Macia',
      descricao: 'Fácil de sentir a bola e de dar efeito sem força. A faixa clássica de quem está aprendendo.',
    };
  if (esn < 50)
    return {
      rotulo: 'Média',
      descricao: 'O meio-termo moderno: efeito bom e velocidade alta, ainda com controle utilizável.',
    };
  if (esn < 55)
    return {
      rotulo: 'Dura',
      descricao: 'Precisa de aceleração pra abrir. Quem tem técnica é premiado; quem não tem, sente a bola morrer.',
    };
  return {
    rotulo: 'Muito dura',
    descricao: 'Território chinês de ataque. Exige braço formado e toque ativo em toda bola.',
  };
}

/** Extrai o primeiro número de um texto de ficha ("46,7° a 47,7° (escala ESN)" → 46.7). */
export function primeiroGrau(texto: string): number | null {
  const m = texto.match(/(\d+(?:[.,]\d+)?)\s*°/);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Reconhece a escala citada num texto de ficha. Null quando a ficha não diz. */
export function escalaDoTexto(texto: string): Escala | null {
  const t = texto.toLowerCase();
  if (t.includes('dhs')) return 'dhs';
  if (t.includes('esn')) return 'esn';
  if (t.includes('butterfly')) return 'butterfly';
  return null;
}
