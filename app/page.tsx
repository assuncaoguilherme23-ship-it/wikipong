/**
 * WikiPong · landing (Server Component → SSG)
 * ------------------------------------------------------------------------------
 * Implementa a "Tela · Landing" do Figma v2 (913:9003) — D-01 para estrutura e
 * copy; D-18 permite exceder: a seção de métricas ao vivo (prova) é adição nossa.
 *
 * Ajustes de HONESTIDADE sobre a copy do Figma (D-16 vence a arte):
 *  · faixa de estatísticas usa números DERIVADOS dos dados reais em build time
 *    (o Figma mostrava 142/9/38 como placeholder);
 *  · "Comparação lado a lado" descreve 2 materiais (o comparador real é de 2);
 *  · o card do catálogo descreve o que a base tem hoje;
 *  · nav e rodapé só listam o que existe — os EM BREVE vivem SÓ na grade de
 *    features, não clicáveis, como a D-16 determina.
 */
import Link from 'next/link';
import { Cabecalho } from '@/componentes/Cabecalho';
import { Rodape } from '@/componentes/Rodape';
import { Radar } from '@/componentes/Radar';
import { PrateleiraIniciantes } from '@/componentes/PrateleiraIniciantes';
import { CarrosselHero } from '@/componentes/CarrosselHero';
import { MATERIAIS } from '@/componentes/dados-materiais';
import { brl } from '@/componentes/formato';
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

/* Custo/mês exibe centavos: brl(v, true) do formatador único (componentes/formato). */
const brlCentavos = (v: number) => brl(v, true);

// Eixos do radar "impressão digital": valores reais, Perdão derivado incluído (D-09).
const EIXOS_RADAR = ['VEL', 'EFE', 'CTR', 'PER*'] as const;

/* Os dois primeiros são as ações que importam — a grade dá peso maior a eles.
   Só entra o que EXISTE (D-16): Profissionais e Notícias saíram do "em breve"
   quando a camada de comunidade (D-19) foi ao ar. */
const FEATURES_ATIVAS = [
  {
    titulo: 'Catálogo completo',
    texto:
      'Borrachas, lâminas, raquetes e bolas com ficha no mesmo formato, cada uma no modo Simples ou Técnico, do jeito que você entende.',
    href: '/catalogo/',
    destaque: true,
  },
  {
    titulo: 'Teste de perfil',
    texto: '1 minuto pra descobrir seu estilo e sair com sugestões concretas.',
    href: '/quiz/',
    destaque: true,
  },
  {
    titulo: 'Comparar lado a lado',
    texto: 'Dois materiais na mesma tela, número por número, com o radar de características.',
    href: '/comparar/',
    destaque: false,
  },
  {
    titulo: 'Conjuntos montados',
    texto: 'Lâmina + duas borrachas que fazem sentido juntas, com o porquê de cada escolha.',
    href: '/conjuntos/',
    destaque: false,
  },
  {
    titulo: 'O que os profissionais usam',
    texto: 'O setup de Calderano, Ma Long e outros, com fonte, data e link pra ficha.',
    href: '/profissionais/',
    destaque: false,
  },
  {
    titulo: 'Guias e glossário',
    texto: 'Do que a dureza muda no seu jogo até cada termo do esporte em português claro.',
    href: '/aprender/',
    destaque: false,
  },
  {
    titulo: 'Notícias',
    texto: 'O tênis de mesa do Brasil acompanhado de perto, sempre com a fonte.',
    href: '/noticias/',
    destaque: false,
  },
] as const;

/* Vaporware não ocupa card: vira uma linha de texto, sem peso visual (D-16). */
const EM_BREVE = ['Videoaulas', 'Avaliações da comunidade', 'Assistente IA'] as const;

function Verificado() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="var(--cor-acento-suave)" />
      <path
        d="M6 10.2l2.6 2.6L14 7.4"
        fill="none"
        stroke="var(--cor-acento-escuro)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  // Faixa de estatísticas: derivada dos dados REAIS em build time (D-16).
  const totalMateriais = MATERIAIS.length;
  const totalMarcas = new Set(MATERIAIS.map((m) => m.marca)).size;
  const comparacoesPossiveis = (totalMateriais * (totalMateriais - 1)) / 2;

  // Prova ao vivo: linhas computadas pela lógica pura (renderer Técnico + Simples).
  const velocidades = AMOSTRAS.map((a) => a.specs.velocidade);
  // AMOSTRAS sao borrachas declaradas aqui mesmo, com spin literal — sempre existe.
  const efeitos = AMOSTRAS.map((a) => a.specs.spin!);
  const controles = AMOSTRAS.map((a) => a.specs.controle);
  const perdoes = AMOSTRAS.map((a) => perdao(a.specs, a.durezaUnificada));
  const custos = AMOSTRAS.map((a) => custoMensalPorClasse(a.precoMedio, a.classe));
  const radarDe = (i: number) => [velocidades[i], efeitos[i], controles[i], perdoes[i]];

  const linhas = [
    { rotulo: 'Velocidade', valores: velocidades, atributo: 'velocidade' as const, destacar: true, fmt: (v: number) => v.toFixed(1) },
    { rotulo: 'Efeito', valores: efeitos, atributo: 'spin' as const, destacar: true, fmt: (v: number) => v.toFixed(1) },
    { rotulo: 'Controle', valores: controles, atributo: 'controle' as const, destacar: true, fmt: (v: number) => v.toFixed(1) },
    { rotulo: 'Perdão*', valores: perdoes, atributo: 'perdao' as const, destacar: true, fmt: (v: number) => v.toFixed(1) },
    // D-09: custo NÃO recebe destaque de máximo (maior = pior).
    { rotulo: 'Custo/mês', valores: custos, atributo: null, destacar: false, fmt: brlCentavos },
  ];

  return (
    <>
      <a className="pular-conteudo" href="#conteudo">
        Pular para o conteúdo
      </a>
      <Cabecalho />

      <main id="conteudo">
        {/* ── Hero (Figma 913:9003): centrado, com estatísticas reais ── */}
        <section className={`container ${styles.hero}`}>
          <div className={styles.heroTexto}>
            <p className="eyebrow">Enciclopédia de tênis de mesa · em português</p>
            <h1 className={styles.heroTitulo}>
              Tênis de mesa não precisa ser um <span className={styles.destaque}>mistério</span>.
            </h1>
            <p className={styles.lede}>
              Do iniciante perdido ao jogador detalhista: o WikiPong explica cada material e
              mostra o certo pro seu jogo, num lugar só, sem você ter que caçar opinião por aí.
            </p>
            <div className={styles.acoesHero}>
              <Link href="/quiz/" className="botao-primario">
                Fazer o teste de perfil →
              </Link>
              <Link href="/catalogo/" className="botao-secundario">
                Explorar o catálogo
              </Link>
            </div>
            <p className={`mono ${styles.micro}`}>leva 1 minuto · sem cadastro</p>
            <dl className={styles.stats}>
              <div className={styles.stat}>
                <dd className="mono">{totalMateriais}</dd>
                <dt>materiais catalogados</dt>
              </div>
              <div className={styles.stat}>
                <dd className="mono">{totalMarcas}</dd>
                <dt>marcas</dt>
              </div>
              <div className={styles.stat}>
                <dd className="mono">{comparacoesPossiveis}</dd>
                <dt>comparações possíveis</dt>
              </div>
            </dl>
          </div>

          {/* Prova visual: a enciclopédia MOSTRA material, não só fala dele. */}
          <CarrosselHero />
        </section>

        {/* ── A verdade (banda mesa) ── */}
        <section className={styles.verdade}>
          <div className={`container ${styles.verdadeInterna}`}>
            <h2>
              Raquete de verdade <span className={styles.destaque}>não vem pronta</span> da loja.
            </h2>
            <p className={styles.verdadeTexto}>
              Quem joga sério monta a sua: uma lâmina + duas borrachas, escolhidas pro seu
              estilo. É essa combinação que muda o jogo, e é ela que o WikiPong te ensina a
              escolher.
            </p>
          </div>
        </section>

        {/* ── As três dores (sequência numerada do Figma) ── */}
        <section className={`container ${styles.dores}`}>
          <h2 className={styles.tituloSecao}>Por que escolher material é tão difícil?</h2>
          <ol className={styles.doresLista}>
            <li className={`${styles.dor} revela`}>
              <span className={`mono ${styles.dorNumero}`} aria-hidden="true">
                01
              </span>
              <h3>Informação espalhada</h3>
              <p>Spec em site gringo, opinião em fórum, review em inglês. Nada explicado em um lugar só.</p>
            </li>
            <li className={`${styles.dor} revela`}>
              <span className={`mono ${styles.dorNumero}`} aria-hidden="true">
                02
              </span>
              <h3>Jargão que exclui</h3>
              <p>Tensor, tacky, carbono externo… tudo assume que você já sabe o que ninguém te ensinou.</p>
            </li>
            <li className={`${styles.dor} revela`}>
              <span className={`mono ${styles.dorNumero}`} aria-hidden="true">
                03
              </span>
              <h3>Critério invisível</h3>
              <p>Review patrocinado elogia tudo, indicação muda conforme o interesse. Falta um lugar que mostre o porquê.</p>
            </li>
          </ol>
        </section>

        {/* ── Manifesto (D-02) + radar "impressão digital" ── */}
        <section className={styles.manifesto}>
          <div className={`container ${styles.manifestoGrade}`}>
            <div>
              <h2>Feito pra explicar, não pra empurrar.</h2>
              <p className={styles.manifestoTexto}>
                O WikiPong existe pra te explicar. Cada material ganha uma ficha sem torcida e no mesmo formato, escrita pra quem está começando entender e pra quem
                é detalhista respeitar.
              </p>
              <ul className={styles.compromissos}>
                <li>
                  <Verificado /> Recomendação explicada, nunca imposta
                </li>
                <li>
                  <Verificado /> Do básico ao avançado, sem jargão gratuito
                </li>
                <li>
                  <Verificado /> Dados organizados, não opinião solta
                </li>
              </ul>
            </div>
            <figure className={`${styles.impressaoDigital} revela-escala`}>
              <Radar
                eixos={EIXOS_RADAR}
                series={[
                  { nome: 'Tenergy 05', valores: radarDe(0), variante: 'tracejada' },
                  { nome: 'Mark V', valores: radarDe(1), variante: 'solida' },
                ]}
                animado
                revelacao="rolagem"
              />
              <figcaption className={`mono ${styles.impressaoLegenda}`}>
                a impressão digital de cada material
              </figcaption>
            </figure>
          </div>
        </section>

        {/* ── Materiais para começar (prateleira horizontal dos iniciantes) ── */}
        <PrateleiraIniciantes />

        {/* ── O que você encontra aqui. Só o que EXISTE ganha card; o que vem por
               aí é uma linha de texto, sem peso visual de vaporware (D-16). ── */}
        <section className={`container ${styles.features}`}>
          <h2 className={styles.tituloSecao}>O que você encontra aqui</h2>
          <div className={styles.featuresGrade}>
            {FEATURES_ATIVAS.map((f) => (
              <Link
                key={f.titulo}
                href={f.href}
                className={`${styles.feature} ${f.destaque ? styles.featureDestaque : ''}`}
              >
                <h3>{f.titulo}</h3>
                <p>{f.texto}</p>
                <span className={styles.featureSeta} aria-hidden="true">
                  →
                </span>
              </Link>
            ))}
          </div>
          <p className={styles.emBreveLinha}>
            <span className={`mono ${styles.emBreveRotulo}`}>em breve</span>
            {EM_BREVE.join(' · ')}
          </p>
        </section>

        <hr className="linha-central" aria-hidden="true" />

        {/* ── Prova ao vivo (adição nossa além do Figma — D-18) ── */}
        <section id="prova" className={styles.prova}>
          <div className={`container ${styles.provaInterna}`}>
          <div className={styles.provaHead}>
            <h2>Números que dá pra comparar de verdade</h2>
            <p>
              A nota que o fabricante dá é a régua dele, feita pra vender: o 9,0 de uma marca não é o
              9,0 da outra. Aqui, cada material mostra o dado técnico e a tradução em
              português claro, lado a lado, além de métricas de fórmula aberta (como o
              Perdão) que nenhum catálogo publica.
            </p>
          </div>

          <div className={`${styles.tabelaWrap} revela`}>
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
            <span className={styles.selo}>A validar</span> &nbsp;* O Perdão é uma conta nossa, feita a partir dos outros números
            (versão 1, ainda esperando um especialista conferir; D-09). Destaque de “maior” é{' '}
            <strong>só um fato, não uma nota</strong>: maior não quer dizer melhor, depende do seu jogo. Custo/mês não
            recebe destaque porque, nele, maior é pior.
          </p>
          </div>
        </section>

        {/* ── CTA final (cartão mesa) ── */}
        <section className={`container ${styles.ctaFinal}`}>
          <div className={`${styles.ctaCartao} revela-escala`}>
            <h2>
              Pronto pra parar de escolher <span className={styles.destaque}>no chute</span>?
            </h2>
            <p>Faça o teste de perfil e receba sugestões que combinam com o seu jogo.</p>
            <Link href="/quiz/" className={`botao-primario ${styles.ctaBotao}`}>
              Fazer o teste de perfil →
            </Link>
            <p className={`mono ${styles.microMesa}`}>leva 1 minuto · sem cadastro</p>
          </div>
        </section>
      </main>

      <Rodape />
    </>
  );
}
