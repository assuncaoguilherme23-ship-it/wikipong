import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { ModeracaoCliente } from './moderacao-cliente';
import estilos from '../comunidade.module.css';

export const metadata: Metadata = {
  title: 'Moderação',
  description: 'A fila de aprovação das avaliações da comunidade.',
  /* Fora do índice: é ferramenta de quem cuida do site, não conteúdo. Não é
     segurança (a página é pública como qualquer outra do export estático) —
     é só não gastar o rastreamento do Google numa tela sem valor de busca. */
  robots: { index: false, follow: false },
};

export default function PaginaModeracao() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/">Início</Link> / <Link href="/comunidade/">Comunidade</Link> / Moderação
        </p>

        <header className={estilos.topo}>
          <h1 className={estilos.titulo}>Moderação</h1>
          <p className={estilos.lede}>
            A fila de aprovação que o D-11 pede. Nada aparece no site antes de passar por aqui.
          </p>
        </header>

        <ModeracaoCliente />
      </main>

      <Rodape />
    </>
  );
}
