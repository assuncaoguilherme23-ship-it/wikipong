/**
 * WikiPong · Moderação (D-11, fila de aprovação)
 * ------------------------------------------------------------------------------
 * A tela que faltava: sem ela, tudo que chega fica invisível esperando alguém
 * mexer no banco na mão.
 *
 * O QUE ELA HONESTAMENTE NÃO FAZ, e por quê:
 *
 * Com o Supabase ligado, esta tela NÃO consegue ver o que está pendente. Não é
 * bug e não tem conserto por aqui: a política de leitura só devolve o que está
 * 'aprovado', e a chave que o site carrega é a ANÔNIMA, visível no bundle pra
 * qualquer um que abrir o DevTools. Uma tela que moderasse com essa chave seria
 * uma tela em que qualquer visitante aprova e apaga o que quiser.
 *
 * Moderar de verdade exige saber QUEM está moderando, e isso exige login. Até
 * lá, a tela diz isso e manda pro painel do Supabase — em vez de fingir que
 * funciona e deixar a fila crescer sem ninguém ver.
 *
 * Localmente ela funciona por inteiro, porque ali o dono do navegador é o único
 * que tem acesso ao que está guardado.
 */
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ordenar, type Avaliacao } from '@/src/logica/avaliacoes';
import { repositorio } from '@/src/logica/repositorio-avaliacoes';
import { Login } from '@/componentes/Login';
import { sessaoAtual, souAdmin, sair, type Sessao } from '@/src/logica/sessao';
import { materialPorId } from '@/componentes/dados-materiais';
import { Estrelas } from '@/componentes/Estrelas';
import { TagEstilo, TagNivel } from '@/componentes/TagEstilo';
import {
  repositorioPedidos, ordenarPedidos, type PedidoDePauta,
} from '@/src/logica/pedidos-pauta';
import {
  repositorioDiscussoes, ordenarTopicos, type Topico, type StatusTopico,
} from '@/src/logica/discussoes';
import { PainelPedidos } from './PainelPedidos';
import { PainelDiscussoes } from './PainelDiscussoes';
import { PainelNoticias } from './PainelNoticias';
import {
  repositorioNoticias, ordenarNoticias, esperando as noticiasEsperando,
  type NoticiaRecebida,
} from '@/src/logica/noticias-fila';
import { PainelEstante } from './PainelEstante';
import { repositorioModeracaoEstante, type MotivoParaModerar } from '@/src/logica/estante';
import estilos from './moderacao.module.css';

type Aba = 'avaliacoes' | 'discussoes' | 'pedidos' | 'noticias' | 'estante';

const ROTULO_STATUS: Record<Avaliacao['status'], string> = {
  pendente: 'esperando',
  aprovado: 'no ar',
  removido: 'removida',
};

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function ModeracaoCliente() {
  const repo = useMemo(() => repositorio(), []);
  const [lista, setLista] = useState<Avaliacao[] | null>(null);
  const [filtro, setFiltro] = useState<Avaliacao['status'] | 'todas'>('todas');

  /* Quatro estados de acesso, e a tela precisa distinguir os quatro:
       local          — modera tudo, você é o dono do navegador;
       sem sessão     — mostra o login;
       logado não-admin — entrou, mas o banco não reconhece como moderador;
       admin          — modera de verdade.
     `undefined` é "ainda perguntando", pra não piscar a tela de login pra quem
     já está logado. */
  const [sessao, setSessao] = useState<Sessao | null | undefined>(undefined);
  const [admin, setAdmin] = useState<boolean | undefined>(undefined);

  /* Os pedidos de pauta vivem AQUI, e não dentro do painel: é esta tela que põe
     a contagem no rótulo da aba, e uma lista carregada nos dois lugares daria
     duas contagens que podem discordar. */
  const repoPedidos = useMemo(() => repositorioPedidos(), []);
  const [aba, setAba] = useState<Aba>('avaliacoes');
  const [pedidos, setPedidos] = useState<PedidoDePauta[] | null>(null);
  const [erroPedidos, setErroPedidos] = useState<string | null>(null);

  const recarregarPedidos = useCallback(
    () =>
      repoPedidos
        .listar()
        .then((ps) => {
          setPedidos(ordenarPedidos(ps, 'recentes'));
          setErroPedidos(null);
        })
        .catch(() => {
          setPedidos([]);
          setErroPedidos(
            'Não consegui ler os pedidos. Se a migração 009 ainda não rodou, a tabela não existe.',
          );
        }),
    [repoPedidos],
  );

  async function agirNoPedido(acao: () => Promise<void>) {
    try {
      await acao();
      await recarregarPedidos();
    } catch {
      setErroPedidos('O banco recusou a mudança. Confira se esta conta está na tabela admins.');
    }
  }

  const repoNoticias = useMemo(() => repositorioNoticias(), []);
  const [noticias, setNoticias] = useState<NoticiaRecebida[] | null>(null);
  const [erroNoticias, setErroNoticias] = useState<string | null>(null);

  const recarregarNoticias = useCallback(
    () => repoNoticias.listar()
      .then((ns) => { setNoticias(ordenarNoticias(ns)); setErroNoticias(null); })
      .catch(() => {
        setNoticias([]);
        setErroNoticias('Não consegui ler a fila de notícias. Se a migração 012 ainda não rodou, a tabela não existe.');
      }),
    [repoNoticias],
  );

  async function agirNaNoticia(acao: () => Promise<void>) {
    try { await acao(); await recarregarNoticias(); }
    catch (e) {
      setErroNoticias(e instanceof Error && /resumo/.test(e.message)
        ? e.message
        : 'O banco recusou a mudança. Confira se esta conta está na tabela admins.');
    }
  }

  const repoEstante = useMemo(() => repositorioModeracaoEstante(), []);
  const [motivosEstante, setMotivosEstante] = useState<MotivoParaModerar[] | null>(null);
  const [erroEstante, setErroEstante] = useState<string | null>(null);

  const recarregarEstante = useCallback(
    () => repoEstante.listar()
      .then((ms) => { setMotivosEstante(ms); setErroEstante(null); })
      .catch(() => {
        setMotivosEstante([]);
        setErroEstante('Não consegui ler os motivos da estante. Se a migração 015 ainda não rodou, a tabela não existe.');
      }),
    [repoEstante],
  );

  async function agirNaEstante(acao: () => Promise<void>) {
    try { await acao(); await recarregarEstante(); }
    catch { setErroEstante('O banco recusou a mudança. Confira se esta conta está na tabela admins.'); }
  }

  const repoDiscussoes = useMemo(() => repositorioDiscussoes(), []);
  const [discussoes, setDiscussoes] = useState<Topico[] | null>(null);
  const [erroDiscussoes, setErroDiscussoes] = useState<string | null>(null);

  const recarregarDiscussoes = useCallback(
    () =>
      repoDiscussoes
        .listar()
        .then((ts) => {
          setDiscussoes(ordenarTopicos(ts, 'novos'));
          setErroDiscussoes(null);
        })
        .catch(() => {
          setDiscussoes([]);
          setErroDiscussoes('Não consegui ler as discussões.');
        }),
    [repoDiscussoes],
  );

  async function agirNaDiscussao(id: string, status: StatusTopico, alvo: 'topico' | 'resposta') {
    try {
      await repoDiscussoes.moderar(id, status, alvo);
      await recarregarDiscussoes();
    } catch {
      setErroDiscussoes('O banco recusou a mudança. Confira se esta conta está na tabela admins.');
    }
  }

  useEffect(() => {
    if (repo.somenteLocal) {
      setSessao(null);
      setAdmin(true);
      return;
    }
    sessaoAtual().then(async (s) => {
      setSessao(s);
      setAdmin(s ? await souAdmin(s) : false);
    });
  }, [repo]);

  useEffect(() => {
    if (admin !== true) return;
    repo.listar().then((todas) => setLista(ordenar(todas, 'recentes')));
    recarregarPedidos();
    recarregarDiscussoes();
    recarregarNoticias();
    recarregarEstante();
  }, [repo, admin, recarregarPedidos, recarregarDiscussoes, recarregarNoticias, recarregarEstante]);

  async function mudar(id: string, status: Avaliacao['status']) {
    await repo.moderar(id, status);
    setLista(ordenar(await repo.listar(), 'recentes'));
  }

  if (sessao === undefined || admin === undefined) {
    return <p className={estilos.carregando}>Verificando o acesso…</p>;
  }

  /* Sem sessão e com servidor ligado: não dá pra ver a fila com a chave anônima
     (a política só devolve 'aprovado'), então a tela pede o login em vez de
     mostrar uma lista vazia que pareceria "não há nada esperando". */
  if (!repo.somenteLocal && !sessao) {
    return (
      <Login
        titulo="Entrar para moderar"
        explicacao="A fila de aprovação só aparece pra quem o banco reconhece como moderador. É por isso que esta tela pede o e-mail antes de mostrar qualquer coisa."
      />
    );
  }

  if (!repo.somenteLocal && sessao && !admin) {
    return (
      <div className={estilos.impedida}>
        <p className={estilos.impedidaTitulo}>Você entrou, mas esta conta não modera.</p>
        <p>
          O banco é quem decide isso, não o site: só quem está na tabela{' '}
          <span className="mono">admins</span> enxerga a fila. Foi de propósito — se o navegador
          pudesse se declarar moderador, qualquer visitante aprovaria as próprias avaliações.
        </p>
        <p className={estilos.enquantoIsso}>
          <strong>Pra virar moderador:</strong> no SQL Editor do Supabase, rode{' '}
          <span className="mono">
            insert into public.admins (usuario_id) select id from auth.users where email =
            &apos;seu@email&apos;
          </span>{' '}
          e recarregue esta página. O passo a passo também está no fim de{' '}
          <span className="mono">supabase/002-login.sql</span>.
        </p>
        <button type="button" className={estilos.linkAcao} onClick={() => sair().then(() => location.reload())}>
          sair desta conta
        </button>
      </div>
    );
  }

  /* A barra de sessão sai daqui de propósito, e não de dentro do bloco de baixo:
     ela precisa aparecer TAMBÉM com a fila vazia. Antes ficava depois do retorno
     antecipado e sumia justo no momento em que é mais necessária — logo depois
     de entrar, quando a única pergunta na cabeça de quem chegou é "será que
     funcionou?". A fila vazia parecia falha de login. */
  const barra = sessao && (
    <p className={estilos.barraSessao}>
      moderando como <strong>{sessao.email ?? 'administrador'}</strong>
      <button
        type="button"
        className={estilos.linkAcao}
        onClick={() => sair().then(() => location.reload())}
      >
        sair
      </button>
    </p>
  );

  /* As abas ficam ACIMA de todo retorno antecipado. Se ficassem lá embaixo,
     bastaria a fila de avaliações estar vazia — que é o estado normal — para a
     aba de pedidos sumir da tela, e ela é justamente a que o fundador veio ver. */
  const esperandoPedidos = pedidos?.filter((p) => p.status === 'pendente').length ?? 0;
  /* Tópico e resposta somam no MESMO número: para quem modera, o que importa é
     "quantas decisões me esperam", não em qual tabela cada uma mora. */
  const esperandoDiscussoes =
    (discussoes ?? []).filter((t) => (t.status ?? 'aprovado') === 'pendente').length +
    (discussoes ?? []).flatMap((t) => t.respostas)
      .filter((r) => (r.status ?? 'aprovado') === 'pendente').length;
  const abas = (
    <div className={estilos.abas} role="tablist" aria-label="O que moderar">
      {([
        ['avaliacoes', 'Avaliações', lista?.filter((a) => a.status === 'pendente').length ?? 0],
        ['discussoes', 'Discussões', esperandoDiscussoes],
        ['pedidos', 'Pedidos de guia', esperandoPedidos],
        ['noticias', 'Notícias', noticiasEsperando(noticias ?? []).length],
        ['estante', 'Estante', (motivosEstante ?? []).filter((m) => m.status === 'pendente').length],
      ] as const).map(([id, rotulo, esperando]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={aba === id}
          className={`${estilos.aba} ${aba === id ? estilos.abaAtiva : ''}`}
          onClick={() => setAba(id)}
        >
          {rotulo}
          {esperando > 0 && <span className={`mono ${estilos.esperando}`}>{esperando}</span>}
        </button>
      ))}
    </div>
  );

  if (aba === 'discussoes') {
    return (
      <>
        {barra}
        {abas}
        <PainelDiscussoes
          topicos={discussoes}
          erro={erroDiscussoes}
          aoModerar={agirNaDiscussao}
        />
      </>
    );
  }

  if (aba === 'noticias') {
    return (
      <>
        {barra}
        {abas}
        <PainelNoticias
          noticias={noticias}
          erro={erroNoticias}
          semServidor={!repoNoticias.disponivel}
          /* Se ele mexeu no texto, a voz passa a ser da casa; se publicou a linha
             fina como veio, ela continua sendo da CBTM e a tela atribui. */
          aoAprovar={(id, resumo) => {
            const n = (noticias ?? []).find((x) => x.id === id);
            const mexeu = resumo.trim() !== (n?.resumo ?? '').trim();
            const origem = mexeu ? 'wikipong' : n?.origemResumo;
            return agirNaNoticia(() => repoNoticias.aprovar(id, resumo, undefined, origem));
          }}
          aoDescartar={(id) => agirNaNoticia(() => repoNoticias.descartar(id))}
          aoDevolver={(id) => agirNaNoticia(() => repoNoticias.devolver(id))}
        />
      </>
    );
  }

  if (aba === 'estante') {
    return (
      <>
        {barra}
        {abas}
        <PainelEstante
          motivos={motivosEstante}
          erro={erroEstante}
          semServidor={!repoEstante.disponivel}
          aoAprovar={(id) => agirNaEstante(() => repoEstante.moderar(id, 'aprovada'))}
          aoDescartar={(id) => agirNaEstante(() => repoEstante.moderar(id, 'descartada'))}
        />
      </>
    );
  }

  if (aba === 'pedidos') {
    return (
      <>
        {barra}
        {abas}
        <PainelPedidos
          pedidos={pedidos}
          erro={erroPedidos}
          aoModerar={(id, status) => agirNoPedido(() => repoPedidos.moderar(id, status))}
          aoAmarrarGuia={(id, slug) => agirNoPedido(() => repoPedidos.amarrarGuia(id, slug))}
        />
      </>
    );
  }

  if (lista === null) {
    return (
      <>
        {barra}
        {abas}
        <p className={estilos.carregando}>Carregando…</p>
      </>
    );
  }

  const visiveis = filtro === 'todas' ? lista : lista.filter((a) => a.status === filtro);
  const contar = (s: Avaliacao['status']) => lista.filter((a) => a.status === s).length;

  if (lista.length === 0) {
    return (
      <>
        {barra}
        {abas}
        <p className={estilos.vazio}>
          {repo.somenteLocal ? (
            <>Nada escrito neste navegador ainda. </>
          ) : (
            <>
              <strong>Fila vazia.</strong> Nenhuma avaliação esperando aprovação — e isso é
              notícia boa, não erro.{' '}
            </>
          )}
          <Link href="/catalogo/">Avaliar um material →</Link>
        </p>
      </>
    );
  }

  return (
    <>
      {barra}
      {abas}

      <div className={estilos.filtros} role="group" aria-label="Filtrar por situação">
        {(['todas', 'pendente', 'aprovado', 'removido'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`${estilos.chip} ${filtro === f ? estilos.chipAtivo : ''}`}
            aria-pressed={filtro === f}
            onClick={() => setFiltro(f)}
          >
            {f === 'todas' ? 'todas' : ROTULO_STATUS[f]}
            <span className={`mono ${estilos.contagem}`}>
              {f === 'todas' ? lista.length : contar(f)}
            </span>
          </button>
        ))}
      </div>

      {repo.somenteLocal && (
        <p className={estilos.nota}>
          Neste navegador a avaliação já entra publicada, porque aqui o segundo par de olhos é
          você mesmo. Por isso a fila de <strong>esperando</strong> nasce vazia. Com o servidor
          ligado é o contrário: tudo chega esperando. Pra ensaiar como vai ser, use{' '}
          <em>voltar pra fila</em> numa avaliação qualquer.
        </p>
      )}

      {visiveis.length === 0 ? (
        <p className={estilos.vazio}>Nenhuma avaliação nessa situação.</p>
      ) : (
        <ul className={estilos.lista}>
          {visiveis.map((a) => {
            const m = materialPorId(a.materialId);
            return (
              <li key={a.id} className={`${estilos.item} ${estilos[a.status]}`}>
                <div className={estilos.cabecalho}>
                  <div className={estilos.quem}>
                    <p className={estilos.autor}>{a.autor}</p>
                    <p className={estilos.tags}>
                      <TagEstilo estilo={a.estilo} comLink={false} />
                      <TagNivel nivel={a.nivel} />
                    </p>
                  </div>
                  <div className={estilos.direita}>
                    <Estrelas nota={a.nota} tamanho="sm" />
                    <span className={`mono ${estilos.situacao}`}>{ROTULO_STATUS[a.status]}</span>
                  </div>
                </div>

                <p className={estilos.sobre}>
                  sobre{' '}
                  {m ? (
                    <Link href={`/materiais/${m.id}/`}>{m.nome}</Link>
                  ) : (
                    <span className={estilos.orfa}>material fora do catálogo ({a.materialId})</span>
                  )}{' '}
                  · usa há {a.tempoDeUso} · {quando(a.criadoEm)}
                </p>

                <p className={estilos.texto}>{a.texto}</p>

                <div className={estilos.acoes}>
                  {a.status !== 'aprovado' && (
                    <button type="button" className="botao-primario" onClick={() => mudar(a.id, 'aprovado')}>
                      Publicar
                    </button>
                  )}
                  {a.status !== 'removido' && (
                    <button type="button" className="botao-secundario" onClick={() => mudar(a.id, 'removido')}>
                      Remover
                    </button>
                  )}
                  {a.status !== 'pendente' && (
                    <button type="button" className={estilos.linkAcao} onClick={() => mudar(a.id, 'pendente')}>
                      voltar pra fila
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className={estilos.nota}>
        Remover não apaga: marca como removida e tira do ar. Apagar de verdade tiraria de você
        a chance de reler o que foi denunciado, e sumiria com o histórico.
      </p>
    </>
  );
}
