/**
 * WikiPong · O resumo da notícia, escrito a partir do texto dela
 * ------------------------------------------------------------------------------
 * Roda dentro da rotina de colheita, antes de depositar a notícia na fila.
 *
 * A REGRA QUE ISTO NÃO QUEBRA: continua proibido copiar prosa da fonte. O que
 * muda é quem escreve — o resumo é redigido A PARTIR do texto da notícia, em
 * PT-BR, e não recortado dela. Foi recortar que encheu a colheita da GEWO de
 * "Cancel - - Free US Shipping".
 *
 * E continua entrando como PENDENTE. O fundador deixa de escrever; não deixa de
 * decidir. A tela de moderação abre o resumo num campo editável — ele lê, corrige
 * se quiser, e publica. Esse clique é o que faz o texto virar voz do site.
 */
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

/* Sem a chave nos segredos do repositório, o construtor não reclama — quem
   reclama é cada requisição, uma por notícia. Avisa uma vez e devolve nulo: a
   colheita continua inteira, as notícias chegam sem resumo, e o fundador
   escreve na moderação como escrevia antes. Uma automação que some por falta de
   configuração é pior que uma que trabalha pela metade e diz isso. */
const TEM_CHAVE = Boolean(process.env.ANTHROPIC_API_KEY);
if (!TEM_CHAVE) {
  console.log('Sem ANTHROPIC_API_KEY: as notícias entram sem resumo, pra você escrever na moderação.');
}

/* As mesmas que as notícias já publicadas usam — não invento vocabulário novo. */
export const TAGS = ['Seleção', 'Brasil', 'Paralímpico', 'Torneio'];

const SISTEMA = `Você escreve resumos de notícias de tênis de mesa para a WikiPong,
uma enciclopédia de equipamentos em português do Brasil.

O resumo tem UMA função: dizer a quem lê o que a notícia conta, para a pessoa
decidir se quer abrir a fonte. Ele fica embaixo do título, na lista de notícias.

Como escrever:
- Português do Brasil, entre 100 e 200 caracteres.
- Comece pelo fato, não pelo contexto. "Depois de vencer em São José dos Campos,
  Calderano falou do que segurou a virada" — não "Em uma entrevista concedida".
- Diga o específico: nome, lugar, o que aconteceu. Nada de "o atleta comentou
  sobre sua participação".
- NÃO repita o título com outras palavras. O resumo acrescenta.
- NÃO use adjetivo de torcida ("brilhante", "incrível", "histórico") nem
  exclamação. O tom é de quem informa, não de quem comemora.
- Só afirme o que está no texto da notícia. Se um dado não está lá, ele não entra.

A tag classifica a notícia numa destas quatro: Seleção (convocação, time
nacional), Brasil (cena nacional em geral), Paralímpico, Torneio (competição
específica).`;

const ESQUEMA = {
  type: 'object',
  properties: {
    resumo: { type: 'string', description: 'O resumo em PT-BR, entre 100 e 200 caracteres.' },
    tag: { type: 'string', enum: TAGS },
  },
  required: ['resumo', 'tag'],
  additionalProperties: false,
};

/**
 * Devolve `{ resumo, tag }` ou `null` quando não dá pra escrever com honestidade
 * — texto curto demais, ou a API falhou. Nulo faz a notícia entrar sem resumo, e
 * o fundador escreve na moderação, como antes. Melhor sem resumo que com resumo
 * inventado a partir de nada.
 */
export async function resumir({ titulo, texto }) {
  if (!TEM_CHAVE) return null;

  /* Menos que isso não é notícia, é chamada. Resumir uma chamada seria escrever
     por cima do vazio. */
  if (!texto || texto.length < 400) return null;

  try {
    const r = await anthropic.messages.create({
      model: 'claude-opus-5',
      /* Folga pro raciocínio. O resumo em si tem 200 caracteres, mas o modelo
         pensa antes, e esses tokens contam aqui: apertado demais, ele para no
         meio e a resposta chega sem o bloco de texto — nulo silencioso. */
      max_tokens: 4000,
      system: SISTEMA,
      output_config: {
        /* `low` porque a tarefa é curta e bem definida: ler um texto e resumir.
           Esforço alto aqui gastaria tokens sem melhorar o resumo. */
        effort: 'low',
        format: { type: 'json_schema', schema: ESQUEMA },
      },
      messages: [{
        role: 'user',
        content: `Título: ${titulo}\n\nTexto da notícia:\n${texto.slice(0, 12000)}`,
      }],
    });

    /* Uma recusa vem como HTTP 200 com stop_reason 'refusal' e content vazio —
       ler content[0] sem conferir quebraria aqui. */
    if (r.stop_reason === 'refusal') {
      console.log(`  resumo recusado pelo modelo (${r.stop_details?.category ?? 'sem categoria'})`);
      return null;
    }

    const bruto = r.content.find((b) => b.type === 'text')?.text;
    /* Resposta sem bloco de texto. Acontece quando o raciocínio come o
       max_tokens todo. Sem esta linha o retorno era nulo MUDO — a notícia
       chegava em branco e o log não dizia nada, que é o pior dos dois mundos. */
    if (!bruto) {
      console.log(`  resposta sem texto (stop_reason: ${r.stop_reason}) — tokens: ${JSON.stringify(r.usage)}`);
      return null;
    }

    const { resumo, tag } = JSON.parse(bruto);
    /* O banco exige 40 caracteres para publicar. Um resumo abaixo disso não
       serve, e devolver nulo é mais honesto que empurrar um pedaço. */
    if (!resumo || resumo.trim().length < 40) {
      console.log(`  resumo curto demais (${resumo?.trim().length ?? 0} caracteres): descartado`);
      return null;
    }
    return { resumo: resumo.trim(), tag: TAGS.includes(tag) ? tag : undefined };
  } catch (e) {
    /* 60 caracteres cortavam justamente a parte util: "Your credit balance is
       too low..." vira "Your credit balance is too...". O erro tem que caber. */
    console.log(`  resumo falhou (${e.status ?? 'sem status'}): ${String(e.message).slice(0, 300)}`);
    return null;
  }
}
