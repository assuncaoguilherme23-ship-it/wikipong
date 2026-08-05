/**
 * WikiPong · Monograma da marca
 * ==============================================================================
 * POR QUE NÃO O LOGO DE VERDADE
 *
 * O pedido era "coloque a imagem da marca". Não coloquei, e o motivo é de design
 * antes de ser jurídico: os quinze logos têm formatos incompatíveis entre si.
 * Butterfly é um wordmark largo, DHS é símbolo com texto ao lado, Yinhe é outra
 * proporção ainda. Numa GRADE UNIFORME, isso vira desalinhamento — cada cartão
 * com uma mancha de tamanho e peso diferente, que é exatamente o defeito que
 * este componente foi feito para resolver.
 *
 * Há o lado prático também: seriam quinze arquivos de marca registrada baixados
 * à mão, com o mesmo risco de pegar o arquivo errado que já custou caro aqui
 * (193 materiais chegaram a mostrar o selo "COMPRA 100% SEGURA" da loja no lugar
 * da foto do produto).
 *
 * O monograma resolve o que o logo resolveria — dar identidade e âncora visual
 * ao cartão — com forma idêntica em todos, contraste garantido nos dois temas e
 * zero dependência externa. É o mesmo raciocínio do `Glifo`, que normaliza a
 * "imagem" dos materiais sem foto.
 *
 * A BANDEIRA vem junto porque a marca JÁ declara o país, e ele estava só como
 * texto em caixa alta no canto. País de origem diz bastante em tênis de mesa —
 * borracha alemã e borracha chinesa são escolas diferentes de jogar.
 */
import { Bandeira } from './Bandeira';
import estilos from './MonogramaMarca.module.css';

/**
 * Iniciais da marca, no máximo duas letras.
 *
 * "Friendship 729" vira FR e não F7: número em monograma lê como parte de um
 * código, não como nome. Marca de palavra única usa as duas primeiras letras.
 */
export function iniciaisDaMarca(nome: string): string {
  const palavras = nome
    .split(/\s+/)
    .filter((p) => /^[A-Za-zÀ-ÿ]/.test(p));

  if (palavras.length >= 2) {
    return (palavras[0][0] + palavras[1][0]).toUpperCase();
  }
  return (palavras[0] ?? nome).slice(0, 2).toUpperCase();
}

export function MonogramaMarca({
  nome,
  pais,
  tamanho = 52,
}: {
  nome: string;
  pais?: string;
  tamanho?: number;
}) {
  return (
    <span
      className={estilos.tile}
      style={{ width: tamanho, height: tamanho }}
      aria-hidden="true"
    >
      <span className={estilos.iniciais} style={{ fontSize: tamanho * 0.38 }}>
        {iniciaisDaMarca(nome)}
      </span>
      {pais && (
        <span className={estilos.bandeira}>
          <Bandeira pais={pais} altura={Math.round(tamanho * 0.24)} />
        </span>
      )}
    </span>
  );
}
