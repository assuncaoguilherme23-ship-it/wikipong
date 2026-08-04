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
  /**
   * Mostra o VALOR ao lado do rótulo de cada eixo (ex.: "VEL 9,0").
   *
   * Existe porque um radar sozinho é forma sem régua: dá para ver que um lado é
   * maior que o outro e não dá para saber quanto. Na ficha, onde há um polígono
   * só, o número é o que transforma o desenho em informação. No /comparar fica
   * desligado — lá são dois polígonos e a tabela ao lado já traz os números.
   */
  mostrarValores?: boolean;
  /**
   * Sufixo do id do gradiente. `<defs>` é global no documento: dois radares na
   * mesma página com o mesmo id fariam o segundo herdar o preenchimento do
   * primeiro.
   */
  id?: string;
  /** 'carga' = draw-in no load (padrão); 'rolagem' = scrubbed pelo scroll
      (CSS scroll-driven; sem suporte, mostra estático — nunca some conteúdo). */
  revelacao?: 'carga' | 'rolagem';
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

export function Radar({
  eixos,
  series,
  tamanho = 280,
  animado = false,
  legenda = true,
  revelacao = 'carga',
  mostrarValores = false,
  id = 'radar',
}: PropsRadar) {
  const porRolagem = animado && revelacao === 'rolagem';
  const centro = tamanho / 2;
  const raio = tamanho * 0.34;
  const cheio = eixos.map(() => 10);
  /* A série sólida manda nos números dos eixos: é o material da ficha. A
     tracejada, quando existe, é referência de fundo. */
  const principal = series.find((s) => s.variante === 'solida') ?? series[0];

  const rotulos = eixos.map((rotulo, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / eixos.length;
    const x = centro + (raio + 18) * Math.cos(ang);
    const y = centro + (raio + 18) * Math.sin(ang) + 3;
    const anchor: 'middle' | 'start' | 'end' =
      Math.abs(Math.cos(ang)) < 0.01 ? 'middle' : x > centro ? 'start' : 'end';
    const valor = principal?.valores[i];
    return { rotulo, x, y, anchor, valor };
  });

  const idGradiente = `grad-radar-${id}`;

  return (
    <div aria-hidden="true" className={porRolagem ? estilos.cronologiaRolagem : undefined}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} role="presentation">
        {/* O preenchimento era um chapado de 13% — quase invisível, e a figura
            parecia contorno vazio. O gradiente sai do centro (mais denso) para a
            borda (mais leve): dá corpo sem competir com a linha, que é quem
            carrega a informação. */}
        <defs>
          <radialGradient id={idGradiente} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--cor-acento)" stopOpacity="0.34" />
            <stop offset="100%" stopColor="var(--cor-acento)" stopOpacity="0.08" />
          </radialGradient>
        </defs>

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
              animado ? (porRolagem ? estilos.animadoRolagem : estilos.animado) : '',
            ].join(' ')}
            style={{
              ...(animado && !porRolagem ? { animationDelay: `${550 + i * 150}ms` } : {}),
              ...(s.variante === 'solida' ? { fill: `url(#${idGradiente})` } : {}),
            }}
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
                className={`${estilos.ponto} ${
                  animado ? (porRolagem ? estilos.pontoRolagem : estilos.pontoAnimado) : ''
                }`}
              />
            )),
          )}

        {rotulos.map((r) => (
          <text key={r.rotulo} x={r.x} y={r.y} textAnchor={r.anchor} className={estilos.rotulo}>
            {r.rotulo}
            {mostrarValores && r.valor !== undefined && (
              <tspan className={estilos.valorEixo} dx="5">
                {r.valor.toFixed(1)}
              </tspan>
            )}
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
