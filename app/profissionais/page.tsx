/**
 * WikiPong · /profissionais — "O que os profissionais usam" (SSG).
 *
 * Traz a feature mais amada do TableTennisDaily (o setup dos tops) na chave da
 * WikiPong: dado CURADO, com fonte e data, e cada peça linkando pra ficha real
 * quando existe equivalente comercial honesto (D-14/D-16). Não copia forum nem
 * finge engajamento — é enciclopédia, não rede social. A honestidade (setup muda,
 * versão National ≠ varejo, copiar não vira técnica) está dita na própria página.
 */
import type { Metadata } from 'next';
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Glifo } from '@/componentes/Glifo';
import { FotoProduto } from '@/componentes/FotoProduto';
import { PROFISSIONAIS, type Papel } from '@/componentes/dados-profissionais';
import estilos from './profissionais.module.css';

export const metadata: Metadata = {
  title: 'O que os profissionais usam — WikiPong',
  description:
    'A lâmina e as borrachas de Hugo Calderano, Ma Long, Fan Zhendong, Harimoto e Bruna Takahashi — com fonte, data e link para a ficha de cada material.',
};

// A peça sem material ainda merece um ícone: deriva do papel.
const GLIFO_POR_PAPEL: Record<Papel, 'Lâmina' | 'Borracha'> = {
  'Lâmina': 'Lâmina',
  Forehand: 'Borracha',
  Backhand: 'Borracha',
};

function dataBR(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('pt-BR');
}

function dominio(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export default function PaginaProfissionais() {
  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo" className={`container ${estilos.pagina}`}>
        <p className="trilha">
          <Link href="/">Início</Link> / Profissionais
        </p>
        <h1 className={estilos.titulo}>O que os profissionais usam</h1>
        <p className={estilos.lede}>
          A lâmina e as duas borrachas de quem joga no topo — cada uma com a fonte e a data em que
          conferimos. Dá pra clicar na peça e ler a ficha, quando temos o equivalente no catálogo.
          Só peça um aviso antes de sair copiando: profissional usa versão feita sob medida, e
          técnica vem antes de equipamento.
        </p>

        <ul className={estilos.lista}>
          {PROFISSIONAIS.map((p) => (
            <li key={p.id} id={p.id} className={estilos.card}>
              <div className={estilos.identidade}>
                <span className={estilos.bandeira} aria-hidden="true">
                  {p.bandeira}
                </span>
                <div className={estilos.identidadeTexto}>
                  <h2 className={estilos.nome}>{p.nome}</h2>
                  <p className={estilos.destaque}>{p.destaque}</p>
                </div>
              </div>

              <p className={`mono ${estilos.etiquetas}`}>
                <span className={estilos.etiqueta}>{p.pais}</span>
                <span className={estilos.etiqueta}>{p.mao}</span>
                <span className={estilos.etiquetaEstilo}>{p.estilo}</span>
              </p>

              <ol className={estilos.pecas}>
                {p.pecas.map((peca) => {
                  const conteudo = (
                    <>
                      <span className={estilos.pecaGlifo}>
                        {peca.material ? (
                          <FotoProduto
                            id={peca.material.id}
                            nome={peca.material.nome}
                            tipo={peca.material.tipo}
                            tamanho={38}
                          />
                        ) : (
                          <Glifo tipo={GLIFO_POR_PAPEL[peca.papel]} tamanho={38} />
                        )}
                      </span>
                      <span className={estilos.pecaTexto}>
                        <span className={`mono ${estilos.pecaPapel}`}>{peca.papel}</span>
                        <span className={estilos.pecaNome}>{peca.nome}</span>
                        {peca.material && <span className={estilos.pecaFicha}>ver ficha →</span>}
                      </span>
                    </>
                  );
                  return (
                    <li key={peca.papel}>
                      {peca.material ? (
                        <Link
                          href={`/materiais/${peca.material.id}/`}
                          className={`${estilos.peca} ${estilos.pecaLink}`}
                        >
                          {conteudo}
                        </Link>
                      ) : (
                        <div className={estilos.peca}>{conteudo}</div>
                      )}
                    </li>
                  );
                })}
              </ol>

              <p className={estilos.nota}>{p.nota}</p>

              <p className={`mono ${estilos.fonte}`}>
                Fonte:{' '}
                <a href={p.fonte} target="_blank" rel="nofollow noopener">
                  {dominio(p.fonte)} ↗
                </a>
                {' · '}consultado em {dataBR(p.consultadoEm)}
              </p>
            </li>
          ))}
        </ul>

        {/* Honestidade explícita — a "Voz de Dados" aplicada a opinião de comunidade (D-14/D-16) */}
        <section className={estilos.rodapeNota} aria-labelledby="titulo-nota">
          <h2 id="titulo-nota" className={estilos.rodapeNotaTitulo}>
            Leia antes de copiar um setup
          </h2>
          <p>Ver o que um campeão usa é divertido — e um pouco enganoso. Três coisas que a gente prefere dizer:</p>
          <ul className={estilos.verdades}>
            <li>
              <strong>Setup de pro muda.</strong> Troca de patrocínio, ajuste de temporada. Por isso
              cada peça acima tem a data em que conferimos e o link da fonte — não é foto parada.
            </li>
            <li>
              <strong>Não é a peça da loja.</strong> Quase todo profissional usa uma versão
              “National”, feita sob medida, que não é vendida ao público. Quando a peça vira link, é
              o equivalente de varejo mais próximo — não a peça exata dele.
            </li>
            <li>
              <strong>Copiar não vira técnica.</strong> A borracha do Ma Long nas mãos de quem está
              começando rende menos, não mais — ela precisa de aceleração pra funcionar. O
              equipamento certo é o que combina com o <em>seu</em> jogo.
            </li>
          </ul>
          <p className={estilos.rodapeLinks}>
            <Link href="/quiz/">Descobrir o setup certo pro meu jogo →</Link>
            <Link href="/catalogo/">Ver o catálogo →</Link>
          </p>
        </section>
      </main>

      <Rodape />
    </>
  );
}
