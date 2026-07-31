import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { PerfilCliente } from './perfil-cliente';
import estilos from '../comunidade.module.css';

export const metadata: Metadata = {
  title: 'Meu perfil',
  description:
    'Seu estilo de jogo, seu nível e a sua raquete montada. O estilo vira a tag que ' +
    'aparece embaixo do seu nome nas avaliações.',
};

export default function PaginaPerfil() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/">Início</Link> / <Link href="/comunidade/">Comunidade</Link> / Meu perfil
        </p>

        <header className={estilos.topo}>
          <h1 className={estilos.titulo}>Meu perfil</h1>
          <p className={estilos.lede}>
            Quem você é, o que você joga com, e o que você já avaliou.
          </p>
          {/* O aviso de "só neste navegador" saiu daqui porque virou MENTIRA pra
              metade dos casos: quem entra passa a ter o perfil no servidor. Ele
              agora é dito pelo componente cliente, que sabe se há sessão — e no
              lugar certo, junto do convite pra entrar. */}
        </header>

        <PerfilCliente />
      </main>

      <Rodape />
    </>
  );
}
