/**
 * WikiPong · Top 5 de borrachas por família
 * ==============================================================================
 * Página inteiramente estática (D-17): os dados são JSON de build, então não há
 * cliente aqui — nem `useState`, nem Suspense. Uma lista que não muda com
 * interação não precisa de JavaScript pra existir.
 *
 * A HONESTIDADE DESTA PÁGINA MORA EM TRÊS LUGARES, e nenhum deles é opcional:
 *
 * 1. A ORDEM NÃO É OPINIÃO DA CASA. Ela sai da régua de `popularidade.ts`:
 *    primeiro quem aparece no levantamento de uso de agosto/2026, por pontos;
 *    depois quem não aparece, pela nota puxada em direção à média do catálogo.
 *    Cada cartão diz qual dos dois sinais o colocou ali.
 *
 * 2. A FONTE DO "USO" NÃO DECLARA A METODOLOGIA DELA. A página publica pontos e
 *    não explica como os calcula. Então a tela diz "mais aparecem no
 *    levantamento", e nunca "mais vendidas" — que seria uma afirmação que
 *    ninguém aqui pode sustentar.
 *
 * 3. A FAMÍLIA É CLASSIFICAÇÃO, e classificação sem critério é chute. Cada
 *    cartão carrega a evidência de por que aquela borracha está naquela
 *    família, e o corte é o TOPSHEET, não o país.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { FotoProduto } from '@/componentes/FotoProduto';
import { Estrelas } from '@/componentes/Estrelas';
import { nomeComMarca, dinheiro } from '@/componentes/formato';
import { topDaFamilia, CONSULTADO_EM_TOP } from '@/componentes/dados-top-borrachas';
import {
  PERIODO_DO_USO, FONTE_USO_FH, FONTE_USO_BH,
} from '@/componentes/dados-uso-atual';
import {
  FAMILIAS, ROTULO_FAMILIA, SUBTITULO_FAMILIA, EXPLICA_FAMILIA,
} from '@/src/logica/popularidade';
import estilos from './top.module.css';
import { Pagina } from '@/componentes/Pagina';

export const metadata: Metadata = {
  title: 'Top 5 de borrachas por família · WikiPong',
  description:
    'As cinco borrachas chinesas, híbridas e tensoras que mais aparecem no levantamento de uso de agosto de 2026 e que a comunidade melhor avaliou — com a régua e a fonte de cada número declaradas.',
};

const MES = new Date(`${PERIODO_DO_USO}-01T12:00:00Z`).toLocaleDateString('pt-BR', {
  month: 'long', year: 'numeric', timeZone: 'UTC',
});

export default function PaginaTopBorrachas() {
  return (
    <Pagina>
      <header className={estilos.capa}>
        <h1 className={estilos.titulo}>As borrachas do momento, por família</h1>
        <p className={estilos.chamada}>
          Cinco de cada família, na ordem em que duas coisas as colocam: quanto elas{' '}
          <strong>aparecem no levantamento de uso</strong> de {MES} e quanto{' '}
          <strong>quem jogou com elas gostou</strong>. Nenhuma nota é nossa.
        </p>

        {/* A ressalva vem ANTES das listas, não num rodapé. Uma lista de "mais
            usadas" cuja fonte não explica a conta precisa dizer isso onde a
            pessoa lê antes de acreditar, não depois. */}
        <div className={estilos.ressalva}>
          <p className={estilos.ressalvaTitulo}>Antes de acreditar na ordem, leia isto</p>
          <p>
            O levantamento de uso vem do{' '}
            <a href={FONTE_USO_FH} target="_blank" rel="noopener noreferrer">
              tabletennis-reference
            </a>{' '}
            ({MES}, listas de{' '}
            <a href={FONTE_USO_FH} target="_blank" rel="noopener noreferrer">forehand</a> e{' '}
            <a href={FONTE_USO_BH} target="_blank" rel="noopener noreferrer">backhand</a>). Eles
            publicam os pontos e <strong>não explicam como os calculam</strong>. Por isso aqui
            está escrito “aparece no levantamento”, e nunca “mais vendida” — venda é outra coisa,
            e ninguém aqui tem esse número.
          </p>
          <p>
            As notas vêm das avaliações da comunidade no Revspin, na escala 0–10 convertida para
            estrelas, e são <strong>puxadas em direção à média do catálogo quando a amostra é
            pequena</strong>: sem isso, uma borracha com três avaliações entusiasmadas passaria
            na frente de uma com duzentas.
          </p>
          <p className={estilos.data}>
            Levantamento transcrito em {CONSULTADO_EM_TOP.split('-').reverse().join('/')}.
          </p>
        </div>
      </header>

      {FAMILIAS.map((f) => {
        const lista = topDaFamilia(f);
        if (lista.length === 0) return null;

        return (
          <section key={f} className={estilos.familia} aria-labelledby={`f-${f}`}>
            <div className={estilos.familiaCabeca}>
              <h2 id={`f-${f}`} className={estilos.familiaTitulo}>
                {ROTULO_FAMILIA[f]}
              </h2>
              <p className={`mono ${estilos.familiaSub}`}>{SUBTITULO_FAMILIA[f]}</p>
              <p className={estilos.familiaExplica}>{EXPLICA_FAMILIA[f]}</p>
            </div>

            <ol className={estilos.lista}>
              {lista.map((e, i) => {
                const m = e.material;
                return (
                  <li key={m.id} className={estilos.item}>
                    <span className={`mono ${estilos.posicao}`} aria-hidden="true">
                      {i + 1}
                    </span>

                    <Link href={`/materiais/${m.id}/`} className={estilos.foto}>
                      <FotoProduto id={m.id} nome={m.nome} tipo={m.tipo} tamanho={72} />
                    </Link>

                    <div className={estilos.corpo}>
                      <h3 className={estilos.nome}>
                        <Link href={`/materiais/${m.id}/`}>{nomeComMarca(m.marca, m.nome)}</Link>
                      </h3>

                      {/* Os dois sinais, lado a lado e SEPARADOS. Somá-los num
                          "score" exigiria uma taxa de câmbio entre ponto de uso
                          e nota, que não existe. */}
                      <div className={estilos.sinais}>
                        {e.uso && (
                          <span className={estilos.sinal}>
                            <span className={`mono ${estilos.sinalValor}`}>
                              {e.uso.posFh ? `#${e.uso.posFh} FH` : ''}
                              {e.uso.posFh && e.uso.posBh ? ' · ' : ''}
                              {e.uso.posBh ? `#${e.uso.posBh} BH` : ''}
                            </span>
                            <span className={estilos.sinalRotulo}>no levantamento de uso</span>
                          </span>
                        )}
                        {m.reviews > 0 ? (
                          <span className={estilos.sinal}>
                            <span className={estilos.sinalValor}>
                              <Estrelas nota={m.rating} tamanho="sm" />
                            </span>
                            <span className={estilos.sinalRotulo}>
                              {m.reviews} {m.reviews === 1 ? 'avaliação' : 'avaliações'} na
                              comunidade
                            </span>
                          </span>
                        ) : (
                          <span className={estilos.sinal}>
                            <span className={`mono ${estilos.sinalValor}`}>—</span>
                            <span className={estilos.sinalRotulo}>
                              ainda sem avaliação na comunidade
                            </span>
                          </span>
                        )}
                        <span className={estilos.sinal}>
                          <span className={`mono ${estilos.sinalValor}`}>
                            {dinheiro(m.preco, m.moeda)}
                          </span>
                          <span className={estilos.sinalRotulo}>
                            {m.moeda ? 'preço na loja de origem' : 'preço de referência'}
                          </span>
                        </span>
                      </div>

                      <p className={estilos.porque}>
                        <strong>
                          {e.porQueEntrou === 'uso'
                            ? 'Entrou pelo uso:'
                            : 'Entrou pela avaliação:'}
                        </strong>{' '}
                        {e.porQueEntrou === 'uso'
                          ? 'está no levantamento de ' + MES + '.'
                          : 'não aparece no levantamento, e chegou aqui pela nota de quem usou.'}{' '}
                        {e.familiaPorque}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <footer className={estilos.rodape}>
        <h2 className={estilos.rodapeTitulo}>O que esta lista não é</h2>
        <p>
          Não é ranking de vendas, não é o que é melhor <em>pra você</em>, e não é opinião da
          WikiPong. Borracha boa é a que combina com a sua lâmina, o seu nível e o seu jogo — e
          isso nenhuma lista resolve.{' '}
          <Link href="/quiz/">O teste de perfil</Link> chega mais perto disso que qualquer top 5,
          e o <Link href="/catalogo/?tipo=borracha">catálogo inteiro</Link> tem 400 borrachas,
          não 15.
        </p>
      </footer>
    </Pagina>
  );
}
