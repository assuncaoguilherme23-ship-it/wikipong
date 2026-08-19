/**
 * WikiPong · Colhedor de notícias da CBTM
 * ------------------------------------------------------------------------------
 * Roda sozinho pela rotina do GitHub (.github/workflows/noticias.yml) e deposita
 * o que achou na fila `noticias_recebidas`, sempre como 'pendente'.
 *
 * SÓ COLHE FATO. Título, endereço, data e fonte — as quatro coisas que dá para
 * ler de uma página sem interpretar nada.
 *
 * O `resumo` é ESCRITO, não colhido: o texto da notícia vai para o modelo, que
 * redige em PT-BR (scripts/resumir-noticia.mjs). A diferença entre escrever e
 * recortar é a mesma de sempre — recortar foi o que encheu a colheita da GEWO de
 * "Cancel - - Free US Shipping".
 *
 * Foi exatamente aqui que a colheita de material deu errado quatro vezes num dia
 * só — recortar prosa da fonte e chamar de conteúdo. Não se repete: se um campo
 * não é extraível com precisão, ele não entra.
 *
 * IDEMPOTENTE pela coluna `url`, que é UNIQUE no banco. Pode rodar de hora em
 * hora; a mesma notícia entra uma vez só, e o 409 do PostgREST é o sinal disso,
 * não um erro.
 */
import { resumir } from './resumir-noticia.mjs';

const UA = { 'user-agent': 'Mozilla/5.0 (compatible; WikiPong/1.0; +https://www.wikipong.com)' };

const URL_SUPABASE = process.env.SUPABASE_URL;
const CHAVE = process.env.SUPABASE_SERVICE_KEY;
if (!URL_SUPABASE || !CHAVE) {
  console.error('Faltam SUPABASE_URL e SUPABASE_SERVICE_KEY nos segredos do repositório.');
  process.exit(1);
}

const CBTM = 'https://www.cbtm.org.br';
/* O sufixo que a CBTM põe em toda <title>. Sai fora: o título da notícia é o que
   vem antes dele. */
const SUFIXO = / - Confederação Brasileira de Tênis de Mesa\s*$/;

const semEntidades = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/\s+/g, ' ').trim();

async function achar() {
  const h = await (await fetch(CBTM + '/', { headers: UA })).text();
  return [...new Set([...h.matchAll(/href="(\/noticia\/detalhe\/\d+\/[^"]+)"/gi)].map((m) => m[1]))];
}

async function ler(caminho) {
  const url = CBTM + caminho;
  const h = await (await fetch(url, { headers: UA })).text();

  const bruto = (h.match(/<title>([^<]{10,200})<\/title>/i) || [])[1];
  if (!bruto) return null;
  const titulo = semEntidades(bruto).replace(SUFIXO, '').trim();
  if (titulo.length < 10) return null;

  /* A data aparece como dd/mm/aaaa junto do horário, no corpo da notícia.
     As entidades saem AQUI, antes de qualquer comparação: o `titulo` vem da
     <title> já decodificado, e casar "Suécia" contra "Su&#233;cia" falha calado.
     Foi o que derrubou a linha fina de 4 das 6 notícias — todo título com acento
     nos primeiros 25 ou nos últimos 20 caracteres. */
  const t = semEntidades(
    h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' '));
  const d = t.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!d) return null;

  /* O corpo da notícia, para o resumo ser escrito a partir dele — e SÓ ele. A
     página inteira tem 8 mil caracteres, dos quais uns 2 mil são menu e outros
     4 mil são o rodapé com as chamadas de "Outras Notícias". Mandar isso pro
     modelo é pedir um resumo do site, não da notícia: ele pode misturar uma
     chamada do rodapé com o texto de cima e escrever um fato que não está ali.
     A matéria começa no carimbo de data e termina em "Outras Notícias". */
  const inicio = t.search(/\d{2}\/\d{2}\/\d{4}/);
  const fim = t.indexOf('Outras Notícias', inicio);
  const corpo = semEntidades(t.slice(inicio, fim > inicio ? fim : inicio + 14000));

  return {
    titulo, url, fonte: 'CBTM', publicado_em: `${d[3]}-${d[2]}-${d[1]}`, corpo,
    linhaFina: linhaFinaDe(t, titulo, inicio),
  };
}

/**
 * A linha fina que a CBTM publica entre o título e a data — "Atletas
 * representarão o Brasil em Dakar, no Senegal, acompanhados pela técnica Daniela
 * Bassi". É específica, é em português, e é ELA que faz esta seção não ser uma
 * lista de manchetes, de graça e sem ninguém digitar.
 *
 * Ela é palavra da CBTM. Quem entra com ela no banco marca `origem_resumo` como
 * 'fonte', e a tela atribui. Copiar sem dizer de quem é seria o erro da GEWO
 * outra vez.
 */
/* Espelho de `comPontoFinal` de src/logica/noticias-fila.ts. Duplicado porque
   este script é .mjs e não compila TypeScript — a asserção em testes/rodar.ts
   compara as duas implementações e quebra se elas divergirem. */
const JA_PONTUADO = /[.!?…:;]$/;
function comPontoFinal(texto) {
  const limpo = (texto ?? '').trim();
  if (!limpo) return limpo;
  return JA_PONTUADO.test(limpo) ? limpo : `${limpo}.`;
}

function linhaFinaDe(t, titulo, ateAqui) {
  const antes = t.lastIndexOf(titulo.slice(0, 25), ateAqui);
  if (antes < 0) return null;

  let trecho = t.slice(antes, ateAqui);
  /* Corta o próprio título do começo. Casa pela cauda dele, porque a versão do
     corpo nem sempre bate caractere a caractere com a da <title>. */
  const cauda = trecho.indexOf(titulo.slice(-20));
  if (cauda >= 0) trecho = trecho.slice(cauda + 20);

  /* O crédito da foto vem grudado no fim: "...no Dakar Expo Centre Foto: WTT". */
  const linha = semEntidades(trecho).replace(/\s*Foto:.*$/i, '').trim();

  /* Peneira. Curta demais o banco recusa; ecoar o título não acrescenta nada a
     quem já leu o título logo acima. Nos dois casos é melhor não ter. */
  if (linha.length < 40) return null;
  if (linha.includes(titulo.slice(0, 30))) return null;
  return linha;
}

const cabecalhos = {
  apikey: CHAVE,
  Authorization: `Bearer ${CHAVE}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

const raiz = `${URL_SUPABASE.replace(/\/$/, '')}/rest/v1/noticias_recebidas`;

/* O que já está na fila, com o resumo de cada uma. Duas coisas dependem disto:
   ECONOMIA — a home da CBTM tem sempre as mesmas 6 notícias, e sem esta consulta
   seriam 18 resumos por dia pras 2 ou 3 que são novas de verdade. O banco recusa
   repetida pela coluna `url`, que é UNIQUE, mas ele recusa DEPOIS: a essa altura
   o resumo já foi escrito e pago.
   RESGATE — a fila pode ter notícia depositada antes de existir redator, com
   resumo nulo. Essa não é repetida: é uma que ainda espera texto. Pular por já
   estar na fila deixaria ela em branco pra sempre. */
async function fila() {
  const res = await fetch(`${raiz}?select=id,url,resumo&limit=2000`, { headers: cabecalhos });
  if (!res.ok) return new Map(); // sem a lista, colhe tudo: o 409 segura
  return new Map((await res.json()).map((r) => [r.url, r]));
}

const naFila = await fila();

let novas = 0, resgatadas = 0, repetidas = 0, ilegiveis = 0, semResumo = 0, daFonte = 0;
for (const caminho of await achar()) {
  const endereco = CBTM + caminho;
  const existente = naFila.get(endereco);
  /* Só é repetida de verdade quando já tem resumo. Sem resumo, ela volta pra
     fila do redator. */
  if (existente?.resumo) { repetidas++; continue; }

  let n;
  try { n = await ler(caminho); } catch { n = null; }
  if (!n) { ilegiveis++; console.log(`  ilegível: ${caminho.slice(0, 60)}`); continue; }

  const { corpo, linhaFina, ...campos } = n;

  /* Duas procedências possíveis, nesta ordem. O modelo escreve na voz do site e
     ganha; sem chave ou sem crédito ele devolve nulo, e aí entra a linha fina da
     CBTM, atribuída. Só fica sem resumo quem não tem nem uma coisa nem outra. */
  const escrito = await resumir({ titulo: n.titulo, texto: corpo });
  if (escrito) {
    campos.resumo = comPontoFinal(escrito.resumo);
    campos.origem_resumo = 'wikipong';
    if (escrito.tag) campos.tag = escrito.tag;
  } else if (linhaFina) {
    /* A linha fina da CBTM vem sem ponto — ela é escrita como legenda, não como
       frase. No site vira frase. Pontuar não muda uma palavra do que eles
       disseram, então a atribuição continua sendo deles. */
    campos.resumo = comPontoFinal(linhaFina);
    campos.origem_resumo = 'fonte';
    daFonte++;
  } else semResumo++;

  if (existente) {
    /* Já está na fila esperando texto. Sem texto novo pra dar, não mexe nela —
       um PATCH vazio só gastaria requisição. E escreve SÓ resumo e tag: o
       `status` é do fundador, e sobrescrever apagaria a decisão dele. */
    if (!campos.resumo) continue;
    const res = await fetch(`${raiz}?id=eq.${existente.id}`, {
      method: 'PATCH', headers: cabecalhos,
      body: JSON.stringify({
        resumo: campos.resumo, origem_resumo: campos.origem_resumo,
        ...(campos.tag ? { tag: campos.tag } : {}),
      }),
    });
    if (res.ok) { resgatadas++; console.log(`  resumo escrito: ${n.titulo.slice(0, 62)}`); }
    else console.log(`  nao consegui escrever o resumo (${res.status}): ${n.titulo.slice(0, 45)}`);
    continue;
  }

  const res = await fetch(raiz, {
    method: 'POST', headers: cabecalhos, body: JSON.stringify(campos),
  });
  if (res.ok) { novas++; console.log(`  nova: ${n.publicado_em} · ${n.titulo.slice(0, 70)}`); }
  else if (res.status === 409) repetidas++;
  else console.log(`  recusada (${res.status}): ${n.titulo.slice(0, 50)}`);
}

console.log(`\n${novas} novas · ${resgatadas} que ja' estavam sem resumo e ganharam um · ${repetidas} repetidas · ${ilegiveis} ilegíveis`);
