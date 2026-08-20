/**
 * WikiPong · Texto com os termos do glossário explicados no lugar
 * ==============================================================================
 * A metade visível do `src/logica/glossario.ts`. Recebe uma frase, devolve a
 * mesma frase com a primeira aparição de cada termo virando um gatilho que
 * explica o termo ali mesmo.
 *
 * ── POR QUE NÃO É UM `title=""` ──────────────────────────────────────────────
 * O atributo `title` parece resolver e não resolve: não aparece no toque, some
 * sozinho depois de alguns segundos, não é estilizável, e vários leitores de
 * tela o ignoram ou o leem duas vezes. Ele é a solução que funciona só para
 * quem já não precisava de ajuda.
 *
 * ── AS QUATRO ENTRADAS, porque nem todo mundo tem mouse ──────────────────────
 *   mouse    entra e sai do gatilho
 *   teclado  Tab foca e mostra; Escape fecha
 *   toque    toca e abre; toca fora e fecha
 *   leitor   `aria-describedby` liga o termo à definição quando ela está aberta
 *
 * O gatilho é um `<button>` de verdade, e não um `<span>` com `onClick`: é o que
 * dá foco, papel e teclado de graça. Ele nasce dentro do parágrafo, então herda
 * a tipografia do texto — a única coisa que muda é o sublinhado pontilhado.
 *
 * ── O QUE ELE NÃO FAZ ────────────────────────────────────────────────────────
 * Não marca o mesmo termo duas vezes (regra do módulo puro) e não substitui o
 * glossário: cada balão tem um link "ver no glossário", porque a definição
 * curta é uma porta, não o destino.
 */
'use client';

import { useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { marcarTermos, type TermoDoGlossario } from '@/src/logica/glossario';
import { TERMOS_GLOSSARIO, ancoraDoTermo } from './dados-glossario';
import estilos from './TextoComGlossario.module.css';

function TermoExplicado({ texto, termo }: { texto: string; termo: TermoDoGlossario }) {
  const [aberto, setAberto] = useState(false);
  const id = useId();
  const caixa = useRef<HTMLSpanElement | null>(null);

  /* Escape fecha e clique fora fecha — as duas saídas que todo popover precisa
     ter e que a versão com `title` não tem. */
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberto(false);
    };
    const aoApontar = (e: PointerEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('keydown', aoTeclar);
    document.addEventListener('pointerdown', aoApontar);
    return () => {
      document.removeEventListener('keydown', aoTeclar);
      document.removeEventListener('pointerdown', aoApontar);
    };
  }, [aberto]);

  return (
    <span className={estilos.caixa} ref={caixa}>
      <button
        type="button"
        className={estilos.gatilho}
        aria-expanded={aberto}
        aria-describedby={aberto ? id : undefined}
        onClick={() => setAberto((v) => !v)}
        onPointerEnter={(e) => {
          /* Só mouse: no toque, `pointerenter` dispara junto com o clique e o
             balão abriria e fecharia no mesmo gesto. */
          if (e.pointerType === 'mouse') setAberto(true);
        }}
        onPointerLeave={(e) => {
          if (e.pointerType === 'mouse') setAberto(false);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => setAberto(false)}
      >
        {texto}
      </button>

      {aberto && (
        <span className={estilos.balao} id={id} role="tooltip">
          <span className={`mono ${estilos.balaoTermo}`}>{termo.termo}</span>
          <span className={estilos.balaoTexto}>{termo.definicao}</span>
          <Link href={`/glossario/#${ancoraDoTermo(termo.termo)}`} className={estilos.balaoLink}>
            ver no glossário →
          </Link>
        </span>
      )}
    </span>
  );
}

export function TextoComGlossario({
  children,
  termos = TERMOS_GLOSSARIO,
}: {
  /** Texto puro. Passar JSX aqui não funciona, e é de propósito: marcar dentro
   *  de marcação exigiria caminhar a árvore e quebraria links existentes. */
  children: string;
  termos?: readonly TermoDoGlossario[];
}) {
  const pedacos = marcarTermos(children, termos);

  return (
    <>
      {pedacos.map((p, i) =>
        p.tipo === 'termo' ? (
          <TermoExplicado key={i} texto={p.texto} termo={p.termo} />
        ) : (
          <span key={i}>{p.texto}</span>
        ),
      )}
    </>
  );
}
