'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  repositorioDiscussoes, validarTopico, ordenarTopicos, porAssunto, ultimaAtividade,
  ROTULO_ASSUNTO, ASSUNTOS,
  type Topico, type Assunto, type OrdemTopico, type Mensagem,
} from '@/src/logica/discussoes';
import { repositorioPerfil, type Perfil } from '@/src/logica/perfil';
import { novoId } from '@/src/logica/repositorio-avaliacoes';
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

  useEffect(() => {
    repo.listar().then(setTopicos);
    repoPerfil.ler().then(setPerfil);
  }, [repo, repoPerfil]);

  const recarregar = async () => setTopicos(await repo.listar());

  const visiveis = useMemo(
    () => ordenarTopicos(porAssunto(topicos ?? [], assunto || undefined), ordem),
    [topicos, ordem, assunto],
  );

  if (topicos === null) return <p className={estilos.carregando}>Carregando…</p>;

  return (
    <>
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
          </div>
        )}
      </div>

      {abrindo && (
        <FormularioTopico
          perfil={perfil}
          aoGravar={async (t) => {
            await repo.gravar(t);
            await recarregar();
            setAbrindo(false);
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
          {ordem === 'sem-resposta'
            ? 'Todos os tópicos já têm resposta.'
            : 'Nenhum tópico com esse assunto ainda.'}
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
                        {t.respostas.map((r) => (
                          <li key={r.id}>
                            <p className={estilos.respostaTexto}>{r.texto}</p>
                            <p className={estilos.assinatura}>
                              <span className={estilos.autor}>{r.autor}</span>
                              {r.estilo && <TagEstilo estilo={r.estilo} />}
                              <time className={`mono ${estilos.data}`} dateTime={r.criadoEm}>
                                {quando(r.criadoEm)}
                              </time>
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <FormularioResposta
                      perfil={perfil}
                      aoResponder={async (msg) => {
                        await repo.responder(t.id, msg);
                        await recarregar();
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
  aoResponder,
}: {
  perfil: Perfil | null;
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
