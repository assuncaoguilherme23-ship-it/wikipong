/**
 * WikiPong · Onde as avaliações moram (contrato + implementação local)
 * ------------------------------------------------------------------------------
 * O D-17 diz: "Backend adiado — entra (Supabase/Postgres) quando as avaliações
 * da comunidade (D-11) exigirem escrita/moderação." Este arquivo é a costura
 * que torna esse dia um trabalho de uma tarde em vez de uma reescrita.
 *
 * A regra: NADA na UI conhece Supabase, localStorage ou JSON. Tudo fala com
 * `RepositorioAvaliacoes`. Trocar de implementação é trocar uma linha em
 * `repositorio()`.
 *
 * HONESTIDADE (D-16) — enquanto for local, é local de verdade e o site diz isso:
 * o que você escreve fica NO SEU NAVEGADOR, ninguém mais vê. Não há avaliação
 * de mentira semeada no repo pra encher a tela. Comunidade vazia aparece vazia.
 */
import type { Avaliacao } from './avaliacoes';
import { tokenGuardado } from './sessao';

export interface RepositorioAvaliacoes {
  /** Nome curto pra UI dizer a verdade sobre onde isto está indo. */
  readonly rotulo: string;
  /** true quando o que se escreve some do alcance de outras pessoas. */
  readonly somenteLocal: boolean;
  /**
   * true quando esta implementação consegue ENXERGAR o que está pendente.
   *
   * É falso no Supabase e não é limitação a consertar: a política de leitura só
   * devolve o que está 'aprovado', e a chave que o site carrega é a anônima,
   * visível no bundle. Uma tela que moderasse com essa chave seria uma tela em
   * que qualquer visitante aprova o que quiser. A moderação de verdade espera
   * login de administrador; até lá, é pelo painel do Supabase.
   */
  readonly podeModerar: boolean;
  listar(): Promise<Avaliacao[]>;
  doMaterial(materialId: string): Promise<Avaliacao[]>;
  gravar(nova: Avaliacao): Promise<void>;
  remover(id: string): Promise<void>;
  /** Muda o status de uma avaliação. Só faz sentido quando `podeModerar`. */
  moderar(id: string, status: Avaliacao['status']): Promise<void>;
}

const CHAVE = 'wikipong:avaliacoes:v1';

/**
 * Implementação local. Serve pra três coisas honestas: o fundador ver o fluxo
 * inteiro funcionando, a UI ser desenvolvida contra dados reais que ela mesma
 * produz, e os testes rodarem sem rede.
 *
 * Grava já como 'aprovado' porque a fila de moderação do D-11 pressupõe um
 * segundo par de olhos, e no seu próprio navegador esse segundo par é você.
 */
export function repositorioLocal(): RepositorioAvaliacoes {
  const ler = (): Avaliacao[] => {
    if (typeof localStorage === 'undefined') return [];
    try {
      const cru = localStorage.getItem(CHAVE);
      return cru ? (JSON.parse(cru) as Avaliacao[]) : [];
    } catch {
      /* Storage cheio, desativado ou com lixo de uma versão anterior. Perder a
         lista é ruim; derrubar a página inteira é pior. */
      return [];
    }
  };

  const escrever = (todas: Avaliacao[]) => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(CHAVE, JSON.stringify(todas));
    } catch {
      /* Idem: quota estourada não pode virar tela branca. */
    }
  };

  return {
    rotulo: 'este navegador',
    somenteLocal: true,
    podeModerar: true,
    async listar() {
      return ler();
    },
    async doMaterial(materialId) {
      return ler().filter((a) => a.materialId === materialId);
    },
    async gravar(nova) {
      escrever([...ler().filter((a) => a.id !== nova.id), nova]);
    },
    async remover(id) {
      escrever(ler().filter((a) => a.id !== id));
    },
    async moderar(id, status) {
      escrever(ler().map((a) => (a.id === id ? { ...a, status } : a)));
    },
  };
}

// ───────────────────────── Supabase ─────────────────────────

/**
 * Implementação contra a API REST do Supabase (PostgREST).
 *
 * `fetch` puro, SEM o SDK: o site é export estático e não precisa de mais um
 * pacote no bundle pra fazer quatro requisições. Se um dia precisar de realtime
 * ou de storage, o SDK entra — e só este arquivo muda.
 *
 * O schema está em supabase/001-comunidade.sql. As colunas são snake_case
 * (convenção do Postgres) e os campos daqui são camelCase: a tradução é feita
 * nas duas funções de mapeamento abaixo, e em nenhum outro lugar.
 *
 * A moderação NÃO é decidida aqui. O banco grava tudo como 'pendente' por
 * DEFAULT e a política de RLS só devolve o que está 'aprovado' — se este código
 * tentasse mandar status, o banco recusaria. Segurança de site estático mora no
 * servidor, porque a chave anônima vai no bundle, à vista de qualquer um.
 */
export function repositorioSupabase(url: string, chave: string): RepositorioAvaliacoes {
  const base = `${url.replace(/\/$/, '')}/rest/v1/avaliacoes`;
  /*
   * DUAS GERAÇÕES DE CHAVE, e o cabeçalho muda entre elas.
   *
   * A antiga (`anon`) era um JWT: mandá-la em `Authorization: Bearer` era o
   * padrão e funcionava. A nova (`sb_publishable_...`) NÃO é JWT — mandar ela
   * como Bearer é mandar um token que o servidor não sabe ler.
   *
   * Então: `apikey` sempre; `Authorization` só quando há algo que seja de fato
   * um token. Com sessão, é o token DA PESSOA, que é o que faz o banco liberar
   * o que é de admin ou de dono. Sem sessão e com chave antiga, mantém o Bearer
   * por compatibilidade com quem já tinha o projeto ligado.
   *
   * Recalculado a cada chamada de propósito: sessão nasce e morre no meio da
   * navegação.
   */
  const chaveEhJwt = chave.startsWith('ey');

  const cabecalhos = (): Record<string, string> => {
    const h: Record<string, string> = { apikey: chave, 'Content-Type': 'application/json' };
    const token = tokenGuardado() ?? (chaveEhJwt ? chave : undefined);
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  };

  type Linha = {
    id: string; material_id: string; usuario_id: string | null; autor: string;
    nota: number; texto: string; nivel: string; tempo_de_uso: string;
    estilo: string; criado_em: string; status: string;
  };

  const daLinha = (l: Linha): Avaliacao => ({
    id: l.id,
    materialId: l.material_id,
    usuarioId: l.usuario_id ?? undefined,
    autor: l.autor,
    nota: l.nota,
    texto: l.texto,
    nivel: l.nivel as Avaliacao['nivel'],
    tempoDeUso: l.tempo_de_uso as Avaliacao['tempoDeUso'],
    estilo: l.estilo as Avaliacao['estilo'],
    criadoEm: l.criado_em,
    status: l.status as Avaliacao['status'],
  });

  const paraLinha = (a: Avaliacao) => ({
    material_id: a.materialId,
    autor: a.autor,
    nota: a.nota,
    texto: a.texto,
    nivel: a.nivel,
    tempo_de_uso: a.tempoDeUso,
    estilo: a.estilo,
    /* `status` e `usuario_id` ficam de fora de propósito: quem decide os dois é
       o banco (DEFAULT 'pendente' e auth.uid()). Mandar daqui seria pedir pra
       ser recusado pela política — e, se não fosse, seria o furo. */
  });

  const buscar = async (consulta: string): Promise<Avaliacao[]> => {
    const res = await fetch(`${base}?${consulta}`, { headers: cabecalhos() });
    if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
    return ((await res.json()) as Linha[]).map(daLinha);
  };

  return {
    rotulo: 'WikiPong',
    somenteLocal: false,
    /* Com sessao, o banco decide (politicas de admin da migracao 002). Sem
       sessao, a chave anonima so' enxerga 'aprovado' e nao ha' fila pra ver. */
    podeModerar: Boolean(tokenGuardado()),
    listar: () => buscar('select=*&order=criado_em.desc&limit=200'),
    doMaterial: (materialId) =>
      buscar(`select=*&material_id=eq.${encodeURIComponent(materialId)}&order=criado_em.desc`),
    async gravar(nova) {
      const res = await fetch(base, {
        method: 'POST',
        headers: { ...cabecalhos(), Prefer: 'return=minimal' },
        body: JSON.stringify(paraLinha(nova)),
      });
      if (!res.ok) throw new Error(`Supabase recusou a gravação (${res.status})`);
    },
    async remover(id) {
      /* Não apaga: marca como removido. Apagar de verdade tira do moderador a
         chance de olhar o que foi denunciado, e some com o histórico. */
      const res = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { ...cabecalhos(), Prefer: 'return=minimal' },
        body: JSON.stringify({ status: 'removido' }),
      });
      if (!res.ok) throw new Error(`Supabase recusou a remoção (${res.status})`);
    },
    async moderar(id, status) {
      const res = await fetch(`${base}?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { ...cabecalhos(), Prefer: 'return=minimal' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`Supabase recusou a moderação (${res.status})`);
    },
  };
}

/**
 * O ponto único de troca. Nada mais no site sabe qual das duas está em uso.
 *
 * Pra ligar o backend: criar o projeto no Supabase, rodar
 * supabase/001-comunidade.sql, e pôr as duas variáveis num .env.local:
 *
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
 *
 * Sem elas, cai no local — e a UI passa a dizer que é local sozinha, porque lê
 * `somenteLocal` em vez de ter a frase escrita na mão.
 */
export const repositorio = (): RepositorioAvaliacoes => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && chave ? repositorioSupabase(url, chave) : repositorioLocal();
};

/** Id sem depender de crypto.randomUUID, que falta em navegador antigo. */
export const novoId = (): string =>
  `av_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
