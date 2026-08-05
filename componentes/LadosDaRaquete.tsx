'use client';

/**
 * WikiPong · Os dois lados da raquete, frente a frente
 * ==============================================================================
 * POR QUE ESTE GRÁFICO, E NÃO MAIS UM RADAR
 *
 * A ficha do material já tem radar (formato da peça) e régua (posição no
 * catálogo); a comparação tem barras. Repetir qualquer um deles aqui não
 * responderia a pergunta que o configurador levanta, que é outra:
 *
 *   **os meus dois lados estão desequilibrados?**
 *
 * Uma raquete é literalmente duas superfícies opostas, e a decisão de quem monta
 * é quase sempre sobre a DIFERENÇA entre elas — forehand mais rápido, backhand
 * mais controlado, ou os dois iguais. Então o gráfico é uma borboleta: um eixo
 * central com o nome da característica e duas barras saindo dele em direções
 * opostas, forehand para a esquerda e backhand para a direita.
 *
 * A leitura é imediata e não precisa de legenda: barra simétrica = lados
 * parecidos; barra torta = um lado domina naquela característica.
 *
 * ── ACESSIBILIDADE ───────────────────────────────────────────────────────────
 *
 * Tabela de verdade por baixo, com os dois números e a diferença em texto. As
 * barras são `aria-hidden` — quem usa leitor de tela recebe os números, não um
 * desenho mudo.
 */
import estilos from './LadosDaRaquete.module.css';

export interface LinhaLados {
  rotulo: string;
  /** Valor do forehand. `undefined` = a peça não tem esse índice. */
  fh?: number;
  bh?: number;
  /** Escala do índice; tudo aqui é 0–10. */
  maximo?: number;
}

/** Diferença acima da qual vale chamar de desequilíbrio, na escala 0–10. */
export const DIFERENCA_NOTAVEL = 1.5;

export function LadosDaRaquete({
  linhas,
  nomeFH,
  nomeBH,
}: {
  linhas: readonly LinhaLados[];
  nomeFH: string;
  nomeBH: string;
}) {
  /* Só entra a característica que OS DOIS lados têm: barra de um lado só não é
     comparação, é número solto com desenho em volta. */
  const validas = linhas.filter((l) => l.fh !== undefined && l.bh !== undefined);
  if (validas.length === 0) return null;

  return (
    <figure className={estilos.bloco}>
      <figcaption className={estilos.legenda}>
        <span className={estilos.ladoFH}>◀ {nomeFH}</span>
        <span className={estilos.tituloLegenda}>forehand × backhand</span>
        <span className={estilos.ladoBH}>{nomeBH} ▶</span>
      </figcaption>

      <div className={estilos.grade}>
        {validas.map((l) => {
          const max = l.maximo ?? 10;
          const fh = l.fh!;
          const bh = l.bh!;
          const dif = Math.abs(fh - bh);
          const notavel = dif >= DIFERENCA_NOTAVEL;
          return (
            <div key={l.rotulo} className={estilos.linha}>
              <span className={`mono ${estilos.valorFH}`}>{fh.toFixed(1)}</span>

              <span className={estilos.trilhoFH} aria-hidden="true">
                <span
                  className={`${estilos.barra} ${notavel && fh > bh ? estilos.dominante : ''}`}
                  style={{ width: `${(fh / max) * 100}%` }}
                />
              </span>

              <span className={estilos.rotulo}>{l.rotulo}</span>

              <span className={estilos.trilhoBH} aria-hidden="true">
                <span
                  className={`${estilos.barra} ${notavel && bh > fh ? estilos.dominante : ''}`}
                  style={{ width: `${(bh / max) * 100}%` }}
                />
              </span>

              <span className={`mono ${estilos.valorBH}`}>{bh.toFixed(1)}</span>
            </div>
          );
        })}
      </div>
    </figure>
  );
}
