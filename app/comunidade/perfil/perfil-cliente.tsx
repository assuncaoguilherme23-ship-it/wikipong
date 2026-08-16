/**
 * WikiPong · Meu perfil — o bastidor do espaço, não uma tela de configurações
 * ==============================================================================
 * A VERSÃO ANTERIOR ERA UM FORMULÁRIO. Oito campos empilhados, três seções de
 * peso igual, e nada na tela que fosse a pessoa: só campos sobre ela. O fundador
 * disse, com razão, que não estava trabalhada.
 *
 * O que mudou, e por quê:
 *
 * 1. O CARTÃO MESA ABRE A PÁGINA, e é o MESMO componente do perfil público,
 *    pintando ao vivo. Antes havia um "crachá" no meio do formulário que imitava
 *    a página pública — imitação diverge. Agora é o mesmo objeto, e "é assim que
 *    você aparece" deixou de ser promessa.
 *
 * 2. OS CAMPOS VIRARAM TRÊS GRUPOS COM NOME, e não uma grade de oito. Quem você
 *    é · como você joga · onde você joga. Grupo com nome é uma pergunta de cada
 *    vez, mesmo com tudo na tela.
 *
 * 3. O TRILHO DIZ O QUE FALTA E PRA QUE SERVE — sem porcentagem. Barra de "60%
 *    completo" faz preencher pra calar o medidor, e dado ruim é pior que dado
 *    faltando (D-16). A lista some conforme a pessoa conta.
 *
 * 4. SEM CONTA, A PÁGINA É RASA — e a razão é factual, não comercial. Nome,
 *    estilo, nível e raquete fazem trabalho AGORA (preenchem sua próxima
 *    avaliação, alimentam o montador), então valem no navegador. Todo o resto só
 *    existe pra ser lido por outra pessoa, e sem conta não há página onde alguém
 *    leia. Guardar "meu clube é a FitPong" num navegador onde ninguém vai ver
 *    seria fingir que algo foi feito.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ROTULO_ESTILO, NIVEIS, type Avaliacao, type EstiloJogador, type NivelJogador,
} from '@/src/logica/avaliacoes';
import { repositorio } from '@/src/logica/repositorio-avaliacoes';
import {
  repositorioPerfilAtual, perfilVazio, temIdentidade, pecasEscolhidas,
  tracosDoPerfil, contextoDoPerfil, oQueFalta, ANO_MINIMO,
  MAOS, EMPUNHADURAS, FREQUENCIAS,
  ROTULO_MAO, ROTULO_EMPUNHADURA, ROTULO_FREQUENCIA,
  type Perfil, type RepositorioPerfil, type Mao, type Empunhadura, type Frequencia,
} from '@/src/logica/perfil';
import { caminhoDoPerfil } from '@/componentes/apelidos';
import { Login } from '@/componentes/Login';
import { usarSessao } from '@/componentes/usarSessao';
import { sair, tokenGuardado } from '@/src/logica/sessao';
import {
  precoTotal, completa, observacoes, ROTULO_PAPEL,
  type Montagem, type PecaMontagem, type PapelPeca,
} from '@/src/logica/montagem';
import { MATERIAIS, materialPorId } from '@/componentes/dados-materiais';
import { brl } from '@/componentes/formato';
import { FotoProduto } from '@/componentes/FotoProduto';
import { SeletorMaterial } from '@/componentes/SeletorMaterial';
import { Estrelas } from '@/componentes/Estrelas';
import { CartaoMesaJogador } from '@/componentes/CartaoMesaJogador';
import { EstanteEditor } from '@/componentes/EstanteEditor';
import estilos from './perfil.module.css';

/* Bate com o check da migracao 014: uma linha, nao um paragrafo. */
const PROCURO_MAXIMO = 120;
/* Bate com os checks da migracao 016. */
const CLUBE_MAXIMO = 60;
const BOLA_MAXIMO = 40;

const ESTILOS: EstiloJogador[] = ['atacante', 'allround', 'defensor'];

/* ── A TRAVA DE PERFIL DE DESEMPENHO SAIU DAQUI TAMBÉM (2026-08-15) ──────────
   O montador tirou esta mesma trava em 2026-08-04, e esta tela ficou pra trás
   por um ano de commits. O efeito era grave e silencioso: o seletor só oferecia
   peça COM specs, e com isso escondia 246 das 549 lâminas e 132 das 400
   borrachas. O fundador foi procurar a Hayabusa que ele usa, não achou, e
   concluiu — com razão — que o catálogo não estava ali.

   `specs` é opcional em `PecaMontagem` justamente por isso: quem monta raquete
   escolhe pelo nome, pela marca e pelo preço, como na loja. A tabela de specs é
   CONSEQUÊNCIA do que a peça tem, não porta de entrada.

   O que continua barrado é o que nunca foi peça de raquete: bola e raquete já
   montada. Isso é tipo, não dado — a mesma régua do `ehPeca` do montador. */
const ehPeca = (m: { tipo: string }): boolean => m.tipo === 'Lâmina' || m.tipo === 'Borracha';

const comoPeca = (id?: string): PecaMontagem | undefined => {
  const m = id ? materialPorId(id) : undefined;
  return m && ehPeca(m) ? (m as PecaMontagem) : undefined;
};

const LAMINAS = MATERIAIS.filter((m) => m.tipo === 'Lâmina');
const BORRACHAS = MATERIAIS.filter((m) => m.tipo === 'Borracha');

export function PerfilCliente() {
  const { usuario, carregando, disponivel } = usarSessao();
  const repoAv = useMemo(() => repositorio(), []);
  const [repoPerfil, setRepoPerfil] = useState<RepositorioPerfil | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [minhas, setMinhas] = useState<Avaliacao[]>([]);
  const [erroAoGravar, setErroAoGravar] = useState<string | null>(null);

  /* O ano é lido UMA vez, na montagem, e passado adiante. As funções que o usam
     são puras de propósito — quem chama diz que ano é. */
  const anoAtual = useMemo(() => new Date().getFullYear(), []);

  /* O repositorio depende de QUEM esta' logado, entao so' pode ser escolhido
     depois que a sessao responde. Refaz quando o usuario muda: entrar ou sair
     troca de onde o perfil vem. */
  /* O `vivo` e a ordem `await` → teste → `set` não são zelo abstrato: sem eles,
     uma leitura que voltasse tarde sobrescreveria o que já tivesse sido
     digitado. Foi assim que o nome do fundador virou "uilherme" nas
     boas-vindas — o "G" entrou antes de a leitura chegar e foi apagado por ela.
     Aqui o formulário só existe depois de `perfil !== null`, então a janela é
     menor, mas trocar de conta (o `usuario?.id` muda) reabre exatamente a
     mesma. */
  useEffect(() => {
    if (carregando) return;
    let vivo = true;
    repositorioPerfilAtual().then(async (r) => {
      const lido = await r.ler();
      if (!vivo) return;
      setRepoPerfil(r);
      setPerfil(lido);
    });
    return () => { vivo = false; };
  }, [carregando, usuario?.id]);

  useEffect(() => {
    if (!perfil?.nome) return;
    const nome = perfil.nome.trim().toLowerCase();
    repoAv.listar().then((todas) =>
      setMinhas(todas.filter((a) => a.autor.trim().toLowerCase() === nome)),
    );
  }, [repoAv, perfil?.nome]);

  /* A gravação passou a LANÇAR quando falha (ver `perfil.ts`). Antes ela
     engolia a recusa do servidor, e o resultado era o pior possível: um
     formulário que aceita tudo e não guarda nada, sem nada na tela dizendo. */
  const salvar = (mudanca: Partial<Perfil>) => {
    const novo = { ...(perfil ?? perfilVazio()), ...mudanca } as Perfil;
    setPerfil(novo);
    if (!repoPerfil) return;
    repoPerfil
      .gravar(novo)
      .then(() => setErroAoGravar(null))
      .catch((e: unknown) =>
        setErroAoGravar(e instanceof Error ? e.message : 'Não consegui guardar agora.'),
      );
  };

  const montagem: Montagem = useMemo(
    () => ({
      lamina: comoPeca(perfil?.equipamento.lamina),
      fh: comoPeca(perfil?.equipamento.fh),
      bh: comoPeca(perfil?.equipamento.bh),
    }),
    [perfil?.equipamento.lamina, perfil?.equipamento.fh, perfil?.equipamento.bh],
  );

  if (carregando || perfil === null) {
    return <p className={estilos.carregando}>Carregando…</p>;
  }

  const temConta = Boolean(usuario);
  /* Sem servidor nenhum não existe conta pra ter, e o site inteiro é uma
     ferramenta local. Esconder campos ali seria trancar uma porta que não leva
     a lugar nenhum. */
  const perfilInteiro = temConta || !disponivel;

  const escolhidas = pecasEscolhidas(perfil);
  const obs = observacoes(montagem);
  const falta = oQueFalta(perfil, perfilInteiro);

  return (
    <div className={estilos.pagina}>
      {/* ── O cartão, ao vivo. Mesmo componente da página pública. ── */}
      <CartaoMesaJogador
        nome={perfil.nome}
        nomeVazio="Seu espaço"
        tracos={tracosDoPerfil(perfil)}
        contexto={contextoDoPerfil(perfil, anoAtual)}
        procuro={perfil.procuro}
        equipamento={perfil.equipamento}
        rodape={
          disponivel && usuario ? (
            <>
              <span>
                Entrou como <strong>{usuario.email}</strong>
              </span>
              {perfil.apelido && temIdentidade(perfil) && (
                <Link href={caminhoDoPerfil(perfil.apelido)}>ver como os outros veem</Link>
              )}
              {/* Serve pros dois casos: trocar a senha que existe, e DAR uma
                  senha a quem só entrava por link. */}
              <Link href="/comunidade/nova-senha/">trocar minha senha</Link>
              <button type="button" onClick={() => sair().then(() => location.reload())}>
                sair
              </button>
            </>
          ) : (
            <span>
              {disponivel
                ? 'Sem conta. O que você preencher fica só neste navegador.'
                : 'O servidor não está ligado — tudo aqui fica neste navegador.'}
            </span>
          )
        }
      />

      {/* Logo abaixo do cartão, onde o olho já está: um aviso de "não guardei"
          no rodapé de uma página longa é um aviso que ninguém lê. */}
      {erroAoGravar && (
        <p className={estilos.erroGravar} role="alert">
          <strong>Não guardei a última mudança.</strong> {erroAoGravar}
        </p>
      )}

      {/* Convite pro passo a passo, ANTES dos campos. Quem chega com perfil
          vazio precisa da saída antes de encarar o formulário, não no fim dele. */}
      {!temIdentidade(perfil) && (
        <div className={estilos.convite}>
          <p className={estilos.conviteTitulo}>É a sua primeira vez por aqui?</p>
          <p className={estilos.conviteTexto}>
            Dá pra montar o perfil em quatro passos, uma pergunta por tela, com o porquê de
            cada uma. Leva menos de um minuto e você pode pular o que quiser.
          </p>
          <Link href="/comunidade/boas-vindas/" className="botao-primario">
            Montar passo a passo
          </Link>
        </div>
      )}

      {/* ── Sem conta: o que fica de fora, e por quê ──
             Em largura inteira e ANTES dos campos, não num trilho lateral: é a
             coisa mais importante desta tela pra quem não entrou.
             A lista abaixo não é lista de vantagem inventada — é a diferença
             real: cada item ali precisa de um `usuario_id` pra existir. Sem
             conta não há dono, e sem dono não há página onde alguém leia. */}
      {disponivel && !usuario && (
        <section className={estilos.semConta} aria-labelledby="t-conta">
          <h2 id="t-conta" className={estilos.tituloGrupo}>O que a conta abre</h2>
          <div className={estilos.semContaCorpo}>
            <div>
              <p className={estilos.explica}>
                Nome, estilo, nível e raquete funcionam <strong>sem conta</strong>: eles
                preenchem sozinhos a sua próxima avaliação e alimentam o montador, e por isso
                vale guardá-los neste navegador.
              </p>
              <p className={estilos.explica}>
                O resto do perfil só existe pra <strong>ser lido por outra pessoa</strong> — e
                sem conta não há página onde alguém leia:
              </p>
              <ul className={estilos.listaAbre}>
                <li>seu endereço público, pra mandar pra alguém</li>
                <li>a estante do que você já usou, e por quê</li>
                <li>desde quando joga, quanto joga, clube e cidade</li>
                <li>suas avaliações assinadas — dá pra corrigir e apagar depois</li>
              </ul>
              <p className={estilos.explica}>
                <strong>Não é obrigatório.</strong> O site inteiro funciona sem entrar.
              </p>
            </div>
            <Login
              titulo="Entrar ou criar conta"
              explicacao="Se ainda não houver conta com esse e-mail, ela é criada quando você clicar no link."
            />
          </div>
        </section>
      )}

      <div className={estilos.colunas}>
        <div className={estilos.principal}>
          {/* ── Quem você é ── */}
          <section className={estilos.grupo} aria-labelledby="g-quem">
            <h2 id="g-quem" className={estilos.tituloGrupo}>Quem você é</h2>
            <p className={estilos.explica}>
              O estilo e o nível viram a <strong>tag embaixo do seu nome</strong> em cada
              avaliação que você escrever. É o que faz a sua nota significar alguma coisa pra
              quem lê — “rápida demais” de um defensor não quer dizer o mesmo que de um
              atacante.
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
                  onChange={(e) =>
                    salvar({ estilo: (e.target.value || undefined) as EstiloJogador })}
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
                  onChange={(e) =>
                    salvar({ nivel: (e.target.value || undefined) as NivelJogador })}
                >
                  <option value="">escolher…</option>
                  {NIVEIS.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            </div>

            {perfilInteiro && (
              <label className={estilos.campo}>
                <span className={estilos.rotulo}>
                  O que você procura agora{' '}
                  <span className={`mono ${estilos.contador}`}>
                    {(perfil.procuro ?? '').length}/{PROCURO_MAXIMO}
                  </span>
                </span>
                <input
                  type="text"
                  maxLength={PROCURO_MAXIMO}
                  value={perfil.procuro ?? ''}
                  onChange={(e) => salvar({ procuro: e.target.value })}
                  placeholder="mais controle no backhand"
                />
                <span className={estilos.dica}>
                  Aparece em destaque no alto do seu perfil, com as suas palavras.
                </span>
              </label>
            )}
          </section>

          {/* ── Como você joga (só com conta) ── */}
          {perfilInteiro && (
            <section className={estilos.grupo} aria-labelledby="g-jogo">
              <h2 id="g-jogo" className={estilos.tituloGrupo}>Como você joga</h2>
              <p className={estilos.explica}>
                Isto é o contexto de tudo o que você escreve. Quem joga todo dia gasta uma
                borracha em três meses; quem joga aos sábados leva dois anos — e os dois vão
                dizer “durou pouco”.
              </p>

              <div className={estilos.campos}>
                <label className={estilos.campo}>
                  <span className={estilos.rotulo}>Joga desde</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={ANO_MINIMO}
                    max={anoAtual}
                    value={perfil.jogaDesde ?? ''}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      salvar({ jogaDesde: e.target.value === '' || !Number.isFinite(n) ? undefined : n });
                    }}
                    placeholder={String(anoAtual - 5)}
                  />
                  {/* O banco barra ano absurdo, mas não consegue barrar "ano que
                      vem" — um CHECK do Postgres não sabe que dia é hoje. Então
                      a régua fina é dita aqui, onde ela pode ser explicada. */}
                  <span className={estilos.dica}>
                    {perfil.jogaDesde && perfil.jogaDesde > anoAtual
                      ? `Esse ano ainda não chegou. O perfil vai ignorar até virar ${anoAtual} ou menos.`
                      : perfil.jogaDesde && perfil.jogaDesde >= ANO_MINIMO
                        ? `Vira “${contextoDoPerfil(perfil, anoAtual)[0]}” no seu perfil.`
                        : 'O ano em que você pegou numa raquete pela primeira vez.'}
                  </span>
                </label>

                <label className={estilos.campo}>
                  <span className={estilos.rotulo}>Quanto você joga</span>
                  <select
                    value={perfil.frequencia ?? ''}
                    onChange={(e) =>
                      salvar({ frequencia: (e.target.value || undefined) as Frequencia })}
                  >
                    <option value="">escolher…</option>
                    {FREQUENCIAS.map((f) => (
                      <option key={f} value={f}>{ROTULO_FREQUENCIA[f]}</option>
                    ))}
                  </select>
                </label>

                <label className={estilos.campo}>
                  <span className={estilos.rotulo}>Mão</span>
                  <select
                    value={perfil.mao ?? ''}
                    onChange={(e) => salvar({ mao: (e.target.value || undefined) as Mao })}
                  >
                    <option value="">escolher…</option>
                    {MAOS.map((m) => (
                      <option key={m} value={m}>{ROTULO_MAO[m]}</option>
                    ))}
                  </select>
                </label>

                <label className={estilos.campo}>
                  <span className={estilos.rotulo}>Empunhadura</span>
                  <select
                    value={perfil.empunhadura ?? ''}
                    onChange={(e) =>
                      salvar({ empunhadura: (e.target.value || undefined) as Empunhadura })}
                  >
                    <option value="">escolher…</option>
                    {EMPUNHADURAS.map((e) => (
                      <option key={e} value={e}>{ROTULO_EMPUNHADURA[e]}</option>
                    ))}
                  </select>
                </label>
              </div>
            </section>
          )}

          {/* ── Onde você joga (só com conta) ── */}
          {perfilInteiro && (
            <section className={estilos.grupo} aria-labelledby="g-onde">
              <h2 id="g-onde" className={estilos.tituloGrupo}>Onde você joga</h2>
              <p className={estilos.explica}>
                O clube é o único campo do perfil que liga você a outra pessoa de verdade — é
                por ele que alguém descobre que joga no mesmo lugar que você.
              </p>

              <div className={estilos.campos}>
                <label className={estilos.campo}>
                  <span className={estilos.rotulo}>Clube ou academia</span>
                  <input
                    type="text"
                    maxLength={CLUBE_MAXIMO}
                    value={perfil.clube ?? ''}
                    onChange={(e) => salvar({ clube: e.target.value })}
                    placeholder="FitPong"
                  />
                </label>
                <label className={estilos.campo}>
                  <span className={estilos.rotulo}>Cidade</span>
                  <input
                    type="text"
                    value={perfil.cidade ?? ''}
                    onChange={(e) => salvar({ cidade: e.target.value })}
                    placeholder="onde você joga"
                  />
                </label>
                <label className={estilos.campo}>
                  <span className={estilos.rotulo}>UF</span>
                  <input
                    type="text"
                    maxLength={2}
                    value={perfil.uf ?? ''}
                    onChange={(e) => salvar({ uf: e.target.value.toUpperCase() })}
                    placeholder="RJ"
                  />
                </label>
                <label className={estilos.campo}>
                  <span className={estilos.rotulo}>Bola que você usa</span>
                  <input
                    type="text"
                    maxLength={BOLA_MAXIMO}
                    value={perfil.bola ?? ''}
                    onChange={(e) => salvar({ bola: e.target.value })}
                    placeholder="Nittaku Premium 40+"
                  />
                </label>
              </div>
            </section>
          )}

          {/* ── Sua raquete ── */}
          <section className={estilos.grupo} aria-labelledby="g-raquete">
            <h2 id="g-raquete" className={estilos.tituloGrupo}>Sua raquete</h2>
            <p className={estilos.explica}>
              Uma lâmina e as duas borrachas. <Link href="/montar/">Não sabe o que combina?</Link>{' '}
              O montador mostra o preço somando e o que a combinação tem de atenção.
            </p>

            <div className={estilos.campos}>
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
        </div>

        {/* ── O trilho ── */}
        <aside className={estilos.trilho}>
          {falta.length > 0 && (
            <div className={estilos.caixaTrilho}>
              <h2 className={estilos.tituloTrilho}>O que ainda dá pra contar</h2>
              <ul className={estilos.listaFalta}>
                {falta.map((f) => (
                  <li key={f.campo}>
                    <span className={estilos.faltaRotulo}>{f.rotulo}</span>
                    <span className={estilos.faltaServe}>{f.serve}</span>
                  </li>
                ))}
              </ul>
              {/* Sem barra e sem porcentagem, de propósito: medidor de
                  completude faz preencher pra calar o medidor, e dado ruim é
                  pior que dado faltando. */}
              <p className={estilos.notaTrilho}>
                Nada aqui é obrigatório. A lista some conforme você conta.
              </p>
            </div>
          )}

        </aside>
      </div>

      {/* ── O que você já usou ── */}
      {perfilInteiro ? (
        <section className={estilos.grupo} aria-labelledby="t-estante">
          <h2 id="t-estante" className={estilos.tituloGrupo}>O que você já usou</h2>
          <EstanteEditor token={tokenGuardado() ?? null} usuarioId={usuario?.id ?? null} />
        </section>
      ) : null}

      {/* ── Minhas avaliações ── */}
      <section className={estilos.grupo} aria-labelledby="t-avaliacoes">
        <h2 id="t-avaliacoes" className={estilos.tituloGrupo}>Minhas avaliações</h2>
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

      <p className={estilos.passoAPasso}>
        <Link href="/comunidade/boas-vindas/">Preencher passo a passo →</Link>{' '}
        <span className={estilos.passoAPassoNota}>
          uma pergunta por tela, com o porquê de cada uma
        </span>
      </p>
    </div>
  );
}

/**
 * Antes isto era um `<select>` nativo com o catálogo inteiro dentro, e ele
 * falhava exatamente como o do montador falhava antes de 2026-08-04: sem busca
 * (o select só pula pra primeira letra), sem foto, e com o nome da marca
 * repetido — "Xiom Xiom Feel ZX3", porque 73 dos 952 materiais já trazem a
 * marca dentro do nome e o rótulo era `${marca} ${nome}` cru.
 *
 * O `SeletorMaterial` já resolvia os três, com o padrão ARIA de combobox
 * inteiro. Ele existia e esta tela não o usava — que é a pior espécie de
 * divergência, porque a correção já estava escrita e paga.
 */
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
  const opcoes = papel === 'lamina' ? LAMINAS : BORRACHAS;
  const escolhido = valor ? materialPorId(valor) : undefined;

  return (
    <div className={estilos.campo}>
      <SeletorMaterial
        rotulo={ROTULO_PAPEL[papel]}
        opcoes={opcoes}
        valor={escolhido}
        aoEscolher={aoEscolher}
      />
      {escolhido && (
        <span className={estilos.pecaEscolhida}>
          <FotoProduto id={escolhido.id} nome={escolhido.nome} tipo={escolhido.tipo} tamanho={36} />
          <Link href={`/materiais/${escolhido.id}/`} className={estilos.pecaLink}>
            ver ficha →
          </Link>
        </span>
      )}
    </div>
  );
}
