'use client';

/**
 * WikiPong Â· /comparar â€” o destino do componente Radar (overlay de 2 polÃ­gonos, D-15).
 *
 * D-12: os materiais comparados vivem na URL (?ids=a,b) â€” compartilhÃ¡vel, back-button
 * grÃ¡tis. Sem ids (ou com ids invÃ¡lidos), a pÃ¡gina diz a verdade (D-16) e oferece o
 * seletor; nunca finge uma comparaÃ§Ã£o.
 *
 * D-09 na tabela: destaque do MAIOR por linha Ã© fato ("maior â‰  melhor"), preÃ§o nÃ£o
 * recebe destaque, e toda derivada leva asterisco + nota A VALIDAR.
 * O radar Ã© aria-hidden; a tabela ao lado Ã© a alternativa acessÃ­vel.
 */
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { indicesDoMaximo, paraPalavra } from '@/src/logica/metricas';
import { metricasComparaveis, metricasDoRadar, temRadar } from '@/src/logica/comparacao';
import { temDesempenho } from '@/src/logica/filtros';
import type { Specs } from '@/src/logica/metricas';

/** Material do catÃ¡logo QUE PODE ser comparado: tem perfil de desempenho.
 *  Guarda de tipo prÃ³pria (em vez de usar `temDesempenho` cru) para nÃ£o perder
 *  os campos do MaterialCatalogo, como `simples`.
 *
 *  â”€â”€ O TIPO MENTIA, E O CRASH SAÃA DAÃ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  Ele declarava `durabilidade: number` e `durezaUnificada: number` como
 *  OBRIGATÃ“RIOS, mas `ehComparavel` sÃ³ chama `temDesempenho`, que nÃ£o olha
 *  nenhum dos dois (`filtros.ts` os declara opcionais e diz, no comentÃ¡rio,
 *  que sÃ£o de borracha: madeira nÃ£o gasta como esponja e nÃ£o tem dureza).
 *
 *  O TypeScript acreditou na afirmaÃ§Ã£o e parou de exigir checagem. Resultado:
 *  `a.durabilidade.toFixed(1)` em `undefined` â€” e como TODAS as 94 lÃ¢minas
 *  estÃ£o sem durabilidade, TODA comparaÃ§Ã£o lÃ¢mina Ã— lÃ¢mina quebrava. Medido:
 *  4.371 dos 10.588 pares do mesmo tipo, 41%.
 *
 *  Agora os dois campos sÃ£o opcionais aqui tambÃ©m, e quem usa precisa olhar. */
type MaterialComparavel = MaterialCatalogo & {
  specs: Specs;
  durabilidade?: number;
  durezaUnificada?: number;
};
const ehComparavel = (m: MaterialCatalogo): m is MaterialComparavel => temDesempenho(m);
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

/* NÃ£o existe mais lista fixa de eixos: eles saem das mÃ©tricas que os DOIS
   materiais realmente tÃªm (ver `metricas` em Comparacao). Era justamente uma
   constante de quatro rÃ³tulos aqui em cima, usada sem conferir quantos valores
   chegavam, que plotava os nÃºmeros nos Ã¢ngulos errados. */

export function ComparadorCliente() {
  const parametros = useSearchParams();
  const [modo, mudarModo] = usarModo(parametros.get('modo'));

  const idsURL = (parametros.get('ids') ?? '').split(',').filter(Boolean);
  const encontrados = idsURL.map(materialPorId).filter((m): m is MaterialCatalogo => m !== undefined);
  const desconhecidos = idsURL.filter((id) => !materialPorId(id));

  /* Comparar sÃ³ faz sentido entre PARES DO MESMO TIPO: borracha com borracha,
     lÃ¢mina com lÃ¢mina. Confrontar a velocidade de uma borracha com a de uma
     lÃ¢mina Ã© somar coisas que medem realidades diferentes â€” o nÃºmero sairia,
     mas nÃ£o significaria nada. E sÃ³ entra quem tem perfil de desempenho: uma
     bola nÃ£o tem "controle 9.0" pra comparar. */
  const tiposDiferentes =
    encontrados.length === 2 && encontrados[0].tipo !== encontrados[1].tipo;
  const semPerfil = encontrados.filter((m) => !ehComparavel(m));
  const comPerfil = encontrados.filter(ehComparavel);
  const prontos =
    comPerfil.length === 2 && !tiposDiferentes
      ? ([comPerfil[0], comPerfil[1]] as [MaterialComparavel, MaterialComparavel])
      : null;

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteÃºdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <div className={estilos.topo}>
          <h1 className={estilos.titulo}>
            {prontos ? `${prontos[0].nome} Ã— ${prontos[1].nome}` : 'Comparar materiais'}
          </h1>
          {prontos && <SeletorModo modo={modo} aoMudar={mudarModo} />}
        </div>

        {desconhecidos.length > 0 && (
          <p className={estilos.aviso} role="alert">
            NÃ£o encontramos no catÃ¡logo: <code className="mono">{desconhecidos.join(', ')}</code>.
          </p>
        )}

        {tiposDiferentes && (
          <p className={estilos.aviso} role="alert">
            <strong>
              {encontrados[0].nome} Ã© {encontrados[0].tipo.toLowerCase()} e {encontrados[1].nome} Ã©{' '}
              {encontrados[1].tipo.toLowerCase()}
            </strong>{' '}
            SÃ³ comparamos materiais do mesmo tipo. Velocidade de borracha e velocidade de lÃ¢mina
            sÃ£o medidas de coisas diferentes: o nÃºmero sairia, mas nÃ£o diria nada.
          </p>
        )}

        {semPerfil.length > 0 && (
          <p className={estilos.aviso} role="alert">
            <strong>{semPerfil.map((m) => m.nome).join(' e ')}</strong> nÃ£o{' '}
            {semPerfil.length > 1 ? 'tÃªm' : 'tem'} ficha de desempenho: nÃ£o hÃ¡ velocidade, efeito nem controle pra comparar.
          </p>
        )}

        {prontos ? <Comparacao par={prontos} modo={modo} /> : <Seletor preSelecionados={encontrados} />}
      </main>

      <Rodape />
    </>
  );
}

/** Estado vazio/parcial honesto (D-16): explica e resolve, sem comparaÃ§Ã£o fingida. */
function Seletor({ preSelecionados }: { preSelecionados: MaterialCatalogo[] }) {
  const [escolhidos, setEscolhidos] = useState<string[]>(preSelecionados.map((m) => m.id));

  const alternar = (id: string) =>
    setEscolhidos((atual) =>
      atual.includes(id) ? atual.filter((e) => e !== id) : atual.length < 2 ? [...atual, id] : atual,
    );

  /* Lista sÃ³ o que Ã© comparÃ¡vel, e â€” assim que o primeiro Ã© escolhido â€” trava no
     tipo dele. O usuÃ¡rio nunca monta um par invÃ¡lido pra descobrir depois. */
  const comparaveis = MATERIAIS.filter(ehComparavel);
  const tipoTravado =
    escolhidos.length > 0 ? materialPorId(escolhidos[0])?.tipo ?? null : null;

  const comparar = () => {
    window.history.pushState(null, '', `?ids=${escolhidos.join(',')}`);
  };

  return (
    <section aria-label="Escolher materiais">
      <p className={estilos.instrucao}>
        Escolha <b>dois materiais do mesmo tipo</b>. A comparaÃ§Ã£o abre com radar sobreposto
        e tabela de nÃºmeros ({escolhidos.length}/2 selecionados).
        {tipoTravado && <> Mostrando sÃ³ {tipoTravado.toLowerCase()}s.</>}
      </p>
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
                    {m.marca} Â· {m.tipo}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        className="botao-primario"
        disabled={escolhidos.length !== 2}
        onClick={comparar}
      >
        Comparar selecionados â†’
      </button>
    </section>
  );
}

function Comparacao({ par, modo }: { par: [MaterialComparavel, MaterialComparavel]; modo: 'simples' | 'tecnico' }) {
  const [a, b] = par;

  /* â”€â”€ UMA LISTA SÃ“, E O RADAR NASCE DELA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
     Antes eram DUAS: `eixosRadar` (rÃ³tulos) e `valoresRadar` (nÃºmeros), montadas
     lado a lado. Duas listas que precisam ter o mesmo tamanho sÃ£o duas listas
     que um dia nÃ£o tÃªm â€” e nÃ£o tinham: o JSX passava `EIXOS`, com quatro
     rÃ³tulos fixos, enquanto `valoresRadar` devolvia trÃªs nÃºmeros para lÃ¢mina.
     O `eixosRadar`, que existia justamente para esse caso, nÃ£o era usado em
     lugar nenhum.

     O Radar distribui os pontos por `valores.length`: trÃªs valores viram um
     triÃ¢ngulo a 120Â° sobre eixos desenhados a 90Â°. NÃ£o quebrava â€” plotava cada
     nÃºmero no eixo errado, que Ã© pior, porque parece certo.

     Agora rÃ³tulo e valores andam juntos no mesmo objeto. NÃ£o dÃ¡ mais para
     acrescentar um sem o outro.

     O QUE Ã‰ DE BORRACHA E NÃƒO DE LÃ‚MINA (e por isso Ã© opcional):
       Â· efeito       â€” propriedade da borracha; madeira nÃ£o tem
       Â· durabilidade â€” esponja gasta, madeira nÃ£o gasta assim
       Â· PerdÃ£o       â€” deriva da maciez da esponja; sem esponja, nÃ£o existe */
  const metricas = metricasComparaveis(a, b, modo === 'simples' ? 'Efeito' : 'Spin');
  const noRadar = metricasDoRadar(metricas);
  /* PolÃ­gono precisa de trÃªs vÃ©rtices para ser forma. Com dois â€” o caso da
     lÃ¢mina, que sÃ³ tem velocidade e controle â€” o radar vira um traÃ§o que nÃ£o
     diz nada, e nÃ£o desenhar Ã© melhor que desenhar ilegÃ­vel (D-16). */
  const desenhaRadar = temRadar(metricas);

  /* A tabela Ã© a MESMA lista do radar, mais o preÃ§o â€” que nunca entra no radar
     porque o eixo mede desempenho de 0 a 10 e reais nÃ£o sÃ£o isso. */
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
    // D-09: preÃ§o sem destaque (a convenÃ§Ã£o marca o maior; no preÃ§o, maior Ã© pior).
    { rotulo: 'PreÃ§o mÃ©dio', valores: [a.preco, b.preco], atributo: null, destacar: false, formato: brl },
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
                <th scope="col">MÃ©trica</th>
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

      {/* â”€â”€ Em portuguÃªs claro, lado a lado â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
          Nasceu de uma perda: ao consertar o radar, a comparaÃ§Ã£o de lÃ¢minas
          ficou sem ele. LÃ¢mina sÃ³ tem duas mÃ©tricas numÃ©ricas â€” velocidade e
          controle â€” e polÃ­gono de dois vÃ©rtices Ã© um traÃ§o. O radar de quatro
          eixos que aparecia ali antes era falso: recebia trÃªs valores e os
          plotava nos Ã¢ngulos errados.

          O que a lÃ¢mina TEM Ã© a construÃ§Ã£o declarada pelo fabricante. Traduzida,
          ela diz mais sobre a diferenÃ§a entre duas madeiras do que velocidade e
          controle sozinhos â€” e Ã© fato de fonte, nÃ£o nÃºmero inventado para
          preencher um grÃ¡fico. */}
      <section className={estilos.claroLado} aria-labelledby="titulo-claro-comparar">
        <h2 id="titulo-claro-comparar" className={estilos.claroTitulo}>
          Em portuguÃªs claro
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
                        <b>{t.rotulo}</b> â€” {t.significa}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <p className={estilos.nota}>
        * O PerdÃ£o Ã© uma conta nossa, feita a partir dos outros nÃºmeros, e a fÃ³rmula fica Ã  vista (versÃ£o 1, ainda esperando um especialista conferir; D-09). Destaque de â€œmaiorâ€ Ã© <strong>sÃ³ um fato, nÃ£o uma nota</strong>: maior nÃ£o quer dizer melhor, depende do seu jogo.
      </p>

      <button type="button" className={`botao-secundario ${estilos.trocar}`} onClick={trocar}>
        â† Escolher outros materiais
      </button>
    </>
  );
}
