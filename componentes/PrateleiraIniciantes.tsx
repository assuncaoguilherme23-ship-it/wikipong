'use client';

/**
 * "Materiais para começar" — prateleira de rolagem horizontal dos materiais de
 * nível Iniciante (dado derivado, D-16: mostra o que a base realmente tem).
 *
 * Acessibilidade: os cards são links (Tab passa por eles e o navegador rola o
 * card focado pra dentro da vista — teclado coberto). As setas são conveniência
 * de mouse: botões reais com aria-label e estado desabilitado nas pontas.
 * scroll-snap pra parada limpa; a rolagem por seta respeita prefers-reduced-motion.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MATERIAIS } from './dados-materiais';
import { FotoProduto } from './FotoProduto';
import { brl } from './formato';
import estilos from './PrateleiraIniciantes.module.css';

const INICIANTES = MATERIAIS.filter((m) => m.nivel === 'Iniciante');

export function PrateleiraIniciantes() {
  const trilhoRef = useRef<HTMLUListElement | null>(null);
  const [posicao, setPosicao] = useState<'inicio' | 'meio' | 'fim' | 'estatico'>('inicio');

  const atualizar = useCallback(() => {
    const el = trilhoRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    if (max <= 4) setPosicao('estatico');
    else if (el.scrollLeft <= 4) setPosicao('inicio');
    else if (el.scrollLeft >= max - 4) setPosicao('fim');
    else setPosicao('meio');
  }, []);

  useEffect(() => {
    atualizar();
    window.addEventListener('resize', atualizar);
    return () => window.removeEventListener('resize', atualizar);
  }, [atualizar]);

  function rolar(dir: -1 | 1) {
    const el = trilhoRef.current;
    if (!el) return;
    const suave = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.85, 520), behavior: suave ? 'smooth' : 'auto' });
  }

  return (
    <section className={`container ${estilos.secao}`} aria-labelledby="titulo-comecar">
      <div className={`${estilos.topo} revela`}>
        <div>
          <h2 id="titulo-comecar" className={estilos.titulo}>
            Materiais para começar
          </h2>
          <p className={estilos.sub}>
            Controle alto e velocidade contida — a base que perdoa enquanto a sua técnica cresce.
          </p>
        </div>
        {posicao !== 'estatico' && (
          <div className={estilos.setas}>
            <button
              type="button"
              className={estilos.seta}
              onClick={() => rolar(-1)}
              disabled={posicao === 'inicio'}
              aria-label="Ver materiais anteriores"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M11 4l-5 5 5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              className={estilos.seta}
              onClick={() => rolar(1)}
              disabled={posicao === 'fim'}
              aria-label="Ver próximos materiais"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M7 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <ul
        className={estilos.trilho}
        ref={trilhoRef}
        onScroll={atualizar}
        aria-label="Materiais para iniciantes"
      >
        {INICIANTES.map((m) => (
          <li key={m.id} className={estilos.item}>
            <Link href={`/materiais/${m.id}/`} className={estilos.cartao}>
              <span className={estilos.glifoCaixa}>
                <FotoProduto id={m.id} nome={m.nome} tipo={m.tipo} tamanho={64} />
              </span>
              <span className={estilos.nome}>{m.nome}</span>
              <span className={`mono ${estilos.meta}`}>
                {m.marca} · {m.tipo}
              </span>
              <span className={estilos.tag}>{m.simples.tag}</span>
              <span className={`mono ${estilos.preco}`}>{brl(m.preco)}</span>
            </Link>
          </li>
        ))}
        <li className={estilos.item}>
          <Link href="/catalogo/?nivel=iniciante" className={estilos.verTodos}>
            <span aria-hidden="true">→</span>
            Ver todos os iniciantes no catálogo
          </Link>
        </li>
      </ul>
    </section>
  );
}
