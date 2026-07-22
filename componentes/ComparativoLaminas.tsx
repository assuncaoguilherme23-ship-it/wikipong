/**
 * Comparativo de lâminas — só com o que é HONESTAMENTE comparável entre marcas:
 * composição, classe (ALL/OFF é convenção da indústria) e espessura em mm.
 *
 * Decisão deliberada (D-09/D-14): os índices de cada fabricante NÃO entram em
 * colunas lado a lado. Butterfly publica "Reação/Vibração"; Stiga e Donic
 * publicam "Velocidade/Controle" em 0–100 — colocar isso em colunas vizinhas
 * seria a gramática visual da comparabilidade aplicada a números que não se
 * comparam. Eles aparecem depois, cada um com a sua escala declarada.
 */
import Link from 'next/link';
import estilos from './ComparativoLaminas.module.css';

export interface LaminaComparada {
  nome: string;
  id?: string;
  composicao: string;
  classe: string;
  espessura: string;
  /** ex.: "Stiga: Velocidade 73 · Controle 77 (escala Stiga, 0–100)" */
  indiceProprio?: string;
}

export function ComparativoLaminas({ laminas }: { laminas: LaminaComparada[] }) {
  const comIndice = laminas.filter((l) => l.indiceProprio);

  return (
    <div className={estilos.caixa}>
      <div className={estilos.rolagem}>
        <table className={estilos.tabela}>
          <thead>
            <tr>
              <th scope="col">Lâmina</th>
              <th scope="col">Composição</th>
              <th scope="col">Classe</th>
              <th scope="col">Espessura</th>
            </tr>
          </thead>
          <tbody>
            {laminas.map((l) => (
              <tr key={l.nome}>
                <th scope="row">
                  {l.id ? <Link href={`/materiais/${l.id}/`}>{l.nome}</Link> : l.nome}
                </th>
                <td>{l.composicao}</td>
                <td>{l.classe}</td>
                <td className="mono">{l.espessura}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {comIndice.length > 0 && (
        <div className={estilos.indices}>
          <p className={`mono ${estilos.indicesTitulo}`}>
            O que cada marca publica — cada uma na própria escala
          </p>
          <ul className={estilos.indicesLista}>
            {comIndice.map((l) => (
              <li key={l.nome}>
                <strong>{l.nome}</strong> — {l.indiceProprio}
              </li>
            ))}
          </ul>
          <p className={estilos.indicesAviso}>
            Estes números ficam fora da tabela de propósito: colocá-los em colunas vizinhas
            sugeriria que dá pra compará-los, e não dá — são réguas diferentes, de marcas
            diferentes, medindo coisas diferentes.
          </p>
        </div>
      )}
    </div>
  );
}
