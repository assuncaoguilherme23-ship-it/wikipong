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
 */

// ───────────────────────── Tipos ─────────────────────────

export interface Opcao {
  id: string;
  titulo: string;
  sub?: string;
  /** id da próxima tela no grafo */
  proximo: string;
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
      { id: 'casual', titulo: 'Jogo casualmente há um tempo', sub: 'quero evoluir', proximo: 'evo-estilo' },
      { id: 'serio', titulo: 'Treino sério há anos', sub: 'sei o que procuro', proximo: 'evo-estilo' },
      { id: 'explorar', titulo: 'Só quero explorar o catálogo', proximo: 'resultado-explorador' },
    ],
  },

  // Branch INICIANTE (3 passos no total)
  'ini-objetivo': {
    tipo: 'pergunta',
    pergunta: 'O que você quer da sua primeira raquete de verdade?',
    passo: { n: 2, total: 3 },
    opcoes: [
      { id: 'aprender', titulo: 'Errar menos e aprender o básico', proximo: 'ini-orcamento' },
      { id: 'jogar-ja', titulo: 'Já competir com os amigos', proximo: 'ini-orcamento' },
    ],
  },
  'ini-orcamento': {
    tipo: 'pergunta',
    pergunta: 'Quanto você pensa em investir agora?',
    passo: { n: 3, total: 3 },
    opcoes: [
      { id: 'ate-300', titulo: 'Até R$ 300', proximo: 'resultado-base' },
      { id: 'ate-600', titulo: 'Até R$ 600', proximo: 'resultado-base' },
    ],
  },

  // Branch EM EVOLUÇÃO (3 passos no total)
  'evo-estilo': {
    tipo: 'pergunta',
    pergunta: 'Como você descreveria o seu jogo?',
    passo: { n: 2, total: 3 },
    opcoes: [
      { id: 'ataque', titulo: 'Gosto de atacar e finalizar', proximo: 'evo-prioridade' },
      { id: 'troca', titulo: 'Prefiro trocar bola e construir o ponto', proximo: 'evo-prioridade' },
    ],
  },
  'evo-prioridade': {
    tipo: 'pergunta',
    pergunta: 'O que pesa mais na escolha do material?',
    passo: { n: 3, total: 3 },
    opcoes: [
      { id: 'potencia', titulo: 'Mais potência e efeito', sub: 'aceito perder um pouco de controle', proximo: 'resultado-em-formacao' },
      { id: 'seguranca', titulo: 'Mais segurança e consistência', proximo: 'resultado-controle' },
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
