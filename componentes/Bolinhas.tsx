/**
 * Bolinhas 0–5 do modo Simples (D-08): renderiza paraBolinhas() de metricas.ts.
 * Decorativas (aria-hidden) — quem chama exibe a palavra/valor acessível ao lado.
 */
import { paraBolinhas } from '@/src/logica/metricas';
import estilos from './Bolinhas.module.css';

export function Bolinhas({ valor }: { valor: number }) {
  const cheias = paraBolinhas(valor);
  return (
    <span className={estilos.bolinhas} aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <i key={i} className={i < cheias ? estilos.cheia : estilos.vazia} />
      ))}
    </span>
  );
}
