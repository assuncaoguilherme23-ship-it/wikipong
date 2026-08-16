/**
 * WikiPong · Perfil do jogador (D-19, emenda da comunidade)
 * ------------------------------------------------------------------------------
 * Módulo PURO + repositório, no mesmo desenho das avaliações: nada na UI sabe
 * onde isto mora, e trocar local por Supabase é trocar uma função.
 *
 * O perfil existe por um motivo prático, não por vaidade: é ele que preenche
 * sozinho o estilo e o nível na hora de avaliar. Sem perfil, cada avaliação
 * pede os mesmos três campos de novo, e formulário repetitivo é formulário
 * abandonado.
 *
 * "Meu equipamento" reusa a `Montagem` do /montar — lâmina + forehand +
 * backhand. Não é entidade nova: é a mesma raquete que a pessoa já monta lá,
 * agora com dono.
 */
import { ROTULO_ESTILO, type EstiloJogador, type NivelJogador } from './avaliacoes';
import { apelidoDe } from './apelido';
import { sessaoAtual, usuarioAtual } from './sessao';

/* Tabelas de lookup: um lugar só, para poderem ser revistas sem caçar string
   espalhada pela UI. Os valores batem com o check da migração 014. */
export type Mao = 'destro' | 'canhoto';
export type Empunhadura = 'classica' | 'caneta-chinesa' | 'caneta-japonesa';
export type Frequencia = 'todo-dia' | 'quase-todo-dia' | 'toda-semana' | 'de-vez-em-quando';

export const MAOS: readonly Mao[] = ['destro', 'canhoto'];
export const EMPUNHADURAS: readonly Empunhadura[] = ['classica', 'caneta-chinesa', 'caneta-japonesa'];
export const FREQUENCIAS: readonly Frequencia[] = [
  'todo-dia', 'quase-todo-dia', 'toda-semana', 'de-vez-em-quando',
];

export const ROTULO_MAO: Readonly<Record<Mao, string>> = {
  destro: 'Destro',
  canhoto: 'Canhoto',
};

export const ROTULO_EMPUNHADURA: Readonly<Record<Empunhadura, string>> = {
  classica: 'Clássica',
  'caneta-chinesa': 'Caneta chinesa',
  'caneta-japonesa': 'Caneta japonesa',
};

export const ROTULO_FREQUENCIA: Readonly<Record<Frequencia, string>> = {
  'todo-dia': 'Todo dia',
  'quase-todo-dia': 'Quase todo dia',
  'toda-semana': 'Toda semana',
  'de-vez-em-quando': 'De vez em quando',
};

/**
 * O ano mais antigo que o banco aceita em `joga_desde` (migração 016). A régua
 * fina — "não pode ser no futuro" — vive na tela, porque um CHECK do Postgres
 * não pode consultar a data de hoje.
 */
export const ANO_MINIMO = 1930;

export interface Perfil {
  nome: string;
  estilo?: EstiloJogador;
  nivel?: NivelJogador;
  /** Gerado uma vez pelo repositório, na primeira gravação. Nunca muda. */
  apelido?: string;
  mao?: Mao;
  empunhadura?: Empunhadura;
  cidade?: string;
  uf?: string;
  /** Uma linha: "mais controle no backhand". */
  procuro?: string;
  /** Ano em que começou a jogar. Vira "N anos de raquete" na tela. */
  jogaDesde?: number;
  frequencia?: Frequencia;
  /** O único campo do perfil que liga uma pessoa a outra. */
  clube?: string;
  bola?: string;
  /** Ids de material. Guardar id e não o objeto: o catálogo muda, o perfil não. */
  equipamento: {
    lamina?: string;
    fh?: string;
    bh?: string;
  };
  atualizadoEm: string;
}

export const perfilVazio = (): Perfil => ({
  nome: '',
  equipamento: {},
  atualizadoEm: new Date().toISOString(),
});

/** Um perfil "existe" quando dá pra apresentar a pessoa: nome + estilo. */
export const temIdentidade = (p: Perfil): boolean =>
  p.nome.trim().length >= 2 && Boolean(p.estilo);

export const temEquipamento = (p: Perfil): boolean =>
  Boolean(p.equipamento.lamina || p.equipamento.fh || p.equipamento.bh);

/** Quantas das três peças a pessoa já escolheu. */
export const pecasEscolhidas = (p: Perfil): number =>
  [p.equipamento.lamina, p.equipamento.fh, p.equipamento.bh].filter(Boolean).length;

// ───────────────────── As duas linhas do cartão mesa ─────────────────────

/**
 * Estilo · nível · mão · empunhadura. A linha de DADO do cartão, em mono.
 *
 * Mora aqui e não em cada tela porque as duas páginas de perfil — a de editar e
 * a pública — têm que mostrar exatamente a mesma linha. Enquanto cada uma
 * montava a sua, "é assim que você aparece" era uma promessa que dependia de
 * ninguém mexer numa das duas.
 */
export const tracosDoPerfil = (p: Perfil): string[] =>
  [
    p.estilo ? ROTULO_ESTILO[p.estilo] : null,
    p.nivel ?? null,
    p.mao ? ROTULO_MAO[p.mao] : null,
    p.empunhadura ? ROTULO_EMPUNHADURA[p.empunhadura] : null,
  ].filter((x): x is string => Boolean(x));

/**
 * A segunda linha: há quanto tempo joga, quanto joga, onde joga, com que bola.
 *
 * `anoAtual` entra por parâmetro pelo mesmo motivo de `retratoDoJogador`:
 * `new Date()` dentro de função pura é asserção que passa hoje e quebra em
 * janeiro.
 */
export function contextoDoPerfil(p: Perfil, anoAtual: number): string[] {
  const partes: string[] = [];

  /* Ano no futuro não vira "-4 anos de raquete": some. Dado impossível é dado
     que falta (D-16), e o banco não consegue barrar isto sozinho — um CHECK do
     Postgres não pode consultar a data de hoje. */
  if (p.jogaDesde && p.jogaDesde <= anoAtual) {
    const anos = anoAtual - p.jogaDesde;
    partes.push(
      anos === 0 ? 'começou este ano' : anos === 1 ? '1 ano de raquete' : `${anos} anos de raquete`,
    );
  }
  if (p.frequencia) partes.push(`joga ${ROTULO_FREQUENCIA[p.frequencia].toLowerCase()}`);
  if (p.clube?.trim()) partes.push(p.clube.trim());

  const lugar = [p.cidade?.trim(), p.uf?.trim()].filter(Boolean).join(' · ');
  if (lugar) partes.push(lugar);

  if (p.bola?.trim()) partes.push(`bola ${p.bola.trim()}`);
  return partes;
}

// ───────────────────────── O que ainda dá pra contar ─────────────────────────

export interface AindaPorContar {
  campo: string;
  rotulo: string;
  /** O que ESTE dado faz aparecer. Nunca um pedido genérico. */
  serve: string;
  /** Sem conta, este dado não tem onde morar — ver a nota abaixo. */
  soComConta: boolean;
}

/**
 * O que o perfil ainda não conta, e o que cada coisa acrescenta.
 *
 * NÃO DEVOLVE PORCENTAGEM, E ISSO É DELIBERADO. Uma barra de "perfil 60%
 * completo" transforma a página numa tarefa com resposta errada, e faz a pessoa
 * preencher pra calar o medidor — o que produz dado ruim, que é pior que dado
 * faltando (D-16). Uma lista do que ainda dá pra contar, cada item dizendo o que
 * ele faz aparecer, informa sem cobrar. Quem não quiser contar, não conta, e a
 * lista some conforme ela conta.
 *
 * A LINHA ENTRE LOCAL E COM CONTA não é comercial, é factual:
 *
 *   nome · estilo · nível · equipamento  →  fazem trabalho AGORA, sem conta:
 *     preenchem sozinhos a sua próxima avaliação e alimentam o montador. Guardar
 *     no navegador serve pra alguma coisa.
 *
 *   todo o resto  →  só existe pra ser LIDO POR OUTRA PESSOA. Sem conta não há
 *     página onde alguém leia (o endereço público nasce do apelido, que nasce da
 *     conta). Guardar "meu clube é a FitPong" num navegador onde ninguém vai ver
 *     seria fingir que algo foi feito.
 */
export function oQueFalta(p: Perfil, temConta: boolean): AindaPorContar[] {
  const tudo: (AindaPorContar & { pronto: boolean })[] = [
    { campo: 'nome', rotulo: 'Como você assina', soComConta: false,
      serve: 'é o nome embaixo de cada avaliação e resposta sua',
      pronto: p.nome.trim().length >= 2 },
    { campo: 'estilo', rotulo: 'Seu estilo', soComConta: false,
      serve: 'vira a tag que faz a sua nota significar alguma coisa pra quem lê',
      pronto: Boolean(p.estilo) },
    { campo: 'nivel', rotulo: 'Seu nível', soComConta: false,
      serve: 'preenche sozinho o formulário toda vez que você for avaliar',
      pronto: Boolean(p.nivel) },
    { campo: 'equipamento', rotulo: 'Sua raquete', soComConta: false,
      serve: 'é o retrato do perfil, e o que deixa outro comparar o dele com o seu',
      pronto: temEquipamento(p) },

    { campo: 'jogaDesde', rotulo: 'Desde quando você joga', soComConta: true,
      serve: 'vira "N anos de raquete" — o contexto de tudo o que você escreve',
      pronto: Boolean(p.jogaDesde) },
    { campo: 'frequencia', rotulo: 'Quanto você joga', soComConta: true,
      serve: 'diz quanto peso dar quando você falar que uma borracha durou pouco',
      pronto: Boolean(p.frequencia) },
    { campo: 'mao', rotulo: 'Mão e empunhadura', soComConta: true,
      serve: 'muda a recomendação inteira — caneta e clássica não pedem a mesma borracha',
      pronto: Boolean(p.mao) },
    { campo: 'clube', rotulo: 'Onde você joga', soComConta: true,
      serve: 'é o único campo do perfil que liga você a outra pessoa de verdade',
      pronto: Boolean(p.clube?.trim() || p.cidade?.trim()) },
    { campo: 'bola', rotulo: 'A bola que você usa', soComConta: true,
      serve: 'detalhe que só mesatenista pergunta, e que muda o toque',
      pronto: Boolean(p.bola?.trim()) },
    { campo: 'procuro', rotulo: 'O que você procura agora', soComConta: true,
      serve: 'é a sua frase, com as suas palavras, no alto do seu perfil',
      pronto: Boolean(p.procuro?.trim()) },
  ];

  return tudo
    .filter((i) => !i.pronto && (temConta || !i.soComConta))
    .map(({ pronto: _pronto, ...resto }) => resto);
}

export interface RepositorioPerfil {
  readonly somenteLocal: boolean;
  ler(): Promise<Perfil>;
  gravar(p: Perfil): Promise<void>;
  limpar(): Promise<void>;
}

const CHAVE = 'wikipong:perfil:v1';

export function repositorioPerfilLocal(): RepositorioPerfil {
  return {
    somenteLocal: true,
    async ler() {
      if (typeof localStorage === 'undefined') return perfilVazio();
      try {
        const cru = localStorage.getItem(CHAVE);
        if (!cru) return perfilVazio();
        /* Mescla com o vazio pra que um perfil gravado por uma versão anterior,
           sem algum campo, não chegue na UI com `equipamento` indefinido. */
        return { ...perfilVazio(), ...(JSON.parse(cru) as Partial<Perfil>) } as Perfil;
      } catch {
        return perfilVazio();
      }
    },
    async gravar(p) {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.setItem(
          CHAVE,
          JSON.stringify({ ...p, atualizadoEm: new Date().toISOString() }),
        );
      } catch {
        /* Quota estourada não pode virar tela branca. */
      }
    },
    async limpar() {
      if (typeof localStorage === 'undefined') return;
      try {
        localStorage.removeItem(CHAVE);
      } catch {
        /* idem */
      }
    },
  };
}

/**
 * Traduz a recusa do PostgREST ao gravar o perfil.
 *
 * O PRIMEIRO CASO É O QUE MAIS VAI ACONTECER, e é por isso que ele tem frase
 * própria: coluna nova no código e migração não rodada no banco. O PostgREST
 * responde `PGRST204` / "Could not find the 'x' column", que não diz a nenhum
 * humano o que fazer — e o sintoma na tela seria o pior possível: um formulário
 * que aceita tudo e não guarda nada.
 *
 * Função pura o bastante pra ser testada: recebe status e corpo já lidos.
 */
export function porQueNaoGravouPerfil(status: number, codigo: string, mensagem: string): string {
  const tudo = `${codigo} ${mensagem}`;
  if (/PGRST204/i.test(tudo) || /could not find the .* column|does not exist/i.test(tudo)) {
    return (
      'O banco ainda não tem uma das colunas deste formulário. Falta rodar a migração mais ' +
      'recente em supabase/ — enquanto isso, nada aqui está sendo guardado.'
    );
  }
  if (status === 401 || status === 403 || /row-level security|permission denied/i.test(tudo)) {
    return 'O servidor recusou a gravação. Sua sessão pode ter expirado — entre de novo.';
  }
  if (/violates check constraint|23514/i.test(tudo)) {
    return 'Um dos valores não foi aceito pelo banco. Confira o ano e os campos de texto mais longos.';
  }
  return `Não consegui guardar (erro ${status}). O que você digitou continua na tela.`;
}

async function porQueNaoGravou(res: Response): Promise<string> {
  let codigo = '';
  let mensagem = '';
  try {
    const d = (await res.json()) as { code?: string; message?: string; details?: string };
    codigo = d.code ?? '';
    mensagem = `${d.message ?? ''} ${d.details ?? ''}`;
  } catch {
    /* Sem corpo legível: sobra o status. */
  }
  return porQueNaoGravouPerfil(res.status, codigo, mensagem);
}

/**
 * Perfil no Supabase — só existe pra quem entrou.
 *
 * A tabela `perfis` tem `usuario_id` como chave, referenciando `auth.users`:
 * perfil sem conta não tem dono, e qualquer um poderia sobrescrever o de
 * qualquer um. Por isso, deslogado, quem responde é sempre o local.
 *
 * O que se ganha ao entrar: o perfil te acompanha em qualquer aparelho, e o
 * estilo que você escolheu uma vez passa a assinar todas as suas avaliações
 * sozinho.
 */
export function repositorioPerfilSupabase(
  url: string,
  chave: string,
  token: string,
  usuarioId: string,
): RepositorioPerfil {
  const base = `${url.replace(/\/$/, '')}/rest/v1/perfis`;
  const cabecalhos = {
    apikey: chave,
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  type Linha = {
    nome: string; estilo: string | null; nivel: string | null;
    apelido: string | null; mao: string | null; empunhadura: string | null;
    cidade: string | null; uf: string | null; procuro: string | null;
    joga_desde: number | null; frequencia: string | null;
    clube: string | null; bola: string | null;
    equip_lamina: string | null; equip_fh: string | null; equip_bh: string | null;
    atualizado_em: string;
  };

  return {
    somenteLocal: false,
    async ler() {
      try {
        const res = await fetch(
          `${base}?usuario_id=eq.${encodeURIComponent(usuarioId)}&select=*`,
          { headers: cabecalhos },
        );
        if (!res.ok) return perfilVazio();
        const linhas = (await res.json()) as Linha[];
        const l = linhas[0];
        if (!l) return perfilVazio();
        return {
          nome: l.nome,
          estilo: (l.estilo ?? undefined) as Perfil['estilo'],
          nivel: (l.nivel ?? undefined) as Perfil['nivel'],
          apelido: l.apelido ?? undefined,
          mao: (l.mao ?? undefined) as Perfil['mao'],
          empunhadura: (l.empunhadura ?? undefined) as Perfil['empunhadura'],
          cidade: l.cidade ?? undefined,
          uf: l.uf ?? undefined,
          procuro: l.procuro ?? undefined,
          jogaDesde: l.joga_desde ?? undefined,
          frequencia: (l.frequencia ?? undefined) as Perfil['frequencia'],
          clube: l.clube ?? undefined,
          bola: l.bola ?? undefined,
          equipamento: {
            lamina: l.equip_lamina ?? undefined,
            fh: l.equip_fh ?? undefined,
            bh: l.equip_bh ?? undefined,
          },
          atualizadoEm: l.atualizado_em,
        };
      } catch {
        /* Sem rede: melhor um perfil vazio que uma tela quebrada. */
        return perfilVazio();
      }
    },
    async gravar(p) {
      /* Upsert: a pessoa tem UM perfil, e salvar de novo é atualizar o mesmo.
         `resolution=merge-duplicates` é o que faz o PostgREST tratar o conflito
         de chave como update em vez de erro.
         ESTA FUNÇÃO LANÇA QUANDO FALHA, e isso é novo. Antes ela terminava com
         `.catch(() => {})` e não olhava o status — então uma recusa do servidor
         (coluna que não existe porque a migração não rodou, RLS negando,
         constraint violada) sumia sem deixar rastro: a tela continuava mostrando
         o que a pessoa digitou, e nada tinha sido guardado. As boas-vindas já
         chamavam isto dentro de try/catch esperando esse comportamento. */
      const res = await fetch(base, {
        method: 'POST',
        headers: { ...cabecalhos, Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify({
          usuario_id: usuarioId,
          nome: p.nome.trim(),
          estilo: p.estilo ?? null,
          nivel: p.nivel ?? null,
          apelido: p.apelido ?? apelidoDe(p.nome, usuarioId),
          mao: p.mao ?? null,
          empunhadura: p.empunhadura ?? null,
          cidade: p.cidade?.trim() || null,
          uf: p.uf?.trim().toUpperCase() || null,
          procuro: p.procuro?.trim() || null,
          joga_desde: p.jogaDesde ?? null,
          frequencia: p.frequencia ?? null,
          clube: p.clube?.trim() || null,
          bola: p.bola?.trim() || null,
          equip_lamina: p.equipamento.lamina ?? null,
          equip_fh: p.equipamento.fh ?? null,
          equip_bh: p.equipamento.bh ?? null,
          atualizado_em: new Date().toISOString(),
        }),
      }).catch(() => null);

      if (!res) {
        throw new Error('Sem conexão agora. O que você digitou continua na tela.');
      }
      if (!res.ok) throw new Error(await porQueNaoGravou(res));
    },
    async limpar() {
      await fetch(`${base}?usuario_id=eq.${encodeURIComponent(usuarioId)}`, {
        method: 'DELETE',
        headers: cabecalhos,
      }).catch(() => {});
    },
  };
}

/**
 * Ponto único de troca. Assíncrono porque descobrir QUEM está logado exige
 * perguntar ao servidor — e sem saber quem é, não há perfil remoto possível.
 *
 * Cai no local em três casos, todos legítimos: sem Supabase configurado, sem
 * ninguém logado, ou sessão expirada.
 */
export async function repositorioPerfilAtual(): Promise<RepositorioPerfil> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return repositorioPerfilLocal();

  const s = await sessaoAtual();
  if (!s) return repositorioPerfilLocal();

  const u = await usuarioAtual(s);
  if (!u) return repositorioPerfilLocal();

  return repositorioPerfilSupabase(url, chave, s.accessToken, u.id);
}

/** Versão síncrona, para quem só precisa do local (testes, primeira pintura). */
export const repositorioPerfil = (): RepositorioPerfil => repositorioPerfilLocal();
