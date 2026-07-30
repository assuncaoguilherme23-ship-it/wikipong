import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { DiscussoesCliente } from './discussoes-cliente';
import estilos from '../comunidade.module.css';

export const metadata: Metadata = {
  title: 'Discussões',
  description:
    'As perguntas que não cabem numa avaliação: qual lâmina combina com a sua borracha, ' +
    'se vale trocar agora, onde achar um modelo que sumiu do mercado.',
};

export default function PaginaDiscussoes() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/">Início</Link> / <Link href="/comunidade/">Comunidade</Link> / Discussões
        </p>

        <header className={estilos.topo}>
          <h1 className={estilos.titulo}>Discussões</h1>
          <p className={estilos.lede}>
            O lugar das perguntas que não cabem numa avaliação. Todo tópico declara um{' '}
            <strong>assunto</strong> e pode se amarrar a um material do catálogo, pra que a
            conversa não vire uma linha do tempo onde nada se acha depois.
          </p>
          <p className={estilos.avisoLocalPagina}>
            <span className={`mono ${estilos.seloPagina}`}>prévia</span>
            Os tópicos ficam <strong>só neste navegador</strong>, sem conta e sem servidor.
            Ninguém mais vê o que você escrever. Quando o backend entrar, isto vira público e
            passa por moderação.
          </p>
        </header>

        <DiscussoesCliente />
      </main>

      <Rodape />
    </>
  );
}
