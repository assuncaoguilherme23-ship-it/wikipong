/**
 * WikiPong · Bloco de avaliações da ficha do material (D-11)
 * ------------------------------------------------------------------------------
 * O que o D-14 exige e esta tela cumpre: isto é OPINIÃO, e mora numa seção
 * própria, depois da ficha técnica, nunca misturada com o dado de fabricante.
 *
 * O que o D-16 exige e esta tela cumpre: enquanto não há backend (D-17), o que
 * a pessoa escreve fica NO NAVEGADOR DELA. A tela diz isso com todas as letras,
 * antes de alguém digitar — descobrir depois seria pegadinha.
 *
 * Resumo, distribuição e recortes vêm todos de `avaliacoes.ts`. Este arquivo
 * não faz conta nenhuma: só desenha o que o módulo puro devolve.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  validar, resumir, ordenar, recortar, ROTULO_ESTILO, NIVEIS, TEMPOS_DE_USO,
  PISO_PARA_MEDIA, NOTA_MAXIMA, TEXTO_MAXIMO,
  type Avaliacao, type EstiloJogador, type NivelJogador, type TempoDeUso,
  type Ordem, type ProblemaCampo,
} from '@/src/logica/avaliacoes';
import { repositorio, novoId } from '@/src/logica/repositorio-avaliacoes';
import { Estrelas, EstrelasEntrada } from './Estrelas';
import { TagEstilo, TagNivel } from './TagEstilo';
import estilos from './AvaliacoesMaterial.module.css';

const ESTILOS: EstiloJogador[] = ['atacante', 'allround', 'defensor'];

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function AvaliacoesMaterial({
  materialId,
  nomeMaterial,
}: {
  materialId: string;
  nomeMaterial: string;
}) {
  const repo = useMemo(() => repositorio(), []);
  const [lista, setLista] = useState<Avaliacao[] | null>(null);
  const [ordem, setOrdem] = useState<Ordem>('recentes');
  const [filtroEstilo, setFiltroEstilo] = useState<EstiloJogador | ''>('');
  const [abrirForm, setAbrirForm] = useState(false);

  useEffect(() => {
    repo.doMaterial(materialId).then(setLista);
  }, [repo, materialId]);

  const resumo = useMemo(() => resumir(lista ?? []), [lista]);
  const visiveis = useMemo(() => {
    const base = (lista ?? []).filter((a) => a.status === 'aprovado');
    return ordenar(recortar(base, filtroEstilo ? { estilo: filtroEstilo } : {}), ordem);
  }, [lista, ordem, filtroEstilo]);

  async function gravar(nova: Avaliacao) {
    await repo.gravar(nova);
    setLista(await repo.doMaterial(materialId));
    setAbrirForm(false);
  }

  /* null = ainda lendo o storage. Não renderizar "nenhuma avaliação" antes de
     saber: a tela piscaria o estado vazio pra quem tem avaliação gravada. */
  if (lista === null) {
    return <p className={estilos.carregando}>Carregando avaliações…</p>;
  }

  return (
    <div className={estilos.bloco}>
      {repo.somenteLocal && (
        <p className={estilos.avisoLocal}>
          <span className={`mono ${estilos.selo}`}>prévia</span>
          As avaliações ainda ficam <strong>só neste navegador</strong>. Ninguém mais vê o que
          você escrever, e some se você limpar os dados do site. Quando as contas abrirem, isto
          vira público e passa por moderação.
        </p>
      )}

      {resumo.total > 0 ? (
        <ResumoNotas resumo={resumo} />
      ) : (
        <p className={estilos.vazio}>
          Ninguém avaliou <strong>{nomeMaterial}</strong> ainda. Se você usa, a sua é a primeira
          — e a ficha técnica acima continua valendo do mesmo jeito.
        </p>
      )}

      <div className={estilos.acoes}>
        <button
          type="button"
          className={abrirForm ? 'botao-secundario' : 'botao-primario'}
          onClick={() => setAbrirForm((v) => !v)}
          aria-expanded={abrirForm}
        >
          {abrirForm ? 'Cancelar' : 'Avaliar este material'}
        </button>
      </div>

      {abrirForm && (
        <Formulario materialId={materialId} nomeMaterial={nomeMaterial} aoGravar={gravar} />
      )}

      {visiveis.length > 0 && (
        <>
          <div className={estilos.controles}>
            <label className={estilos.controle}>
              <span className={`mono ${estilos.controleRotulo}`}>ordenar</span>
              <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)}>
                <option value="recentes">mais recentes</option>
                <option value="uteis">mais completas</option>
                <option value="nota-alta">nota mais alta</option>
                <option value="nota-baixa">nota mais baixa</option>
              </select>
            </label>
            <label className={estilos.controle}>
              <span className={`mono ${estilos.controleRotulo}`}>estilo de quem avaliou</span>
              <select
                value={filtroEstilo}
                onChange={(e) => setFiltroEstilo(e.target.value as EstiloJogador | '')}
              >
                <option value="">todos</option>
                {ESTILOS.map((e) => (
                  <option key={e} value={e}>
                    {ROTULO_ESTILO[e]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <ul className={estilos.lista}>
            {visiveis.map((a) => (
              <li key={a.id} className={estilos.item}>
                <div className={estilos.cabecalhoItem}>
                  <div>
                    <p className={estilos.autor}>{a.autor}</p>
                    {/* A tag do estilo vive AQUI, embaixo do nome: é o contexto
                        que faz a nota significar alguma coisa. */}
                    <p className={estilos.tags}>
                      <TagEstilo estilo={a.estilo} />
                      <TagNivel nivel={a.nivel} />
                    </p>
                  </div>
                  <div className={estilos.notaItem}>
                    <Estrelas nota={a.nota} tamanho="sm" />
                    <time className={`mono ${estilos.data}`} dateTime={a.criadoEm}>
                      {dataCurta(a.criadoEm)}
                    </time>
                  </div>
                </div>
                <p className={estilos.texto}>{a.texto}</p>
                <p className={`mono ${estilos.uso}`}>usa há {a.tempoDeUso}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      {visiveis.length === 0 && filtroEstilo && resumo.total > 0 && (
        <p className={estilos.vazio}>
          Nenhum <strong>{ROTULO_ESTILO[filtroEstilo].toLowerCase()}</strong> avaliou este
          material ainda.{' '}
          <button type="button" className={estilos.limpar} onClick={() => setFiltroEstilo('')}>
            Ver todas as avaliações
          </button>
        </p>
      )}
    </div>
  );
}

// ───────────────────────── Resumo ─────────────────────────

function ResumoNotas({ resumo }: { resumo: ReturnType<typeof resumir> }) {
  const maior = Math.max(...resumo.distribuicao, 1);
  return (
    <div className={estilos.resumo}>
      <div className={estilos.media}>
        {resumo.media !== null ? (
          <>
            <p className={`mono ${estilos.mediaNumero}`}>
              {resumo.media.toFixed(1).replace('.', ',')}
            </p>
            <Estrelas nota={resumo.media} tamanho="md" />
          </>
        ) : (
          /* Abaixo do piso a média não sai — e a tela DIZ por quê, em vez de
             mostrar um número que engana. Mesma regra do sinal do Revspin. */
          <p className={estilos.semMedia}>
            Ainda sem média: são precisas {PISO_PARA_MEDIA} avaliações pra que ela signifique
            algo.
          </p>
        )}
        <p className={`mono ${estilos.totalAvaliacoes}`}>
          {resumo.total} {resumo.total === 1 ? 'avaliação' : 'avaliações'}
        </p>
      </div>

      <ul className={estilos.distribuicao}>
        {[5, 4, 3, 2, 1].map((n) => {
          const quantas = resumo.distribuicao[n - 1];
          return (
            <li key={n} className={estilos.barraLinha}>
              <span className={`mono ${estilos.barraRotulo}`}>{n}★</span>
              <span className={estilos.barraTrilho}>
                <span
                  className={estilos.barraCheia}
                  style={{ width: `${(quantas / maior) * 100}%` }}
                />
              </span>
              <span className={`mono ${estilos.barraContagem}`}>{quantas}</span>
              <span className="apenas-leitor">
                {quantas} de {resumo.total} deram {n} de {NOTA_MAXIMA} estrelas
              </span>
            </li>
          );
        })}
      </ul>

      {/* O recorte que o D-11 existe pra permitir: a mesma borracha lida por
          quem joga diferente. Só aparece quando há mais de um grupo — com um
          grupo só, repetir a média geral não informa nada. */}
      {Object.keys(resumo.porEstilo).length > 1 && (
        <div className={estilos.recortes}>
          <p className={`mono ${estilos.recorteTitulo}`}>média por estilo de quem avaliou</p>
          <ul className={estilos.recorteLista}>
            {(Object.keys(resumo.porEstilo) as EstiloJogador[]).map((e) => (
              <li key={e}>
                <TagEstilo estilo={e} comLink={false} />
                <span className={`mono ${estilos.recorteNota}`}>
                  {resumo.porEstilo[e]!.media.toFixed(1).replace('.', ',')}
                </span>
                <span className={estilos.recorteTotal}>
                  ({resumo.porEstilo[e]!.total})
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── Formulário ─────────────────────────

function Formulario({
  materialId,
  nomeMaterial,
  aoGravar,
}: {
  materialId: string;
  nomeMaterial: string;
  aoGravar: (a: Avaliacao) => Promise<void>;
}) {
  const [autor, setAutor] = useState('');
  const [nota, setNota] = useState<number | undefined>();
  const [texto, setTexto] = useState('');
  const [nivel, setNivel] = useState<NivelJogador | ''>('');
  const [tempoDeUso, setTempo] = useState<TempoDeUso | ''>('');
  const [estilo, setEstilo] = useState<EstiloJogador | ''>('');
  const [tentou, setTentou] = useState(false);

  const rascunho = {
    autor, nota, texto,
    nivel: nivel || undefined,
    tempoDeUso: tempoDeUso || undefined,
    estilo: estilo || undefined,
  };
  const problemas = validar(rascunho);
  const erroDe = (campo: ProblemaCampo['campo']) =>
    tentou ? problemas.find((p) => p.campo === campo)?.mensagem : undefined;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setTentou(true);
    if (problemas.length > 0) return;
    await aoGravar({
      id: novoId(),
      materialId,
      autor: autor.trim(),
      nota: nota!,
      texto: texto.trim(),
      nivel: nivel as NivelJogador,
      tempoDeUso: tempoDeUso as TempoDeUso,
      estilo: estilo as EstiloJogador,
      criadoEm: new Date().toISOString(),
      status: 'aprovado',
    });
  }

  return (
    <form className={estilos.form} onSubmit={enviar} noValidate>
      <h3 className={estilos.formTitulo}>Sua avaliação de {nomeMaterial}</h3>

      <div className={estilos.campo}>
        <span className={estilos.rotulo}>Sua nota</span>
        <EstrelasEntrada valor={nota} aoEscolher={setNota} invalido={Boolean(erroDe('nota'))} />
        <Erro mensagem={erroDe('nota')} />
      </div>

      <label className={estilos.campo}>
        <span className={estilos.rotulo}>Como quer assinar</span>
        <input
          type="text"
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          placeholder="seu nome ou apelido"
          aria-invalid={Boolean(erroDe('autor'))}
        />
        <Erro mensagem={erroDe('autor')} />
      </label>

      {/* Os três campos que transformam opinião em dado (D-11). Ficam JUNTOS e
          antes do texto de propósito: são rápidos de responder e é o que dá
          sentido à nota depois. */}
      <div className={estilos.grade}>
        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Seu estilo de jogo</span>
          <select
            value={estilo}
            onChange={(e) => setEstilo(e.target.value as EstiloJogador)}
            aria-invalid={Boolean(erroDe('estilo'))}
          >
            <option value="">escolher…</option>
            {ESTILOS.map((e) => (
              <option key={e} value={e}>
                {ROTULO_ESTILO[e]}
              </option>
            ))}
          </select>
          <Erro mensagem={erroDe('estilo')} />
        </label>

        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Seu nível</span>
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value as NivelJogador)}
            aria-invalid={Boolean(erroDe('nivel'))}
          >
            <option value="">escolher…</option>
            {NIVEIS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <Erro mensagem={erroDe('nivel')} />
        </label>

        <label className={estilos.campo}>
          <span className={estilos.rotulo}>Usa há quanto tempo</span>
          <select
            value={tempoDeUso}
            onChange={(e) => setTempo(e.target.value as TempoDeUso)}
            aria-invalid={Boolean(erroDe('tempoDeUso'))}
          >
            <option value="">escolher…</option>
            {TEMPOS_DE_USO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <Erro mensagem={erroDe('tempoDeUso')} />
        </label>
      </div>

      <label className={estilos.campo}>
        <span className={estilos.rotulo}>O que você achou</span>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={5}
          maxLength={TEXTO_MAXIMO}
          placeholder="Como ela se comporta no seu jogo? O que surpreendeu, o que decepcionou?"
          aria-invalid={Boolean(erroDe('texto'))}
        />
        <span className={`mono ${estilos.contador}`}>
          {texto.trim().length}/{TEXTO_MAXIMO}
        </span>
        <Erro mensagem={erroDe('texto')} />
      </label>

      <div className={estilos.formAcoes}>
        <button type="submit" className="botao-primario">
          Publicar avaliação
        </button>
        {tentou && problemas.length > 0 && (
          <p className={estilos.resumoErro} role="alert">
            Falta {problemas.length === 1 ? 'um campo' : `${problemas.length} campos`}.
          </p>
        )}
      </div>
    </form>
  );
}

function Erro({ mensagem }: { mensagem?: string }) {
  if (!mensagem) return null;
  return (
    <span className={estilos.erro} role="alert">
      {mensagem}
    </span>
  );
}
