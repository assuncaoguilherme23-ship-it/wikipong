/**
 * WikiPong · Catálogo estático — o que o Google (e quem está sem JS) recebe
 * ==============================================================================
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * O `/catalogo` inteiro é um componente de cliente: ele usa `useSearchParams`,
 * porque o estado navegável mora na URL (D-12), e no export estático isso obriga
 * um boundary de Suspense. O que o build congela no HTML é o FALLBACK desse
 * boundary — e o fallback era uma linha:
 *
 *     <p>Carregando catálogo…</p>
 *
 * Resultado medido antes desta mudança: `out/catalogo/index.html` tinha 9,6 KB
 * e NENHUM material. Nem um nome, nem um link. A página principal do site — a
 * que reúne 678 produtos — entregava uma tela em branco para quem indexa.
 *
 * Isso contradiz o motivo declarado da escolha da stack. O D-17 registra que
 * Next foi escolhido em vez de SPA por "SSG por rota (SEO desde o dia 1)". As
 * 678 páginas de material cumprem; a porta de entrada delas, não.
 *
 * ── O QUE MUDA ────────────────────────────────────────────────────────────────
 *
 * O boundary continua (o D-12 não é negociável), mas o fallback passa a ser o
 * catálogo de verdade: os 678 materiais, com nome, marca, tipo, preço, foto,
 * link e a frase em português claro. É conteúdo real, não esqueleto — a mesma
 * informação que o componente de cliente mostra quando assume.
 *
 * ── POR QUE ELE SE PARECE COM O CARTÃO INTERATIVO ────────────────────────────
 *
 * Este HTML aparece por um instante antes da hidratação. Se fosse uma lista
 * crua, a troca seria um salto visual. Ele reusa as classes de
 * `catalogo.module.css` para que a substituição seja imperceptível.
 *
 * O que ele NÃO tem, de propósito: seletor de modo, checkbox de comparar,
 * filtros e busca. São controles que dependem de JS — mostrá-los mortos por um
 * segundo seria prometer interação que ainda não existe (D-16).
 *
 * ── POR QUE 60, E NÃO OS 678 ─────────────────────────────────────────────────
 *
 * A primeira versão renderizava o catálogo inteiro. Funcionou e pesou 1,6 MB —
 * 166× o tamanho anterior. Medido, o custo se reparte assim:
 *
 *     payload RSC ... 973 KB (61%)   HTML visível ... 631 KB
 *
 * O payload RSC é a árvore serializada que o React usa para hidratar — e ela é
 * DESCARTADA no instante em que o componente de cliente assume. Era quase 1 MB
 * baixado para ser jogado fora.
 *
 * E não era necessário para o que motivou a mudança: as 678 páginas de material
 * já são SSG e JÁ ESTÃO NO SITEMAP (712 URLs, 678 delas de material). O Google
 * chega em todas por lá. O que faltava aqui não era descoberta — era a página
 * não ser uma tela em branco.
 *
 * Sessenta cobre isso com ~150 KB: conteúdo real, links reais, e a lista
 * completa entra assim que o JS carrega. O número não é mágico — é o maior que
 * cabe no orçamento de peso sem transformar a porta de entrada num download.
 */

/** Quantos materiais o HTML estático carrega. Ver o bloco acima antes de mexer. */
const QUANTOS_NO_HTML = 60;
import Link from 'next/link';
import { MATERIAIS } from '@/componentes/dados-materiais';
import { FotoProduto } from '@/componentes/FotoProduto';
import { dinheiro } from '@/componentes/formato';
import { traduzirFicha } from '@/src/logica/traduzir';
import { fabricantePorId } from '@/componentes/dados-fabricante';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import estilos from './catalogo.module.css';

export function CatalogoEstatico() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <div className={estilos.topo}>
          <h1 className={estilos.titulo}>Materiais</h1>
        </div>

        {/* Diz o que está mostrando e o que falta — a contagem sozinha, com 60
            cartões abaixo dela, seria número que não bate com a tela (D-16). */}
        <p className={estilos.contagem}>
          {MATERIAIS.length} materiais no catálogo. Os {QUANTOS_NO_HTML} primeiros aparecem
          abaixo; a lista completa, a busca e os filtros entram assim que a página terminar de
          carregar.
        </p>

        <ul className={estilos.grade}>
          {MATERIAIS.slice(0, QUANTOS_NO_HTML).map((m) => {
            const leitura = traduzirFicha(m.tipo, fabricantePorId(m.id)?.ficha);
            return (
              <li key={m.id} className={estilos.itemGrade}>
                <Link href={`/materiais/${m.id}/`} className={estilos.cartao}>
                  <div className={estilos.cartaoTopo}>
                    <FotoProduto id={m.id} nome={m.nome} tipo={m.tipo} tamanho={56} />
                    <div>
                      <h2 className={estilos.cartaoNome}>{m.nome}</h2>
                      <p className={`mono ${estilos.cartaoMeta}`}>
                        {m.marca} · {m.tipo} · {m.nivel}
                      </p>
                    </div>
                  </div>
                  <p className={estilos.praQuemE}>
                    <b>{m.simples.tag}.</b> {leitura?.resumo || m.simples.frase}
                  </p>
                  <p className={`mono ${estilos.preco}`}>{dinheiro(m.preco, m.moeda)}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>

      <Rodape />
    </>
  );
}
