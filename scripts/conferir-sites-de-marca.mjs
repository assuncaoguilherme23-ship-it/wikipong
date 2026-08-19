/**
 * WikiPong · Os sites oficiais das marcas ainda existem?
 * ==============================================================================
 * Rodar: `node scripts/conferir-sites-de-marca.mjs`
 *
 * POR QUE ISTO NÃO É UM TESTE. `testes/rodar.ts` roda em toda mudança e não pode
 * depender de rede: ficaria lento, falharia no avião e ensinaria a ignorar
 * falha. Este script é o par do `cobertura-loja.mjs` — checagem de mundo
 * externo, sob demanda, com resultado que a pessoa lê e decide.
 *
 * O QUE ELE PEGA, e já pegou: em 2026-08-16 três marcas linkavam para domínios
 * que não existem mais (729tabletennis.com, yinhe-tt.com e sanwei-tt.com), e a
 * Tibhar apontava para a LOJA brasileira em vez do fabricante. Link morto é
 * proibido pelo D-16, e ninguém clica no "site oficial" de dezesseis marcas
 * para conferir.
 *
 * DNS SEPARADO DE HTTP, de propósito. Domínio que não resolve está MORTO e o
 * link tem que sair. Domínio que resolve mas recusa conexão pode estar só
 * bloqueando este computador — é o caso da DHS, que responde para o resto do
 * mundo e não para cá. Tratar os dois como a mesma coisa apagaria um link bom.
 */
import { promises as dns } from 'node:dns';
import { readFileSync } from 'node:fs';

const marcas = JSON.parse(readFileSync('dados/marcas.json', 'utf8')).marcas;
const UA = { 'user-agent': 'Mozilla/5.0 (compatible; WikiPong/1.0; +https://www.wikipong.com)' };

let mortos = 0;
let suspeitos = 0;
let semLink = 0;

console.log('\nConferindo o site oficial de cada marca…\n');

for (const [nome, dados] of Object.entries(marcas)) {
  const site = dados.site;

  if (!site) {
    semLink++;
    console.log(`  ${nome.padEnd(16)} sem link  (registrado como sem site oficial conhecido)`);
    continue;
  }

  const host = new URL(site).hostname;

  try {
    await dns.lookup(host);
  } catch {
    mortos++;
    console.log(`  ${nome.padEnd(16)} MORTO     ${host} não resolve — o link tem que sair`);
    continue;
  }

  try {
    const r = await fetch(site, {
      headers: UA,
      redirect: 'follow',
      signal: AbortSignal.timeout(15000),
    });
    if (r.ok) {
      console.log(`  ${nome.padEnd(16)} ok        ${r.status} ${host}`);
    } else {
      suspeitos++;
      console.log(`  ${nome.padEnd(16)} suspeito  ${r.status} ${host} — conferir no navegador`);
    }
  } catch (e) {
    suspeitos++;
    /* Resolve mas não conecta: pode ser bloqueio geográfico, não site morto.
       Não sugerir remoção aqui — sugerir conferência humana. */
    console.log(
      `  ${nome.padEnd(16)} suspeito  ${host} resolve mas não conecta (${String(e.message).slice(0, 40)})`,
    );
  }
}

console.log(
  `\n${mortos} morto(s) · ${suspeitos} para conferir no navegador · ${semLink} sem link registrado\n`,
);
if (mortos > 0) {
  console.log('Domínio morto = link morto no ar. Tire o campo `site` da marca em dados/marcas.json');
  console.log('(o campo é opcional, e a página omite a linha sozinha).\n');
}
