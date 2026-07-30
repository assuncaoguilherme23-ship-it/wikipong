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
import type { EstiloJogador, NivelJogador } from './avaliacoes.js';

export interface Perfil {
  nome: string;
  estilo?: EstiloJogador;
  nivel?: NivelJogador;
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

/** Ponto único de troca, igual ao das avaliações. */
export const repositorioPerfil = (): RepositorioPerfil => repositorioPerfilLocal();
