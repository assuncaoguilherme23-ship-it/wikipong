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
import type { Avaliacao } from './avaliacoes.js';

export interface RepositorioAvaliacoes {
  /** Nome curto pra UI dizer a verdade sobre onde isto está indo. */
  readonly rotulo: string;
  /** true quando o que se escreve some do alcance de outras pessoas. */
  readonly somenteLocal: boolean;
  listar(): Promise<Avaliacao[]>;
  doMaterial(materialId: string): Promise<Avaliacao[]>;
  gravar(nova: Avaliacao): Promise<void>;
  remover(id: string): Promise<void>;
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
  };
}

/**
 * O ponto único de troca. Quando o projeto do Supabase existir, isto vira:
 *
 *   return process.env.NEXT_PUBLIC_SUPABASE_URL
 *     ? repositorioSupabase()
 *     : repositorioLocal();
 *
 * e mais nada no site precisa mudar. O schema do D-11 já está espelhado no tipo
 * `Avaliacao`, campo a campo, justamente pra que a migração seja um CREATE TABLE.
 */
export const repositorio = (): RepositorioAvaliacoes => repositorioLocal();

/** Id sem depender de crypto.randomUUID, que falta em navegador antigo. */
export const novoId = (): string =>
  `av_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
