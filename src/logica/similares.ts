/**
 * WikiPong · Os materiais parecidos com este
 * ==============================================================================
 * POR QUE ESTE MÓDULO EXISTE
 *
 * A ficha já compara este material com a MEDIANA do catálogo (o polígono
 * tracejado atrás do radar) e mostra onde ele cai na régua dos semelhantes. As
 * duas coisas respondem "8,2 é muito?".
 *
 * Nenhuma responde a pergunta seguinte, que é a que faz alguém abrir a ficha:
 * **e o que mais existe parecido com este?** Mediana não tem nome, não tem
 * preço e não dá para comprar. Quem está decidindo quer três alternativas
 * concretas ao lado.
 *
 * ── COMO A SEMELHANÇA É MEDIDA ───────────────────────────────────────────────
 *
 * Não existe um número de "parecido" publicado por ninguém, então a conta é
 * nossa — e por isso ela é simples o bastante para caber numa frase e ser
 * discutida: distância entre os índices que OS DOIS têm, mais o preço como
 * termo fraco.
 *
 * O preço entra porque parecido-mas-cinco-vezes-mais-caro não é alternativa. E
 * entra FRACO porque a pergunta é sobre a peça, não sobre o orçamento: quem
 * quer filtrar por preço tem o catálogo inteiro para isso.
 *
 * O que NÃO entra: nota de comunidade e popularidade. Rankear vizinho por nota
 * transformaria "parecidos com este" em "melhores que este", que é veredito
 * disfarçado de sugestão (D-14).
 *
 * ── E QUEM NÃO TEM ÍNDICE NENHUM ─────────────────────────────────────────────
 *
 * São 470 de 678. Para eles a distância cai no que existe: mesma família da
 * construção traduzida (madeira pura ≠ fibra externa), mesmo nível, e o preço.
 * É pobre comparado a specs, e é o que a loja de verdade oferece — ninguém
 * escolhe lâmina comparando decimais que não existem.
 *
 * Módulo PURO.
 */

export interface Similar {
  id: string;
  nome: string;
  tipo: string;
  nivel: string;
  preco: number;
  moeda?: string;
  specs?: { velocidade: number; spin?: number; controle: number };
  durabilidade?: number;
  /** Família da construção traduzida, quando a ficha declara. */
  familia?: string | null;
}

/** Quanto o preço pesa. Baixo de propósito: a pergunta é sobre a peça. */
const PESO_PRECO = 0.25;
/** Quanto valem os sinais categóricos quando não há número nenhum. */
const PESO_FAMILIA = 3;
const PESO_NIVEL = 1.5;

/**
 * Distância entre dois materiais. Menor = mais parecido.
 *
 * `null` quando não há NADA em comum para medir — nem índice, nem família, nem
 * nível, nem preço comparável. Devolver um número aí seria inventar proximidade.
 */
export function distancia(a: Similar, b: Similar, precoMaximo: number): number | null {
  let soma = 0;
  let termos = 0;

  if (a.specs && b.specs) {
    /* Os índices já vivem em 0–10, então a diferença crua é comparável entre
       eixos sem normalizar nada — a escala foi construída para isso. */
    soma += (a.specs.velocidade - b.specs.velocidade) ** 2;
    soma += (a.specs.controle - b.specs.controle) ** 2;
    termos += 2;
    if (a.specs.spin !== undefined && b.specs.spin !== undefined) {
      soma += (a.specs.spin - b.specs.spin) ** 2;
      termos += 1;
    }
    if (a.durabilidade !== undefined && b.durabilidade !== undefined) {
      soma += (a.durabilidade - b.durabilidade) ** 2;
      termos += 1;
    }
  } else {
    /* Sem índice, o que sobra é categórico. Família da construção pesa mais que
       nível porque uma madeira pura e uma de fibra externa jogam diferente
       mesmo sendo as duas "avançadas". */
    if (a.familia && b.familia) {
      soma += a.familia === b.familia ? 0 : PESO_FAMILIA ** 2;
      termos += 1;
    }
    if (a.nivel && b.nivel) {
      soma += a.nivel === b.nivel ? 0 : PESO_NIVEL ** 2;
      termos += 1;
    }
  }

  /* Preço só entra entre materiais na MESMA moeda: comparar R$ 300 com US$ 218
     exigiria câmbio, e câmbio é chute — a mesma regra do filtro e da ordenação. */
  if (a.moeda === b.moeda && precoMaximo > 0) {
    const dif = Math.abs(a.preco - b.preco) / precoMaximo;
    soma += (dif * 10 * PESO_PRECO) ** 2;
    termos += 1;
  }

  if (termos === 0) return null;
  return Math.sqrt(soma / termos);
}

/**
 * Os `quantos` materiais mais parecidos com `alvo`, do MESMO TIPO.
 *
 * Empate desempata por id, para a lista não mudar de ordem entre dois builds do
 * mesmo dado — página estática que muda sozinha a cada deploy é ruído.
 */
export function similares(
  alvo: Similar,
  universo: readonly Similar[],
  quantos = 3,
): Similar[] {
  const mesmoTipo = universo.filter((m) => m.tipo === alvo.tipo && m.id !== alvo.id);
  if (mesmoTipo.length === 0) return [];

  const precoMaximo = Math.max(...mesmoTipo.map((m) => m.preco), alvo.preco);

  /* ── MESMA BASE DE EVIDÊNCIA PRIMEIRO (conserto de 2026-08-20) ─────────────
     Um material COM índices era comparado com outro SEM nenhum, e a distância
     saía de "os dois são Avançado" — 82% dos pares do site inteiro eram assim.
     O resultado tinha cara de recomendação e era quase sorteio: a Tenergy 05
     aparecia ao lado de uma borracha sem spec nenhuma, em dólar, cuja única
     coisa em comum era a etiqueta de nível.

     Agora os candidatos são separados por BASE: quem tem índice concorre com
     quem tem índice. Só quando não há vizinhos suficientes na mesma base o
     resto entra, para a seção não ficar vazia — e aí a frase derivada some
     sozinha, que é o comportamento certo: sem base comum, não há o que dizer.

     Foi a frase que denunciou o defeito. Ela saía vazia em 891 de 893 pares, e
     vazia estava certa: não havia nada honesto a escrever sobre aqueles pares. */
  const ordenar = (candidatos: readonly Similar[]) =>
    candidatos
      .map((m) => ({ m, d: distancia(alvo, m, precoMaximo) }))
      .filter((x): x is { m: Similar; d: number } => x.d !== null)
      .sort((x, y) => (x.d === y.d ? x.m.id.localeCompare(y.m.id) : x.d - y.d))
      .map((x) => x.m);

  const mesmaBase = ordenar(mesmoTipo.filter((m) => Boolean(m.specs) === Boolean(alvo.specs)));
  if (mesmaBase.length >= quantos) return mesmaBase.slice(0, quantos);

  const resto = ordenar(mesmoTipo.filter((m) => Boolean(m.specs) !== Boolean(alvo.specs)));
  return [...mesmaBase, ...resto].slice(0, quantos);
}

// ───────────────────────── Por que ESTE apareceu ─────────────────────────
/**
 * A lista de parecidos dizia QUEM, nunca POR QUÊ.
 *
 * Três nomes com números ao lado obrigam o leitor a fazer a conta na cabeça:
 * "8,2 contra 8,6 é muito?". Ele já não sabia se 8,2 era muito — foi por isso
 * que abriu a ficha. A frase derivada faz a subtração por ele.
 *
 * ── O QUE ESTA FRASE NUNCA DIZ ───────────────────────────────────────────────
 * "Melhor", "pior", "vale mais a pena". Direção não é veredito: dizer que uma
 * borracha é MAIS RÁPIDA é fato subtraído de dois números publicados; dizer que
 * ela é MELHOR é opinião, e opinião aqui joga rotulada e em outra seção (D-14).
 *
 * ── E NUNCA INVENTA EIXO ─────────────────────────────────────────────────────
 * Só entra eixo que OS DOIS têm. Lâmina não tem efeito publicado por fonte
 * nenhuma; comparar o efeito de duas lâminas produziria uma frase sobre um
 * número que não existe — o mesmo erro que o radar já cometeu uma vez.
 */

/** Abaixo disto, na régua 0–10, a diferença é ruído de arredondamento. */
export const DIFERENCA_MINIMA = 0.3;
/** Acima disto a diferença deixa de ser "um pouco" e vira "bem". */
export const DIFERENCA_CLARA = 1;
/** Preço só vira assunto quando muda a faixa, não quando muda o troco. */
export const PRECO_MINIMO_RELATIVO = 0.12;

export type EixoComparavel = 'velocidade' | 'spin' | 'controle' | 'durabilidade';

export interface Diferenca {
  eixo: EixoComparavel;
  rotulo: string;
  /** Do ponto de vista do PARECIDO em relação ao alvo. */
  direcao: 'mais' | 'menos';
  /** Diferença absoluta, na régua do eixo. */
  quanto: number;
  intensidade: 'leve' | 'clara';
}

export interface PorqueParecido {
  /** Eixos em que os dois praticamente empatam — é o que os torna alternativa. */
  iguais: string[];
  /** Onde diferem, do maior para o menor. */
  diferencas: Diferenca[];
  /** Diferença de preço, só entre materiais na MESMA moeda. */
  preco?: { direcao: 'mais' | 'menos'; quanto: number };
  /** A frase pronta. Vazia quando não há nada honesto a dizer. */
  frase: string;
}

const ROTULO_EIXO: Readonly<Record<EixoComparavel, string>> = {
  velocidade: 'velocidade',
  spin: 'efeito',
  controle: 'controle',
  durabilidade: 'durabilidade',
};

/** Português tem gênero, e "mesmo velocidade" denuncia texto gerado. */
const GENERO_EIXO: Readonly<Record<EixoComparavel, 'a' | 'o'>> = {
  velocidade: 'a',
  durabilidade: 'a',
  spin: 'o',
  controle: 'o',
};

const valorDoEixo = (m: Similar, eixo: EixoComparavel): number | undefined =>
  eixo === 'durabilidade' ? m.durabilidade : m.specs?.[eixo];

export function porQueParecido(alvo: Similar, outro: Similar): PorqueParecido {
  const iguais: string[] = [];
  const diferencas: Diferenca[] = [];

  for (const eixo of ['velocidade', 'spin', 'controle', 'durabilidade'] as const) {
    const a = valorDoEixo(alvo, eixo);
    const b = valorDoEixo(outro, eixo);
    /* Eixo que só um dos dois tem não vira frase: seria comparar com o vazio. */
    if (a === undefined || b === undefined) continue;

    const delta = b - a;
    const quanto = Math.abs(delta);
    if (quanto < DIFERENCA_MINIMA) {
      iguais.push(ROTULO_EIXO[eixo]);
      continue;
    }
    diferencas.push({
      eixo,
      rotulo: ROTULO_EIXO[eixo],
      direcao: delta > 0 ? 'mais' : 'menos',
      quanto: Math.round(quanto * 10) / 10,
      intensidade: quanto >= DIFERENCA_CLARA ? 'clara' : 'leve',
    });
  }

  diferencas.sort((x, y) => y.quanto - x.quanto);

  /* Preço só entre a MESMA moeda — mesma regra da distância, do filtro e da
     ordenação: converter exigiria câmbio, e câmbio é chute. */
  let preco: PorqueParecido['preco'];
  if (alvo.moeda === outro.moeda && alvo.preco > 0) {
    const dif = outro.preco - alvo.preco;
    if (Math.abs(dif) / alvo.preco >= PRECO_MINIMO_RELATIVO) {
      preco = { direcao: dif > 0 ? 'mais' : 'menos', quanto: Math.abs(dif) };
    }
  }

  return { iguais, diferencas, preco, frase: frasear(iguais, diferencas, preco) };
}

/**
 * Monta a frase. No máximo DUAS diferenças: a terceira já não é comparação, é
 * ficha técnica — e a ficha técnica está logo acima, inteira.
 */
/** "mesma velocidade" / "mesmo controle" — concordância, não detalhe. */
function mesmo(rotulo: string): string {
  const eixo = (Object.keys(ROTULO_EIXO) as EixoComparavel[])
    .find((e) => ROTULO_EIXO[e] === rotulo);
  return `${eixo && GENERO_EIXO[eixo] === 'a' ? 'a mesma' : 'o mesmo'} ${rotulo}`;
}

function frasear(
  iguais: string[],
  diferencas: Diferenca[],
  preco: PorqueParecido['preco'],
): string {
  const partes: string[] = [];

  for (const d of diferencas.slice(0, 2)) {
    const intensidade = d.intensidade === 'clara' ? 'bem ' : 'um pouco ';
    partes.push(`${intensidade}${d.direcao === 'mais' ? 'mais' : 'menos'} ${d.rotulo}`);
  }

  /* Nenhuma diferença de índice: o que sobra é o empate, que é informação — é
     por isso que ele é alternativa de verdade. */
  if (partes.length === 0 && iguais.length > 0) {
    partes.push(
      iguais.length === 1
        ? `praticamente ${mesmo(iguais[0])}`
        : 'praticamente o mesmo perfil',
    );
  } else if (partes.length > 0 && iguais.length > 0) {
    partes.push(mesmo(iguais[0]));
  }

  if (preco) {
    const brl = preco.quanto.toLocaleString('pt-BR', {
      style: 'currency', currency: 'BRL', maximumFractionDigits: 0,
    });
    partes.push(`${brl} ${preco.direcao === 'mais' ? 'mais caro' : 'mais barato'}`);
  }

  if (partes.length === 0) return '';
  return partes.join(', ');
}
