'use client';

/**
 * TradutorEscalas — a tese do WikiPong virando gesto.
 *
 * O site inteiro argumenta que "o 9.0 de uma marca não é o 9.0 da outra". Aqui a
 * pessoa MEXE e vê: arrasta 39° na régua chinesa e enxerga que aquilo é 51° na
 * europeia — dureza de outro mundo. É o argumento provado na mão, não afirmado.
 *
 * Honestidade (D-16/D-09): a saída é FAIXA, não número — a conversão é regra
 * comunitária com incerteza real, e fingir "51,0°" seria precisão inventada. O
 * carimbo A VALIDAR fica visível junto do resultado, não escondido num rodapé.
 */
import { useId, useState } from 'react';
import {
  ESCALAS,
  converter,
  faixaLegivel,
  paraESN,
  sensacao,
  type Escala,
} from '@/src/logica/escalas';
import estilos from './TradutorEscalas.module.css';

/** Limites do controle: cobre da esponja mais macia à mais dura em qualquer régua. */
const MIN = 25;
const MAX = 60;

/** Régua visual em ESN — os cortes são os mesmos do `sensacao`. */
const ZONAS = [
  { ate: 40, rotulo: 'macia' },
  { ate: 45, rotulo: '' },
  { ate: 50, rotulo: 'média' },
  { ate: 55, rotulo: '' },
  { ate: 60, rotulo: 'dura' },
];

export function TradutorEscalas({ inicial = 39, escalaInicial = 'dhs' as Escala }) {
  const [valor, setValor] = useState(inicial);
  const [escala, setEscala] = useState<Escala>(escalaInicial);
  const idValor = useId();

  const faixaESN = paraESN(valor, escala);
  const centroESN = (faixaESN.min + faixaESN.max) / 2;
  const s = sensacao(centroESN);
  const posicao = Math.min(100, Math.max(0, ((centroESN - MIN) / (MAX - MIN)) * 100));

  const outras = ESCALAS.filter((e) => e.id !== escala);

  return (
    <div className={estilos.bloco}>
      {/* ── Entrada: quanto, em qual régua ── */}
      <div className={estilos.entrada}>
        <div className={estilos.campoValor}>
          <label htmlFor={idValor} className={estilos.rotuloCampo}>
            Dureza
          </label>
          <div className={estilos.valorLinha}>
            <output className={`mono ${estilos.valorGrande}`}>{valor}°</output>
            <input
              id={idValor}
              type="range"
              min={MIN}
              max={MAX}
              step={1}
              value={valor}
              onChange={(e) => setValor(Number(e.target.value))}
              className={estilos.controle}
            />
          </div>
        </div>

        <fieldset className={estilos.grupoEscala}>
          <legend className={estilos.rotuloCampo}>na escala</legend>
          <div className={estilos.opcoesEscala}>
            {ESCALAS.map((e) => (
              <button
                key={e.id}
                type="button"
                className={estilos.opcaoEscala}
                aria-pressed={escala === e.id}
                onClick={() => setEscala(e.id)}
              >
                {e.nome.split(' ')[0]}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* ── Saída: o mesmo número nas outras réguas ── */}
      <div className={estilos.saida} aria-live="polite">
        <p className={estilos.saidaTitulo}>
          {valor}° na escala {ESCALAS.find((e) => e.id === escala)?.nome.split(' ')[0]} equivale a
        </p>
        <dl className={estilos.equivalencias}>
          {outras.map((e) => (
            <div key={e.id} className={estilos.equivalencia}>
              <dt className={estilos.equivNome}>{e.nome}</dt>
              <dd className={`mono ${estilos.equivValor}`}>
                {faixaLegivel(converter(valor, escala, e.id))}
              </dd>
            </div>
          ))}
        </dl>

        {/* Régua ESN: onde essa dureza cai na experiência de jogo */}
        <div className={estilos.regua}>
          <div className={estilos.reguaBarra} aria-hidden="true">
            {ZONAS.map((z, i) => (
              <span key={z.ate} className={estilos.zona} data-forte={i >= 3 ? 'sim' : undefined}>
                {z.rotulo}
              </span>
            ))}
            <span className={estilos.marcador} style={{ left: `${posicao}%` }} />
          </div>
          <p className={estilos.sensacao}>
            <strong>{s.rotulo}.</strong> {s.descricao}
          </p>
        </div>

        <p className={estilos.selo}>
          <span className={estilos.seloTag}>A validar</span>
          Conversão por regra da comunidade, não medição de laboratório — por isso a
          resposta é uma faixa, e não um número exato. Pendente de validação do
          especialista (D-09).
        </p>
      </div>
    </div>
  );
}
