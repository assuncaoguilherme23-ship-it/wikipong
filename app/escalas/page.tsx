/**
 * WikiPong · /escalas — tradutor de durezas entre réguas de fabricante (SSG).
 *
 * Página própria de propósito: esta é a informação mais rara do site em português
 * e a que a comunidade linka. Enterrada dentro de um guia ela não é achável por
 * busca; com URL própria, vira referência.
 *
 * Todo número aqui é A VALIDAR (D-09) e o carimbo aparece junto do resultado.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { TradutorEscalas } from '@/componentes/TradutorEscalas';
import { ESCALAS } from '@/src/logica/escalas';
import { MATERIAIS } from '@/componentes/dados-materiais';
import { fabricantePorId } from '@/componentes/dados-fabricante';
import { escalaDoTexto, primeiroGrau, paraESN, faixaLegivel } from '@/src/logica/escalas';
import estilos from './escalas.module.css';

export const metadata: Metadata = {
  title: 'Tradutor de durezas: DHS, ESN e Butterfly',
  description:
    'Uma borracha de 39° na escala chinesa não é a mesma coisa que 39° na europeia. Converta durezas entre as escalas DHS, ESN e Butterfly e veja o que cada faixa entrega em quadra.',
};

/** Materiais do catálogo cuja ficha de fabricante declara grau E escala — os
 *  únicos que podem ilustrar a tabela sem inventar dado (D-16). */
function exemplosReais() {
  const linhas: { nome: string; marca: string; id: string; grau: number; escala: ReturnType<typeof escalaDoTexto>; }[] = [];
  for (const m of MATERIAIS) {
    const fab = fabricantePorId(m.id);
    const linha = fab?.ficha?.find((l) => /dureza/i.test(l.rotulo));
    if (!linha) continue;
    const grau = primeiroGrau(linha.valor);
    const escala = escalaDoTexto(linha.valor);
    if (grau === null || escala === null) continue;
    linhas.push({ nome: m.nome, marca: m.marca, id: m.id, grau, escala });
  }
  return linhas;
}

export default function PaginaEscalas() {
  const exemplos = exemplosReais();

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/aprender/">Aprender</Link> / Tradutor de durezas
        </p>
        <h1 className={estilos.titulo}>Tradutor de durezas</h1>
        <p className={estilos.lede}>
          Uma borracha de <strong>39° na escala chinesa</strong> não é a mesma coisa que 39° na europeia. É bem mais dura. Cada fabricante mede na sua própria régua e ninguém publica
          a conversão. Aqui você faz a tradução.
        </p>

        <TradutorEscalas />

        {/* As réguas que existem, e como reconhecer cada uma */}
        <section className={estilos.secao} aria-labelledby="titulo-reguas">
          <h2 id="titulo-reguas" className={estilos.tituloSecao}>
            As três réguas
          </h2>
          <dl className={estilos.reguas}>
            {ESCALAS.map((e) => (
              <div key={e.id} className={estilos.reguaItem}>
                <dt className={estilos.reguaNome}>{e.nome}</dt>
                <dd className={estilos.reguaTexto}>
                  {e.origem}
                  <span className={estilos.reguaExemplos}>Aparece em: {e.exemplos}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Tabela derivada do catálogo real — nada digitado à mão */}
        {exemplos.length > 0 && (
          <section className={estilos.secao} aria-labelledby="titulo-exemplos">
            <h2 id="titulo-exemplos" className={estilos.tituloSecao}>
              Materiais do catálogo, traduzidos
            </h2>
            <p className={estilos.subtitulo}>
              O grau que cada fabricante publica, e o que ele significa na régua europeia, a que usamos como referência.
            </p>
            <div className={estilos.tabelaWrap}>
              <table className={estilos.tabela}>
                <thead>
                  <tr>
                    <th scope="col">Material</th>
                    <th scope="col">O fabricante diz</th>
                    <th scope="col">Em ESN equivale a</th>
                  </tr>
                </thead>
                <tbody>
                  {exemplos.map((e) => (
                    <tr key={e.id}>
                      <th scope="row" className={estilos.celulaNome}>
                        <Link href={`/materiais/${e.id}/`}>{e.nome}</Link>
                        <span className={estilos.celulaMarca}>{e.marca}</span>
                      </th>
                      <td className="mono">
                        {e.grau}° <span className={estilos.celulaEscala}>{e.escala?.toUpperCase()}</span>
                      </td>
                      <td className={`mono ${estilos.celulaESN}`}>
                        {e.escala === 'esn' ? '— (já é a régua)' : faixaLegivel(paraESN(e.grau, e.escala!))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={estilos.nota}>
              Tabela montada a partir das fichas de fabricante que o catálogo já traz. Só entram materiais cuja ficha declara <strong>o grau e a escala</strong>. Onde o fabricante não
              diz a régua, não traduzimos: seria chute.
            </p>
          </section>
        )}

        <p className={estilos.saibaMais}>
          <Link href="/aprender/dureza-da-esponja/">
            Guia completo: o que a dureza muda no seu jogo →
          </Link>
        </p>
      </main>

      <Rodape />
    </>
  );
}
