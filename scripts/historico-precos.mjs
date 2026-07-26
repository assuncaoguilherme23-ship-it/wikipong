/**
 * WikiPong · Extrai o histórico de preços do GIT.
 *
 * A ideia: `dados/ofertas.json` é versionado, então cada checagem de preço já
 * ficou gravada com data e autor. O git É a série temporal — não precisa banco
 * (D-13). Este script lê o histórico do arquivo e destila em
 * `dados/historico-precos.json`, que a ficha consome.
 *
 * Rodar: npm run historico
 *
 * Guarda-corpo de honestidade: só entra ponto onde o preço MUDOU (mais o
 * primeiro). Repetir o mesmo valor em toda checagem inflaria a série e daria a
 * impressão de acompanhamento que não houve.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const ARQUIVO = 'dados/ofertas.json';
const SAIDA = 'dados/historico-precos.json';

const git = (...args) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

/** Commits que tocaram o arquivo, do mais antigo ao mais novo. */
function commits() {
  return git('log', '--reverse', '--format=%H\t%ad', '--date=short', '--', ARQUIVO)
    .split('\n')
    .filter(Boolean)
    .map((linha) => {
      const [hash, data] = linha.split('\t');
      return { hash, data };
    });
}

function ofertasEm(hash) {
  try {
    return JSON.parse(git('show', `${hash}:${ARQUIVO}`)).ofertas ?? [];
  } catch {
    return []; // commit onde o arquivo ainda não existia ou não era JSON válido
  }
}

const series = new Map(); // "materialId\tloja" -> [{ data, preco }]

for (const { hash, data } of commits()) {
  for (const o of ofertasEm(hash)) {
    if (typeof o.preco !== 'number') continue;
    const chave = `${o.materialId}\t${o.loja}`;
    const pontos = series.get(chave) ?? [];
    const ultimo = pontos[pontos.length - 1];
    // Só grava quando é o primeiro ponto ou quando o preço mudou de verdade.
    if (!ultimo || ultimo.preco !== o.preco) pontos.push({ data, preco: o.preco });
    series.set(chave, pontos);
  }
}

const porMaterial = {};
for (const [chave, pontos] of series) {
  const [materialId, loja] = chave.split('\t');
  (porMaterial[materialId] ??= []).push({ loja, pontos });
}

const total = [...series.values()].reduce((s, p) => s + p.length, 0);
const comVariacao = [...series.values()].filter((p) => p.length > 1).length;

writeFileSync(
  SAIDA,
  JSON.stringify(
    {
      aviso:
        'HISTÓRICO DE PREÇOS — gerado por scripts/historico-precos.mjs a partir do histórico do git de dados/ofertas.json. Não editar à mão: é derivado. Cada ponto é uma checagem em que o preço MUDOU (o primeiro sempre entra); repetir o mesmo valor não vira ponto novo, para não simular acompanhamento que não houve (D-16).',
      geradoEm: new Date().toISOString().slice(0, 10),
      materiais: porMaterial,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

console.log(
  `histórico: ${Object.keys(porMaterial).length} materiais · ${total} ponto(s) · ` +
    `${comVariacao} série(s) com variação de preço → ${SAIDA}`,
);
