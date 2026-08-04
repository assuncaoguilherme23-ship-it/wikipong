/**
 * WikiPong · "Parecidos com este" — o gráfico comparativo da ficha
 * ==============================================================================
 * A ficha tinha duas comparações e nenhuma delas tinha NOME:
 *
 *   · o radar contra a mediana do catálogo — mediana não se compra
 *   · a régua de onde o material cai entre os semelhantes — nem essa
 *
 * Este responde a pergunta seguinte, que é a que faz alguém abrir a ficha: **e o
 * que mais existe parecido com este?** Três alternativas concretas, com nome,
 * número e preço, e o caminho para a comparação completa.
 *
 * ── POR QUE BARRAS E NÃO OUTRO RADAR ─────────────────────────────────────────
 *
 * Radar com quatro polígonos vira emaranhado — é o motivo de o /comparar aceitar
 * só dois materiais. Barra agrupada por índice deixa comparar quatro valores na
 * horizontal sem nenhum se esconder atrás do outro, e escala para qualquer
 * quantidade de índices, inclusive um.
 *
 * ── ACESSIBILIDADE ───────────────────────────────────────────────────────────
 *
 * É uma tabela de verdade, com `<th>` e `<caption>`. A barra é `aria-hidden` e
 * mora dentro da célula, ao lado do número — quem usa leitor de tela recebe a
 * tabela inteira, não um "gráfico" mudo.
 */
import Link from 'next/link';
import { brl } from './formato';
import type { Similar } from '@/src/logica/similares';
import estilos from './ComparativoSimilares.module.css';

export interface IndiceComparado {
  rotulo: string;
  /** Lê o valor no material; `undefined` quando aquele não tem o índice. */
  ler: (m: Similar) => number | undefined;
}

export function ComparativoSimilares({
  alvo,
  similares,
  indices,
}: {
  alvo: Similar;
  similares: readonly Similar[];
  indices: readonly IndiceComparado[];
}) {
  if (similares.length === 0) return null;

  const todos = [alvo, ...similares];

  /* Só entra o índice que o ALVO tem e pelo menos um vizinho também: linha em
     que só um valor existe não é comparação, é número solto com barra. */
  const linhas = indices.filter((i) => {
    const doAlvo = i.ler(alvo);
    return doAlvo !== undefined && similares.some((s) => i.ler(s) !== undefined);
  });

  const mesmaMoeda = similares.every((s) => s.moeda === alvo.moeda);

  return (
    <section className={estilos.bloco} aria-labelledby="titulo-similares">
      <h2 id="titulo-similares" className={estilos.titulo}>
        Parecidos com este
      </h2>
      <p className={estilos.subtitulo}>
        {alvo.tipo === 'Lâmina' || alvo.tipo === 'Borracha'
          ? `As ${alvo.tipo.toLowerCase()}s mais próximas deste material no catálogo, pelos números que os dois lados têm.`
          : 'Os materiais mais próximos deste no catálogo.'}{' '}
        Proximidade é conta nossa, não ranking: <strong>estar aqui não quer dizer ser melhor</strong>.
      </p>

      <div className={estilos.rolagem}>
        <table className={estilos.tabela}>
          <caption className={estilos.legenda}>
            Este material e os {similares.length} mais próximos, índice a índice
          </caption>
          <thead>
            <tr>
              <th scope="col">Índice</th>
              {todos.map((m, i) => (
                <th scope="col" key={m.id} className={i === 0 ? estilos.colunaAlvo : undefined}>
                  {i === 0 ? (
                    <span className={estilos.nomeAlvo}>{m.nome}</span>
                  ) : (
                    <Link href={`/materiais/${m.id}/`}>{m.nome}</Link>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map((linha) => (
              <tr key={linha.rotulo}>
                <th scope="row" className={estilos.rotuloLinha}>
                  {linha.rotulo}
                </th>
                {todos.map((m, i) => {
                  const v = linha.ler(m);
                  return (
                    <td key={m.id} className={i === 0 ? estilos.colunaAlvo : undefined}>
                      {v === undefined ? (
                        <span className={estilos.ausente} title="este material não tem esse índice">
                          —
                        </span>
                      ) : (
                        <>
                          <span className={`mono ${estilos.numero}`}>{v.toFixed(1)}</span>
                          <span className={estilos.barra} aria-hidden="true">
                            <span
                              className={i === 0 ? estilos.preenchimentoAlvo : estilos.preenchimento}
                              style={{ width: `${(v / 10) * 100}%` }}
                            />
                          </span>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Preço fecha a tabela e NÃO ganha barra: barra convida a ler
                "maior é melhor", e no preço maior é pior. Some quando há moeda
                diferente na linha — dólar e real não se comparam sem câmbio. */}
            {mesmaMoeda && (
              <tr>
                <th scope="row" className={estilos.rotuloLinha}>
                  Preço
                </th>
                {todos.map((m, i) => (
                  <td key={m.id} className={i === 0 ? estilos.colunaAlvo : undefined}>
                    <span className={`mono ${estilos.numero}`}>
                      {m.moeda ? `${m.moeda} ${m.preco}` : brl(m.preco)}
                    </span>
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className={estilos.acoes}>
        {similares.map((s) => (
          <Link key={s.id} href={`/comparar/?ids=${alvo.id},${s.id}`} className={estilos.acao}>
            Comparar com {s.nome} →
          </Link>
        ))}
      </p>
    </section>
  );
}
