'use client';

/**
 * WikiPong · /comparar — o destino do componente Radar (overlay de 2 polígonos, D-15).
 *
 * D-12: os materiais comparados vivem na URL (?ids=a,b) — compartilhável, back-button
 * grátis. Sem ids (ou com ids inválidos), a página diz a verdade (D-16) e oferece o
 * seletor; nunca finge uma comparação.
 *
 * D-09 na tabela: destaque do MAIOR por linha é fato ("maior ≠ melhor"), preço não
 * recebe destaque, e toda derivada leva asterisco + nota A VALIDAR.
 * O radar é aria-hidden; a tabela ao lado é a alternativa acessível.
 */
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { indicesDoMaximo, paraPalavra } from '@/src/logica/metricas';
import { metricasComparaveis, metricasDoRadar, temRadar } from '@/src/logica/comparacao';
import type { Specs } from '@/src/logica/metricas';

/** Material do catálogo posto lado a lado na comparação.
 *
 *  Hoje é QUALQUER material — o que limita é o tipo, não o dado. Nem sempre foi
 *  assim, e as duas mudanças abaixo explicam por quê.
 *
 *  ── O TIPO MENTIA, E O CRASH SAÍA DAÍ ──────────────────────────────────────
 *  Ele declarava `durabilidade: number` e `durezaUnificada: number` como
 *  OBRIGATÓRIOS, mas `ehComparavel` só chama `temDesempenho`, que não olha
 *  nenhum dos dois (`filtros.ts` os declara opcionais e diz, no comentário,
 *  que são de borracha: madeira não gasta como esponja e não tem dureza).
 *
 *  O TypeScript acreditou na afirmação e parou de exigir checagem. Resultado:
 *  `a.durabilidade.toFixed(1)` em `undefined` — e como TODAS as 94 lâminas
 *  estão sem durabilidade, TODA comparação lâmina × lâmina quebrava. Medido:
 *  4.371 dos 10.588 pares do mesmo tipo, 41%.
 *
 *  Agora os dois campos são opcionais aqui também, e quem usa precisa olhar.
 *
 *  -- E DEPOIS ELE FECHAVA DEMAIS --------------------------------------------
 *  A guarda também EXIGIA perfil de desempenho, e com isso 470 dos 678
 *  materiais não podiam ser comparados de jeito nenhum — a maioria do catálogo,
 *  com o cursor bloqueado em cada cartão.
 *
 *  Isso fazia sentido quando a comparação era só radar e tabela de números. Não
 *  faz mais: o `traduzir.ts` lê a construção declarada pelo fabricante em 678 de
 *  678 fichas. Duas lâminas sem specs se comparam pela madeira, pela posição da
 *  fibra, pela classe e pelo preço — que é como se compara lâmina numa loja de
 *  verdade, e é fato de fonte, não número inventado.
 *
 *  Agora `specs` é opcional aqui também. O que NÃO mudou: só se compara do mesmo
 *  tipo, borracha com borracha e madeira com madeira. */
type MaterialComparavel = MaterialCatalogo & {
  specs?: Specs;
  durabilidade?: number;
  durezaUnificada?: number;
};
import { MATERIAIS, materialPorId, type MaterialCatalogo } from '@/componentes/dados-materiais';
import { traduzirFicha } from '@/src/logica/traduzir';
import { fabricantePorId } from '@/componentes/dados-fabricante';
import { brl } from '@/componentes/formato';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Radar } from '@/componentes/Radar';
import { FotoProduto } from '@/componentes/FotoProduto';
import { Bolinhas } from '@/componentes/Bolinhas';
import { SeletorModo } from '@/componentes/SeletorModo';
import { usarModo } from '@/componentes/usarModo';
import estilos from './comparar.module.css';

/* Não existe mais lista fixa de eixos: eles saem das métricas que os DOIS
   materiais realmente têm (ver `metricas` em Comparacao). Era justamente uma
   constante de quatro rótulos aqui em cima, usada sem conferir quantos valores
   chegavam, que plotava os números nos ângulos errados. */

export function ComparadorCliente() {
  const parametros = useSearchParams();
  const [modo, mudarModo] = usarModo(parametros.get('modo'));

  const idsURL = (parametros.get('ids') ?? '').split(',').filter(Boolean);
  const encontrados = idsURL.map(materialPorId).filter((m): m is MaterialCatalogo => m !== undefined);
  const desconhecidos = idsURL.filter((id) => !materialPorId(id));

  /* Comparar só faz sentido entre PARES DO MESMO TIPO: borracha com borracha,
     lâmina com lâmina. Confrontar a velocidade de uma borracha com a de uma
     lâmina é somar coisas que medem realidades diferentes — o número sairia,
     mas não significaria nada. Esta é a única trava, e é decisão de produto. */
  const tiposDiferentes =
    encontrados.length === 2 && encontrados[0].tipo !== encontrados[1].tipo;
  /* Só o TIPO barra agora. A exigência de perfil de desempenho saiu: ela
     bloqueava 470 dos 678 materiais, e a comparação deixou de depender só de
     número quando a ficha do fabricante passou a ser traduzida. */
  const prontos =
    encontrados.length === 2 && !tiposDiferentes
      ? ([encontrados[0], encontrados[1]] as [MaterialComparavel, MaterialComparavel])
      : null;

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <div className={estilos.topo}>
          <h1 className={estilos.titulo}>
            {prontos ? `${prontos[0].nome} × ${prontos[1].nome}` : 'Comparar materiais'}
          </h1>
          {prontos && <SeletorModo modo={modo} aoMudar={mudarModo} />}
        </div>

        {desconhecidos.length > 0 && (
          <p className={estilos.aviso} role="alert">
            Não encontramos no catálogo: <code className="mono">{desconhecidos.join(', ')}</code>.
          </p>
        )}

        {tiposDiferentes && (
          <p className={estilos.aviso} role="alert">
            <strong>
              {encontrados[0].nome} é {encontrados[0].tipo.toLowerCase()} e {encontrados[1].nome} é{' '}
              {encontrados[1].tipo.toLowerCase()}
            </strong>{' '}
            Só comparamos materiais do mesmo tipo. Velocidade de borracha e velocidade de lâmina
            são medidas de coisas diferentes: o número sairia, mas não diria nada.
          </p>
        )}

        {/* O aviso "não tem ficha de desempenho" saiu daqui. Ele existia porque
            faltar perfil IMPEDIA a comparação inteira. Não impede mais: a tabela
            mostra as métricas que existirem, e quando não existe nenhuma a
            própria seção diz isso, no lugar onde a pessoa está olhando. */}

        {prontos ? <Comparacao par={prontos} modo={modo} /> : <Seletor preSelecionados={encontrados} />}
      </main>

      <Rodape />
    </>
  );
}

/** Estado vazio/parcial honesto (D-16): explica e resolve, sem comparação fingida. */
function Seletor({ preSelecionados }: { preSelecionados: MaterialCatalogo[] }) {
  const [escolhidos, setEscolhidos] = useState<string[]>(preSelecionados.map((m) => m.id));

  const alternar = (id: string) =>
    setEscolhidos((atual) =>
      atual.includes(id) ? atual.filter((e) => e !== id) : atual.length < 2 ? [...atual, id] : atual,
    );

  const [busca, setBusca] = useState('');

  const tipoTravado =
    escolhidos.length > 0 ? materialPorId(escolhidos[0])?.tipo ?? null : null;

  /* ── A LISTA AGORA CUMPRE O QUE A FRASE PROMETE ─────────────────────────────
     A instrução dizia "Mostrando só borrachas" e o que se via era o catálogo
     inteiro — lâmina, raquete e bola no meio, apenas desabilitadas. Frase e tela
     discordavam, e com 678 materiais isso virou uma lista enorme de itens que
     não dá para clicar.

     Agora o tipo travado FILTRA de verdade, e a busca corta o resto. O que some
     não é informação escondida: é opção que não pode ser escolhida. */
  const comparaveis = MATERIAIS.filter((m) => {
    if (tipoTravado !== null && m.tipo !== tipoTravado && !escolhidos.includes(m.id)) return false;
    if (!busca.trim()) return true;
    const alvo = `${m.nome} ${m.marca} ${m.tipo}`.toLowerCase();
    return busca
      .toLowerCase()
      .split(/\s+/)
      .every((termo) => alvo.includes(termo));
  });

  const comparar = () => {
    window.history.pushState(null, '', `?ids=${escolhidos.join(',')}`);
  };

  return (
    <section aria-label="Escolher materiais">
      <p className={estilos.instrucao}>
        Escolha <b>dois materiais do mesmo tipo</b>. A comparação abre com radar sobreposto
        e tabela de números.
        {tipoTravado && (
          <>
            {' '}
            Mostrando só {tipoTravado.toLowerCase()}s, porque é com o que a{' '}
            {tipoTravado.toLowerCase()} escolhida se compara.
          </>
        )}
      </p>

      {/* Com 678 materiais, rolar até achar não é caminho. */}
      <input
        type="search"
        className={estilos.buscaEscolha}
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome, marca ou tipo…"
        aria-label="Buscar material para comparar"
      />

      {comparaveis.length === 0 && (
        <p className={estilos.semResultado}>
          Nada com <b>{busca}</b>
          {tipoTravado ? ` entre as ${tipoTravado.toLowerCase()}s` : ''}. Tente outro termo.
        </p>
      )}

      <ul className={estilos.listaEscolha}>
        {comparaveis.map((m) => {
          const marcado = escolhidos.includes(m.id);
          const bloqueado =
            !marcado && (escolhidos.length >= 2 || (tipoTravado !== null && m.tipo !== tipoTravado));
          return (
            <li key={m.id}>
              <label className={`${estilos.itemEscolha} ${marcado ? estilos.itemMarcado : ''}`}>
                <input
                  type="checkbox"
                  checked={marcado}
                  disabled={bloqueado}
                  onChange={() => alternar(m.id)}
                />
                <FotoProduto id={m.id} nome={m.nome} tipo={m.tipo} tamanho={40} />
                <span>
                  <b>{m.nome}</b>
                  <span className={`mono ${estilos.metaEscolha}`}>
                    {m.marca} · {m.tipo}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {/* ── A BARRA DE AÇÃO GRUDA NO PÉ DA TELA ───────────────────────────────
          O botão ficava depois da lista. Com 678 materiais isso significava
          rolar a página inteira até o fim para clicar em "Comparar" — inclusive
          quando os dois já estavam escolhidos na primeira tela.

          Fixa no rodapé da janela, ela está sempre a um clique, e o contador ao
          lado diz o que falta sem precisar voltar lá em cima. */}
      <div className={estilos.barraAcao}>
        <p className={estilos.contadorEscolha} aria-live="polite">
          {escolhidos.length === 0 && 'Nenhum material escolhido'}
          {escolhidos.length === 1 && `${materialPorId(escolhidos[0])?.nome} · falta escolher o segundo`}
          {escolhidos.length === 2 && (
            <>
              {materialPorId(escolhidos[0])?.nome} <span aria-hidden="true">×</span>{' '}
              {materialPorId(escolhidos[1])?.nome}
            </>
          )}
        </p>
        <div className={estilos.barraAcaoBotoes}>
          {escolhidos.length > 0 && (
            <button
              type="button"
              className={`botao-secundario ${estilos.limparEscolha}`}
              onClick={() => setEscolhidos([])}
            >
              Limpar
            </button>
          )}
          <button
            type="button"
            className="botao-primario"
            disabled={escolhidos.length !== 2}
            onClick={comparar}
          >
            Comparar <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function Comparacao({ par, modo }: { par: [MaterialComparavel, MaterialComparavel]; modo: 'simples' | 'tecnico' }) {
  const [a, b] = par;

  /* ── UMA LISTA SÓ, E O RADAR NASCE DELA ────────────────────────────────────
     Antes eram DUAS: `eixosRadar` (rótulos) e `valoresRadar` (números), montadas
     lado a lado. Duas listas que precisam ter o mesmo tamanho são duas listas
     que um dia não têm — e não tinham: o JSX passava `EIXOS`, com quatro
     rótulos fixos, enquanto `valoresRadar` devolvia três números para lâmina.
     O `eixosRadar`, que existia justamente para esse caso, não era usado em
     lugar nenhum.

     O Radar distribui os pontos por `valores.length`: três valores viram um
     triângulo a 120° sobre eixos desenhados a 90°. Não quebrava — plotava cada
     número no eixo errado, que é pior, porque parece certo.

     Agora rótulo e valores andam juntos no mesmo objeto. Não dá mais para
     acrescentar um sem o outro.

     O QUE É DE BORRACHA E NÃO DE LÂMINA (e por isso é opcional):
       · efeito       — propriedade da borracha; madeira não tem
       · durabilidade — esponja gasta, madeira não gasta assim
       · Perdão       — deriva da maciez da esponja; sem esponja, não existe */
  const metricas = metricasComparaveis(a, b, modo === 'simples' ? 'Efeito' : 'Spin');
  const noRadar = metricasDoRadar(metricas);
  /* Polígono precisa de três vértices para ser forma. Com dois — o caso da
     lâmina, que só tem velocidade e controle — o radar vira um traço que não
     diz nada, e não desenhar é melhor que desenhar ilegível (D-16). */
  const desenhaRadar = temRadar(metricas);

  /* A tabela é a MESMA lista do radar, mais o preço — que nunca entra no radar
     porque o eixo mede desempenho de 0 a 10 e reais não são isso. */
  const linhas: {
    rotulo: string;
    valores: [number, number];
    atributo: 'velocidade' | 'spin' | 'controle' | 'perdao' | null;
    destacar: boolean;
    formato: (v: number) => string;
  }[] = [
    ...metricas.map((m) => ({
      rotulo: m.rotulo,
      valores: m.valores,
      atributo: m.atributo,
      destacar: true,
      formato: (v: number) => v.toFixed(1),
    })),
    // D-09: preço sem destaque (a convenção marca o maior; no preço, maior é pior).
    { rotulo: 'Preço médio', valores: [a.preco, b.preco], atributo: null, destacar: false, formato: brl },
  ];

  const trocar = () => window.history.pushState(null, '', window.location.pathname);

  return (
    <>
      <div className={estilos.palcoComparacao}>
        {desenhaRadar && (
          <div className={estilos.radarCaixa}>
            <Radar
              eixos={noRadar.map((m) => m.eixo)}
              series={[
                { nome: a.nome, valores: noRadar.map((m) => m.valores[0]), variante: 'tracejada' },
                { nome: b.nome, valores: noRadar.map((m) => m.valores[1]), variante: 'solida' },
              ]}
              animado
            />
          </div>
        )}

        <div className={estilos.tabelaWrap}>
          <table className={estilos.tabela}>
            <thead>
              <tr>
                <th scope="col">Métrica</th>
                {[a, b].map((m) => (
                  <th scope="col" key={m.id}>
                    {m.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => {
                const maximos = linha.destacar ? indicesDoMaximo([...linha.valores]) : [];
                return (
                  <tr key={linha.rotulo}>
                    <th scope="row" className={estilos.atributo}>
                      {linha.rotulo}
                    </th>
                    {linha.valores.map((valor, i) => {
                      const ehMaximo = maximos.includes(i);
                      return (
                        <td key={i}>
                          {modo === 'tecnico' || !linha.atributo ? (
                            <span className={`mono ${estilos.valor} ${ehMaximo ? estilos.maximo : ''}`}>
                              {linha.formato(valor)}
                              {ehMaximo && <span className={estilos.tagMaior}>maior</span>}
                            </span>
                          ) : (
                            <span className={`${estilos.valorSimples} ${ehMaximo ? estilos.maximo : ''}`}>
                              <Bolinhas valor={valor} />
                              <span>{paraPalavra(linha.atributo, valor)}</span>
                              {ehMaximo && <span className={estilos.tagMaior}>maior</span>}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Em português claro, lado a lado ────────────────────────────────────
          Nasceu de uma perda: ao consertar o radar, a comparação de lâminas
          ficou sem ele. Lâmina só tem duas métricas numéricas — velocidade e
          controle — e polígono de dois vértices é um traço. O radar de quatro
          eixos que aparecia ali antes era falso: recebia três valores e os
          plotava nos ângulos errados.

          O que a lâmina TEM é a construção declarada pelo fabricante. Traduzida,
          ela diz mais sobre a diferença entre duas madeiras do que velocidade e
          controle sozinhos — e é fato de fonte, não número inventado para
          preencher um gráfico. */}
      <section className={estilos.claroLado} aria-labelledby="titulo-claro-comparar">
        <h2 id="titulo-claro-comparar" className={estilos.claroTitulo}>
          Em português claro
        </h2>
        <div className={estilos.claroGrade}>
          {[a, b].map((m) => {
            const leitura = traduzirFicha(m.tipo, fabricantePorId(m.id)?.ficha);
            return (
              <div key={m.id} className={estilos.claroColuna}>
                <h3 className={estilos.claroNome}>{m.nome}</h3>
                <p className={estilos.claroResumo}>
                  {leitura?.resumo || m.simples.frase}
                </p>
                {leitura && leitura.tracos.length > 0 && (
                  <ul className={estilos.claroTracos}>
                    {leitura.tracos.map((t) => (
                      <li key={t.rotulo}>
                        <b>{t.rotulo}</b> — {t.significa}
                      </li>
                    ))}
                  </ul>
                )}

                {/* A ficha CRUA do fabricante, nas palavras dele. É o confronto
                    que sustenta a comparação quando não há número — construção,
                    superfície, dureza — e o único jeito honesto de comparar duas
                    madeiras que nenhuma fonte mediu. */}
                {(() => {
                  const ficha = fabricantePorId(m.id)?.ficha;
                  if (!ficha || ficha.length === 0) return null;
                  return (
                    <dl className={estilos.claroFicha}>
                      {ficha.map((l) => (
                        <div key={l.rotulo}>
                          <dt>{l.rotulo}</dt>
                          <dd>{l.valor}</dd>
                        </div>
                      ))}
                    </dl>
                  );
                })()}
              </div>
            );
          })}
        </div>

        {/* Sem nenhuma métrica numérica, a tabela acima tem só o preço. Dizer
            por quê, aqui embaixo do que de fato compara, evita que a pessoa
            ache que faltou carregar (D-16). */}
        {metricas.length === 0 && (
          <p className={estilos.claroSemNumero}>
            Nenhum dos dois tem perfil de desempenho medido, então a tabela acima traz só o preço.
            A comparação aqui é pela ficha do fabricante — que é como se compara{' '}
            {a.tipo.toLowerCase()} na loja.
          </p>
        )}
      </section>

      <p className={estilos.nota}>
        * O Perdão é uma conta nossa, feita a partir dos outros números, e a fórmula fica à vista (versão 1, ainda esperando um especialista conferir; D-09). Destaque de “maior” é <strong>só um fato, não uma nota</strong>: maior não quer dizer melhor, depende do seu jogo.
      </p>

      <button type="button" className={`botao-secundario ${estilos.trocar}`} onClick={trocar}>
        ← Escolher outros materiais
      </button>
    </>
  );
}
