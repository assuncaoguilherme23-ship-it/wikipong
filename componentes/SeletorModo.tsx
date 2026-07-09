'use client';

/** Alternador Simples ↔ Técnico (D-08). Controlado: quem persiste é o usarModo. */
import type { Modo } from './usarModo';
import estilos from './SeletorModo.module.css';

export function SeletorModo({ modo, aoMudar }: { modo: Modo; aoMudar: (m: Modo) => void }) {
  return (
    <div className={estilos.grupo} role="group" aria-label="Modo de exibição">
      <button
        type="button"
        className={estilos.opcao}
        aria-pressed={modo === 'simples'}
        onClick={() => aoMudar('simples')}
      >
        Simples
      </button>
      <button
        type="button"
        className={estilos.opcao}
        aria-pressed={modo === 'tecnico'}
        onClick={() => aoMudar('tecnico')}
      >
        Técnico
      </button>
    </div>
  );
}
