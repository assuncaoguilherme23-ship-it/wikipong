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

  return mesmoTipo
    .map((m) => ({ m, d: distancia(alvo, m, precoMaximo) }))
    .filter((x): x is { m: Similar; d: number } => x.d !== null)
    .sort((x, y) => (x.d === y.d ? x.m.id.localeCompare(y.m.id) : x.d - y.d))
    .slice(0, quantos)
    .map((x) => x.m);
}
