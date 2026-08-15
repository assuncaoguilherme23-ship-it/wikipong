/**
 * WikiPong · Discussões por tópico (D-19, emenda de 2026-07-30)
 * ------------------------------------------------------------------------------
 * Módulo PURO + repositório, no mesmo desenho das avaliações e do perfil.
 *
 * O D-19 dizia que fórum ao vivo não entrava porque muda a stack. A emenda o
 * traz de volta pelo mesmo caminho das avaliações: lógica e UI contra o
 * adaptador, escrita local até o backend do D-17 chegar.
 *
 * O que este fórum faz DIFERENTE de um fórum comum, e de propósito:
 *  · todo tópico tem ASSUNTO declarado, de uma lista curta. Fórum sem eixo vira
 *    linha do tempo, e achar coisa velha fica impossível;
 *  · tópico pode se amarrar a um MATERIAL do catálogo. Aí a discussão aparece
 *    ligada à ficha, em vez de viver num canto sem ligação com o resto do site;
 *  · quem escreve carrega a mesma tag de estilo das avaliações. A pergunta
 *    "vale a pena pra mim?" depende de quem responde.
 */
import type { EstiloJogador, NivelJogador } from './avaliacoes';
import { tokenGuardado } from './sessao';

export type Assunto = 'material' | 'montagem' | 'tecnica' | 'compra' | 'geral';

export const ROTULO_ASSUNTO: Readonly<Record<Assunto, string>> = {
  material: 'Sobre um material',
  montagem: 'Montagem da raquete',
  tecnica: 'Técnica e treino',
  compra: 'Onde comprar',
  geral: 'Geral',
};

export const ASSUNTOS = Object.keys(ROTULO_ASSUNTO) as Assunto[];

export interface Mensagem {
  id: string;
  autor: string;
  estilo?: EstiloJogador;
  nivel?: NivelJogador;
  texto: string;
  criadoEm: string;
  /**
   * Situação na moderação. Ausente no modo local, onde o segundo par de olhos é
   * o dono do navegador. Com servidor, a leitura pública já vem filtrada — o
   * campo existe para a TELA DE MODERAÇÃO, que é a única que vê o pendente.
   */
  status?: StatusTopico;
  /** Só o dono da mensagem e o moderador marcam — a regra mora no banco (010). */
  usuarioId?: string;
}

export interface Topico extends Mensagem {
  titulo: string;
  assunto: Assunto;
  /** Opcional: amarra a discussão a uma ficha do catálogo. */
  materialId?: string;
  respostas: Mensagem[];
  /**
   * Id da resposta que quem perguntou (ou um moderador) marcou como a que
   * resolveu. É o que faz um tópico de seis meses atrás continuar útil: sem
   * isso, quem chega pela busca lê quinze respostas e sai sem saber em qual
   * acreditar.
   */
  respostaUtil?: string;
}

export const TITULO_MINIMO = 8;
export const TEXTO_MINIMO = 20;

export interface ProblemaTopico {
  campo: 'titulo' | 'texto' | 'autor';
  mensagem: string;
}

export function validarTopico(r: Partial<Topico>): ProblemaTopico[] {
  const p: ProblemaTopico[] = [];
  if ((r.autor ?? '').trim().length < 2) {
    p.push({ campo: 'autor', mensagem: 'Diga como quer assinar.' });
  }
  if ((r.titulo ?? '').trim().length < TITULO_MINIMO) {
    p.push({
      campo: 'titulo',
      mensagem: `Um título que diga do que se trata (${TITULO_MINIMO} caracteres ou mais).`,
    });
  }
  if ((r.texto ?? '').trim().length < TEXTO_MINIMO) {
    p.push({ campo: 'texto', mensagem: `Conte o caso — pelo menos ${TEXTO_MINIMO} caracteres.` });
  }
  return p;
}

/** Data da última coisa que aconteceu no tópico: abertura ou última resposta. */
export const ultimaAtividade = (t: Topico): string =>
  t.respostas.reduce((maior, r) => (r.criadoEm > maior ? r.criadoEm : maior), t.criadoEm);

export type OrdemTopico = 'ativos' | 'novos' | 'sem-resposta';

/**
 * `ativos` é o default de propósito: num fórum pequeno, ordenar por criação
 * enterra a conversa que está viva sob tópicos novos que ninguém respondeu.
 */
export function ordenarTopicos(ts: readonly Topico[], ordem: OrdemTopico): Topico[] {
  const fora = [...ts];
  switch (ordem) {
    case 'ativos':
      return fora.sort((a, b) => ultimaAtividade(b).localeCompare(ultimaAtividade(a)));
    case 'novos':
      return fora.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
    /* O filtro que mantém fórum pequeno vivo: quem chega vê primeiro quem ainda
       não teve resposta. Pergunta sem resposta é a razão nº 1 de alguém não
       voltar. */
    case 'sem-resposta':
      return fora
        .filter((t) => t.respostas.length === 0)
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }
}

export const porAssunto = (ts: readonly Topico[], a?: Assunto): Topico[] =>
  a ? ts.filter((t) => t.assunto === a) : [...ts];

export const doMaterial = (ts: readonly Topico[], materialId: string): Topico[] =>
  ts.filter((t) => t.materialId === materialId);

/**
 * A resposta marcada, à frente das outras.
 *
 * Um fórum onde a resposta certa é a nona da lista obriga todo mundo a reler a
 * discussão inteira. Ela sobe, e as outras seguem na ordem em que foram escritas
 * — o que aconteceu depois continua legível como conversa.
 */
export function respostasOrdenadas(t: Topico): Mensagem[] {
  if (!t.respostaUtil) return [...t.respostas];
  const util = t.respostas.find((r) => r.id === t.respostaUtil);
  if (!util) return [...t.respostas];
  return [util, ...t.respostas.filter((r) => r.id !== t.respostaUtil)];
}

export const temRespostaUtil = (t: Topico): boolean =>
  Boolean(t.respostaUtil && t.respostas.some((r) => r.id === t.respostaUtil));

/* ── Busca ──
   Sem acento, sem caixa. Casa TODOS os termos, em qualquer ordem, no título e no
   texto — mesma régua da busca do catálogo, para o site não ter duas buscas que
   se comportam diferente. */
const semAcento = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export function buscarTopicos(ts: readonly Topico[], termo: string): Topico[] {
  const termos = semAcento(termo).split(/\s+/).filter(Boolean);
  if (termos.length === 0) return [...ts];
  return ts.filter((t) => {
    /* As RESPOSTAS entram na busca de propósito. Num fórum de equipamento o nome
       do material quase nunca está no título ("vale a pena trocar?"), e sim na
       resposta de quem respondeu. Buscar só o título esconderia justamente os
       tópicos que a busca existe para achar. */
    const alvo = semAcento(`${t.titulo} ${t.texto} ${t.respostas.map((r) => r.texto).join(' ')}`);
    return termos.every((p) => alvo.includes(p));
  });
}

export interface RepositorioDiscussoes {
  readonly somenteLocal: boolean;
  listar(): Promise<Topico[]>;
  gravar(t: Topico): Promise<void>;
  responder(topicoId: string, m: Mensagem): Promise<void>;
  /** Aprova, remove ou devolve à fila. Exige admin no banco. */
  moderar(id: string, status: StatusTopico, alvo: 'topico' | 'resposta'): Promise<void>;
  /** Marca (ou desmarca, com `null`) a resposta que resolveu a dúvida. */
  marcarRespostaUtil(topicoId: string, respostaId: string | null): Promise<void>;
}

export type StatusTopico = 'pendente' | 'aprovado' | 'removido';

const CHAVE = 'wikipong:discussoes:v1';

export function repositorioDiscussoesLocal(): RepositorioDiscussoes {
  const ler = (): Topico[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
      const cru = localStorage.getItem(CHAVE);
      return cru ? (JSON.parse(cru) as Topico[]) : [];
    } catch {
      return [];
    }
  };
  const escrever = (ts: Topico[]) => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(ts));
    } catch {
      /* Quota estourada não pode virar tela branca. */
    }
  };

  return {
    somenteLocal: true,
    async listar() {
      return ler();
    },
    async gravar(t) {
      escrever([...ler().filter((x) => x.id !== t.id), t]);
    },
    async responder(topicoId, m) {
      escrever(
        ler().map((t) =>
          t.id === topicoId ? { ...t, respostas: [...t.respostas, m] } : t,
        ),
      );
    },
    async moderar(id, status, alvo) {
      escrever(
        ler().map((t) => {
          if (alvo === 'topico') return t.id === id ? { ...t, status } : t;
          return { ...t, respostas: t.respostas.map((r) => (r.id === id ? { ...r, status } : r)) };
        }),
      );
    },
    async marcarRespostaUtil(topicoId, respostaId) {
      escrever(
        ler().map((t) =>
          t.id === topicoId ? { ...t, respostaUtil: respostaId ?? undefined } : t,
        ),
      );
    },
  };
}

// ───────────────────────── Supabase ─────────────────────────

/**
 * O backend das discussões, contra a API REST do Supabase (PostgREST).
 *
 * `fetch` puro, sem SDK — mesma decisão do repositório de avaliações: o site é
 * export estático e não vai carregar um pacote inteiro para fazer requisição.
 *
 * As tabelas `topicos` e `respostas` existem desde a migração 001, com as
 * políticas por papel corrigidas na 007. Este arquivo é o que faltava para
 * ligá-las — até aqui, tudo que se escrevia no fórum morria no localStorage de
 * quem escreveu.
 *
 * AS RESPOSTAS VÊM EMBUTIDAS numa consulta só, pela chave estrangeira. Uma
 * requisição por tópico para buscar respostas seria N+1 — numa lista de trinta
 * tópicos, trinta e uma viagens.
 *
 * E O NOME DA CHAVE VAI EXPLÍCITO no `select`. Existem DUAS ligações entre
 * `topicos` e `respostas`, e elas apontam para lados opostos:
 *
 *   respostas.topico_id    → topicos.id     (as respostas de um tópico)
 *   topicos.resposta_util  → respostas.id   (a resposta que resolveu, da 010)
 *
 * Com as duas no ar, `respostas(*)` virou ambíguo e o PostgREST passou a
 * responder 300 (PGRST201) em vez de dados. A lista do fórum ficou vazia em
 * produção, e ninguém viu, porque a tela trata falha de leitura como "não há
 * nada" — que é o certo pra não dar tela branca, e é justamente o que faz um
 * defeito destes passar despercebido.
 */
export function repositorioDiscussoesSupabase(url: string, chave: string): RepositorioDiscussoes {
  const raiz = `${url.replace(/\/$/, '')}/rest/v1`;
  const chaveEhJwt = chave.startsWith('ey');

  const cabecalhos = (): Record<string, string> => {
    const h: Record<string, string> = { apikey: chave, 'Content-Type': 'application/json' };
    const token = tokenGuardado() ?? (chaveEhJwt ? chave : undefined);
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  type LinhaResposta = {
    id: string; topico_id: string; usuario_id: string | null; autor: string; estilo: string | null;
    nivel: string | null; texto: string; criado_em: string; status: string;
  };
  type LinhaTopico = {
    id: string; titulo: string; texto: string; assunto: string;
    material_id: string | null; usuario_id: string | null; autor: string;
    estilo: string | null; nivel: string | null; criado_em: string; status: string;
    resposta_util: string | null; respostas: LinhaResposta[] | null;
  };

  const daResposta = (l: LinhaResposta): Mensagem => ({
    id: l.id,
    autor: l.autor,
    usuarioId: l.usuario_id ?? undefined,
    estilo: (l.estilo ?? undefined) as EstiloJogador | undefined,
    nivel: (l.nivel ?? undefined) as NivelJogador | undefined,
    texto: l.texto,
    criadoEm: l.criado_em,
    status: l.status as StatusTopico,
  });

  const doTopico = (l: LinhaTopico): Topico => ({
    id: l.id,
    titulo: l.titulo,
    texto: l.texto,
    assunto: l.assunto as Assunto,
    materialId: l.material_id ?? undefined,
    usuarioId: l.usuario_id ?? undefined,
    autor: l.autor,
    estilo: (l.estilo ?? undefined) as EstiloJogador | undefined,
    nivel: (l.nivel ?? undefined) as NivelJogador | undefined,
    criadoEm: l.criado_em,
    status: l.status as StatusTopico,
    respostaUtil: l.resposta_util ?? undefined,
    /* Ordena aqui e não no banco: o PostgREST ordena o recurso embutido por
       outra cláusula, e cronológica é a única ordem em que uma conversa se lê. */
    respostas: (l.respostas ?? [])
      .map(daResposta)
      .sort((a, b) => a.criadoEm.localeCompare(b.criadoEm)),
  });

  return {
    somenteLocal: false,
    async listar() {
      const res = await fetch(
        `${raiz}/topicos?select=*,respostas!respostas_topico_id_fkey(*)&order=criado_em.desc&limit=200`,
        { headers: cabecalhos() },
      );
      if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
      return ((await res.json()) as LinhaTopico[]).map(doTopico);
    },
    async gravar(t) {
      /* `status` fica de fora: quem decide é o banco (DEFAULT 'pendente'). E
         `respostas` também — elas são outra tabela, não uma coluna. */
      const res = await fetch(`${raiz}/topicos`, {
        method: 'POST',
        headers: { ...cabecalhos(), Prefer: 'return=minimal' },
        body: JSON.stringify({
          titulo: t.titulo,
          texto: t.texto,
          assunto: t.assunto,
          autor: t.autor,
          ...(t.materialId ? { material_id: t.materialId } : {}),
          ...(t.estilo ? { estilo: t.estilo } : {}),
          ...(t.nivel ? { nivel: t.nivel } : {}),
          ...(t.usuarioId ? { usuario_id: t.usuarioId } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Supabase recusou o tópico (${res.status})`);
    },
    async responder(topicoId, m) {
      const res = await fetch(`${raiz}/respostas`, {
        method: 'POST',
        headers: { ...cabecalhos(), Prefer: 'return=minimal' },
        body: JSON.stringify({
          topico_id: topicoId,
          autor: m.autor,
          texto: m.texto,
          ...(m.estilo ? { estilo: m.estilo } : {}),
          ...(m.nivel ? { nivel: m.nivel } : {}),
          ...(m.usuarioId ? { usuario_id: m.usuarioId } : {}),
        }),
      });
      if (!res.ok) throw new Error(`Supabase recusou a resposta (${res.status})`);
    },
    async moderar(id, status, alvo) {
      const tabela = alvo === 'topico' ? 'topicos' : 'respostas';
      const res = await fetch(`${raiz}/${tabela}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { ...cabecalhos(), Prefer: 'return=minimal' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Supabase recusou a moderação (${res.status})`);
    },
    async marcarRespostaUtil(topicoId, respostaId) {
      /* Por FUNÇÃO, não por PATCH. A RLS filtra linha, não coluna: dar ao dono
         do tópico o direito de atualizar a linha deixaria ele trocar o `status`
         na mesma requisição e publicar sem passar pela moderação. A função da
         migração 010 só mexe na coluna certa, e confere que a resposta é mesmo
         daquele tópico. */
      const res = await fetch(`${raiz}/rpc/marcar_resposta_util`, {
        method: 'POST',
        headers: cabecalhos(),
        body: JSON.stringify({ p_topico: topicoId, p_resposta: respostaId }),
      });
      if (!res.ok) throw new Error(`Supabase recusou a marcação (${res.status})`);
    },
  };
}

/** O ponto único de troca. Nada na UI sabe qual das duas está em uso. */
export const repositorioDiscussoes = (): RepositorioDiscussoes => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && chave ? repositorioDiscussoesSupabase(url, chave) : repositorioDiscussoesLocal();
};

/**
 * Quantas vezes a resposta desta pessoa foi a que resolveu o tópico.
 *
 * É o único número de reputação que este site guarda, e é de propósito: ele é
 * GANHO, não declarado — quem marca é quem perguntou. Contagem de mensagens ou
 * de curtidas premiaria volume, e volume muda o que as pessoas escrevem.
 */
export function resolveuQuantas(topicos: readonly Topico[], usuarioId: string): number {
  return topicos.filter((t) =>
    Boolean(t.respostaUtil) &&
    t.respostas.some((r) => r.id === t.respostaUtil && r.usuarioId === usuarioId),
  ).length;
}
