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
}

export interface TelaPergunta {
  tipo: 'pergunta';
  pergunta: string;
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
    passo: { n: 1, total: 3 },
    opcoes: [
      { id: 'comecando', titulo: 'Estou começando agora', sub: 'ou vou começar', proximo: 'ini-objetivo' },
      {
        id: 'voltando',
        titulo: 'Voltei depois de um tempo parado',
        sub: 'já sei o básico',
        proximo: 'ini-objetivo',
        // Já tem base: abre o intermediário e tolera um pouco mais de velocidade
        filtro: 'nivel=iniciante,intermediario&vel=3-8',
      },
      { id: 'casual', titulo: 'Jogo casualmente há um tempo', sub: 'quero evoluir', proximo: 'evo-estilo' },
      {
        id: 'serio',
        titulo: 'Treino sério há anos',
        sub: 'sei o que procuro',
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
      {
        id: 'aprender',
        titulo: 'Errar menos e aprender o básico',
        proximo: 'ini-orcamento',
        filtro: 'ctrl=9-10', // aperta o controle: só o que mais perdoa
      },
      {
        id: 'jogar-ja',
        titulo: 'Já competir com os amigos',
        proximo: 'ini-orcamento',
        filtro: 'vel=6-8', // aceita mais velocidade que a base
      },
      {
        id: 'pronta',
        titulo: 'Uma raquete pronta, sem montar nada',
        sub: 'já vem com as borrachas',
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
        proximo: 'evo-prioridade',
        filtro: 'vel=7-10',
      },
      {
        id: 'troca',
        titulo: 'Prefiro trocar bola e construir o ponto',
        proximo: 'evo-prioridade',
        filtro: 'ctrl=8-10',
      },
      {
        id: 'allround',
        titulo: 'All-round: um pouco de tudo',
        sub: 'depende do adversário',
        proximo: 'evo-prioridade',
        filtro: 'intencao=equilibrado',
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
        proximo: 'resultado-controle',
        filtro: 'ordenar=preco-asc',
      },
    ],
  },

  // Resultados (perfis) — o CTA carrega o preset na URL (D-12)
  'resultado-base': {
    tipo: 'resultado',
    perfil: {
      id: 'base-solida',
      nome: 'Base sólida primeiro',
      descricao: 'Material que perdoa: controle alto e velocidade contida, pra técnica crescer sem brigar com a raquete.',
      presetURL: '/catalogo?nivel=iniciante&ctrl=8-10&vel=3-6&ordenar=perdao',
    },
  },
  'resultado-em-formacao': {
    tipo: 'resultado',
    perfil: {
      id: 'atacante-em-formacao',
      nome: 'Atacante em formação',
      descricao: 'Velocidade média-alta com controle ainda alto: rápido o bastante pra crescer, tolerante o bastante pra errar.',
      presetURL: '/catalogo?nivel=intermediario&vel=6-8&ctrl=7-10',
    },
  },
  'resultado-controle': {
    tipo: 'resultado',
    perfil: {
      id: 'construtor-de-pontos',
      nome: 'Construtor de pontos',
      descricao: 'Consistência acima de tudo: controle e efeito pra trocar bola até abrir o espaço certo.',
      presetURL: '/catalogo?vel=5-7&ctrl=8-10&ordenar=controle',
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
