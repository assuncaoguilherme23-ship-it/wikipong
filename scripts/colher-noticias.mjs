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

  /* A data aparece como dd/mm/aaaa junto do horário, no corpo da notícia. */
  const t = h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
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

  return { titulo, url, fonte: 'CBTM', publicado_em: `${d[3]}-${d[2]}-${d[1]}`, corpo };
}

const cabecalhos = {
  apikey: CHAVE,
  Authorization: `Bearer ${CHAVE}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

let novas = 0, repetidas = 0, ilegiveis = 0, semResumo = 0;
for (const caminho of await achar()) {
  let n;
  try { n = await ler(caminho); } catch { n = null; }
  if (!n) { ilegiveis++; console.log(`  ilegível: ${caminho.slice(0, 60)}`); continue; }

  const { corpo, ...campos } = n;
  const escrito = await resumir({ titulo: n.titulo, texto: corpo });
  if (escrito) { campos.resumo = escrito.resumo; if (escrito.tag) campos.tag = escrito.tag; }
  else semResumo++;

  const res = await fetch(`${URL_SUPABASE.replace(/\/$/, '')}/rest/v1/noticias_recebidas`, {
    method: 'POST', headers: cabecalhos, body: JSON.stringify(campos),
  });
  if (res.ok) { novas++; console.log(`  nova: ${n.publicado_em} · ${n.titulo.slice(0, 70)}`); }
  else if (res.status === 409) repetidas++;
  else console.log(`  recusada (${res.status}): ${n.titulo.slice(0, 50)}`);
}

console.log(`\n${novas} novas · ${repetidas} já estavam na fila · ${ilegiveis} sem título ou data legível`);
