/**
 * WikiPong · Meu perfil (D-19, emenda da comunidade)
 * ------------------------------------------------------------------------------
 * Três blocos, nesta ordem porque é a ordem em que a pessoa se apresenta:
 *   quem você é       → nome, estilo, nível (é a tag que aparece nos comentários)
 *   meu equipamento   → a raquete montada, reusando a Montagem do /montar
 *   minhas avaliações → o que você já escreveu, com link pra ficha
 *
 * O equipamento não é entidade nova: é a mesma `Montagem` do /montar, agora com
 * dono. Por isso as observações da montagem (assimetria, dureza dos dois lados)
 * aparecem aqui de graça — o módulo puro já sabia fazer isso.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ROTULO_ESTILO, NIVEIS, type Avaliacao, type EstiloJogador, type NivelJogador,
} from '@/src/logica/avaliacoes';
import { repositorio } from '@/src/logica/repositorio-avaliacoes';
import {
  repositorioPerfil, perfilVazio, temIdentidade, pecasEscolhidas, type Perfil,
} from '@/src/logica/perfil';
import {
  pecasDe, precoTotal, completa, observacoes, ROTULO_PAPEL,
  type Montagem, type PecaMontagem, type PapelPeca,
} from '@/src/logica/montagem';
import { MATERIAIS, materialPorId } from '@/componentes/dados-materiais';
import { temDesempenho } from '@/src/logica/filtros';
import { brl } from '@/componentes/formato';
import { FotoProduto } from '@/componentes/FotoProduto';
import { Estrelas } from '@/componentes/Estrelas';
import { TagEstilo, TagNivel } from '@/componentes/TagEstilo';
import estilos from './perfil.module.css';

const ESTILOS: EstiloJogador[] = ['atacante', 'allround', 'defensor'];

const comoPeca = (id?: string): PecaMontagem | undefined => {
  const m = id ? materialPorId(id) : undefined;
  return m && temDesempenho(m) ? (m as PecaMontagem) : undefined;
};

export function PerfilCliente() {
  const repoPerfil = useMemo(() => repositorioPerfil(), []);
  const repoAv = useMemo(() => repositorio(), []);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [minhas, setMinhas] = useState<Avaliacao[]>([]);

  useEffect(() => {
    repoPerfil.ler().then(setPerfil);
  }, [repoPerfil]);

  useEffect(() => {
    if (!perfil?.nome) return;
    const nome = perfil.nome.trim().toLowerCase();
    repoAv.listar().then((todas) =>
      setMinhas(todas.filter((a) => a.autor.trim().toLowerCase() === nome)),
    );
  }, [repoAv, perfil?.nome]);

  const salvar = (mudanca: Partial<Perfil>) => {
    const novo = { ...(perfil ?? perfilVazio()), ...mudanca } as Perfil;
    setPerfil(novo);
    void repoPerfil.gravar(novo);
  };

  const montagem: Montagem = useMemo(
    () => ({
      lamina: comoPeca(perfil?.equipamento.lamina),
      fh: comoPeca(perfil?.equipamento.fh),
      bh: comoPeca(perfil?.equipamento.bh),
    }),
    [perfil?.equipamento.lamina, perfil?.equipamento.fh, perfil?.equipamento.bh],
  );

  if (perfil === null) return <p className={estilos.carregando}>Carregando…</p>;

  const escolhidas = pecasEscolhidas(perfil);
  const obs = observacoes(montagem);

  return (
    <div className={estilos.blocos}>
      {/* ── Quem você é ── */}
      <section className={estilos.secao} aria-labelledby="t-identidade">
        <h2 id="t-identidade" className={estilos.tituloSecao}>
          Quem você é
        </h2>
        <p className={estilos.explica}>
          O estilo e o nível daqui viram a <strong>tag embaixo do seu nome</strong> em cada
          avaliação que você escrever. É o que faz a sua nota significar alguma coisa pra quem
          lê.
        </p>

        <div className={estilos.campos}>
          <label className={estilos.campo}>
            <span className={estilos.rotulo}>Como você assina</span>
            <input
              type="text"
              value={perfil.nome}
              onChange={(e) => salvar({ nome: e.target.value })}
              placeholder="seu nome ou apelido"
            />
          </label>
          <label className={estilos.campo}>
            <span className={estilos.rotulo}>Seu estilo de jogo</span>
            <select
              value={perfil.estilo ?? ''}
              onChange={(e) => salvar({ estilo: (e.target.value || undefined) as EstiloJogador })}
            >
              <option value="">escolher…</option>
              {ESTILOS.map((e) => (
                <option key={e} value={e}>{ROTULO_ESTILO[e]}</option>
              ))}
            </select>
          </label>
          <label className={estilos.campo}>
            <span className={estilos.rotulo}>Seu nível</span>
            <select
              value={perfil.nivel ?? ''}
              onChange={(e) => salvar({ nivel: (e.target.value || undefined) as NivelJogador })}
            >
              <option value="">escolher…</option>
              {NIVEIS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
        </div>

        {temIdentidade(perfil) ? (
          <div className={estilos.previa}>
            <p className={`mono ${estilos.previaRotulo}`}>é assim que você aparece</p>
            <div className={estilos.cracha}>
              <p className={estilos.crachaNome}>{perfil.nome}</p>
              <p className={estilos.crachaTags}>
                <TagEstilo estilo={perfil.estilo!} />
                {perfil.nivel && <TagNivel nivel={perfil.nivel} />}
              </p>
            </div>
          </div>
        ) : (
          <p className={estilos.faltando}>
            Preencha o nome e o estilo pra ver como a sua assinatura vai ficar.
          </p>
        )}
      </section>

      {/* ── Meu equipamento ── */}
      <section className={estilos.secao} aria-labelledby="t-equipamento">
        <h2 id="t-equipamento" className={estilos.tituloSecao}>
          Meu equipamento
        </h2>
        <p className={estilos.explica}>
          A sua raquete: uma lâmina e as duas borrachas.{' '}
          <Link href="/montar/">Não sabe o que combina?</Link> O montador mostra o preço somando
          e o que a combinação tem de atenção.
        </p>

        <div className={estilos.pecas}>
          {(['lamina', 'fh', 'bh'] as PapelPeca[]).map((papel) => (
            <SeletorPeca
              key={papel}
              papel={papel}
              valor={perfil.equipamento[papel]}
              aoEscolher={(id) =>
                salvar({ equipamento: { ...perfil.equipamento, [papel]: id || undefined } })
              }
            />
          ))}
        </div>

        {escolhidas > 0 && (
          <div className={estilos.resumoEquip}>
            <p className={`mono ${estilos.total}`}>
              {completa(montagem)
                ? `${brl(precoTotal(montagem))} somando as 3 peças`
                : `${escolhidas} de 3 peças · ${brl(precoTotal(montagem))} até aqui`}
            </p>
            {/* De graça: o módulo do /montar já sabia ler a combinação. */}
            {obs.length > 0 && (
              <ul className={estilos.observacoes}>
                {obs.map((o) => (
                  <li key={o.titulo} className={o.tipo === 'atencao' ? estilos.obsAtencao : ''}>
                    <strong>{o.titulo}</strong> {o.texto}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* ── Minhas avaliações ── */}
      <section className={estilos.secao} aria-labelledby="t-avaliacoes">
        <h2 id="t-avaliacoes" className={estilos.tituloSecao}>
          Minhas avaliações
        </h2>
        {minhas.length === 0 ? (
          <p className={estilos.faltando}>
            Você ainda não avaliou nenhum material.{' '}
            <Link href="/catalogo/">Achar um que você usa →</Link>
          </p>
        ) : (
          <ul className={estilos.listaAv}>
            {minhas.map((a) => {
              const m = materialPorId(a.materialId);
              return (
                <li key={a.id} className={estilos.itemAv}>
                  {m && (
                    <Link href={`/materiais/${m.id}/`} className={estilos.linkMaterial}>
                      <FotoProduto id={m.id} nome={m.nome} tipo={m.tipo} tamanho={40} />
                      <span className={estilos.nomeMaterial}>{m.nome}</span>
                    </Link>
                  )}
                  <Estrelas nota={a.nota} tamanho="sm" />
                  <p className={estilos.textoAv}>{a.texto}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function SeletorPeca({
  papel,
  valor,
  aoEscolher,
}: {
  papel: PapelPeca;
  valor?: string;
  aoEscolher: (id: string) => void;
}) {
  /* Lâmina pro papel de lâmina, borracha pros dois lados: oferecer uma borracha
     onde vai a madeira só produziria montagem impossível. */
  const opcoes = MATERIAIS.filter(
    (m) => temDesempenho(m) && m.tipo === (papel === 'lamina' ? 'Lâmina' : 'Borracha'),
  );
  const escolhido = valor ? materialPorId(valor) : undefined;

  return (
    <label className={estilos.campo}>
      <span className={estilos.rotulo}>{ROTULO_PAPEL[papel]}</span>
      <select value={valor ?? ''} onChange={(e) => aoEscolher(e.target.value)}>
        <option value="">escolher…</option>
        {opcoes.map((m) => (
          <option key={m.id} value={m.id}>
            {m.marca} {m.nome}
          </option>
        ))}
      </select>
      {escolhido && (
        <span className={estilos.pecaEscolhida}>
          <FotoProduto id={escolhido.id} nome={escolhido.nome} tipo={escolhido.tipo} tamanho={36} />
          <Link href={`/materiais/${escolhido.id}/`} className={estilos.pecaLink}>
            ver ficha →
          </Link>
        </span>
      )}
    </label>
  );
}
