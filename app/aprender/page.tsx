/**
 * WikiPong · /aprender — hub dos guias (grupo "Aprender" da D-03).
 * SSG. Lista os guias + o glossário (as duas áreas do Aprender que existem hoje;
 * Videoaulas fica de fora até existir — D-16).
 */
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { GUIAS } from './guias';
import estilos from './aprender.module.css';

export default function PaginaAprender() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">Aprender</p>
        <h1 className={estilos.titulo}>Aprender</h1>
        <p className={estilos.lede}>
          Guias diretos pra escolher e montar seu equipamento sem jargão — do básico ao passo
          seguinte, em português claro.
        </p>

        <ul className={estilos.lista}>
          {GUIAS.map((g) => (
            <li key={g.slug}>
              <Link href={`/aprender/${g.slug}/`} className={estilos.cartao}>
                <span className={estilos.cartaoTitulo}>{g.titulo}</span>
                <p className={estilos.cartaoResumo}>{g.resumo}</p>
                <span className={`mono ${estilos.minutos}`}>{g.minutos} min de leitura</span>
              </Link>
            </li>
          ))}
          <li>
            <Link href="/glossario/" className={`${estilos.cartao} ${estilos.cartaoGlossario}`}>
              <span className={estilos.cartaoTitulo}>Glossário</span>
              <p className={estilos.cartaoResumo}>
                Cada termo técnico do esporte explicado em uma linha.
              </p>
              <span className={`mono ${estilos.minutos}`}>Consulta rápida</span>
            </Link>
          </li>
        </ul>
      </main>

      <Rodape />
    </>
  );
}
