/**
 * WikiPong · Guias do "Aprender" (D-03)
 * ------------------------------------------------------------------------------
 * Conteúdo educativo em português claro — os 6 tópicos da Page 1 antiga do Figma,
 * agora escritos de verdade. Registro-guia (D-14): isto é ORIENTAÇÃO editorial,
 * não spec de fabricante; onde há regra externa (ITTF), aponta pra fonte oficial
 * em vez de fingir autoridade (D-16). Cross-links ligam glossário, quiz, catálogo
 * e fichas. É também o 2º corpus do assistente IA (D-10: glossário → guias → …).
 *
 * Metadados guiam o índice e a nav; o `corpo` é JSX pra permitir os links.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface Guia {
  slug: string;
  titulo: string;
  resumo: string;
  minutos: number;
  corpo: ReactNode;
}

export const GUIAS: Guia[] = [
  {
    slug: 'como-escolher-borracha',
    titulo: 'Como escolher sua borracha',
    resumo: 'Tipo, dureza da esponja e por que o iniciante deve começar pelo controle.',
    minutos: 4,
    corpo: (
      <>
        <p>
          A borracha é o que mais muda a sensação do seu jogo — mais até que a marca da
          lâmina. Antes de olhar preço, entenda três coisas: o tipo, a dureza da esponja e o
          que você precisa <em>agora</em>.
        </p>
        <h2>Lisa ou com pinos?</h2>
        <p>
          Quase todo mundo começa (e faz bem) com borracha <strong>lisa</strong> — a superfície
          virada para dentro, que dá efeito previsível e controle. Borrachas de pinos (curtos ou
          longos) servem a estilos específicos de defesa e bloqueio; deixe para quando já souber
          o que procura.
        </p>
        <h2>A esponja decide a sensação</h2>
        <p>
          Sob a borracha há uma camada de <Link href="/glossario/">esponja</Link>. Quanto mais
          dura, mais rápida e mais exigente com a técnica; quanto mais macia, mais controle e
          mais tolerância ao erro. Muitas borrachas modernas usam{' '}
          <Link href="/glossario/">tensão</Link> para ganhar efeito — ótimas, desde que a esponja
          não seja dura demais para o seu momento.
        </p>
        <h2>Comece pelo controle</h2>
        <p>
          O erro clássico é comprar a borracha dos profissionais. Uma borracha rápida demais faz
          a bola sair da mesa antes de você ter técnica para segurá-la. Priorize{' '}
          <strong>controle alto e velocidade contida</strong> — é exatamente o que o perfil
          &ldquo;Base sólida primeiro&rdquo; recomenda. Você troca por algo mais rápido quando o
          braço pedir, não antes.
        </p>
        <p className="prox">
          <Link href="/catalogo/?nivel=iniciante&amp;tipo=borracha">Ver borrachas de iniciante →</Link>
          <Link href="/quiz/">Não sabe seu perfil? Faça o teste →</Link>
        </p>
      </>
    ),
  },
  {
    slug: 'madeira-vs-carbono',
    titulo: 'Lâminas: madeira vs carbono',
    resumo: 'Por que a madeira pura ensina melhor, e quando a fibra passa a valer a pena.',
    minutos: 4,
    corpo: (
      <>
        <p>
          A lâmina é a base de madeira onde as borrachas são coladas. Ela define a velocidade de
          partida e o toque. A dúvida mais comum do iniciante: madeira pura ou com fibra de
          carbono?
        </p>
        <h2>Madeira pura: o toque que ensina</h2>
        <p>
          Uma lâmina só de madeira (<em>allwood</em>) é mais lenta e mais flexível. Isso dá mais
          sensação da bola e muito mais controle — você sente o que está fazendo e a bola perdoa
          o erro. É onde a grande maioria deve começar, com uma madeira do tipo{' '}
          <em>allround</em>. Exemplos na base:{' '}
          <Link href="/materiais/stiga-allround/">Stiga Allround Classic</Link> e{' '}
          <Link href="/materiais/donic-appelgren/">Donic Appelgren Allplay</Link>.
        </p>
        <h2>Fibra (ALC, ZLC): velocidade que cobra técnica</h2>
        <p>
          Camadas de <Link href="/glossario/">arylate-carbono (ALC)</Link> ou{' '}
          <Link href="/glossario/">zylon-carbono (ZLC)</Link> deixam a lâmina mais rápida e mais
          rígida — e menos tolerante. É excelente para quem já ataca com consistência; cedo
          demais, só atrapalha, porque a bola vai embora antes da hora.
        </p>
        <h2>O que pesa pra você agora</h2>
        <p>
          Se você está começando, uma madeira allwood allround é a escolha quase sempre certa. A
          fibra espera você pedir por ela — e você vai saber quando for a hora.
        </p>
        <p className="prox">
          <Link href="/catalogo/?nivel=iniciante&amp;tipo=lamina">Ver lâminas de iniciante →</Link>
        </p>
      </>
    ),
  },
  {
    slug: 'estilos-de-jogo',
    titulo: 'Estilos de jogo',
    resumo: 'Atacante, defensor, all-round — e por que o iniciante não precisa escolher ainda.',
    minutos: 3,
    corpo: (
      <>
        <p>
          Não existe &ldquo;melhor equipamento&rdquo;, existe o que combina com o seu jeito de
          jogar. Conhecer os estilos ajuda a entender por que uma borracha rende para uma pessoa
          e não para outra.
        </p>
        <h2>Atacante</h2>
        <p>
          Busca finalizar o ponto com força e efeito. Valoriza velocidade e{' '}
          <Link href="/glossario/">topspin</Link>, aceita perder um pouco de controle em troca de
          potência.
        </p>
        <h2>Defensor e bloqueador</h2>
        <p>
          Trabalha devolvendo e aproveitando a velocidade da bola do adversário (o{' '}
          <Link href="/glossario/">bloqueio</Link> é a jogada-chave). Valoriza controle e
          constância acima de tudo.
        </p>
        <h2>All-round</h2>
        <p>
          O equilíbrio: constrói o ponto, troca bola e ataca quando abre o espaço. É o estilo mais
          versátil — e o ponto de partida natural.
        </p>
        <h2>E o iniciante?</h2>
        <p>
          No começo, todo mundo é all-round. A prioridade é constância, não potência. O seu estilo
          vai se revelando com o tempo de mesa — e o equipamento acompanha essa descoberta, não o
          contrário.
        </p>
        <p className="prox">
          <Link href="/quiz/">O teste indica o seu perfil em 1 minuto →</Link>
        </p>
      </>
    ),
  },
  {
    slug: 'montando-raquete',
    titulo: 'Montando sua raquete',
    resumo: 'Raquete de verdade não vem pronta: lâmina + duas borrachas, montadas para você.',
    minutos: 4,
    corpo: (
      <>
        <p>
          Aqui está o segredo que quase ninguém conta a quem está começando: a raquete de quem
          joga sério <strong>não vem pronta da loja</strong>. Ela é montada — uma lâmina e duas
          borrachas, escolhidas para o seu jogo.
        </p>
        <h2>As três peças</h2>
        <p>
          São a <strong>lâmina</strong> e duas borrachas: uma para o lado do{' '}
          <em>forehand</em> (o seu lado dominante) e uma para o <em>backhand</em>. Os dois lados
          podem — e muitas vezes devem — ser diferentes, porque cada lado faz um trabalho.
        </p>
        <h2>Coladas, e trocáveis</h2>
        <p>
          As borrachas são coladas na lâmina com cola própria de tênis de mesa, e podem ser
          trocadas quando gastam. É por isso que a lâmina é um investimento que dura, enquanto as
          borrachas são consumíveis (veja{' '}
          <Link href="/aprender/cuidados-manutencao/">cuidados e manutenção</Link>).
        </p>
        <h2>Um lado de cada cor</h2>
        <p>
          As regras exigem que os dois lados tenham cores nitidamente diferentes — classicamente
          um vermelho e um preto (as{' '}
          <Link href="/aprender/regras-ittf/">regras da ITTF</Link> hoje admitem outras cores de
          um dos lados; confira a norma vigente).
        </p>
        <h2>Comece por uma montagem simples</h2>
        <p>
          Para o primeiro conjunto: uma madeira allwood allround + duas borrachas de controle. É a
          combinação que perdoa enquanto a técnica cresce — e a base de qualquer &ldquo;kit
          iniciante&rdquo;.
        </p>
        <p className="prox">
          <Link href="/catalogo/?nivel=iniciante">Ver materiais para começar →</Link>
        </p>
      </>
    ),
  },
  {
    slug: 'regras-ittf',
    titulo: 'Regras essenciais da ITTF',
    resumo: 'O básico sobre bola, raquete e pontuação que todo iniciante deve saber.',
    minutos: 3,
    corpo: (
      <>
        <p>
          A <Link href="/glossario/">ITTF</Link> (Federação Internacional de Tênis de Mesa) é quem
          define as regras e homologa equipamentos. O essencial para quem está começando:
        </p>
        <h2>A bola</h2>
        <p>
          Hoje a bola oficial é de plástico, com <Link href="/glossario/">40mm+ (a &ldquo;40+&rdquo;)</Link>,
          que substituiu o antigo celuloide. Para jogo levado a sério, procure as de{' '}
          <strong>3 estrelas</strong>, que têm o padrão mais regular.
        </p>
        <h2>A raquete</h2>
        <p>
          Os dois lados precisam ter cores claramente diferentes, e as borrachas devem ser
          homologadas (a ITTF publica a lista oficial dos modelos aprovados para competição).
        </p>
        <h2>Pontuação, em uma frase</h2>
        <p>
          Cada set vai até <strong>11 pontos</strong>, com diferença mínima de 2; a partida é
          normalmente melhor de 5 ou 7 sets. O saque alterna a cada 2 pontos.
        </p>
        <p className="nota-guia">
          As regras oficiais evoluem e têm detalhes (saque, homologações, competição) além deste
          resumo — para valer em torneio, confira sempre a norma vigente da ITTF ou da sua
          federação.
        </p>
        <p className="prox">
          <Link href="/glossario/">Ver o glossário de termos →</Link>
        </p>
      </>
    ),
  },
  {
    slug: 'cuidados-manutencao',
    titulo: 'Cuidados e manutenção',
    resumo: 'Como limpar, guardar e saber a hora de trocar — o que estica a vida da borracha.',
    minutos: 3,
    corpo: (
      <>
        <p>
          Borracha é consumível: ela perde efeito com o uso e o tempo. Cuidar bem estica a vida
          útil, mantém a aderência e adia a troca — o que, no fim, baixa o seu custo por mês.
        </p>
        <h2>Limpe depois de jogar</h2>
        <p>
          A poeira e a oleosidade da mão matam o efeito. Passe uma esponja ou pano úmido (ou um
          limpador próprio de borracha) depois de jogar — a diferença na aderência é enorme.
        </p>
        <h2>Use filme protetor</h2>
        <p>
          Guardar a borracha coberta com o filme protetor a protege da oxidação e da poeira entre
          os treinos. É barato e faz a superfície durar mais.
        </p>
        <h2>Longe do sol e do calor</h2>
        <p>
          Calor resseca a borracha e a esponja. Nada de deixar a raquete no carro ao sol ou perto
          de fontes de calor — guarde em lugar fresco, dentro de um estojo.
        </p>
        <h2>Quando trocar</h2>
        <p>
          Quando a borracha perde aderência e efeito mesmo depois de limpa, chegou a hora. Uma
          borracha de ataque tende a durar poucos meses de uso intenso; uma clássica de controle,
          bem mais — é essa diferença que aparece no <em>custo por mês</em> das fichas.
        </p>
        <p className="prox">
          <Link href="/catalogo/">Ver o catálogo de materiais →</Link>
        </p>
      </>
    ),
  },
];

export const guiaPorSlug = (slug: string): Guia | undefined => GUIAS.find((g) => g.slug === slug);
