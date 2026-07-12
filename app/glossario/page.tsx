/**
 * WikiPong · /glossario — conteúdo MIGRADO da Page 1 antiga do Figma (a convite
 * do fundador, 2026-07-09); visual verde-mesa v2 (D-01). Server Component puro →
 * HTML 100% estático no build (SEO: páginas de glossário são porta de entrada
 * de busca). Também é o primeiro corpus do assistente IA (D-10).
 * Na D-03, Glossário mora no grupo "Aprender" — o eyebrow já sinaliza isso.
 */
import type { Metadata } from 'next';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import glossario from '@/dados/glossario.json';
import estilos from './glossario.module.css';

export const metadata: Metadata = {
  title: 'Glossário',
  description:
    'Os principais termos técnicos do tênis de mesa — topspin, ALC, tensão, bloqueio — ' +
    'explicados de forma direta, em português claro.',
};

export default function PaginaGlossario() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">Aprender / Glossário</p>
        <h1 className={estilos.titulo}>Glossário</h1>
        <p className={estilos.lede}>
          Os principais termos técnicos do tênis de mesa, explicados de forma direta.
        </p>

        {/* Lista tipográfica de enciclopédia: fios, não cards */}
        <dl className={estilos.lista}>
          {glossario.verbetes.map((v) => (
            <div key={v.termo} className={estilos.verbete}>
              <dt>{v.termo}</dt>
              <dd>{v.definicao}</dd>
            </div>
          ))}
        </dl>

        <p className={estilos.notaIA}>
          Sentiu falta de um termo? O glossário cresce junto com a enciclopédia — e é a
          primeira base de conhecimento do assistente do WikiPong.
        </p>
      </main>

      <Rodape />
    </>
  );
}
