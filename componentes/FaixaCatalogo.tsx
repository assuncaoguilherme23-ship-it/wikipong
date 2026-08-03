/**
 * WikiPong · Régua "onde este material cai no catálogo"
 * ==============================================================================
 * O gráfico que responde a pergunta que o radar não responde: **8,2 é muito?**
 *
 * O radar compara FORMAS e precisa de três eixos — por isso ele atende 114 dos
 * 678 materiais e nenhuma das 393 lâminas. Esta régua funciona com um índice só,
 * então serve a lâmina (velocidade e controle) e serve o preço, que existe em
 * 678 de 678.
 *
 * ── ACESSIBILIDADE ───────────────────────────────────────────────────────────
 *
 * O radar do site é `aria-hidden` e depende da tabela ao lado como alternativa.
 * Esta régua NÃO precisa disso: ela é uma lista de definição de verdade, com o
 * número e a frase em texto. O desenho é enfeite por cima de conteúdo que já se
 * lê sem ele — é a barra que é `aria-hidden`, não a informação.
 */
import { posicaoNaFaixa, fracaoNaFaixa, leituraDaPosicao, type Posicao } from '@/src/logica/posicao';
import estilos from './FaixaCatalogo.module.css';

export interface LinhaFaixa {
  /** "Velocidade", "Preço"… */
  rotulo: string;
  /** Como a frase chama isto: "velocidade", "preço". */
  rotuloFrase: string;
  valor: number;
  /** Todos os valores comparáveis (mesmo tipo de material). */
  universo: readonly number[];
  /** Formata o número exibido. Preço tem R$; índice tem uma casa decimal. */
  formato: (v: number) => string;
}

function Regua({ p }: { p: Posicao }) {
  const pct = fracaoNaFaixa(p) * 100;
  return (
    <div className={estilos.trilho} aria-hidden="true">
      <span className={estilos.marcador} style={{ left: `${pct}%` }} />
    </div>
  );
}

export function FaixaCatalogo({
  linhas,
  universoRotulo,
}: {
  linhas: readonly LinhaFaixa[];
  /** "as 282 borrachas do catálogo" — a base fica à vista, sempre. */
  universoRotulo: string;
}) {
  const calculadas = linhas
    .map((l) => ({ linha: l, posicao: posicaoNaFaixa(l.valor, l.universo) }))
    .filter((x): x is { linha: LinhaFaixa; posicao: Posicao } => x.posicao !== null);

  /* Sem nenhuma régua sustentável, a seção inteira some. Régua com base de 3
     materiais não é régua — é coincidência com aparência de estatística. */
  if (calculadas.length === 0) return null;

  return (
    <section className={estilos.bloco} aria-labelledby="titulo-faixa">
      <h2 id="titulo-faixa" className={estilos.titulo}>
        Onde este material cai no catálogo
      </h2>
      <p className={estilos.subtitulo}>
        Comparado com {universoRotulo}. Um número solto não diz nada: 8,2 de velocidade só
        significa alguma coisa ao lado do que existe.
      </p>

      <dl className={estilos.lista}>
        {calculadas.map(({ linha, posicao }) => (
          <div key={linha.rotulo} className={estilos.item}>
            <dt className={estilos.rotulo}>{linha.rotulo}</dt>
            <dd className={estilos.valor}>
              <span className={`mono ${estilos.numero}`}>{linha.formato(posicao.valor)}</span>
              <Regua p={posicao} />
              <span className={estilos.leitura}>
                {leituraDaPosicao(posicao, linha.rotuloFrase)}
              </span>
              <span className={`mono ${estilos.extremos}`} aria-hidden="true">
                {linha.formato(posicao.min)} — {linha.formato(posicao.max)}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
