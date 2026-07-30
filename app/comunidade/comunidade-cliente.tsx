/**
 * WikiPong · Espaço da comunidade — feed e ranking (D-19, emendado)
 * ------------------------------------------------------------------------------
 * Benchmark: TableTennisDaily. O que se copia dele é o VALOR — ver o que a
 * comunidade usa e acha, num lugar só. O que não se copia é a mecânica de
 * fórum ao vivo, que muda a stack (D-17).
 *
 * As duas abas resolvem perguntas diferentes:
 *   Feed     — "o que estão dizendo agora?"
 *   Ranking  — "o que a comunidade aprova, pro meu jeito de jogar?"
 *
 * O ranking é DERIVADO (D-11), nunca digitado, e ordena por Wilson e não por
 * média: sem isso, o material com uma única nota 5 lidera pra sempre.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  maisRecentes, ranking, resumir, ROTULO_ESTILO, NIVEIS,
  type Avaliacao, type EstiloJogador, type NivelJogador,
} from '@/src/logica/avaliacoes';
import { repositorio } from '@/src/logica/repositorio-avaliacoes';
import { materialPorId } from '@/componentes/dados-materiais';
import { FotoProduto } from '@/componentes/FotoProduto';
import { Estrelas } from '@/componentes/Estrelas';
import { TagEstilo, TagNivel } from '@/componentes/TagEstilo';
import estilos from './comunidade.module.css';

const ESTILOS: EstiloJogador[] = ['atacante', 'allround', 'defensor'];

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export function ComunidadeCliente() {
  const repo = useMemo(() => repositorio(), []);
  const [todas, setTodas] = useState<Avaliacao[] | null>(null);
  const [aba, setAba] = useState<'feed' | 'ranking'>('feed');
  const [estilo, setEstilo] = useState<EstiloJogador | ''>('');
  const [nivel, setNivel] = useState<NivelJogador | ''>('');

  useEffect(() => {
    repo.listar().then(setTodas);
  }, [repo]);

  const feed = useMemo(() => maisRecentes(todas ?? [], 30), [todas]);
  const tabela = useMemo(
    () =>
      ranking(todas ?? [], {
        estilo: estilo || undefined,
        nivel: nivel || undefined,
      }).slice(0, 20),
    [todas, estilo, nivel],
  );

  if (todas === null) {
    return <p className={estilos.carregando}>Carregando…</p>;
  }

  /* Comunidade vazia aparece vazia (D-16). Nada de avaliação semeada no repo
     pra fazer o espaço parecer movimentado no dia do lançamento. */
  if (todas.length === 0) {
    return <Vazio />;
  }

  return (
    <>
      <div className={estilos.abas} role="tablist" aria-label="Seções da comunidade">
        {(['feed', 'ranking'] as const).map((a) => (
          <button
            key={a}
            role="tab"
            type="button"
            aria-selected={aba === a}
            className={`${estilos.aba} ${aba === a ? estilos.abaAtiva : ''}`}
            onClick={() => setAba(a)}
          >
            {a === 'feed' ? 'O que estão dizendo' : 'O que a comunidade aprova'}
          </button>
        ))}
      </div>

      {aba === 'feed' ? (
        <ul className={estilos.feed}>
          {feed.map((a) => {
            const m = materialPorId(a.materialId);
            return (
              <li key={a.id} className={estilos.cartao}>
                <div className={estilos.cartaoTopo}>
                  {m && (
                    <Link href={`/materiais/${m.id}/`} className={estilos.material}>
                      <FotoProduto id={m.id} nome={m.nome} tipo={m.tipo} tamanho={44} />
                      <span>
                        <span className={estilos.materialNome}>{m.nome}</span>
                        <span className={`mono ${estilos.materialMarca}`}>{m.marca}</span>
                      </span>
                    </Link>
                  )}
                  <Estrelas nota={a.nota} tamanho="sm" />
                </div>
                <p className={estilos.texto}>{a.texto}</p>
                <p className={estilos.assinatura}>
                  <span className={estilos.autor}>{a.autor}</span>
                  <TagEstilo estilo={a.estilo} />
                  <TagNivel nivel={a.nivel} />
                  <time className={`mono ${estilos.data}`} dateTime={a.criadoEm}>
                    {dataCurta(a.criadoEm)}
                  </time>
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <>
          <div className={estilos.filtros}>
            <label className={estilos.filtro}>
              <span className={`mono ${estilos.filtroRotulo}`}>estilo de quem avaliou</span>
              <select value={estilo} onChange={(e) => setEstilo(e.target.value as EstiloJogador | '')}>
                <option value="">todos</option>
                {ESTILOS.map((e) => (
                  <option key={e} value={e}>{ROTULO_ESTILO[e]}</option>
                ))}
              </select>
            </label>
            <label className={estilos.filtro}>
              <span className={`mono ${estilos.filtroRotulo}`}>nível</span>
              <select value={nivel} onChange={(e) => setNivel(e.target.value as NivelJogador | '')}>
                <option value="">todos</option>
                {NIVEIS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>

          <p className={estilos.explicaOrdem}>
            Ordenado pelo <strong>limite inferior de Wilson</strong>, não pela média. É o que
            impede que um material com uma única nota 5 fique na frente de outro com quarenta
            avaliações e média 4,8. A média continua à mostra, do lado.
          </p>

          {tabela.length === 0 ? (
            <p className={estilos.vazioFiltro}>
              Ninguém com esse recorte avaliou nada ainda.
            </p>
          ) : (
            <ol className={estilos.ranking}>
              {tabela.map((linha, i) => {
                const m = materialPorId(linha.materialId);
                if (!m) return null;
                return (
                  <li key={linha.materialId} className={estilos.linhaRanking}>
                    <span className={`mono ${estilos.posicao}`} aria-hidden="true">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <Link href={`/materiais/${m.id}/`} className={estilos.material}>
                      <FotoProduto id={m.id} nome={m.nome} tipo={m.tipo} tamanho={40} />
                      <span>
                        <span className={estilos.materialNome}>{m.nome}</span>
                        <span className={`mono ${estilos.materialMarca}`}>{m.marca}</span>
                      </span>
                    </Link>
                    <span className={estilos.numeros}>
                      <Estrelas nota={linha.media} tamanho="sm" />
                      <span className={`mono ${estilos.mediaTexto}`}>
                        {linha.media.toFixed(1).replace('.', ',')} · {linha.total}{' '}
                        {linha.total === 1 ? 'avaliação' : 'avaliações'}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </>
  );
}

function Vazio() {
  return (
    <div className={estilos.vazio}>
      <p className={estilos.vazioTitulo}>Ninguém avaliou nada ainda.</p>
      <p>
        Este espaço se enche com as avaliações que as pessoas escrevem nas fichas dos materiais.
        Não semeamos nenhuma pra fazer o lugar parecer movimentado: comunidade vazia aparece
        vazia, e a primeira avaliação de verdade vale mais que trinta inventadas.
      </p>
      <p>
        <Link href="/catalogo/" className="botao-primario">
          Achar um material que você usa
        </Link>
      </p>
    </div>
  );
}

/** Resumo numérico do topo — derivado, como tudo aqui. */
export function ResumoComunidade() {
  const repo = useMemo(() => repositorio(), []);
  const [todas, setTodas] = useState<Avaliacao[]>([]);

  useEffect(() => {
    repo.listar().then(setTodas);
  }, [repo]);

  const resumo = resumir(todas);
  const materiais = new Set(todas.map((a) => a.materialId)).size;

  if (resumo.total === 0) return null;

  return (
    <dl className={estilos.numerosTopo}>
      <div>
        <dd className="mono">{resumo.total}</dd>
        <dt>{resumo.total === 1 ? 'avaliação' : 'avaliações'}</dt>
      </div>
      <div>
        <dd className="mono">{materiais}</dd>
        <dt>{materiais === 1 ? 'material avaliado' : 'materiais avaliados'}</dt>
      </div>
      {resumo.media !== null && (
        <div>
          <dd className="mono">{resumo.media.toFixed(1).replace('.', ',')}</dd>
          <dt>média geral</dt>
        </div>
      )}
    </dl>
  );
}
