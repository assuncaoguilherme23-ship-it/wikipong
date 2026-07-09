/**
 * WikiPong · home (Server Component → renderizado no build / SSG)
 * ------------------------------------------------------------------------------
 * Prova de integração da COLHEITA: este componente importa `src/logica/metricas`
 * (módulo puro, intocado) e o executa em BUILD TIME. Os números abaixo são
 * assados no HTML estático — exatamente o ganho de SEO/first-paint que motivou
 * escolher Next (D-17).
 *
 * Respeita decisões de conteúdo:
 *  · Copy do herói = D-02 (o método, não o comércio).
 *  · Tabela = D-08 (dois renderers a partir do mesmo dado canônico: número + palavra).
 *  · D-09: destaque do máximo por linha é FATO (rótulo "maior"), NÃO veredito;
 *    custo/mês SEM destaque (maior = pior); asterisco + nota "A VALIDAR".
 */
import Link from 'next/link';
import {
  perdao,
  custoMensalPorClasse,
  paraPalavra,
  indicesDoMaximo,
  type Specs,
  type ClasseBorracha,
} from '@/src/logica/metricas';
import styles from './page.module.css';

// Exemplos publicados no board "Métricas · Derivadas" do Figma (os mesmos dos testes).
type Amostra = {
  nome: string;
  specs: Specs;
  durezaUnificada: number;
  precoMedio: number;
  classe: ClasseBorracha;
};

const AMOSTRAS: Amostra[] = [
  { nome: 'Tenergy 05', specs: { velocidade: 9.0, spin: 9.3, controle: 7.0 }, durezaUnificada: 47, precoMedio: 450, classe: 'tensor' },
  { nome: 'Mark V', specs: { velocidade: 7.0, spin: 7.5, controle: 9.0 }, durezaUnificada: 42, precoMedio: 180, classe: 'classica' },
];

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

export default function Home() {
  // Linhas da tabela: cada uma computada pela lógica pura (renderer Técnico + Simples).
  const velocidades = AMOSTRAS.map((a) => a.specs.velocidade);
  const efeitos = AMOSTRAS.map((a) => a.specs.spin);
  const controles = AMOSTRAS.map((a) => a.specs.controle);
  const perdoes = AMOSTRAS.map((a) => perdao(a.specs, a.durezaUnificada));
  const custos = AMOSTRAS.map((a) => custoMensalPorClasse(a.precoMedio, a.classe));

  const linhas = [
    { rotulo: 'Velocidade', valores: velocidades, atributo: 'velocidade' as const, destacar: true, fmt: (v: number) => v.toFixed(1) },
    { rotulo: 'Efeito', valores: efeitos, atributo: 'spin' as const, destacar: true, fmt: (v: number) => v.toFixed(1) },
    { rotulo: 'Controle', valores: controles, atributo: 'controle' as const, destacar: true, fmt: (v: number) => v.toFixed(1) },
    { rotulo: 'Perdão*', valores: perdoes, atributo: 'perdao' as const, destacar: true, fmt: (v: number) => v.toFixed(1) },
    // D-09: custo NÃO recebe destaque de máximo (maior = pior).
    { rotulo: 'Custo/mês', valores: custos, atributo: null, destacar: false, fmt: brl },
  ];

  return (
    <>
      <header className={styles.header}>
        <div className={`container ${styles.headerRow}`}>
          <Link href="/" className={styles.brand}>
            Wiki<span>Pong</span>
          </Link>
          <nav className={styles.nav} aria-label="Principal">
            {/* D-16 (lançamento honesto): só o que existe entra na nav. */}
            <Link href="/quiz/">Fazer o teste</Link>
          </nav>
        </div>
      </header>

      <main>
        <section className={`container ${styles.hero}`}>
          <p className="eyebrow">Enciclopédia · tênis de mesa</p>
          <h1>Feito pra explicar, não pra empurrar.</h1>
          <p className={styles.lede}>Recomendação explicada, nunca imposta.</p>
          <div className={styles.heroActions}>
            <Link href="/quiz/" className={styles.cta}>
              Fazer o teste →
            </Link>
            <a href="#prova" className={styles.ghost}>
              Ver as métricas
            </a>
          </div>
        </section>

        <section id="prova" className={`container ${styles.prova}`}>
          <div className={styles.provaHead}>
            <p className="eyebrow">Colheita integrada</p>
            <h2>Os mesmos números do Figma, calculados pela lógica pura</h2>
            <p>
              Esta tabela é renderizada no build a partir de{' '}
              <code className="mono">src/logica/metricas.ts</code> — o módulo colhido dos
              protótipos, sem uma linha alterada. Cada célula mostra o dado Técnico e, abaixo,
              a tradução do modo Simples (D-08).
            </p>
          </div>

          <div className={styles.tabelaWrap}>
            <table className={styles.tabela}>
            <thead>
              <tr>
                <th scope="col">Métrica</th>
                {AMOSTRAS.map((a) => (
                  <th scope="col" key={a.nome}>
                    {a.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((linha) => {
                const maxIdx = linha.destacar ? indicesDoMaximo(linha.valores) : [];
                return (
                  <tr key={linha.rotulo}>
                    <th scope="row" className={styles.atributo}>
                      {linha.rotulo}
                    </th>
                    {linha.valores.map((valor, i) => {
                      const ehMax = maxIdx.includes(i);
                      return (
                        <td key={i}>
                          <span className={`${styles.valorTecnico} ${ehMax ? styles.maxfato : ''}`}>
                            {linha.fmt(valor)}
                            {ehMax && <span className={styles.maxTag}>maior</span>}
                          </span>
                          {linha.atributo && (
                            <span className={styles.valorSimples}>
                              {paraPalavra(linha.atributo, valor)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>

          <p className={styles.nota}>
            <span className={styles.selo}>A validar</span> &nbsp;* Perdão é métrica derivada
            (proposta v1, pendente de validação do especialista — D-09). Destaque de “maior” é{' '}
            <strong>fato, não veredito</strong>: maior ≠ melhor, depende do seu jogo. Custo/mês não
            recebe destaque porque, nele, maior é pior.
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className="container">
          WikiPong — enciclopédia PT-BR de tênis de mesa. Scaffold Next.js (static export · D-17).
        </div>
      </footer>
    </>
  );
}
