/**
 * WikiPong · Tradutor de ficha → linguagem de gente
 * ==============================================================================
 * O QUE ESTE MÓDULO RESOLVE
 *
 * O modo Simples (D-08) só mudava alguma coisa para material COM perfil de
 * desempenho. São 208 de 678. Para os outros 470 — 69% do catálogo — apertar
 * "Simples" não mudava um pixel: o cartão mostrava o mesmo texto nos dois modos.
 *
 * E o texto que ele mostrava falava da NOSSA COLHEITA, não da peça:
 *
 *     "17 avaliações. A versão mais lenta da linha."
 *     "R$ 905. Lâmina de defesa da linha mais cara da Andro."
 *     "Lançamento recente: zero avaliações registradas na comunidade."
 *
 * Isso responde "o quanto a gente sabe disso?". Quem aperta Simples está
 * perguntando outra coisa: "o que essa peça faz?".
 *
 * ── POR QUE DERIVAR, E NÃO ESCREVER 470 FRASES ────────────────────────────────
 *
 * Escrever à mão 470 descrições de peças que ninguém aqui jogou seria inventar.
 * O D-09 já resolveu esse mesmo dilema com a dureza: onde o fabricante declara,
 * o número é CALCULADO da ficha, não digitado. Aqui é igual — o fabricante
 * declara a construção ("Madeira + carbono em posição interna") e a superfície
 * ("Lisa, tensionada"), e são 470 de 470 com ficha. O que falta não é dado, é
 * tradução.
 *
 * Ganho de manutenção: melhorar uma frase aqui melhora o catálogo inteiro de
 * uma vez, e nenhuma frase pode contradizer a ficha, porque nasce dela.
 *
 * ── O QUE É FATO E O QUE É TRADUÇÃO (D-14) ────────────────────────────────────
 *
 * FATO: a construção e a superfície, ditas pelo fabricante — vão em `ficha`.
 * TRADUÇÃO: o que isso significa para quem joga. É consenso do esporte, não
 * medição nossa, e por isso as tabelas abaixo levam o carimbo A VALIDAR até o
 * especialista assinar (D-07/D-09). Nenhuma delas inventa número: elas dizem
 * em português o que a palavra técnica já dizia em jargão.
 *
 * Módulo PURO: sem DOM, sem framework, sem import de dado. Recebe a ficha,
 * devolve texto.
 */

// ─────────────────────────── Tipos ───────────────────────────

/** Uma linha da ficha do fabricante, como vem de `fabricantes.json`. */
export interface LinhaFicha {
  rotulo: string;
  valor: string;
}

/**
 * Famílias de lâmina. O eixo que muda a vida de quem joga é UM: tem fibra
 * (carbono, arylate, vidro) ou é madeira pura. O resto é variação.
 */
export type FamiliaLamina = 'com-fibra' | 'balsa' | 'madeira-pura';

/** Famílias de borracha — os mesmos nomes que `metricas.ts` já usa. */
export type FamiliaBorracha = 'tensor' | 'aderente' | 'hibrida' | 'classica';

/** Um traço curto: o rótulo e o que ele significa na prática. */
export interface Traco {
  rotulo: string;
  significa: string;
}

export interface LeituraSimples {
  /** Uma frase: o que é a peça e como ela joga. */
  resumo: string;
  /** Traços curtos, para quem lê em diagonal. */
  tracos: Traco[];
}

// ──────────────────── Tabelas (A VALIDAR — D-07) ────────────────────

/**
 * A VALIDAR · o que cada família de lâmina significa para quem joga.
 * Consenso do esporte, não medição nossa.
 */
export const LAMINA: Record<FamiliaLamina, { resumo: string; traco: Traco }> = {
  'com-fibra': {
    resumo:
      'Lâmina com uma camada de fibra dentro da madeira. A fibra devolve a bola mais rápido e ' +
      'tira vibração: ganha velocidade e perde perdão. Pede gesto já formado — no erro, ela ' +
      'não segura a bola dentro da mesa.',
    traco: { rotulo: 'Tem fibra', significa: 'mais rápida e menos perdoada no erro' },
  },
  balsa: {
    resumo:
      'Lâmina com miolo de balsa, que é madeira muito leve. Dá velocidade sem peso na mão, mas ' +
      'o toque é mais mole: a bola sai rápido e é mais difícil sentir para onde.',
    traco: { rotulo: 'Miolo de balsa', significa: 'leve e rápida, com toque mais mole' },
  },
  'madeira-pura': {
    resumo:
      'Lâmina de madeira pura, sem fibra. É o tipo que mais perdoa: a bola sai mais devagar e ' +
      'sobra tempo para corrigir o gesto. É por isso que ela é a recomendada para quem ainda ' +
      'está formando a técnica.',
    traco: { rotulo: 'Madeira pura', significa: 'mais lenta e mais fácil de controlar' },
  },
};

/**
 * A VALIDAR · o que cada família de borracha significa para quem joga.
 */
export const BORRACHA: Record<FamiliaBorracha, { resumo: string; traco: Traco }> = {
  tensor: {
    resumo:
      'Borracha tensionada: a esponja já vem esticada de fábrica e devolve energia sozinha. ' +
      'Dá velocidade sem exigir força, e é o padrão do jogo moderno.',
    traco: { rotulo: 'Tensionada', significa: 'a esponja empurra a bola por você' },
  },
  aderente: {
    resumo:
      'Superfície aderente, do estilo chinês: a bola gruda mais na borracha e sai com muito ' +
      'giro. Em compensação exige gesto completo — quem bate curto sente a bola morrer na mesa.',
    traco: { rotulo: 'Aderente', significa: 'muito giro, mas exige gesto completo' },
  },
  hibrida: {
    resumo:
      'Híbrida: capa aderente do estilo chinês sobre esponja tensionada. Junta o giro de uma ' +
      'com a saída rápida da outra, e é o caminho de quem quer o giro chinês sem abrir mão da ' +
      'velocidade.',
    traco: { rotulo: 'Híbrida', significa: 'giro do estilo chinês com saída rápida' },
  },
  classica: {
    resumo:
      'Borracha lisa clássica, sem tensionamento. Mais lenta e mais previsível que as ' +
      'modernas — é a que menos castiga erro de gesto, e a que mais dura.',
    traco: { rotulo: 'Clássica', significa: 'lenta, previsível e de vida longa' },
  },
};

/** A VALIDAR · traços extras, quando o fabricante os declara. */
export const EXTRAS: Record<string, Traco> = {
  defensiva: { rotulo: 'Classe defensiva', significa: 'feita para cortar longe da mesa, não para atacar' },
  caneta: { rotulo: 'Empunhadura caneta', significa: 'pega de caneta, não a clássica de aperto de mão' },
  hinoki: { rotulo: 'Hinoki', significa: 'cipreste japonês: toque macio e saída alta' },
  hexagonal: { rotulo: 'Cabeça hexagonal', significa: 'área útil maior nas bordas, formato fora do padrão redondo' },
  dura: { rotulo: 'Esponja dura', significa: 'rende mais na batida forte, castiga mais no toque leve' },
  macia: { rotulo: 'Esponja macia', significa: 'mais fácil de segurar, menos potência na batida forte' },
};

/**
 * A VALIDAR · a bola. Não tem eixo "como joga" de lâmina ou borracha, mas tem a
 * pergunta que todo iniciante faz na loja: por que uma bola custa cinco vezes a
 * outra. A resposta está na ficha — estrelas e homologação.
 */
export const BOLA = {
  resumo:
    'Bola de plástico 40+, o padrão atual do esporte. O que muda de preço entre bolas é a ' +
    'regularidade: quanto mais estrelas, mais parecidas entre si são as bolas da mesma caixa ' +
    'em peso, quique e formato.',
  tresEstrelas: {
    rotulo: 'Três estrelas',
    significa: 'a categoria de competição — bola de treino tem uma ou duas',
  },
  ittf: { rotulo: 'Aprovada pela ITTF', significa: 'pode ser usada em torneio oficial' },
} as const;

// ──────────────────── Classificadores ────────────────────

/* Escapes explícitos em vez do bloco de diacríticos colado direto: combinantes
   soltos no código-fonte são invisíveis no editor e somem em qualquer conversão
   de encoding pelo caminho. */
const DIACRITICOS = /[̀-ͯ]/g;
const semAcento = (s: string): string =>
  s.normalize('NFD').replace(DIACRITICOS, '').toLowerCase();

/** Texto de todas as linhas da ficha, junto e sem acento — a base das buscas. */
function textoDaFicha(ficha: readonly LinhaFicha[]): string {
  return semAcento(ficha.map((l) => `${l.rotulo} ${l.valor}`).join(' · '));
}

/*
 * ── POR QUE ESTES CLASSIFICADORES DEVOLVEM `null` ─────────────────────────────
 *
 * A primeira versão tinha `madeira-pura` como default do `else` final. Rodada
 * contra o catálogo, ela classificou assim QUINZE lâminas:
 *
 *     Viscaria Super ALC · Timo Boll ALC · Fan Zhendong Super ALC ·
 *     Harimoto Innerforce ZLC · Mizutani Jun Super ZLC · Primorac Carbon …
 *
 * Ou seja: as lâminas de fibra mais conhecidas do esporte seriam descritas como
 * "madeira pura, sem fibra — a recomendada para quem está formando a técnica".
 * O contrário exato da verdade, na cara de quem menos pode conferir.
 *
 * A causa não era o regex: era o DEFAULT AFIRMAR. A ficha dessas quinze não tem
 * linha de construção nenhuma — só "Lâmina avulsa. O cabo se escolhe na loja" —
 * e um `else` que devolve uma família transforma ausência de dado em afirmação.
 *
 * Agora: sem sinal na ficha, `null`, e a UI cai no texto editorial (D-16 — o
 * silêncio é melhor que o palpite). O teste `traduzir` guarda essa fronteira
 * com a invariante do nome: nenhuma lâmina cujo NOME diz fibra pode ser
 * classificada como madeira pura.
 */

/** Grafias de fibra que aparecem nas fichas — inclusive as em inglês. */
const FIBRA =
  /carbono|carbon|fibra|fiber|arylate|aramid|\balc\b|\bzlc\b|\bzlf\b|\bcnf\b|\bac\b|zylon|texalium|kevlar|vidro|glass/;

/** Sinal de que a ficha realmente FALA de construção, e não só de cabo/venda. */
const FALA_DE_MADEIRA = /madeira|ply|camada|balsa|hinoki|koto|limba|ayous|kiri|cipreste/;

/**
 * Família da lâmina, lida da construção declarada. `null` = a ficha não diz.
 *
 * A ordem importa: "pura" e "sem fibra" são NEGAÇÕES e vêm primeiro, senão
 * "5 camadas de madeira pura (sem fibra)" cairia em `com-fibra` por conter a
 * palavra "fibra".
 */
export function familiaDaLamina(ficha: readonly LinhaFicha[]): FamiliaLamina | null {
  const t = textoDaFicha(ficha);
  if (/\bpura\b|sem fibra/.test(t)) return 'madeira-pura';
  if (FIBRA.test(t)) return 'com-fibra';
  if (/balsa/.test(t)) return 'balsa';
  /* Só afirma madeira pura se a ficha falou de madeira. Silêncio não é resposta. */
  return FALA_DE_MADEIRA.test(t) ? 'madeira-pura' : null;
}

/**
 * Família da borracha, lida da superfície declarada. `null` = a ficha não diz.
 *
 * Aderente + tensionada ao mesmo tempo é HÍBRIDA, e essa combinação precisa ser
 * testada ANTES das duas puras, senão a primeira que casar leva.
 */
export function familiaDaBorracha(ficha: readonly LinhaFicha[]): FamiliaBorracha | null {
  const t = textoDaFicha(ficha);
  const aderente = /aderent|pegajos|hibrid|tacky/.test(t);
  const tensionada = /tensionad|tensor|tension/.test(t);
  if (aderente && tensionada) return 'hibrida';
  if (aderente) return 'aderente';
  if (tensionada) return 'tensor';
  /* "Lisa" sozinha é declaração de superfície: borracha tensionada sempre se
     anuncia como tal, então lisa e mais nada é clássica. Sem nem isso, `null`. */
  return /\blisa\b|invertid|smooth/.test(t) ? 'classica' : null;
}

/** Traços extras declarados na ficha, na ordem em que aparecem na tabela. */
export function extrasDaFicha(ficha: readonly LinhaFicha[]): Traco[] {
  const t = textoDaFicha(ficha);
  const achados: Traco[] = [];
  if (/defensiv/.test(t)) achados.push(EXTRAS.defensiva);
  if (/caneta|penhold/.test(t)) achados.push(EXTRAS.caneta);
  if (/hinoki/.test(t)) achados.push(EXTRAS.hinoki);
  if (/hexagonal|cybershape/.test(t)) achados.push(EXTRAS.hexagonal);
  if (/\bdura\b|\bhard\b/.test(t)) achados.push(EXTRAS.dura);
  if (/\bmacia\b|\bsoft\b/.test(t)) achados.push(EXTRAS.macia);
  return achados;
}

// ──────────────────── A leitura pronta ────────────────────

/**
 * Ficha do fabricante → resumo em português de gente.
 *
 * `null` quando não dá para dizer nada honesto: sem ficha, ou tipo que este
 * tradutor não cobre (bola, raquete montada). Devolver `null` é melhor que
 * devolver frase genérica — a UI já sabe cair no texto editorial (D-16).
 */
export function traduzirFicha(
  tipo: string,
  ficha: readonly LinhaFicha[] | undefined,
): LeituraSimples | null {
  if (!ficha || ficha.length === 0) return null;

  const t = semAcento(tipo);
  const extras = extrasDaFicha(ficha);

  if (t.includes('bola')) {
    const texto = textoDaFicha(ficha);
    const tracos: Traco[] = [];
    if (/3 estrela|tres estrela|\b3\*|three star/.test(texto)) tracos.push(BOLA.tresEstrelas);
    if (/ittf/.test(texto)) tracos.push(BOLA.ittf);
    return tracos.length > 0 ? { resumo: BOLA.resumo, tracos } : null;
  }

  if (t.includes('lamina')) {
    const familia = familiaDaLamina(ficha);
    if (familia) return { resumo: LAMINA[familia].resumo, tracos: [LAMINA[familia].traco, ...extras] };
    /* Sem construção declarada, mas a ficha ainda pode ter dito algo útil
       ("construção defensiva", "cabeça hexagonal"). Descartar isso junto com a
       família era jogar fora dado que existe — o defeito que deixava a
       Defensive Pro JP e a Wavy Cybershape mudas no modo Simples. */
    return extras.length > 0 ? { resumo: '', tracos: extras } : null;
  }

  if (t.includes('borracha')) {
    const familia = familiaDaBorracha(ficha);
    if (familia) return { resumo: BORRACHA[familia].resumo, tracos: [BORRACHA[familia].traco, ...extras] };
    return extras.length > 0 ? { resumo: '', tracos: extras } : null;
  }

  return null;
}
