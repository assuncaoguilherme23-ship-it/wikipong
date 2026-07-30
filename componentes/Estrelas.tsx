/**
 * WikiPong · Estrelas — leitura e entrada
 * ------------------------------------------------------------------------------
 * Dois modos no mesmo desenho, pra que dar a nota e ler a nota tenham a mesma
 * forma: `Estrelas` só mostra, `EstrelasEntrada` deixa escolher.
 *
 * Acessibilidade:
 *  · a versão de leitura é UMA imagem com texto ("4 de 5 estrelas"), não cinco
 *    ícones soltos que o leitor de tela soletraria um a um;
 *  · a de entrada é um radiogroup de verdade — seta navega, espaço escolhe,
 *    e cada opção tem rótulo em palavras, porque "★★★★☆" não se lê em voz alta;
 *  · o hover só pinta com ponteiro fino (@media hover), pra não acender no
 *    toque acidental do celular.
 */
'use client';

import { useId, useState } from 'react';
import estilos from './Estrelas.module.css';

const CAMINHO_ESTRELA =
  'M10 1.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L1.6 7.7l5.8-.8z';

function Estrela({ preenchida }: { preenchida: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className={estilos.icone} aria-hidden="true" focusable="false">
      <path
        d={CAMINHO_ESTRELA}
        className={preenchida ? estilos.cheia : estilos.vazia}
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Estrelas({
  nota,
  tamanho = 'md',
}: {
  nota: number;
  tamanho?: 'sm' | 'md' | 'lg';
}) {
  const cheias = Math.round(nota);
  return (
    <span className={`${estilos.linha} ${estilos[tamanho]}`} role="img"
      aria-label={`${nota.toFixed(1).replace('.', ',')} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Estrela key={n} preenchida={n <= cheias} />
      ))}
    </span>
  );
}

/** As palavras existem pro leitor de tela e pro hover — nota crua não diz nada. */
const SENTIDO: Readonly<Record<number, string>> = {
  1: 'Não recomendo',
  2: 'Deixou a desejar',
  3: 'Cumpre o que promete',
  4: 'Muito boa',
  5: 'Melhor impossível',
};

export function EstrelasEntrada({
  valor,
  aoEscolher,
  invalido = false,
}: {
  valor?: number;
  aoEscolher: (n: number) => void;
  invalido?: boolean;
}) {
  const [espiando, setEspiando] = useState<number | undefined>();
  const grupo = useId();
  const mostrando = espiando ?? valor;

  return (
    <div className={estilos.entradaBloco}>
      <div
        className={`${estilos.entrada} ${invalido ? estilos.invalida : ''}`}
        role="radiogroup"
        aria-label="Sua nota, de 1 a 5 estrelas"
        onMouseLeave={() => setEspiando(undefined)}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={estilos.opcao} onMouseEnter={() => setEspiando(n)}>
            <input
              type="radio"
              name={grupo}
              value={n}
              checked={valor === n}
              onChange={() => aoEscolher(n)}
              className={estilos.radio}
            />
            <span className={estilos.visual}>
              <Estrela preenchida={mostrando !== undefined && n <= mostrando} />
            </span>
            <span className="apenas-leitor">{`${n} — ${SENTIDO[n]}`}</span>
          </label>
        ))}
      </div>
      {/* Reserva a altura sempre, pra escolher estrela não empurrar o formulário. */}
      <p className={estilos.sentido} aria-hidden="true">
        {mostrando ? SENTIDO[mostrando] : ' '}
      </p>
    </div>
  );
}
