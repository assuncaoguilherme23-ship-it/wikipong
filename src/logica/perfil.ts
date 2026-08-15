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
import type { EstiloJogador, NivelJogador } from './avaliacoes';
import { apelidoDe } from './apelido';
import { sessaoAtual, usuarioAtual } from './sessao';

/* Tabelas de lookup: um lugar só, para poderem ser revistas sem caçar string
   espalhada pela UI. Os valores batem com o check da migração 014. */
export type Mao = 'destro' | 'canhoto';
export type Empunhadura = 'classica' | 'caneta-chinesa' | 'caneta-japonesa';

export const MAOS: readonly Mao[] = ['destro', 'canhoto'];
export const EMPUNHADURAS: readonly Empunhadura[] = ['classica', 'caneta-chinesa', 'caneta-japonesa'];

export const ROTULO_MAO: Readonly<Record<Mao, string>> = {
  destro: 'Destro',
  canhoto: 'Canhoto',
};

export const ROTULO_EMPUNHADURA: Readonly<Record<Empunhadura, string>> = {
  classica: 'Clássica',
  'caneta-chinesa': 'Caneta chinesa',
  'caneta-japonesa': 'Caneta japonesa',
};

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
         de chave como update em vez de erro. */
      await fetch(base, {
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
          equip_lamina: p.equipamento.lamina ?? null,
          equip_fh: p.equipamento.fh ?? null,
          equip_bh: p.equipamento.bh ?? null,
          atualizado_em: new Date().toISOString(),
        }),
      }).catch(() => {
        /* Falha de rede não pode derrubar a tela enquanto se digita. */
      });
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
