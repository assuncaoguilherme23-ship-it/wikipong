/**
 * WikiPong · Máquina de estados do quiz (colheita do protótipo — D-15)
 * ------------------------------------------------------------------------------
 * Arquitetura portada fielmente do wikipong-quiz.html:
 *   · grafo de telas nomeadas (era `SCREENS[id]` no protótipo)
 *   · transição com PILHA de histórico (era `history.push` + `goBack()`)
 *   · progresso CIENTE DO BRANCH (era `progressFor` → "Pergunta n de total",
 *     com total variável por caminho — o branch do iniciante tem 3 passos,
 *     o do explorador tem 1)
 *
 * O que mudou na colheita: o protótipo misturava lógica e DOM (innerHTML);
 * aqui é módulo PURO e IMUTÁVEL — cada transição devolve um estado novo.
 * Renderização é problema da UI; URLs de preset implementam o D-12.
 *
 * ⚠️ Os TEXTOS (perguntas/opções) são conteúdo v2 alinhado às telas do Figma.
 * Ao abrir o protótipo no Claude Code, diffar copy se quiser resgatar frases.
 *
 * ENRIQUECIMENTO (D-18, 2026-07-23): cada pergunta ganhou uma opção a mais e cada
 * opção pode carregar um `filtro` — um fragmento de filtro REAL que entra no preset
 * final (`presetFinal`). Antes, orçamento/objetivo/estilo eram coletados mas NÃO
 * mudavam o resultado; agora toda resposta refina o catálogo. Os 4 perfis e seus
 * `presetURL` base seguem intactos (a recomendação das fichas depende deles).
 */

// ───────────────────────── Tipos ─────────────────────────

export interface Opcao {
  id: string;
  titulo: string;
  sub?: string;
  /** id da próxima tela no grafo */
  proximo: string;
  /**
   * OPCIONAL: fragmento de filtro REAL que esta resposta acrescenta ao preset
   * final (D-12). É o que faz a resposta CONTAR — orçamento vira filtro de preço,
   * estilo vira faixa de velocidade/controle, "raquete pronta" vira tipo=raquete.
   * Só entram chaves que o motor de filtros entende (D-16: nunca filtro fingido).
   * Resposta MAIS TARDE no caminho sobrescreve a mesma chave.
   */
  filtro?: string;
  /**
   * OPCIONAL: faixa de tempo de referência, para a pessoa saber onde se encaixa.
   * Existe porque "começando agora" e "jogo casualmente" se sobrepunham e não
   * havia como decidir entre as duas.
   *
   * É REFERÊNCIA, não régua (A VALIDAR — D-07): tempo sozinho não define nível.
   * Quem treina 3× por semana há 8 meses passa quem bate bola aos domingos há
   * 3 anos. Por isso as faixas são largas e a tela diz que frequência pesa mais.
   */
  tempo?: string;
}

export interface TelaPergunta {
  tipo: 'pergunta';
  pergunta: string;
  /** OPCIONAL: ressalva curta sob a pergunta, quando a escolha precisa de contexto. */
  nota?: string;
  /** rótulo e total do progresso deste branch (ex.: passo 2 de 3) */
  passo: { n: number; total: number };
  opcoes: Opcao[];
}

export interface Perfil {
  id: string;
  nome: string;
  descricao: string;
  /** preset de filtros do catálogo — estado na URL (D-12) */
  presetURL: string;
}

export interface TelaResultado {
  tipo: 'resultado';
  perfil: Perfil;
}

export type Tela = TelaPergunta | TelaResultado;

export interface EstadoQuiz {
  atual: string;
  historico: readonly string[];
  respostas: Readonly<Record<string, string>>; // telaId -> opcaoId
}

// ───────────────────── O grafo de telas ─────────────────────

export const TELAS: Record<string, Tela> = {
  // Q1 — o fork (iniciante / em evolução / explorar)
  inicio: {
    tipo: 'pergunta',
    pergunta: 'Há quanto tempo você joga?',
    nota: 'As faixas são só uma referência pra você se localizar. O que pesa mais é a frequência. Quem treina 3× por semana há 8 meses costuma estar à frente de quem bate bola aos domingos há 3 anos. Na dúvida entre duas, escolha a de baixo.',
    passo: { n: 1, total: 3 },
    opcoes: [
      {
        id: 'comecando',
        titulo: 'Estou começando agora',
        sub: 'ou ainda vou começar',
        tempo: 'nunca joguei · até 1 mês',
        proximo: 'ini-objetivo',
      },
      {
        id: 'voltando',
        titulo: 'Voltei depois de um tempo parado',
        sub: 'já sei o básico',
        tempo: 'joguei antes · retomando agora',
        proximo: 'ini-objetivo',
        // Já tem base: abre o intermediário junto com o iniciante.
        filtro: 'nivel=iniciante,intermediario',
      },
      {
        id: 'casual',
        titulo: 'Jogo casualmente há um tempo',
        sub: 'quero evoluir',
        tempo: '1 mês a 2 anos · sem treino regular',
        proximo: 'evo-estilo',
      },
      {
        id: 'serio',
        titulo: 'Treino sério há anos',
        sub: 'sei o que procuro',
        tempo: '2 anos ou mais · treinando toda semana',
        proximo: 'evo-estilo',
        filtro: 'nivel=intermediario,avancado',
      },
      { id: 'explorar', titulo: 'Só quero explorar o catálogo', proximo: 'resultado-explorador' },
    ],
  },

  // Branch INICIANTE (3 passos no total)
  'ini-objetivo': {
    tipo: 'pergunta',
    pergunta: 'O que você quer da sua primeira raquete de verdade?',
    passo: { n: 2, total: 3 },
    opcoes: [
      /* ── POR QUE ESTES FILTROS VIRARAM ORDENAÇÃO ─────────────────────────
         Eram faixas de spec: `ctrl=9-10` e `vel=6-8`. Faixa de spec só casa com
         material QUE TEM spec — 208 de 678 — e no nível iniciante são 10 de 33.
         O resultado é que o quiz respondia com quase nada: medindo os 37
         caminhos possíveis, 4 terminavam em ZERO materiais e 18 em menos de 10.

         Nível, tipo e intenção existem em 678 de 678; velocidade e controle,
         não. Então o que FILTRA é faceta, e o que a preferência faz é ORDENAR —
         a lista continua completa e a ordem responde ao que a pessoa pediu. */
      {
        id: 'aprender',
        titulo: 'Errar menos e aprender o básico',
        proximo: 'ini-orcamento',
        filtro: 'ordenar=controle', // controle alto e' o que de fato perdoa erro
      },
      {
        id: 'jogar-ja',
        titulo: 'Já competir com os amigos',
        proximo: 'ini-orcamento',
        filtro: 'ordenar=velocidade',
      },
      {
        id: 'pronta',
        titulo: 'Uma raquete pronta, sem montar nada',
        /* O aviso é a única coisa honesta a fazer aqui: o catálogo tem DUAS
           raquetes montadas, de R$ 295 e R$ 443. Sem ele, quem escolhe "até
           R$ 200" na pergunta seguinte cai numa lista vazia sem entender por
           quê — e o vazio, nesse caso, é verdade sobre o acervo, não erro. */
        sub: 'o catálogo tem só 2 montadas hoje, a partir de R$ 295',
        proximo: 'ini-orcamento',
        filtro: 'tipo=raquete',
      },
    ],
  },
  'ini-orcamento': {
    tipo: 'pergunta',
    pergunta: 'Quanto você pensa em investir agora?',
    passo: { n: 3, total: 3 },
    opcoes: [
      { id: 'ate-200', titulo: 'Até R$ 200', proximo: 'resultado-base', filtro: 'preco=200' },
      { id: 'ate-400', titulo: 'Até R$ 400', proximo: 'resultado-base', filtro: 'preco=400' },
      {
        id: 'sem-teto',
        titulo: 'Sem teto por enquanto',
        sub: 'quero ver as opções',
        proximo: 'resultado-base',
        // de propósito SEM filtro: "sem teto" não inventa faixa de preço
      },
    ],
  },

  // Branch EM EVOLUÇÃO (3 passos no total)
  'evo-estilo': {
    tipo: 'pergunta',
    pergunta: 'Como você descreveria o seu jogo?',
    passo: { n: 2, total: 3 },
    opcoes: [
      {
        id: 'ataque',
        titulo: 'Gosto de atacar e finalizar',
        // Ataque ganhou ramo próprio: a pergunta que separa dois atacantes não é
        // "o que pesa mais", é ONDE eles jogam. Ver `evo-ataque-distancia`.
        proximo: 'evo-ataque-distancia',
        filtro: 'intencao=atacar',
      },
      {
        id: 'troca',
        titulo: 'Prefiro trocar bola e construir o ponto',
        proximo: 'evo-prioridade',
        filtro: 'intencao=controlar,equilibrado',
      },
      {
        id: 'allround',
        titulo: 'All-round: um pouco de tudo',
        sub: 'depende do adversário',
        proximo: 'evo-prioridade',
        filtro: 'intencao=equilibrado',
      },
      {
        id: 'defesa',
        titulo: 'Defendo, devolvo tudo e espero o erro',
        sub: 'corte e bloqueio',
        proximo: 'evo-defesa-como',
        filtro: 'intencao=controlar',
      },
    ],
  },

  /* Ramo do ATAQUE. A distância da mesa é o eixo que mais muda o material de um
     atacante — e é o mesmo eixo da posição da fibra na lâmina: externa favorece
     quem joga colado, interna favorece quem gira um passo atrás. */
  'evo-ataque-distancia': {
    tipo: 'pergunta',
    pergunta: 'Onde você fica quando ataca?',
    nota: 'Se você ainda não sabe, escolha a última. Distância de mesa é das últimas coisas que se define, e material errado por causa disso atrapalha mais do que ajuda.',
    passo: { n: 3, total: 3 },
    opcoes: [
      {
        id: 'colado',
        titulo: 'Colado na mesa, no contra-ataque',
        sub: 'bloqueio e devolvo rápido',
        proximo: 'resultado-perto-da-mesa',
        filtro: 'ordenar=velocidade',
      },
      {
        id: 'meia-distancia',
        titulo: 'Um passo atrás, girando a bola',
        sub: 'topspin com arco',
        proximo: 'resultado-topspin',
        filtro: 'ordenar=spin',
      },
      {
        id: 'nao-sei',
        titulo: 'Ainda estou descobrindo',
        proximo: 'resultado-em-formacao',
        filtro: 'ordenar=controle',
      },
    ],
  },

  /* Ramo da DEFESA. Não existia: quem se descrevia como defensor caía nas mesmas
     três respostas de quem ataca. */
  'evo-defesa-como': {
    tipo: 'pergunta',
    pergunta: 'Como você defende?',
    passo: { n: 3, total: 3 },
    opcoes: [
      {
        id: 'corte',
        titulo: 'Corto longe da mesa',
        sub: 'espero o erro do ataque',
        proximo: 'resultado-defensor',
        filtro: 'ordenar=controle',
      },
      {
        id: 'bloqueio',
        titulo: 'Bloqueio colado na mesa',
        sub: 'devolvo a força do outro',
        proximo: 'resultado-perto-da-mesa',
        filtro: 'ordenar=controle',
      },
      {
        id: 'mistura',
        titulo: 'Defendo e ataco quando dá',
        proximo: 'resultado-controle',
        filtro: 'ordenar=controle',
      },
    ],
  },
  'evo-prioridade': {
    tipo: 'pergunta',
    pergunta: 'O que pesa mais na escolha do material?',
    passo: { n: 3, total: 3 },
    opcoes: [
      {
        id: 'potencia',
        titulo: 'Mais potência e efeito',
        sub: 'aceito perder um pouco de controle',
        proximo: 'resultado-em-formacao',
        filtro: 'ordenar=spin',
      },
      {
        id: 'seguranca',
        titulo: 'Mais segurança e consistência',
        proximo: 'resultado-controle',
        filtro: 'ordenar=controle',
      },
      {
        id: 'custo',
        titulo: 'Que dure e valha o preço',
        sub: 'custo-benefício',
        // Ia para "Construtor de pontos", que não fala de dinheiro em lugar
        // nenhum. Agora tem resultado próprio.
        proximo: 'resultado-custo',
        filtro: 'ordenar=preco-asc',
      },
    ],
  },

  /* Resultados (perfis) — o CTA carrega o preset na URL (D-12).
     Os presets FILTRAM por faceta (nível, tipo, intenção — declaradas em 678 de
     678) e ORDENAM por spec. A versão anterior filtrava por faixa de spec e
     entregava listas de 1 a 6 materiais, porque faixa de spec descarta os 470
     sem perfil de desempenho antes de qualquer outra coisa. */
  'resultado-base': {
    tipo: 'resultado',
    perfil: {
      id: 'base-solida',
      nome: 'Base sólida primeiro',
      descricao: 'Material que perdoa: a técnica cresce sem brigar com a raquete. Ordenado por controle, que é o índice que de fato mede quanto a peça tolera erro de gesto.',
      presetURL: '/catalogo?nivel=iniciante&ordenar=controle',
    },
  },
  'resultado-em-formacao': {
    tipo: 'resultado',
    perfil: {
      id: 'atacante-em-formacao',
      nome: 'Atacante em formação',
      descricao: 'Rápido o bastante pra crescer, tolerante o bastante pra errar. O nível intermediário inteiro, com o de maior controle primeiro.',
      presetURL: '/catalogo?nivel=intermediario&ordenar=controle',
    },
  },
  'resultado-controle': {
    tipo: 'resultado',
    perfil: {
      id: 'construtor-de-pontos',
      nome: 'Construtor de pontos',
      descricao: 'Consistência acima de tudo: trocar bola até abrir o espaço certo. Ordenado por controle.',
      presetURL: '/catalogo?intencao=controlar,equilibrado&ordenar=controle',
    },
  },
  'resultado-defensor': {
    tipo: 'resultado',
    perfil: {
      id: 'defensor',
      nome: 'Defensor',
      descricao: 'Material feito para devolver, não para finalizar: controle alto e velocidade contida, para o ponto durar até o outro errar.',
      presetURL: '/catalogo?intencao=controlar&ordenar=controle',
    },
  },
  'resultado-perto-da-mesa': {
    tipo: 'resultado',
    perfil: {
      id: 'perto-da-mesa',
      nome: 'Jogo colado na mesa',
      descricao: 'Resposta imediata e arco baixo, aproveitando a força que vem do outro lado. Em lâmina, é o território da fibra externa.',
      presetURL: '/catalogo?intencao=atacar&ordenar=velocidade',
    },
  },
  'resultado-topspin': {
    tipo: 'resultado',
    perfil: {
      id: 'topspin-meia-distancia',
      nome: 'Topspin de meia-distância',
      descricao: 'Girar a bola um passo atrás da mesa, com arco. Pede tempo de contato — em lâmina, é o território da fibra interna.',
      presetURL: '/catalogo?intencao=atacar&ordenar=spin',
    },
  },
  'resultado-custo': {
    tipo: 'resultado',
    perfil: {
      id: 'custo-beneficio',
      nome: 'Custo-benefício',
      descricao: 'Do mais barato para o mais caro, com preço real de loja conferido. Lembrando que borracha é consumível: o que dura mais pode sair mais barato por ano.',
      presetURL: '/catalogo?ordenar=preco-asc',
    },
  },
  'resultado-explorador': {
    tipo: 'resultado',
    perfil: {
      id: 'explorador',
      nome: 'Explorador',
      descricao: 'Sem pressa e sem filtro: o catálogo inteiro, com o modo Simples ligado pra tudo fazer sentido.',
      presetURL: '/catalogo?modo=simples',
    },
  },
};

// ───────────────────── Transições (puras) ─────────────────────

export function iniciar(): EstadoQuiz {
  return { atual: 'inicio', historico: [], respostas: {} };
}

/** Responde a tela atual e avança no grafo. NUNCA muta o estado recebido. */
export function responder(estado: EstadoQuiz, opcaoId: string): EstadoQuiz {
  const tela = TELAS[estado.atual];
  if (!tela || tela.tipo !== 'pergunta') {
    throw new Error(`Tela '${estado.atual}' não aceita resposta`);
  }
  const opcao = tela.opcoes.find(o => o.id === opcaoId);
  if (!opcao) throw new Error(`Opção '${opcaoId}' não existe em '${estado.atual}'`);
  return {
    atual: opcao.proximo,
    historico: [...estado.historico, estado.atual],
    respostas: { ...estado.respostas, [estado.atual]: opcaoId },
  };
}

/** Volta uma tela (pilha), esquecendo a resposta que levou até aqui. */
export function voltar(estado: EstadoQuiz): EstadoQuiz {
  if (estado.historico.length === 0) return estado;
  const anterior = estado.historico[estado.historico.length - 1];
  const respostas = { ...estado.respostas };
  delete respostas[anterior];
  return {
    atual: anterior,
    historico: estado.historico.slice(0, -1),
    respostas,
  };
}

/** Progresso ciente do branch (era `progressFor` no protótipo). null em resultado. */
export function progresso(estado: EstadoQuiz): { n: number; total: number; rotulo: string } | null {
  const tela = TELAS[estado.atual];
  if (!tela || tela.tipo !== 'pergunta') return null;
  const { n, total } = tela.passo;
  return { n, total, rotulo: `Pergunta ${n} de ${total}` };
}

/** Perfil final, quando a tela atual é um resultado. */
export function resultado(estado: EstadoQuiz): Perfil | null {
  const tela = TELAS[estado.atual];
  return tela && tela.tipo === 'resultado' ? tela.perfil : null;
}

/**
 * Preset FINAL do resultado: o `presetURL` do perfil (a base, que continua sendo
 * a identidade canônica usada pela recomendação) MAIS os fragmentos de filtro das
 * respostas do caminho. É isto que faz cada resposta contar de verdade.
 *
 * Regra de merge: percorre o histórico NA ORDEM respondida e sobrescreve por
 * chave — a resposta mais específica (mais tarde) vence. Só entram chaves que o
 * motor de filtros entende, então o resultado é sempre um preset válido (D-12).
 *
 * Devolve null quando a tela atual não é um resultado.
 */
export function presetFinal(estado: EstadoQuiz): string | null {
  const perfil = resultado(estado);
  if (!perfil) return null;

  const base = perfil.presetURL;
  const corte = base.indexOf('?');
  const caminho = corte === -1 ? base : base.slice(0, corte);
  const params = new URLSearchParams(corte === -1 ? '' : base.slice(corte + 1));

  for (const telaId of estado.historico) {
    const tela = TELAS[telaId];
    if (!tela || tela.tipo !== 'pergunta') continue;
    const opcao = tela.opcoes.find((o) => o.id === estado.respostas[telaId]);
    if (!opcao?.filtro) continue;
    for (const [chave, valor] of new URLSearchParams(opcao.filtro)) {
      params.set(chave, valor);
    }
  }

  // Vírgula é separador de lista nas facetas (nivel=a,b) — mantida legível na URL.
  const qs = params.toString().replace(/%2C/gi, ',');
  return qs ? `${caminho}?${qs}` : caminho;
}
