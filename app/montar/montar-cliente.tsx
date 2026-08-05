'use client';

/**
 * WikiPong · /montar — configurador de raquete.
 *
 * É o momento de maior intenção do site: a pessoa deixa de ler sobre material e
 * começa a montar o dela. /conjuntos mostra montagens PRONTAS; aqui ela faz a
 * própria, com o preço somando ao vivo.
 *
 * D-12: a montagem inteira vive na URL (?lamina=&fh=&bh=) — compartilhável,
 * back-button de graça, e dá pra mandar pro amigo pedir opinião.
 *
 * D-16: NÃO existe nota de desempenho do conjunto. O que aparece é fato (specs
 * de cada peça, soma dos preços) e observações derivadas com critério visível.
 * A recusa fica dita na própria tela, não escondida.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { FotoProduto } from '@/componentes/FotoProduto';
import { SeletorMaterial } from '@/componentes/SeletorMaterial';
import { LadosDaRaquete } from '@/componentes/LadosDaRaquete';
import { repositorioPerfilAtual, perfilVazio, type Perfil } from '@/src/logica/perfil';
import { INTENCAO_DO_ESTILO, ROTULO_ESTILO } from '@/src/logica/avaliacoes';
import { MATERIAIS, materialPorId, type MaterialCatalogo } from '@/componentes/dados-materiais';
import { brl } from '@/componentes/formato';
import { paraPalavra } from '@/src/logica/metricas';
import {
  observacoes,
  vereditosDaMontagem,
  precoTotal,
  completa,
  ROTULO_PAPEL,
  type Montagem,
  type PecaMontagem,
  type PapelPeca,
} from '@/src/logica/montagem';
import estilos from './montar.module.css';

/* ── A TRAVA DE PERFIL DE DESEMPENHO SAIU (2026-08-04) ────────────────────────
   O montador só oferecia peça com specs, e com isso escondia 469 das 675:
   299 lâminas de 393 e 170 borrachas de 282. Quem monta raquete não escolhe por
   decimal — escolhe pelo nome, pela marca e pelo preço, como na loja. A tabela
   de specs é CONSEQUÊNCIA do que as peças têm, não porta de entrada.

   O que continua barrado é o que nunca foi peça de raquete: bola e raquete já
   montada. Isso é tipo, não dado. */
const ehPeca = (m: MaterialCatalogo): m is MaterialCatalogo & PecaMontagem =>
  m.tipo === 'Lâmina' || m.tipo === 'Borracha';
const pecaValida = (m: MaterialCatalogo | undefined): PecaMontagem | undefined =>
  m && ehPeca(m) ? m : undefined;

const LAMINAS = MATERIAIS.filter((m) => m.tipo === 'Lâmina');
const BORRACHAS = MATERIAIS.filter((m) => m.tipo === 'Borracha');

const CAMPOS: { papel: PapelPeca; chave: string; opcoes: typeof MATERIAIS }[] = [
  { papel: 'lamina', chave: 'lamina', opcoes: LAMINAS },
  { papel: 'fh', chave: 'fh', opcoes: BORRACHAS },
  { papel: 'bh', chave: 'bh', opcoes: BORRACHAS },
];

export function MontarCliente() {
  const parametros = useSearchParams();

  const montagem: Montagem = useMemo(
    () => ({
      lamina: pecaValida(materialPorId(parametros.get('lamina') ?? '')),
      fh: pecaValida(materialPorId(parametros.get('fh') ?? '')),
      bh: pecaValida(materialPorId(parametros.get('bh') ?? '')),
    }),
    [parametros],
  );

  /* ── O PERFIL DE QUEM MONTA ─────────────────────────────────────────────────
     A tela dizia o preço e apontava choques entre as peças, e nunca relacionava
     nada com QUEM está montando. A pessoa já declarou estilo e nível no perfil
     da comunidade — usar isso é o mínimo, e é dado que ela mesma deu.

     Lido no cliente porque o perfil pode estar no localStorage ou no Supabase, e
     esta página é export estático: no build não existe pessoa nenhuma. */
  const [perfil, setPerfil] = useState<Perfil>(perfilVazio);
  useEffect(() => {
    let vivo = true;
    repositorioPerfilAtual()
      .then((r) => r.ler())
      .then((p) => { if (vivo) setPerfil(p); })
      .catch(() => { /* sem perfil, a seção simplesmente não aparece */ });
    return () => { vivo = false; };
  }, []);

  const vereditos = useMemo(
    () => vereditosDaMontagem(montagem, perfil.estilo, perfil.nivel, INTENCAO_DO_ESTILO),
    [montagem, perfil],
  );
  const temPerfil = Boolean(perfil.estilo || perfil.nivel);

  /* As características que dá para confrontar entre os dois lados. Só borracha
     tem efeito e durabilidade; a lâmina não entra aqui de propósito, porque ela
     é UMA e o gráfico é sobre a diferença entre DOIS lados. */
  const linhasLados = useMemo(
    () => [
      { rotulo: 'Velocidade', fh: montagem.fh?.specs?.velocidade, bh: montagem.bh?.specs?.velocidade },
      { rotulo: 'Efeito', fh: montagem.fh?.specs?.spin, bh: montagem.bh?.specs?.spin },
      { rotulo: 'Controle', fh: montagem.fh?.specs?.controle, bh: montagem.bh?.specs?.controle },
      { rotulo: 'Durab.', fh: montagem.fh?.durabilidade, bh: montagem.bh?.durabilidade },
    ],
    [montagem],
  );

  const total = precoTotal(montagem);
  const obs = observacoes(montagem);
  const pronta = completa(montagem);
  const escolhidas = [montagem.lamina, montagem.fh, montagem.bh].filter(Boolean).length;

  function escolher(chave: string, id: string) {
    const p = new URLSearchParams(parametros.toString());
    if (id) p.set(chave, id);
    else p.delete(chave);
    const qs = p.toString();
    window.history.pushState(null, '', qs ? `?${qs}` : window.location.pathname);
  }

  function limpar() {
    window.history.pushState(null, '', window.location.pathname);
  }

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/catalogo/">Materiais</Link> / Montar
        </p>
        <h1 className={estilos.titulo}>Monte a sua raquete</h1>
        <p className={estilos.lede}>
          Uma lâmina e duas borrachas. Escolha as peças e veja o preço real somando, e o que a combinação tem de atenção. Sem palpite de nota: só o que dá pra afirmar.
        </p>

        <div className={estilos.corpo}>
          {/* ── Escolha das peças ── */}
          <section className={estilos.escolhas} aria-label="Escolher peças">
            {CAMPOS.map(({ papel, chave, opcoes }) => {
              const atual = montagem[papel];
              return (
                <div key={chave} className={estilos.campo}>
                  <SeletorMaterial
                    rotulo={ROTULO_PAPEL[papel]}
                    opcoes={opcoes}
                    valor={atual}
                    aoEscolher={(id) => escolher(chave, id)}
                  />

                  {atual && (
                    <Link href={`/materiais/${atual.id}/`} className={estilos.previa}>
                      <FotoProduto id={atual.id} nome={atual.nome} tipo={atual.tipo} tamanho={52} />
                      <span className={estilos.previaTexto}>
                        <span className={estilos.previaNome}>{atual.nome}</span>
                        <span className={`mono ${estilos.previaMeta}`}>
                          {atual.nivel}
                          {atual.specs
                            ? ` · ${paraPalavra('controle', atual.specs.controle)}`
                            : ''}
                        </span>
                      </span>
                      <span className={`mono ${estilos.previaPreco}`}>{brl(atual.preco)}</span>
                    </Link>
                  )}
                </div>
              );
            })}

            {escolhidas > 0 && (
              <button type="button" className={estilos.limpar} onClick={limpar}>
                Começar de novo
              </button>
            )}
          </section>

          {/* ── Resultado ── */}
          <section className={estilos.resultado} aria-label="Sua montagem" aria-live="polite">
            <div className={estilos.totalCaixa}>
              <p className={`mono ${estilos.totalValor}`}>{brl(total)}</p>
              <p className={estilos.totalNota}>
                {pronta
                  ? 'somando as 3 peças'
                  : `${escolhidas} de 3 peças escolhidas; o total cresce conforme você escolhe`}
              </p>
            </div>

            {pronta ? (
              <>
                {/* Fato: as specs lado a lado. Sem média, sem nota do conjunto. */}
                <table className={estilos.tabela}>
                  <thead>
                    <tr>
                      <th scope="col">Peça</th>
                      <th scope="col">Vel.</th>
                      <th scope="col">Efeito</th>
                      <th scope="col">Controle</th>
                      <th scope="col">Durab.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['lamina', 'fh', 'bh'] as PapelPeca[]).map((papel) => {
                      const p = montagem[papel]!;
                      return (
                        <tr key={papel}>
                          <th scope="row" className={estilos.celulaPeca}>
                            <span className={estilos.celulaPapel}>{ROTULO_PAPEL[papel]}</span>
                            {p.nome}
                          </th>
                          {/* Travessão quando o número não existe — nunca zero.
                              Depois que o montador passou a aceitar as 675 peças,
                              a maioria chega aqui sem perfil de desempenho, e
                              zero leria como "velocidade nenhuma". */}
                          <td className="mono">{p.specs ? p.specs.velocidade.toFixed(1) : '—'}</td>
                          <td className="mono">{p.specs?.spin !== undefined ? p.specs.spin.toFixed(1) : '—'}</td>
                          <td className="mono">{p.specs ? p.specs.controle.toFixed(1) : '—'}</td>
                          {/* Só a borracha gasta: travessão na lâmina, não zero. */}
                          <td className="mono">
                            {p.durabilidade !== undefined ? p.durabilidade.toFixed(1) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* ── OS DOIS LADOS, FRENTE A FRENTE ─────────────────────
                    Radar e barra já existem na ficha e na comparação. Aqui a
                    pergunta é outra — "os meus dois lados estão
                    desequilibrados?" — e ela pede outro desenho: uma borboleta,
                    com o forehand crescendo para a esquerda e o backhand para a
                    direita a partir do nome da característica. Barra simétrica
                    lê como lados parecidos; barra torta, como um lado que
                    domina. Sem legenda, sem cor para decorar. */}
                {montagem.fh && montagem.bh && (
                  <LadosDaRaquete
                    linhas={linhasLados}
                    nomeFH={montagem.fh.nome}
                    nomeBH={montagem.bh.nome}
                  />
                )}

                {/* ── COMBINA COM O SEU PERFIL? ──────────────────────────────
                    Só aparece para quem já declarou estilo ou nível na
                    comunidade. Sem perfil, a seção some em vez de pedir cadastro
                    no meio de uma ferramenta que funciona sem ele. */}
                {temPerfil && vereditos.length > 0 && (
                  <section className={estilos.perfil} aria-labelledby="titulo-perfil">
                    <h3 id="titulo-perfil" className={estilos.perfilTitulo}>
                      Combina com o seu perfil?
                    </h3>
                    <p className={estilos.perfilLede}>
                      Comparado com o que você declarou na comunidade
                      {perfil.estilo ? `: ${ROTULO_ESTILO[perfil.estilo]}` : ''}
                      {perfil.nivel ? `, nível ${perfil.nivel}` : ''}. É ponto de partida, não
                      sentença — montar contra o próprio estilo é escolha legítima.
                    </p>
                    <ul className={estilos.perfilLista}>
                      {vereditos.map((v) => (
                        <li key={v.papel} className={estilos.perfilItem}>
                          <span
                            className={
                              v.estilo === 'destoa' || v.nivel === 'destoa'
                                ? estilos.marcaDestoa
                                : v.estilo === 'combina' || v.nivel === 'combina'
                                  ? estilos.marcaCombina
                                  : estilos.marcaNeutra
                            }
                            aria-hidden="true"
                          />
                          <span>
                            <b>{ROTULO_PAPEL[v.papel]}</b> — {v.peca.nome}
                            {v.texto ? `: ${v.texto}.` : ' não tem nada que destoe do seu perfil.'}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {obs.length > 0 && (
                  <ul className={estilos.observacoes}>
                    {obs.map((o) => (
                      <li
                        key={o.titulo}
                        className={`${estilos.obs} ${o.tipo === 'atencao' ? estilos.obsAtencao : ''}`}
                      >
                        <p className={estilos.obsTitulo}>{o.titulo}</p>
                        <p className={estilos.obsTexto}>{o.texto}</p>
                      </li>
                    ))}
                  </ul>
                )}

                {/* A recusa dita na cara, não escondida (D-16) */}
                <div className={estilos.recusa}>
                  <p className={estilos.recusaTitulo}>Por que não damos uma nota ao conjunto</p>
                  <p>
                    Seria fácil publicar uma “velocidade da montagem”. Não publicamos porque não
                    saberíamos defender: a lâmina e as duas borrachas <strong>interagem</strong>,
                    cada lado faz um trabalho diferente, e o resultado não é soma nem média.
                    Qualquer número aí seria invenção com cara de medição.
                  </p>
                  <p className={estilos.recusaLinks}>
                    <Link href="/conjuntos/">Ver montagens que já fazem sentido →</Link>
                    <Link href="/aprender/montando-raquete/">Guia: montando sua raquete →</Link>
                  </p>
                </div>
              </>
            ) : (
              <div className={estilos.vazio}>
                <p className={estilos.vazioTitulo}>Escolha as três peças</p>
                <p>
                  Assim que a lâmina e as duas borrachas estiverem escolhidas, aparecem aqui as
                  specs lado a lado e as observações da combinação.
                </p>
                <p className={estilos.vazioDica}>
                  Sem ideia de por onde começar? <Link href="/quiz/">Faça o teste de perfil</Link>{' '}
                  ou veja <Link href="/conjuntos/">montagens prontas</Link>.
                </p>
              </div>
            )}

          </section>
        </div>
      </main>

      <Rodape />
    </>
  );
}
