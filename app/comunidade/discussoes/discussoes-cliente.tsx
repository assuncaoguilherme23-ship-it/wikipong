'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  repositorioDiscussoes, validarTopico, ordenarTopicos, porAssunto, ultimaAtividade,
  buscarTopicos, respostasOrdenadas, temRespostaUtil, ROTULO_ASSUNTO, ASSUNTOS,
  type Topico, type Assunto, type OrdemTopico, type Mensagem,
} from '@/src/logica/discussoes';
import { repositorioPerfil, type Perfil } from '@/src/logica/perfil';
import { novoId } from '@/src/logica/repositorio-avaliacoes';
import { sessaoAtual, souAdmin, quemSou } from '@/src/logica/sessao';
import { MATERIAIS, materialPorId } from '@/componentes/dados-materiais';
import { TagEstilo, TagNivel } from '@/componentes/TagEstilo';
import estilos from './discussoes.module.css';

const quando = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function DiscussoesCliente() {
  const repo = useMemo(() => repositorioDiscussoes(), []);
  const repoPerfil = useMemo(() => repositorioPerfil(), []);
  const [topicos, setTopicos] = useState<Topico[] | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [ordem, setOrdem] = useState<OrdemTopico>('ativos');
  const [assunto, setAssunto] = useState<Assunto | ''>('');
  const [abrindo, setAbrindo] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null);
  /* Busca e marca são o que se colhe de um fórum grande: lá o valor não está no
     que foi escrito hoje, está em achar o tópico de oito meses atrás. */
  const [termo, setTermo] = useState('');
  const [marca, setMarca] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);
  /* Quem pode marcar a resposta que resolveu: o dono do tópico e o moderador.
     A regra de verdade mora no banco (função da migração 010); isto aqui só
     decide se o botão aparece, pra não oferecer o que vai ser recusado. */
  const [euId, setEuId] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    repo.listar().then(setTopicos).catch(() => setTopicos([]));
    repoPerfil.ler().then(setPerfil);
    sessaoAtual().then(async (s) => {
      if (!s) return;
      setEuId(await quemSou(s));
      setAdmin(await souAdmin(s));
    });
  }, [repo, repoPerfil]);

  const recarregar = async () => setTopicos(await repo.listar());

  /* Marcas que REALMENTE aparecem nos tópicos. Listar as 15 do catálogo daria
     uma caixa cheia de opções que não filtram nada. */
  const marcasEmUso = useMemo(() => {
    const nomes = new Set<string>();
    for (const t of topicos ?? []) {
      const m = t.materialId ? materialPorId(t.materialId) : undefined;
      if (m) nomes.add(m.marca);
    }
    return [...nomes].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [topicos]);

  const visiveis = useMemo(() => {
    let ts = porAssunto(topicos ?? [], assunto || undefined);
    if (marca) {
      ts = ts.filter((t) => {
        const m = t.materialId ? materialPorId(t.materialId) : undefined;
        return m?.marca === marca;
      });
    }
    /* A busca vem DEPOIS dos filtros e ANTES da ordenação: filtrar o que a busca
       já reduziu é mais barato, e ordenar antes seria trabalho jogado fora. */
    return ordenarTopicos(buscarTopicos(ts, termo), ordem);
  }, [topicos, ordem, assunto, marca, termo]);

  /* No modo local o dono do navegador é o único que existe, então marca sempre.
     Com servidor, marca quem abriu o tópico e o moderador — a mesma regra que a
     função da migração 010 aplica de verdade, do lado do banco. */
  const podeMarcar = (t: Topico) =>
    repo.somenteLocal || admin || Boolean(euId && t.usuarioId === euId);

  if (topicos === null) return <p className={estilos.carregando}>Carregando…</p>;

  return (
    <>
      <p className={estilos.ondeMora}>
        {repo.somenteLocal ? (
          <>
            <span className={`mono ${estilos.selo}`}>prévia</span>
            Os tópicos ficam <strong>só neste navegador</strong>, sem conta e sem servidor.
            Ninguém mais vê o que você escrever.
          </>
        ) : (
          <>
            Todo tópico e toda resposta passam por leitura antes de aparecer aqui. Escrever não
            exige conta — <strong>entrar</strong> serve pra você poder marcar depois qual resposta
            resolveu a sua dúvida.
          </>
        )}
      </p>

      <div className={estilos.barra}>
        <button
          type="button"
          className={abrindo ? 'botao-secundario' : 'botao-primario'}
          onClick={() => setAbrindo((v) => !v)}
        >
          {abrindo ? 'Cancelar' : 'Abrir um tópico'}
        </button>

        {topicos.length > 0 && (
          <div className={estilos.filtros}>
            {/* A busca vem primeiro: num fórum, achar o que já existe vale mais
                que ordenar o que está na tela. E ela varre as RESPOSTAS também,
                porque o nome do material quase nunca está no título. */}
            <label className={estilos.filtro}>
              <span className={`mono ${estilos.filtroRotulo}`}>buscar</span>
              <input
                type="search"
                className={estilos.busca}
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="palavra, material, marca…"
              />
            </label>
            <label className={estilos.filtro}>
              <span className={`mono ${estilos.filtroRotulo}`}>ordenar</span>
              <select value={ordem} onChange={(e) => setOrdem(e.target.value as OrdemTopico)}>
                <option value="ativos">com movimento</option>
                <option value="novos">mais novos</option>
                <option value="sem-resposta">ainda sem resposta</option>
              </select>
            </label>
            <label className={estilos.filtro}>
              <span className={`mono ${estilos.filtroRotulo}`}>assunto</span>
              <select value={assunto} onChange={(e) => setAssunto(e.target.value as Assunto | '')}>
                <option value="">todos</option>
                {ASSUNTOS.map((a) => (
                  <option key={a} value={a}>{ROTULO_ASSUNTO[a]}</option>
                ))}
              </select>
            </label>
            {/* Só aparece quando há mais de uma marca em jogo: um filtro com uma
                opção só não filtra nada e ocupa a linha. */}
            {marcasEmUso.length > 1 && (
              <label className={estilos.filtro}>
                <span className={`mono ${estilos.filtroRotulo}`}>marca</span>
                <select value={marca} onChange={(e) => setMarca(e.target.value)}>
                  <option value="">todas</option>
                  {marcasEmUso.map((mc) => (
                    <option key={mc} value={mc}>{mc}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        )}
      </div>

      {aviso && (
        <p className={estilos.avisoEnviado} role="status">
          {aviso}
        </p>
      )}

      {abrindo && (
        <FormularioTopico
          perfil={perfil}
          aoGravar={async (t) => {
            await repo.gravar(t);
            await recarregar();
            setAbrindo(false);
            /* Com servidor, o tópico nasce pendente e NÃO volta na lista. Sem
               esta frase, quem escreveu acha que sumiu — e escreve de novo. */
            setAviso(
              repo.somenteLocal
                ? null
                : 'Tópico enviado. Ele aparece aqui depois de lido — por isso não está na lista ainda.',
            );
          }}
        />
      )}

      {topicos.length === 0 && !abrindo && (
        <div className={estilos.vazio}>
          <p className={estilos.vazioTitulo}>Nenhum tópico ainda.</p>
          <p>
            Este é o lugar das perguntas que não cabem numa avaliação: qual lâmina combina com a
            borracha que você já tem, se vale trocar agora, onde achar um modelo que sumiu do
            mercado. Nada foi semeado aqui pra fazer parecer movimentado.
          </p>
        </div>
      )}

      {visiveis.length === 0 && topicos.length > 0 && (
        <p className={estilos.vazioFiltro}>
          {termo
            ? `Nada encontrado para “${termo}”. A busca olha o título, o texto e as respostas.`
            : ordem === 'sem-resposta'
              ? 'Todos os tópicos já têm resposta.'
              : 'Nenhum tópico com esse recorte ainda.'}
        </p>
      )}

      <ul className={estilos.lista}>
        {visiveis.map((t) => {
          const m = t.materialId ? materialPorId(t.materialId) : undefined;
          const estaAberto = aberto === t.id;
          return (
            <li key={t.id} className={estilos.topico}>
              <p className={estilos.topicoMeta}>
                <span className={`mono ${estilos.assunto}`}>{ROTULO_ASSUNTO[t.assunto]}</span>
                {m && (
                  <Link href={`/materiais/${m.id}/`} className={estilos.materialLink}>
                    {m.nome}
                  </Link>
                )}
                {/* Na LISTA, não só dentro do tópico: quem varre a página quer
                    saber onde tem resposta boa antes de abrir cada um. */}
                {temRespostaUtil(t) && (
                  <span className={`mono ${estilos.seloResolvido}`}>resolvido</span>
                )}
              </p>
              <h3 className={estilos.topicoTitulo}>{t.titulo}</h3>
              <p className={estilos.topicoTexto}>{t.texto}</p>
              <p className={estilos.assinatura}>
                <span className={estilos.autor}>{t.autor}</span>
                {t.estilo && <TagEstilo estilo={t.estilo} />}
                {t.nivel && <TagNivel nivel={t.nivel} />}
                <time className={`mono ${estilos.data}`} dateTime={t.criadoEm}>
                  {quando(t.criadoEm)}
                </time>
              </p>

              <div className={estilos.respostasBloco}>
                <button
                  type="button"
                  className={estilos.abrirRespostas}
                  onClick={() => setAberto(estaAberto ? null : t.id)}
                  aria-expanded={estaAberto}
                >
                  {t.respostas.length === 0
                    ? 'Responder'
                    : `${t.respostas.length} ${t.respostas.length === 1 ? 'resposta' : 'respostas'}`}
                  {t.respostas.length > 0 && (
                    <span className={`mono ${estilos.ultima}`}>
                      · última em {quando(ultimaAtividade(t))}
                    </span>
                  )}
                </button>

                {estaAberto && (
                  <>
                    {t.respostas.length > 0 && (
                      <ul className={estilos.respostas}>
                        {respostasOrdenadas(t).map((r) => {
                          const resolveu = r.id === t.respostaUtil;
                          return (
                            <li key={r.id} className={resolveu ? estilos.respostaUtil : undefined}>
                              {resolveu && (
                                <p className={`mono ${estilos.seloResolveu}`}>resolveu a dúvida</p>
                              )}
                              <p className={estilos.respostaTexto}>{r.texto}</p>
                              <p className={estilos.assinatura}>
                                <span className={estilos.autor}>{r.autor}</span>
                                {r.estilo && <TagEstilo estilo={r.estilo} />}
                                <time className={`mono ${estilos.data}`} dateTime={r.criadoEm}>
                                  {quando(r.criadoEm)}
                                </time>
                                {podeMarcar(t) && (
                                  <button
                                    type="button"
                                    className={estilos.marcar}
                                    onClick={async () => {
                                      await repo.marcarRespostaUtil(t.id, resolveu ? null : r.id);
                                      await recarregar();
                                    }}
                                  >
                                    {resolveu ? 'desmarcar' : 'foi esta que resolveu'}
                                  </button>
                                )}
                              </p>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <FormularioResposta
                      perfil={perfil}
                      usuarioId={euId}
                      aoResponder={async (msg) => {
                        await repo.responder(t.id, msg);
                        await recarregar();
                        setAviso(
                          repo.somenteLocal
                            ? null
                            : 'Resposta enviada. Ela aparece depois de lida.',
                        );
                      }}
                    />
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}

// ───────────────────────── Formulários ─────────────────────────

function FormularioTopico({
  perfil,
  aoGravar,
}: {
  perfil: Perfil | null;
  aoGravar: (t: Topico) => Promise<void>;
}) {
  /* O nome vem do perfil quando existe: perguntar de novo o que a pessoa já
     disse é o jeito mais rápido de fazer alguém desistir de escrever. */
  const [autor, setAutor] = useState(perfil?.nome ?? '');
  const [titulo, setTitulo] = useState('');
  const [texto, setTexto] = useState('');
  const [assunto, setAssunto] = useState<Assunto>('geral');
  const [materialId, setMaterialId] = useState('');
  const [tentou, setTentou] = useState(false);

  const problemas = validarTopico({ autor, titulo, texto });
  const erro = (c: 'autor' | 'titulo' | 'texto') =>
    tentou ? problemas.find((p) => p.campo === c)?.mensagem : undefined;

  return (
    <form
      className={estilos.form}
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        setTentou(true);
        if (problemas.length > 0) return;
        await aoGravar({
          id: novoId(),
          titulo: titulo.trim(),
          texto: texto.trim(),
          assunto,
          materialId: materialId || undefined,
          autor: autor.trim(),
          estilo: perfil?.estilo,
          nivel: perfil?.nivel,
          criadoEm: new Date().toISOString(),
          respostas: [],
        });
      }}
    >
      <label className={estilos.campo}>
        <span className={estilos.rotulo}>Título</span>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="do que se trata, numa linha"
          aria-invalid={Boolean(erro('titulo'))}
        />
        {erro('titulo') && <span className={estilos.erro} role="alert">{erro('titulo')}</span>}
      </label>

      <div className={estilos.grade}>
        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Assunto</span>
          <select value={assunto} onChange={(e) => setAssunto(e.target.value as Assunto)}>
            {ASSUNTOS.map((a) => (
              <option key={a} value={a}>{ROTULO_ASSUNTO[a]}</option>
            ))}
          </select>
        </label>
        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Material (opcional)</span>
          <select value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            <option value="">nenhum</option>
            {MATERIAIS.map((m) => (
              <option key={m.id} value={m.id}>{m.marca} {m.nome}</option>
            ))}
          </select>
        </label>
        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Como quer assinar</span>
          <input
            type="text"
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            aria-invalid={Boolean(erro('autor'))}
          />
          {erro('autor') && <span className={estilos.erro} role="alert">{erro('autor')}</span>}
        </label>
      </div>

      <label className={estilos.campo}>
        <span className={estilos.rotulo}>O caso</span>
        <textarea
          rows={5}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="conte o contexto: o que você usa hoje, o que quer resolver"
          aria-invalid={Boolean(erro('texto'))}
        />
        {erro('texto') && <span className={estilos.erro} role="alert">{erro('texto')}</span>}
      </label>

      <div>
        <button type="submit" className="botao-primario">Publicar tópico</button>
        {!perfil?.estilo && (
          <p className={estilos.dica}>
            Seu tópico vai sair sem a tag de estilo.{' '}
            <Link href="/comunidade/perfil/">Preencher o perfil</Link> faz ela aparecer aqui e
            nas suas avaliações.
          </p>
        )}
      </div>
    </form>
  );
}

function FormularioResposta({
  perfil,
  usuarioId,
  aoResponder,
}: {
  perfil: Perfil | null;
  usuarioId: string | null;
  aoResponder: (m: Mensagem) => Promise<void>;
}) {
  const [texto, setTexto] = useState('');
  const [autor, setAutor] = useState(perfil?.nome ?? '');
  const pode = texto.trim().length >= 5 && autor.trim().length >= 2;

  return (
    <form
      className={estilos.formResposta}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!pode) return;
        await aoResponder({
          id: novoId(),
          autor: autor.trim(),
          estilo: perfil?.estilo,
          nivel: perfil?.nivel,
          texto: texto.trim(),
          criadoEm: new Date().toISOString(),
          usuarioId: usuarioId ?? undefined,
        });
        setTexto('');
      }}
    >
      <textarea
        rows={3}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="sua resposta"
        aria-label="Sua resposta"
      />
      <div className={estilos.linhaResposta}>
        <input
          type="text"
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          placeholder="assinar como"
          aria-label="Como quer assinar"
        />
        <button type="submit" className="botao-secundario" disabled={!pode}>
          Responder
        </button>
      </div>
    </form>
  );
}
