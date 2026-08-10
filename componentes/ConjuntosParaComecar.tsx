/**
 * WikiPong · "Raquete inteira para começar" — na home, antes das peças soltas
 * ------------------------------------------------------------------------------
 * A home tinha uma prateleira de materiais de nível Iniciante, e ela responde à
 * pergunta errada para quem está começando. Quem nunca comprou uma raquete não
 * está escolhendo UMA borracha: está tentando descobrir que compra três coisas,
 * que a lâmina vem nua, e que os dois lados podem ser diferentes. Uma lista de
 * peças soltas pede que a pessoa monte o quebra-cabeça antes de saber que existe
 * um quebra-cabeça.
 *
 * Por isso esta seção vem ANTES da prateleira: primeiro a resposta pronta, e só
 * depois as peças para quem quiser escolher uma a uma.
 *
 * Cada card leva direto ao /montar com as três peças na URL (D-12). É o destino
 * mais completo que existe para uma combinação: lá estão o resumo em prosa do
 * conjunto, o gráfico dos dois lados, o veredito peça a peça e o preço somado —
 * e a pessoa pode trocar uma peça sem recomeçar.
 *
 * NADA DE NOTA DE DESEMPENHO DO CONJUNTO. A regra do dados/conjuntos.json vale
 * aqui igual: lâmina e borrachas interagem, cada lado faz um trabalho diferente,
 * e qualquer "velocidade do conjunto" seria número inventado. O que se publica é
 * o preço, que é soma real, e o `porque`, que é recomendação editorial assumida.
 */
import Link from 'next/link';
import { CONJUNTOS } from './dados-conjuntos';
import { FotoProduto } from './FotoProduto';
import { dinheiro } from './formato';
import estilos from './ConjuntosParaComecar.module.css';

/* Derivado, não escrito à mão: se um conjunto de iniciante for acrescentado ou
   mudar de nível no JSON, esta seção acompanha sozinha.

   As TRÊS peças precisam existir. `resolver()` descarta silenciosamente a peça
   cujo id não está no catálogo — é o certo, porque um id velho não pode derrubar
   a página inteira. Mas uma seção que promete "raquete inteira" não pode
   anunciar um conjunto ao qual falta a borracha do backhand. Aí não é inteira, e
   o card mostraria duas fotos onde diz três. */
const PARA_COMECAR = CONJUNTOS.filter((c) => c.nivel === 'Iniciante' && c.pecas.length === 3);

const CURTO: Record<string, string> = {
  'Lâmina': 'lâmina',
  Forehand: 'forehand',
  Backhand: 'backhand',
};

export function ConjuntosParaComecar() {
  /* Sem conjunto de iniciante, a seção não aparece. Um título com grade vazia é
     pior que ausência: promete e não entrega (D-16). */
  if (PARA_COMECAR.length === 0) return null;

  return (
    <section className={`container ${estilos.secao}`} aria-labelledby="conjuntos-comecar">
      <div className={estilos.cabeca}>
        <h2 id="conjuntos-comecar" className={estilos.titulo}>
          Raquete inteira, pronta para começar
        </h2>
        <p className={estilos.lede}>
          Uma raquete de verdade são <strong>três compras</strong>: a lâmina e uma borracha para
          cada lado. Estas três montagens já estão fechadas — com o motivo de cada escolha e o
          preço somado, sem letra miúda.
        </p>
      </div>

      <ul className={estilos.grade}>
        {PARA_COMECAR.map((c) => (
          <li key={c.id}>
            <Link
              href={`/montar/?lamina=${c.lamina}&fh=${c.borrachaFH}&bh=${c.borrachaBH}`}
              className={estilos.cartao}
            >
              <span className={estilos.nome}>{c.nome}</span>
              <span className={estilos.resumo}>{c.resumo}</span>

              <span className={estilos.pecas} aria-hidden="true">
                {c.pecas.map((p) => (
                  <span key={p.papel} className={estilos.peca}>
                    <FotoProduto
                      id={p.material.id}
                      nome={p.material.nome}
                      tipo={p.material.tipo}
                      tamanho={56}
                    />
                    <span className={`mono ${estilos.papel}`}>{CURTO[p.papel]}</span>
                  </span>
                ))}
              </span>

              {/* A lista de peças acima é decorativa para quem usa leitor de
                  tela — as fotos não dizem nada. Os nomes vêm em texto aqui. */}
              <span className={estilos.nomesPecas}>
                {c.pecas.map((p) => `${CURTO[p.papel]}: ${p.material.marca} ${p.material.nome}`)
                  .join(' · ')}
              </span>

              <span className={estilos.rodape}>
                {c.misturaMoedas ? (
                  /* Peças em moedas diferentes não somam. Dizer isso é melhor
                     que publicar um total que ninguém consegue pagar. */
                  <span className={`mono ${estilos.semTotal}`}>peças em moedas diferentes</span>
                ) : (
                  <span className={`mono ${estilos.preco}`}>
                    {dinheiro(c.precoTotal, c.moeda)}
                    <span className={estilos.precoRotulo}>as três peças</span>
                  </span>
                )}
                <span className={estilos.seta} aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className={estilos.saidas}>
        <Link href="/conjuntos/">Ver as montagens com o porquê de cada escolha →</Link>
        <Link href="/quiz/">Não sabe por onde começar? Responda 5 perguntas →</Link>
      </p>
    </section>
  );
}
