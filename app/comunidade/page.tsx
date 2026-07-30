/**
 * WikiPong · /comunidade (SSG + ilha cliente)
 * ------------------------------------------------------------------------------
 * O casco é estático (SEO, D-17); o miolo que depende do repositório de
 * avaliações é cliente. Enquanto o backend não entra, o repositório é local —
 * e a página diz isso, em vez de fingir movimento (D-16).
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { ComunidadeCliente, ResumoComunidade } from './comunidade-cliente';
import estilos from './comunidade.module.css';

export const metadata: Metadata = {
  title: 'Comunidade',
  description:
    'O que os jogadores brasileiros estão dizendo sobre cada material: avaliações com ' +
    'estrelas, estilo de jogo e nível de quem escreveu.',
};

export default function PaginaComunidade() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/">Início</Link> / Comunidade
        </p>

        <header className={estilos.topo}>
          <h1 className={estilos.titulo}>Comunidade</h1>
          <p className={estilos.lede}>
            O que quem joga está achando de cada material. Toda avaliação vem com o{' '}
            <strong>estilo</strong> e o <strong>nível</strong> de quem escreveu, porque a mesma
            borracha vale coisas diferentes pra um atacante e pra um defensor.
          </p>
          <ResumoComunidade />
        </header>

        <ComunidadeCliente />

        <section className={estilos.explica} aria-labelledby="titulo-explica">
          <h2 id="titulo-explica" className={estilos.tituloExplica}>
            Como este espaço funciona
          </h2>
          <ul className={estilos.regras}>
            <li>
              <strong>A nota vem com contexto.</strong> Estilo, nível e tempo de uso são
              obrigatórios. Uma Tenergy vale 5★ pro avançado e 2★ pro iniciante: sem saber quem
              escreveu, a média mente.
            </li>
            <li>
              <strong>Nada de número digitado.</strong> Média, ranking e recortes são todos
              calculados a partir das avaliações. Não existe campo onde alguém escolha a
              posição de um material.
            </li>
            <li>
              <strong>Isto não é a ficha técnica.</strong> A ficha é independente e continua
              valendo, mesmo que a comunidade discorde dela. As duas coisas aparecem separadas
              na página de cada material, de propósito.
            </li>
            <li>
              <strong>Opinião de fora entra com nome.</strong> A nota do Revspin que aparece
              nas fichas é de outra comunidade, sempre com fonte, data e link. Ela nunca é
              somada com as avaliações daqui.
            </li>
          </ul>
        </section>
      </main>

      <Rodape />
    </>
  );
}
