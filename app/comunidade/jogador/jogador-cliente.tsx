/**
 * WikiPong · A tela pública do jogador
 * ------------------------------------------------------------------------------
 * Só leitura. Quem edita é a `/comunidade/perfil/`; esta aqui é o que os outros
 * veem, e é ela que faz o crachá daquela tela deixar de ser promessa.
 *
 * DUAS REGRAS QUE NÃO PODEM ESCAPAR DAQUI:
 *
 * 1. O motivo da estante passa SEMPRE por `motivoVisivel`, nunca por `.motivo`
 *    direto. É essa função que aplica o D-14: prosa espera gente, e o dono vê
 *    o próprio texto mesmo pendente.
 * 2. Bloco sem dado DESAPARECE inteiro, em vez de dizer "nenhum item". Perfil
 *    novo mostra o pouco que tem, não uma lista das próprias ausências.
 *
 * Falha de rede não vira tela branca: o que carregou fica, o que falhou some.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { materialPorId } from '@/componentes/dados-materiais';
import { MARCAS } from '@/componentes/dados-marcas';
import { slug } from '@/src/logica/filtros';
import { nomeComMarca } from '@/componentes/formato';
import { usarSessao } from '@/componentes/usarSessao';
import { repositorio } from '@/src/logica/repositorio-avaliacoes';
import { repositorioDiscussoes, resolveuQuantas } from '@/src/logica/discussoes';
import {
  repositorioEstante, ordenarEstante, motivoVisivel, emUsoHoje,
  type EntradaDeEstante,
} from '@/src/logica/estante';
import { linhaDoTempo, ROTULO_ATIVIDADE, type Atividade } from '@/src/logica/atividade';
import { procedenciaDe, type ProcedenciaDoAvaliador } from '@/src/logica/procedencia-do-avaliador';
import { retratoDoJogador } from '@/src/logica/retrato-do-jogador';
import type { Avaliacao } from '@/src/logica/avaliacoes';
import { tracosDoPerfil, contextoDoPerfil, type Perfil } from '@/src/logica/perfil';
import { CartaoMesaJogador } from '@/componentes/CartaoMesaJogador';
import estilos from './jogador.module.css';

/** O catálogo mora na UI; os módulos puros são quem recebe os resolvedores. */
const marcaDe = (id: string): string | undefined => materialPorId(id)?.marca;

const nomeDoMaterial = (id: string): string | undefined => {
  const m = materialPorId(id);
  return m ? nomeComMarca(m.marca, m.nome) : undefined;
};

/** O que a tela precisa do perfil, mais o dono — que não está no tipo `Perfil`. */
type PerfilPublico = Perfil & { usuarioId: string };

const ano = (iso?: string) => (iso ? iso.slice(0, 4) : null);

/** "2023 – 2024", "desde 2024", ou nada quando a pessoa não disse. */
function periodo(e: EntradaDeEstante): string | null {
  const de = ano(e.de);
  const ate = ano(e.ate);
  if (de && ate) return `${de} – ${ate}`;
  if (de && emUsoHoje(e)) return `desde ${de}`;
  if (ate) return `até ${ate}`;
  return null;
}

async function buscarPerfil(apelido: string): Promise<PerfilPublico | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chave) return null;

  const res = await fetch(
    `${url.replace(/\/$/, '')}/rest/v1/perfis?apelido=eq.${encodeURIComponent(apelido)}&select=*`,
    { headers: { apikey: chave, Authorization: `Bearer ${chave}` } },
  );
  if (!res.ok) throw new Error(`Supabase respondeu ${res.status}`);
  const linhas = (await res.json()) as Record<string, string | null>[];
  const l = linhas[0];
  if (!l) return null;

  return {
    usuarioId: l.usuario_id as string,
    nome: l.nome as string,
    apelido: l.apelido ?? undefined,
    estilo: (l.estilo ?? undefined) as Perfil['estilo'],
    nivel: (l.nivel ?? undefined) as Perfil['nivel'],
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
    atualizadoEm: (l.atualizado_em as string) ?? new Date().toISOString(),
  };
}

export function JogadorCliente() {
  const apelido = useSearchParams().get('p') ?? '';
  const { usuario } = usarSessao();

  const [perfil, setPerfil] = useState<PerfilPublico | null | undefined>(undefined);
  const [estante, setEstante] = useState<EntradaDeEstante[]>([]);
  const [atividade, setAtividade] = useState<Atividade[]>([]);
  const [procedencia, setProcedencia] = useState<ProcedenciaDoAvaliador | null>(null);
  const [resolveu, setResolveu] = useState(0);
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([]);

  const repoEstante = useMemo(() => repositorioEstante(), []);
  /* Lido uma vez, na montagem: `retratoDoJogador` é puro e recebe o ano. */
  const anoAtual = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    if (!apelido) { setPerfil(null); return; }
    let vivo = true;
    buscarPerfil(apelido)
      .then((p) => { if (vivo) setPerfil(p); })
      .catch(() => { if (vivo) setPerfil(null); });
    return () => { vivo = false; };
  }, [apelido]);

  useEffect(() => {
    if (!perfil) return;
    let vivo = true;
    const dono = perfil.usuarioId;

    /* Cada bloco falha sozinho: rede ruim tira uma seção, não a página. */
    repoEstante.listar(dono)
      .then((es) => { if (vivo) setEstante(es); })
      .catch(() => { if (vivo) setEstante([]); });

    repositorio().listar()
      .then((avs) => {
        if (!vivo) return;
        const minhas = avs.filter((a) => a.usuarioId === dono);
        setProcedencia(minhas.length > 0 ? procedenciaDe(minhas) : null);
        setAvaliacoes(minhas);
        return minhas;
      })
      .then(async (minhas) => {
        const topicos = await repositorioDiscussoes().listar();
        if (!vivo) return;
        const respostas = topicos.flatMap((t) =>
          t.respostas.map((r) => ({ ...r, topicoId: t.id })));
        setAtividade(linhaDoTempo(minhas ?? [], topicos, respostas, dono, nomeDoMaterial));
        setResolveu(resolveuQuantas(topicos, dono));
      })
      .catch(() => { if (vivo) { setAtividade([]); setResolveu(0); setAvaliacoes([]); } });

    return () => { vivo = false; };
  }, [perfil, repoEstante]);

  /* Esqueleto, não "Carregando…": a página busca quatro coisas de fontes
     diferentes, e uma linha de texto some sem avisar que algo grande vem aí.
     O esqueleto tem a forma do que vai chegar, então nada salta de lugar
     quando chega (o CLS de graça). */
  if (perfil === undefined) {
    return (
      <div className={estilos.esqueleto} aria-busy="true" aria-label="Carregando o perfil">
        <div className={estilos.esqueletoMesa}>
          <span className={estilos.barra} style={{ width: '11rem', height: '2.2rem' }} />
          <span className={estilos.barra} style={{ width: '17rem' }} />
          <div className={estilos.esqueletoPecas}>
            <span className={estilos.esqueletoPeca} />
            <span className={estilos.esqueletoPeca} />
            <span className={estilos.esqueletoPeca} />
          </div>
        </div>
        <span className={estilos.barra} style={{ width: '8rem' }} />
        <span className={estilos.barra} style={{ width: '22rem' }} />
      </div>
    );
  }

  if (perfil === null) {
    return (
      <div className={estilos.vazio}>
        <h1 className={estilos.tituloVazio}>Esse jogador não existe</h1>
        <p className={estilos.vazioTexto}>
          O endereço pode estar errado, ou o perfil pode ter sido apagado. Perfis só existem
          depois que a pessoa escolhe um nome — quem entrou e ainda não preencheu nada não
          tem página.
        </p>
        <Link href="/comunidade/" className="botao-secundario">
          Voltar para a comunidade
        </Link>
      </div>
    );
  }

  const souODono = usuario?.id === perfil.usuarioId;
  const naEstante = ordenarEstante(estante);

  /* As duas linhas do cartão vêm do módulo puro, e não daqui: a tela de editar
     mostra exatamente as mesmas, e enquanto cada página montava a sua, "é assim
     que você aparece" dependia de ninguém mexer numa das duas. */
  const retrato = retratoDoJogador({
    jogaDesde: perfil.jogaDesde,
    anoAtual,
    avaliacoes,
    estante,
    equipamento: perfil.equipamento,
    marcaDe,
  });
  const companheiro = retrato.companheiroMaisAntigo
    ? materialPorId(retrato.companheiroMaisAntigo.materialId)
    : undefined;

  /* Um array só, em vez de JSX aninhado com fragmentos condicionais. A tira de
     fatos precisa saber QUANTOS fatos tem pra se distribuir, e antes ela não
     sabia — a contagem estava espalhada em três condicionais. */
  const fatos: { valor: string; rotulo: string }[] = [];
  if (procedencia) {
    const { quantas, materiaisDistintos, borrachas, laminas, faixaTipica } = procedencia;
    fatos.push({
      valor: String(quantas),
      rotulo: quantas === 1 ? 'avaliação escrita' : 'avaliações escritas',
    });
    fatos.push({
      valor: String(materiaisDistintos),
      /* O singular não é firula: com um material só, a tela dizia "1 materiais
         diferentes" — e um erro de concordância na primeira linha de números
         faz duvidar dos números. */
      rotulo:
        borrachas > 0 && laminas > 0
          ? `materiais — ${borrachas} borracha${borrachas > 1 ? 's' : ''}, ${laminas} lâmina${laminas > 1 ? 's' : ''}`
          : materiaisDistintos === 1
            ? 'material diferente'
            : 'materiais diferentes',
    });
    if (faixaTipica) {
      fatos.push({ valor: faixaTipica, rotulo: 'de uso, tipicamente, antes de avaliar' });
    }
  }
  if (resolveu > 0) {
    fatos.push({
      valor: String(resolveu),
      rotulo: resolveu === 1 ? 'dúvida que resolveu' : 'dúvidas que resolveu',
    });
  }
  /* Derivado, não perguntado: diz se a pessoa é generosa ou dura com nota — que
     é exatamente o que falta pra saber quanto pesa um "4" dela. Só sai com
     amostra suficiente; o módulo puro cuida do piso. */
  if (retrato.notaQueCostumaDar !== undefined) {
    fatos.push({
      valor: retrato.notaQueCostumaDar.toFixed(1).replace('.', ','),
      rotulo: 'é a nota que costuma dar',
    });
  }

  /* O perfil recém-nascido — nome e estilo, nada mais. É o PRIMEIRO estado que
     alguém vê do próprio espaço, saindo das boas-vindas, e era o menos
     desenhado: sobrava um nome solto no meio da página.
     Só pro dono. Anunciar o vazio do perfil alheio não serve a ninguém. */
  const aindaVazio =
    fatos.length === 0 && naEstante.length === 0 && atividade.length === 0;

  return (
    <article className={estilos.perfil}>
      {/* ── O cartão mesa ──
          A Regra da Mesa: a cor da identidade carrega superfícies inteiras. Aqui
          ela carrega a IDENTIDADE DE ALGUÉM — que é o pedido do fundador (um
          espaço, não uma ficha). Antes, a página começava com um h1 sobre papel,
          igualzinho a todas as outras do site: nada dizia "você chegou na casa
          de alguém".
          A raquete entra AQUI dentro, e não como seção separada logo abaixo:
          num site de equipamento, a raquete é parte de quem a pessoa é. Separar
          as duas era o que fazia isto parecer um registro de banco de dados. */}
      <CartaoMesaJogador
        nome={perfil.nome}
        tracos={tracosDoPerfil(perfil)}
        contexto={contextoDoPerfil(perfil, anoAtual)}
        procuro={perfil.procuro}
        equipamento={perfil.equipamento}
        rodape={
          souODono ? (
            <>
              <span>Este é o seu perfil, como os outros veem.</span>
              <Link href="/comunidade/perfil/">Editar</Link>
            </>
          ) : undefined
        }
      />

      {souODono && aindaVazio && (
        <section className={estilos.comecando} aria-labelledby="t-comecando">
          <h2 id="t-comecando" className={estilos.tituloSecao}>
            Seu espaço está começando
          </h2>
          <p className={estilos.explica}>
            Daqui pra frente ele cresce sozinho: cada material que você marcar como já usado,
            cada avaliação que escrever e cada dúvida que resolver aparece nesta página. Não há
            nada a preencher aqui — só a usar o site.
          </p>
          <div className={estilos.comecandoAcoes}>
            <Link href="/comunidade/perfil/" className="botao-primario">
              Montar a estante
            </Link>
            <Link href="/catalogo/" className="botao-secundario">
              Achar um material que você usa
            </Link>
          </div>
        </section>
      )}

      {/* Os números, sem selo. Quem lê julga — é a Regra da Voz de Dados
          aplicada a gente em vez de a material.
          Tira horizontal, e não grade de cartões: quatro caixas iguais com um
          número grande dentro é o hero-metric que o PRODUCT.md aposentou. Aqui
          os fatos correm numa linha, separados por fio, como legenda de tabela. */}
      {fatos.length > 0 && (
        <section className={estilos.secao} aria-labelledby="t-numeros">
          <h2 id="t-numeros" className={estilos.tituloSecao}>Na comunidade</h2>
          <ul className={estilos.fatos}>
            {fatos.map((f) => (
              <li key={f.rotulo} className={estilos.fato}>
                <span className={`mono ${estilos.numero}`}>{f.valor}</span>
                <span className={estilos.numeroRotulo}>{f.rotulo}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Derivado, não perguntado ──
             Ninguém digitou nada disto: sai da estante, da raquete e das
             avaliações que a pessoa já tinha. É o que faz o perfil ficar
             detalhado sem o formulário ficar maior. */}
      {(retrato.marcas.length > 0 || companheiro) && (
        <section className={estilos.secao} aria-labelledby="t-passou">
          <h2 id="t-passou" className={estilos.tituloSecao}>O que já passou pela mão</h2>

          {companheiro && retrato.companheiroMaisAntigo && (
            <p className={estilos.companheiro}>
              Está com a{' '}
              <Link href={`/materiais/${companheiro.id}/`}>
                {nomeComMarca(companheiro.marca, companheiro.nome)}
              </Link>{' '}
              desde{' '}
              <span className="mono">{retrato.companheiroMaisAntigo.desde}</span> — é a peça
              que ficou mais tempo na raquete.
            </p>
          )}

          {retrato.marcas.length > 0 && (
            <>
              <ul className={estilos.marcas}>
                {retrato.marcas.map((m) => {
                  const s = slug(m);
                  /* Só vira link se a página existir de verdade: marca sem
                     página viraria link morto, que o D-16 proíbe. */
                  return MARCAS.some((x) => x.slug === s) ? (
                    <li key={m}>
                      <Link href={`/marcas/${s}/`} className={estilos.marca}>{m}</Link>
                    </li>
                  ) : (
                    <li key={m}><span className={estilos.marca}>{m}</span></li>
                  );
                })}
              </ul>
              <p className={estilos.notaSecao}>
                {retrato.marcas.length === 1
                  ? 'A única marca que aparece na estante, na raquete ou nas avaliações.'
                  : `${retrato.marcas.length} marcas entre a estante, a raquete e as avaliações.`}
              </p>
            </>
          )}
        </section>
      )}

      {naEstante.length > 0 && (
        <section className={estilos.secao} aria-labelledby="t-estante">
          <h2 id="t-estante" className={estilos.tituloSecao}>Já usou</h2>
          <ul className={estilos.estante}>
            {naEstante.map((e) => {
              const m = materialPorId(e.materialId);
              if (!m) return null;
              /* SEMPRE por aqui. Ler `e.motivo` direto vazaria texto pendente. */
              const motivo = motivoVisivel(e, souODono);
              const quando = periodo(e);
              return (
                <li key={e.id} className={estilos.entrada}>
                  <div className={estilos.entradaTopo}>
                    <Link href={`/materiais/${m.id}/`}>{nomeComMarca(m.marca, m.nome)}</Link>
                    {quando && <span className={`mono ${estilos.periodo}`}>{quando}</span>}
                    {emUsoHoje(e) && <span className={estilos.emUso}>em uso</span>}
                  </div>
                  {motivo && (
                    <p className={estilos.motivo}>
                      {motivo}
                      {souODono && e.motivoStatus === 'pendente' && (
                        <span className={`mono ${estilos.esperando}`}> · esperando revisão</span>
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {atividade.length > 0 && (
        <section className={estilos.secao} aria-labelledby="t-atividade">
          <h2 id="t-atividade" className={estilos.tituloSecao}>O que já escreveu</h2>
          <ul className={estilos.atividade}>
            {atividade.slice(0, 20).map((a) => (
              <li key={`${a.tipo}-${a.id}`} className={estilos.item}>
                <span className={`mono ${estilos.acao}`}>{ROTULO_ATIVIDADE[a.tipo]}</span>
                <Link href={a.para} className={estilos.itemTexto}>{a.titulo}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
