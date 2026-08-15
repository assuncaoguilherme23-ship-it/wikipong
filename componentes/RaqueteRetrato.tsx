/**
 * WikiPong · A raquete de alguém, como retrato
 * ------------------------------------------------------------------------------
 * Num site de equipamento, a raquete diz mais sobre a pessoa que a cara dela.
 * Por isso o centro do perfil é isto, e não um avatar.
 *
 * SEM NÚMEROS, de propósito — e a razão importa:
 *
 * O desenho original pedia "o radar das características somadas" das três
 * peças. Esse número não existe. O radar deste site é alimentado por
 * `metricasComparaveis(a, b)`, que compara DOIS materiais; não há régua definida
 * para somar uma lâmina com duas borrachas, e velocidade de lâmina não é a mesma
 * grandeza que velocidade de borracha.
 *
 * Enfileirar os números de cada peça também não serve: o catálogo tem DUAS
 * réguas (`semente` até 10, `megaspin` até 150). Duas peças podem estar em
 * réguas diferentes, e pôr "9.0" ao lado de "128" sem dizer a régua é
 * exatamente a comparação enganosa que o `comparacao.ts` já recusa com
 * `mesmaRegua`.
 *
 * Então o retrato mostra as peças e leva para a ficha, onde o número tem
 * procedência declarada.
 */
'use client';

import Link from 'next/link';
import { FotoProduto } from './FotoProduto';
import { materialPorId } from './dados-materiais';
import { nomeComMarca } from './formato';
import { ROTULO_PAPEL, type PapelPeca } from '../src/logica/montagem';
import estilos from './RaqueteRetrato.module.css';

const PAPEIS: readonly PapelPeca[] = ['lamina', 'fh', 'bh'];

export function RaqueteRetrato({
  equipamento,
}: {
  equipamento: { lamina?: string; fh?: string; bh?: string };
}) {
  const pecas = PAPEIS.map((papel) => {
    const id = equipamento[papel];
    const material = id ? materialPorId(id) : undefined;
    return material ? { papel, material } : null;
  }).filter((p): p is { papel: PapelPeca; material: NonNullable<ReturnType<typeof materialPorId>> } =>
    p !== null,
  );

  /* Bloco sem peça nenhuma desaparece inteiro. Perfil novo mostra o pouco que
     tem, não uma lista das suas ausências. */
  if (pecas.length === 0) return null;

  return (
    <section className={estilos.retrato} aria-labelledby="t-raquete">
      <h2 id="t-raquete" className={estilos.titulo}>
        A raquete
      </h2>

      <ul className={estilos.pecas}>
        {pecas.map(({ papel, material }) => (
          <li key={papel}>
            <Link href={`/materiais/${material.id}/`} className={estilos.peca}>
              <span className={`mono ${estilos.papel}`}>{ROTULO_PAPEL[papel]}</span>
              <FotoProduto
                id={material.id}
                nome={material.nome}
                tipo={material.tipo}
                tamanho={72}
              />
              <span className={estilos.nome}>{nomeComMarca(material.marca, material.nome)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
