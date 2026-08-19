import type { Metadata } from 'next';
import Link from 'next/link';
import { CompeticoesCliente } from './competicoes-cliente';
import {
  TEMPORADA, FONTE_CALENDARIO, CONSULTADO_EM_CALENDARIO,
} from '@/componentes/dados-competicoes';
import estilos from './competicoes.module.css';
import { Pagina } from '@/componentes/Pagina';

export const metadata: Metadata = {
  title: `Competições nacionais de tênis de mesa ${TEMPORADA} · WikiPong`,
  description:
    `Calendário das competições nacionais de tênis de mesa em ${TEMPORADA}: Copa Brasil Ouro e Prata, Brasileirão Interclubes e Seletiva Nacional, com datas, cidade e tipo — transcrito do calendário oficial da CBTM.`,
};

const dataBR = (iso: string) => iso.split('-').reverse().join('/');

export default function PaginaCompeticoes() {
  return (
    <Pagina>
      <header className={estilos.capa}>
        <h1 className={estilos.titulo}>Competições nacionais de {TEMPORADA}</h1>
        <p className={estilos.chamada}>
          Todo o calendário nacional da CBTM em uma página: quando, onde e de que tipo é cada
          competição.
        </p>

        <div className={estilos.procedencia}>
          <p>
            Transcrito do{' '}
            <a href={FONTE_CALENDARIO} target="_blank" rel="noopener noreferrer">
              calendário oficial da CBTM
            </a>{' '}
            em {dataBR(CONSULTADO_EM_CALENDARIO)}. Cada linha é o que eles publicam — nada aqui
            é estimado.
          </p>
          {/* Dizer o que NÃO se sabe vale mais que uma coluna vazia (D-16): quem
              procura horário de jogo descobre aqui que não vai achar, em vez de
              varrer a página atrás de um dado que ninguém tem. */}
          <p>
            <strong>O que esta página não tem, porque a fonte não publica:</strong> horário de
            jogo, nome do ginásio, taxa e prazo de inscrição. Para isso, e porque{' '}
            <strong>data e sede mudam</strong>, confira na CBTM antes de comprar passagem.
          </p>
        </div>
      </header>

      <CompeticoesCliente />

      <footer className={estilos.rodape}>
        <p>
          Quer saber com que material esse pessoal joga?{' '}
          <Link href="/profissionais/">O que os profissionais usam</Link> traz a raquete de quem
          está no alto do ranking, com fonte e data de cada checagem.
        </p>
      </footer>
    </Pagina>
  );
}
