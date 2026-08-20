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
import { ancoraDoTermo, TERMOS_GLOSSARIO } from '@/componentes/dados-glossario';
import { TextoComGlossario } from '@/componentes/TextoComGlossario';

export const metadata: Metadata = {
  title: 'Glossário',
  description:
    'Os termos técnicos do tênis de mesa — do topspin ao efeito catapulta, da pegajosidade ' +
    'ao ponto de fundo — explicados de forma direta, em português claro.',
};

/* A ordem segue o caminho de quem aprende, não o alfabeto: primeiro o que a bola
   toca (a capa), depois o que está embaixo (a esponja), depois o que acontece no
   milésimo do impacto, e por último o que só se descobre com o tempo de uso.
   Categoria fora desta lista não aparece — é erro de digitação no dado, e sumir
   é melhor que abrir uma seção órfã sem título pensado. */
const CATEGORIAS = [
  'A superfície',
  'A esponja',
  'A física do impacto',
  'Golpes e efeitos',
  'Uso e manutenção',
] as const;

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

        {/* ── AGRUPADO POR CATEGORIA ───────────────────────────────────────
            Eram 10 verbetes e uma lista corrida bastava. Com 33, corrido vira
            parede: quem procura "o que é catapulta" não sabe se já passou por
            ela. A ordem das categorias não é alfabética — segue o caminho de
            quem está aprendendo, do que a bola toca primeiro (a capa) para o
            que só se percebe com o tempo (o desgaste). */}
        {CATEGORIAS.map((categoria) => {
          const verbetes = glossario.verbetes.filter((v) => v.categoria === categoria);
          if (verbetes.length === 0) return null;
          return (
            <section key={categoria} className={estilos.grupo}>
              <h2 className={estilos.grupoTitulo}>{categoria}</h2>
              <dl className={estilos.lista}>
                {/* A âncora existe pro balão do TextoComGlossario ter onde
                    chegar. Sem ela, "ver no glossário" abriria a página e
                    largaria a pessoa no topo, procurando a palavra com o olho —
                    que é exatamente o trabalho que o tooltip veio poupar. */}
                {verbetes.map((v) => (
                  <div
                    key={v.termo}
                    id={ancoraDoTermo(v.termo)}
                    className={`${estilos.verbete} revela`}
                  >
                    <dt>{v.termo}</dt>
                    <dd>
                      {/* A definição cruza com os OUTROS verbetes: é a maior
                          densidade do site (0,97 termo por definição), e é o que
                          uma enciclopédia faz. O `filter` tira o próprio termo —
                          um verbete que se explica com ele mesmo é um círculo,
                          e o balão abriria em cima da resposta que a pessoa já
                          está lendo. */}
                      <TextoComGlossario termos={TERMOS_GLOSSARIO.filter((t) => t.termo !== v.termo)}>
                        {v.definicao}
                      </TextoComGlossario>
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          );
        })}

        <p className={estilos.notaIA}>
          Sentiu falta de um termo? O glossário cresce junto com a enciclopédia, e é a primeira base de conhecimento do assistente do WikiPong.
        </p>
      </main>

      <Rodape />
    </>
  );
}
