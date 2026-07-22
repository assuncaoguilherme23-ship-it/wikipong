/**
 * Régua de dureza da esponja — macia → dura, ancorada em DADO REAL de fabricante
 * (dados/fabricantes.json). Cada item declara sua faixa em GRAUS ESN; itens de
 * outra escala (ex.: DHS) entram pela equivalência, com o aviso visível — porque
 * "39°" chinês não é "39°" europeu, e esconder isso seria mentir por omissão (D-16).
 *
 * Acessibilidade: é uma lista semântica (não um gráfico). A barra é decorativa
 * (aria-hidden); o valor em graus está sempre em texto.
 */
import Link from 'next/link';
import estilos from './EscalaDureza.module.css';

export interface ItemDureza {
  nome: string;
  /** id do material no catálogo — vira link pra ficha */
  id?: string;
  /** faixa em graus na escala ESN (equivalente, quando a original for outra) */
  min: number;
  max: number;
  /** rótulo exibido (ex.: "37° a 41° DHS ≈ 51° ESN") */
  rotulo: string;
  /** aviso curto quando a escala original não é a ESN */
  escalaOutra?: string;
}

const PISO = 30;
const TETO = 55;
const pct = (g: number) => ((g - PISO) / (TETO - PISO)) * 100;

export function EscalaDureza({ itens }: { itens: ItemDureza[] }) {
  const ordenados = [...itens].sort((a, b) => (a.min + a.max) / 2 - (b.min + b.max) / 2);

  return (
    <div className={estilos.caixa}>
      <p className={`mono ${estilos.extremos}`}>
        <span>← mais macia · {PISO}°</span>
        <span>{TETO}° · mais dura →</span>
      </p>

      <ol className={estilos.lista}>
        {ordenados.map((item) => {
          const esquerda = pct(item.min);
          const largura = Math.max(pct(item.max) - pct(item.min), 2.5);
          return (
            <li key={item.nome} className={estilos.item}>
              <span className={estilos.nome}>
                {item.id ? <Link href={`/materiais/${item.id}/`}>{item.nome}</Link> : item.nome}
                {item.escalaOutra && (
                  <span className={estilos.avisoEscala}>{item.escalaOutra}</span>
                )}
              </span>
              <span className={estilos.trilho} aria-hidden="true">
                <span
                  className={estilos.marca}
                  style={{ left: `${esquerda}%`, width: `${largura}%` }}
                />
              </span>
              <span className={`mono ${estilos.graus}`}>{item.rotulo}</span>
            </li>
          );
        })}
      </ol>

      <p className={estilos.rodape}>
        Valores conforme o fabricante (fonte em cada ficha). Onde as fontes divergem,
        mostramos a faixa em vez de um número exato.
      </p>
    </div>
  );
}
