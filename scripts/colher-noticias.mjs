/**
 * WikiPong · Colhedor de notícias da CBTM
 * ------------------------------------------------------------------------------
 * Roda sozinho pela rotina do GitHub (.github/workflows/noticias.yml) e deposita
 * o que achou na fila `noticias_recebidas`, sempre como 'pendente'.
 *
 * SÓ COLHE FATO. Título, endereço, data e fonte — as quatro coisas que dá para
 * ler de uma página sem interpretar nada. O `resumo` fica nulo de propósito: ele
 * é escrito por gente, na moderação, e é o que separa uma seção de notícias de
 * um agregador de manchetes.
 *
 * Foi exatamente aqui que a colheita de material deu errado quatro vezes num dia
 * só — recortar prosa da fonte e chamar de conteúdo. Não se repete: se um campo
 * não é extraível com precisão, ele não entra.
 *
 * IDEMPOTENTE pela coluna `url`, que é UNIQUE no banco. Pode rodar de hora em
 * hora; a mesma notícia entra uma vez só, e o 409 do PostgREST é o sinal disso,
 * não um erro.
 */
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

  return { titulo, url, fonte: 'CBTM', publicado_em: `${d[3]}-${d[2]}-${d[1]}` };
}

const cabecalhos = {
  apikey: CHAVE,
  Authorization: `Bearer ${CHAVE}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
};

let novas = 0, repetidas = 0, ilegiveis = 0;
for (const caminho of await achar()) {
  let n;
  try { n = await ler(caminho); } catch { n = null; }
  if (!n) { ilegiveis++; console.log(`  ilegível: ${caminho.slice(0, 60)}`); continue; }

  const res = await fetch(`${URL_SUPABASE.replace(/\/$/, '')}/rest/v1/noticias_recebidas`, {
    method: 'POST', headers: cabecalhos, body: JSON.stringify(n),
  });
  if (res.ok) { novas++; console.log(`  nova: ${n.publicado_em} · ${n.titulo.slice(0, 70)}`); }
  else if (res.status === 409) repetidas++;
  else console.log(`  recusada (${res.status}): ${n.titulo.slice(0, 50)}`);
}

console.log(`\n${novas} novas · ${repetidas} já estavam na fila · ${ilegiveis} sem título ou data legível`);
