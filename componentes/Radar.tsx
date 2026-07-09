/**
 * WikiPong · componente Radar (a colheita final do D-15)
 * ------------------------------------------------------------------------------
 * Promove o radar decorativo do hero a componente reutilizável, com o requisito
 * do CLAUDE.md: OVERLAY de 2 polígonos (sólido × tracejado — distinguíveis sem
 * depender de cor). Draw-in portado do protótipo; morre sob prefers-reduced-motion
 * (override global).
 *
 * ACESSIBILIDADE: o gráfico é sempre aria-hidden. Quem usa DEVE oferecer a
 * alternativa acessível (tabela com os mesmos números — padrão D-14/D-09), como
 * fazem a home e o /comparar.
 *
 * Sem hooks: funciona em Server Components (hero SSG) e em Client (comparador).
 */
import estilos from './Radar.module.css';

export interface SerieRadar {
  nome: string;
  /** 0–10 por eixo, na mesma ordem de `eixos` */
  valores: number[];
  variante: 'solida' | 'tracejada';
}

interface PropsRadar {
  eixos: readonly string[];
  series: readonly SerieRadar[];
  tamanho?: number;
  animado?: boolean;
  legenda?: boolean;
}

function coords(valores: readonly number[], centro: number, raio: number): Array<[number, number]> {
  return valores.map((v, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / valores.length;
    const r = raio * (v / 10);
    return [centro + r * Math.cos(ang), centro + r * Math.sin(ang)];
  });
}

const pontos = (cs: Array<[number, number]>): string =>
  cs.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

export function Radar({ eixos, series, tamanho = 280, animado = false, legenda = true }: PropsRadar) {
  const centro = tamanho / 2;
  const raio = tamanho * 0.34;
  const cheio = eixos.map(() => 10);

  const rotulos = eixos.map((rotulo, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / eixos.length;
    const x = centro + (raio + 18) * Math.cos(ang);
    const y = centro + (raio + 18) * Math.sin(ang) + 3;
    const anchor: 'middle' | 'start' | 'end' =
      Math.abs(Math.cos(ang)) < 0.01 ? 'middle' : x > centro ? 'start' : 'end';
    return { rotulo, x, y, anchor };
  });

  return (
    <div aria-hidden="true">
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} role="presentation">
        {[0.25, 0.5, 0.75, 1].map((t) => (
          <polygon
            key={t}
            points={pontos(coords(cheio.map((v) => v * t), centro, raio))}
            className={estilos.anel}
          />
        ))}
        {coords(cheio, centro, raio).map(([x, y], i) => (
          <line key={i} x1={centro} y1={centro} x2={x} y2={y} className={estilos.anel} />
        ))}

        {series.map((s, i) => (
          <polygon
            key={s.nome}
            points={pontos(coords(s.valores, centro, raio))}
            className={[
              estilos.poligono,
              s.variante === 'solida' ? estilos.solida : estilos.tracejada,
              animado ? estilos.animado : '',
            ].join(' ')}
            style={animado ? { animationDelay: `${550 + i * 150}ms` } : undefined}
          />
        ))}
        {series
          .filter((s) => s.variante === 'solida')
          .map((s) =>
            coords(s.valores, centro, raio).map(([x, y], i) => (
              <circle
                key={`${s.nome}-${i}`}
                cx={x}
                cy={y}
                r={2.8}
                className={`${estilos.ponto} ${animado ? estilos.pontoAnimado : ''}`}
              />
            )),
          )}

        {rotulos.map((r) => (
          <text key={r.rotulo} x={r.x} y={r.y} textAnchor={r.anchor} className={estilos.rotulo}>
            {r.rotulo}
          </text>
        ))}
      </svg>

      {legenda && (
        <div className={estilos.legenda}>
          {series.map((s) => (
            <span key={s.nome}>
              <i className={s.variante === 'solida' ? estilos.amostraSolida : estilos.amostraTracejada} />{' '}
              {s.nome}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
