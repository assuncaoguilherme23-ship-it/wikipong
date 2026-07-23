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
import { EscalaDureza } from '@/componentes/EscalaDureza';
import { ComparativoLaminas } from '@/componentes/ComparativoLaminas';

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
          não seja dura demais para o seu momento.{' '}
          <Link href="/aprender/dureza-da-esponja/">
            Veja a régua de dureza, com material de verdade, e a pegadinha das escalas →
          </Link>
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
    slug: 'dureza-da-esponja',
    titulo: 'Dureza da esponja: o que muda no seu jogo',
    resumo: 'Da mais macia à mais dura — o que cada extremo entrega, o que cobra, e a pegadinha das escalas.',
    minutos: 6,
    corpo: (
      <>
        <p>
          Sob a superfície de qualquer borracha lisa existe uma camada de{' '}
          <Link href="/glossario/">esponja</Link>. A dureza dela — medida em graus — é
          provavelmente a spec que <strong>mais muda a sensação</strong> do seu jogo. Também é a
          que mais confunde, porque o número sozinho não diz nada se você não souber a escala.
        </p>

        <h2>O que a dureza faz, fisicamente</h2>
        <p>
          Quando a bola bate, a esponja <strong>afunda e devolve energia</strong>, como uma cama
          elástica. Quanto ela afunda, e com que rapidez devolve, é o que muda tudo:
        </p>
        <p>
          <strong>Esponja macia</strong> afunda mais e por mais tempo. A bola “entra” na borracha
          e permanece em contato por uma fração maior de segundo — é o que os manuais chamam de{' '}
          <em>dwell time</em>. Mais tempo de contato significa mais chance de a superfície agarrar
          a bola e girá-la, mesmo em toques leves, e mais margem para corrigir um ângulo errado.
          Por isso ela perdoa. O preço: numa batida forte, parte da energia se perde deformando a
          esponja em vez de voltar para a bola — o teto de velocidade é mais baixo, e em aceleração
          máxima a bola pode “afundar demais” e sair sem direção.
        </p>
        <p>
          <strong>Esponja dura</strong> deforma pouco e devolve a energia de forma mais direta e
          rápida. Isso dá velocidade e trajetória mais reta quando você bate forte. O preço é
          exigente: ela precisa de aceleração para “abrir”. Se o seu golpe não tem velocidade
          suficiente, a esponja simplesmente não trabalha — e você fica com uma borracha que gira
          menos e perdoa menos que uma macia. Dureza não é upgrade automático: é uma troca.
        </p>

        <h2>A régua, com material de verdade</h2>
        <p>
          Onde os materiais do catálogo caem, segundo o que cada fabricante publica (a fonte está
          na ficha de cada um):
        </p>

        <EscalaDureza
          itens={[
            { nome: 'Rozena', id: 'rozena', min: 35, max: 35, rotulo: '35°' },
            { nome: 'Tenergy 05', id: 'tenergy05', min: 36, max: 36, rotulo: '36°' },
            { nome: 'Dignics 05', id: 'dignics05', min: 40, max: 40, rotulo: '40°' },
            { nome: 'AK47 Yellow', id: 'palio-ak47', min: 42, max: 44, rotulo: '42° a 44°' },
            { nome: 'Mark V', id: 'markv', min: 40, max: 45, rotulo: '40° a 45°' },
            { nome: 'Evolution MX-P', id: 'mxp', min: 46.7, max: 47.7, rotulo: '46,7° a 47,7°' },
            {
              nome: 'Hurricane 3 Neo',
              id: 'hurricane',
              min: 49,
              max: 53,
              rotulo: '≈ 51° ESN',
              escalaOutra: 'original: 39° na escala DHS',
            },
          ]}
        />

        <h2>A pegadinha: grau não é universal</h2>
        <p>
          Repare na Hurricane acima. Ela é vendida como <strong>39°</strong> — e está posicionada
          perto do extremo duro. Não é erro: a escala chinesa (DHS) e a escala europeia (ESN, usada
          por Tibhar, Xiom, Donic e companhia) <strong>medem de formas diferentes</strong>. Uma
          Hurricane de 39° DHS equivale a mais ou menos <strong>51° ESN</strong> — ou seja, é bem
          mais dura que uma europeia de 39°. A escala japonesa da Butterfly é uma terceira régua.
        </p>
        <p>
          Conclusão prática: <strong>nunca compare graus sem antes conferir a escala</strong>. Foi
          para resolver exatamente esse problema que a ficha unificada do WikiPong existe — e é a
          tabela de conversão entre escalas que ainda aguarda validação de especialista.
        </p>

        <h2>O que escolher agora</h2>
        <p>
          <strong>Está começando:</strong> fique na faixa macia (por volta de 35° a 42° na escala
          europeia). Você vai errar menos, sentir mais a bola e aprender o toque — que é o que
          importa nos primeiros meses.
        </p>
        <p>
          <strong>Já ataca com consistência:</strong> subir para 45°–50° faz sentido, porque agora
          você tem a aceleração que ativa a esponja. Suba um lado de cada vez (normalmente o
          forehand primeiro) para sentir a diferença isolada.
        </p>
        <p>
          <strong>Borracha chinesa dura e pegajosa:</strong> exige técnica formada e golpe rápido.
          Muitos jogadores só a usam com <em>booster</em>, e sem isso ela pode ficar lenta demais.
          Não é um bom primeiro passo.
        </p>
        <p className="nota-guia">
          Um detalhe honesto: dureza da esponja é só um dos fatores. Superfície (pegajosa ou de
          atrito), tensão, espessura e a lâmina embaixo mudam o resultado tanto quanto. Nenhum
          número isolado decide se um material combina com você.
        </p>
        <p className="prox">
          <Link href="/aprender/como-escolher-borracha/">Guia: como escolher sua borracha →</Link>
          <Link href="/catalogo/?nivel=iniciante">Ver materiais para começar →</Link>
        </p>
      </>
    ),
  },
  {
    slug: 'madeira-vs-carbono',
    titulo: 'Lâminas: madeira vs carbono',
    resumo: 'O que a fibra faz de verdade, como ler a classe (ALL/OFF) e quando ela passa a valer a pena.',
    minutos: 6,
    corpo: (
      <>
        <p>
          A lâmina é a base de madeira onde as borrachas são coladas. Ela define a velocidade de
          partida e o <em>toque</em> — a informação que volta pra sua mão quando a bola bate. A
          dúvida mais comum de quem está começando: madeira pura ou com fibra de carbono?
        </p>

        <h2>Como uma lâmina funciona</h2>
        <p>
          Uma lâmina é um sanduíche de lâminas finas de madeira coladas com as fibras cruzadas. No
          impacto, esse sanduíche <strong>flexiona e volta</strong>. Quanto mais ele flexiona, mais
          tempo a bola fica em contato e mais informação você sente — e mais devagar ela sai.
          Quanto mais rígido, mais rápido devolve a energia — e menos você sente.
        </p>

        <h2>Madeira pura: o toque que ensina</h2>
        <p>
          Uma lâmina só de madeira (<em>allwood</em>) flexiona mais. Isso dá sensação e controle:
          você percebe o que está fazendo, e o erro de ângulo não vira bola fora imediatamente. É
          onde a grande maioria deve começar. As madeiras têm papéis: um miolo leve e macio
          (abachi, kiri) segura o peso e amortece; camadas externas mais duras (limba, koto) dão a
          resposta.
        </p>

        <h2>O que a fibra faz de verdade</h2>
        <p>
          Camadas de <Link href="/glossario/">arylate-carbono (ALC)</Link> ou{' '}
          <Link href="/glossario/">zylon-carbono (ZLC)</Link> entram entre as madeiras, e cada
          material contribui com uma coisa diferente:
        </p>
        <p>
          <strong>O carbono</strong> é rígido: espalha o impacto por uma área maior (o famoso
          “ponto doce” mais largo) e devolve energia com pouca perda — daí a velocidade. <strong>
          O arylate</strong> entra justamente para compensar: é uma fibra que absorve vibração,
          domando a dureza seca do carbono puro. Por isso o ALC é a combinação mais popular do
          circuito: rápido, mas ainda com algum toque. O ZLC troca parte desse amortecimento por
          mais rigidez ainda — mais potência, menos perdão.
        </p>
        <p>
          O custo é real: quanto mais rígida a lâmina, <strong>menos ela avisa</strong> o que está
          acontecendo e menos tempo você tem pra corrigir. Cedo demais, a fibra não te deixa mais
          rápido — te deixa mais impreciso.
        </p>

        <h2>Lendo a classe: ALL, OFF e companhia</h2>
        <p>
          Quase toda marca classifica a lâmina numa régua de intenção, e essa é{' '}
          <strong>a única coisa que dá pra comparar entre marcas com segurança</strong>:
        </p>
        <p>
          <strong>DEF</strong> (defensiva) → <strong>ALL</strong> (allround, equilibrada) →{' '}
          <strong>ALL+</strong> → <strong>OFF−</strong> → <strong>OFF</strong> (ofensiva) →{' '}
          <strong>OFF+</strong>. Quem está começando quer <strong>ALL</strong>. Quem já ataca com
          consistência caminha para OFF− e OFF.
        </p>

        <h2>Quatro lâminas reais, lado a lado</h2>
        <p>
          Compare pelo que é comparável — composição, classe e espessura. A espessura é um sinal
          honesto: mais milímetros e mais fibra, mais velocidade.
        </p>

        <ComparativoLaminas
          laminas={[
            {
              nome: 'Stiga Allround Classic',
              id: 'stiga-allround',
              composicao: '5 madeiras (all-wood)',
              classe: 'ALL (allround)',
              espessura: '5,1 mm',
              indiceProprio: 'Velocidade 73 · Controle 77 (escala Stiga, 0–100)',
            },
            {
              nome: 'Donic Appelgren Allplay',
              id: 'donic-appelgren',
              composicao: '5 madeiras (abachi no miolo, limba nas externas)',
              classe: 'ALL (allround)',
              espessura: '5,5 mm',
              indiceProprio: 'Velocidade 73 · Controle 82 (escala Donic, 0–100)',
            },
            {
              nome: 'Butterfly Viscaria',
              id: 'viscaria',
              composicao: '5 madeiras + 2 de Arylate-Carbon',
              classe: 'OFF (ofensiva)',
              espessura: '5,8 mm',
              indiceProprio: 'Reação 11.8 · Vibração 10.3 (índices Butterfly para lâminas)',
            },
            {
              nome: 'Butterfly Fan Zhendong ALC',
              id: 'fzd',
              composicao: '5 madeiras + 2 de Arylate-Carbon',
              classe: 'OFF (ofensiva)',
              espessura: '5,8 mm',
              indiceProprio: 'Reação 11.8 · Vibração 10.3 (índices Butterfly para lâminas)',
            },
          ]}
        />

        <p>
          Duas leituras saltam da tabela. Primeira: as duas allwood são mais finas (5,1 e 5,5 mm)
          que as duas com fibra (5,8 mm) — a espessura acompanha a intenção. Segunda: a Viscaria e
          a Fan Zhendong ALC têm <strong>exatamente a mesma ficha</strong>. Não é coincidência: a
          FZD usa a estrutura consagrada da Viscaria; o que muda é o acabamento e o nome no cabo.
        </p>

        <h2>O que pesa pra você agora</h2>
        <p>
          Se você está começando, uma allwood classe ALL é a escolha quase sempre certa — e não é
          uma lâmina “de iniciante” que você joga fora depois: a Stiga Allround Classic está no
          mercado desde 1967 justamente porque continua fazendo sentido. A fibra espera você pedir
          por ela, e você vai saber quando for a hora: quando sentir que a lâmina está segurando o
          seu ataque, e não o contrário.
        </p>
        <p className="nota-guia">
          Uma advertência de leitura: a lâmina responde por parte da velocidade, mas a borracha e
          a dureza da esponja mudam o resultado tanto quanto. Trocar de lâmina para “ficar mais
          rápido” sem entender a borracha costuma frustrar.
        </p>
        <p className="prox">
          <Link href="/aprender/dureza-da-esponja/">Guia: dureza da esponja →</Link>
          <Link href="/aprender/montando-raquete/">Guia: montando sua raquete →</Link>
          <Link href="/catalogo/?tipo=lamina">Ver todas as lâminas do catálogo →</Link>
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
          <Link href="/conjuntos/">Ver montagens prontas, com o porquê de cada uma →</Link>
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
