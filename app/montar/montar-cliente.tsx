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
import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { FotoProduto } from '@/componentes/FotoProduto';
import { MATERIAIS, materialPorId, type MaterialCatalogo } from '@/componentes/dados-materiais';
import { temDesempenho } from '@/src/logica/filtros';
import { brl } from '@/componentes/formato';
import { perdao, paraPalavra } from '@/src/logica/metricas';
import {
  observacoes,
  precoTotal,
  completa,
  ROTULO_PAPEL,
  type Montagem,
  type PecaMontagem,
  type PapelPeca,
} from '@/src/logica/montagem';
import estilos from './montar.module.css';

/* Só entra na montagem quem tem perfil de desempenho — o configurador mostra
   specs lado a lado, e peça sem spec não teria o que mostrar. Na prática isso já
   exclui a bola, que não é peça de raquete de todo jeito. */
const ehPeca = (m: MaterialCatalogo): m is MaterialCatalogo & PecaMontagem => temDesempenho(m);
const pecaValida = (m: MaterialCatalogo | undefined): PecaMontagem | undefined =>
  m && ehPeca(m) ? m : undefined;

const LAMINAS = MATERIAIS.filter(ehPeca).filter((m) => m.tipo === 'Lâmina');
const BORRACHAS = MATERIAIS.filter(ehPeca).filter((m) => m.tipo === 'Borracha');

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
          Uma lâmina e duas borrachas. Escolha as peças e veja o preço real somando — e o que a
          combinação tem de atenção. Sem palpite de nota: só o que dá pra afirmar.
        </p>

        <div className={estilos.corpo}>
          {/* ── Escolha das peças ── */}
          <section className={estilos.escolhas} aria-label="Escolher peças">
            {CAMPOS.map(({ papel, chave, opcoes }) => {
              const atual = montagem[papel];
              return (
                <div key={chave} className={estilos.campo}>
                  <label className={estilos.campoRotulo} htmlFor={`campo-${chave}`}>
                    {ROTULO_PAPEL[papel]}
                  </label>
                  <select
                    id={`campo-${chave}`}
                    className={estilos.select}
                    value={atual?.id ?? ''}
                    onChange={(e) => escolher(chave, e.target.value)}
                  >
                    <option value="">— escolher —</option>
                    {opcoes.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nome} · {o.marca} · {brl(o.preco)}
                      </option>
                    ))}
                  </select>

                  {atual && (
                    <Link href={`/materiais/${atual.id}/`} className={estilos.previa}>
                      <FotoProduto id={atual.id} nome={atual.nome} tipo={atual.tipo} tamanho={52} />
                      <span className={estilos.previaTexto}>
                        <span className={estilos.previaNome}>{atual.nome}</span>
                        <span className={`mono ${estilos.previaMeta}`}>
                          {atual.nivel} · {paraPalavra('controle', atual.specs.controle)}
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
                  : `${escolhidas} de 3 peças escolhidas — o total cresce conforme você escolhe`}
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
                      <th scope="col">Perdão*</th>
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
                          <td className="mono">{p.specs.velocidade.toFixed(1)}</td>
                          <td className="mono">{p.specs.spin.toFixed(1)}</td>
                          <td className="mono">{p.specs.controle.toFixed(1)}</td>
                          <td className="mono">{perdao(p.specs, p.durezaUnificada).toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

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

            <p className={estilos.notaDerivada}>
              * Perdão é métrica derivada com fórmula aberta (proposta v1, pendente de validação
              do especialista — D-09).
            </p>
          </section>
        </div>
      </main>

      <Rodape />
    </>
  );
}
