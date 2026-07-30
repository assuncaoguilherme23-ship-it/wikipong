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
import type { EstiloJogador, NivelJogador } from './avaliacoes.js';

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
}

export interface Topico extends Mensagem {
  titulo: string;
  assunto: Assunto;
  /** Opcional: amarra a discussão a uma ficha do catálogo. */
  materialId?: string;
  respostas: Mensagem[];
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

export interface RepositorioDiscussoes {
  readonly somenteLocal: boolean;
  listar(): Promise<Topico[]>;
  gravar(t: Topico): Promise<void>;
  responder(topicoId: string, m: Mensagem): Promise<void>;
}

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
  };
}

export const repositorioDiscussoes = (): RepositorioDiscussoes => repositorioDiscussoesLocal();
