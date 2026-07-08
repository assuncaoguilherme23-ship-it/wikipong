/**
 * WikiPong · Testes da colheita (rodar: npx tsx testes/rodar.ts)
 * Asserções derivadas dos números PUBLICADOS no Figma (board Métricas · Derivadas
 * e telas de Comparação) — se o código divergir do que está desenhado, isto quebra.
 */
import {
  perdao, maciez, custoMensal, custoMensalPorClasse,
  paraBolinhas, paraPalavra, indicesDoMaximo, Specs,
} from '../src/logica/metricas.js';
import {
  iniciar, responder, voltar, progresso, resultado, TELAS,
} from '../src/logica/quiz.js';

let ok = 0; const falhas: string[] = [];
function afirma(cond: boolean, msg: string) { if (cond) ok++; else falhas.push(msg); }
const aprox = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

// ───────── métricas: os exemplos do board reproduzidos exatamente ─────────
const tenergy: Specs = { velocidade: 9.0, spin: 9.3, controle: 7.0 };
const markv: Specs = { velocidade: 7.0, spin: 7.5, controle: 9.0 };

afirma(aprox(maciez(47), 4), 'maciez(47°) deve ser 4');
afirma(aprox(maciez(42), 5), 'maciez(42°) deve ser 5');
afirma(perdao(tenergy, 47) === 4.6, `perdão Tenergy = 4.6 (veio ${perdao(tenergy, 47)})`);
afirma(perdao(markv, 42) === 6.4, `perdão Mark V = 6.4 (veio ${perdao(markv, 42)})`);

afirma(aprox(custoMensal(450, 4), 112.5), 'custo Tenergy = 112.5/mês');
afirma(aprox(custoMensal(180, 10), 18), 'custo Mark V = 18/mês');
afirma(aprox(custoMensalPorClasse(450, 'tensor'), 112.5), 'custo por classe tensor');

afirma(paraBolinhas(9.0) === 5, 'bolinhas(9.0) = 5');
afirma(paraBolinhas(7.0) === 4, 'bolinhas(7.0) = 4 (round(3.5))');
afirma(paraBolinhas(0) === 0 && paraBolinhas(10) === 5, 'bolinhas nos extremos');

afirma(paraPalavra('velocidade', 9.0) === 'Muito rápida', 'vel 9.0 → Muito rápida');
afirma(paraPalavra('velocidade', 7.0) === 'Moderada', 'vel 7.0 → Moderada');
afirma(paraPalavra('spin', 9.3) === 'Altíssimo', 'spin 9.3 → Altíssimo');
afirma(paraPalavra('spin', 7.5) === 'Bom', 'spin 7.5 → Bom');
afirma(paraPalavra('controle', 9.0) === 'Muito fácil', 'ctrl 9.0 → Muito fácil');
afirma(paraPalavra('controle', 7.0) === 'Exige atenção', 'ctrl 7.0 → Exige atenção');
afirma(paraPalavra('perdao', 4.6) === 'Perdoa pouco', 'perdão 4.6 → Perdoa pouco');
afirma(paraPalavra('perdao', 6.4) === 'Perdoa bem', 'perdão 6.4 → Perdoa bem');

afirma(JSON.stringify(indicesDoMaximo([9.0, 7.0])) === '[0]', 'máximo simples');
afirma(JSON.stringify(indicesDoMaximo([7, 7])) === '[0,1]', 'empate destaca ambos');

// ───────── quiz: grafo, progresso por branch, pilha, imutabilidade ─────────
const e0 = iniciar();
afirma(e0.atual === 'inicio', 'inicia na tela inicio');
afirma(progresso(e0)?.rotulo === 'Pergunta 1 de 3', 'progresso inicial 1 de 3');

const e1 = responder(e0, 'casual');
afirma(e1.atual === 'evo-estilo' && progresso(e1)?.n === 2, 'casual → evo-estilo (2 de 3)');
const e2 = responder(e1, 'ataque');
const e3 = responder(e2, 'potencia');
afirma(e3.atual === 'resultado-em-formacao', 'chega no resultado');
afirma(resultado(e3)?.nome === 'Atacante em formação', 'perfil correto');
afirma((resultado(e3)?.presetURL ?? '').includes('vel=6-8'), 'preset na URL (D-12)');
afirma(progresso(e3) === null, 'resultado não tem progresso');

const ex = responder(iniciar(), 'explorar');
afirma(resultado(ex)?.id === 'explorador', 'explorar vai direto ao resultado');

const v = voltar(e2);
afirma(v.atual === 'evo-estilo', 'voltar retorna à tela anterior');
afirma(!('evo-estilo' in v.respostas), 'voltar esquece a resposta desfeita');
afirma(voltar(iniciar()).atual === 'inicio', 'voltar no início é no-op');

afirma(e0.historico.length === 0 && Object.keys(e0.respostas).length === 0, 'estado original intacto');

let lancou = false;
try { responder(e3, 'qualquer'); } catch { lancou = true; }
afirma(lancou, 'responder em tela de resultado lança erro');
lancou = false;
try { responder(e0, 'nao-existe'); } catch { lancou = true; }
afirma(lancou, 'opção inexistente lança erro');

for (const [id, tela] of Object.entries(TELAS)) {
  if (tela.tipo === 'pergunta') {
    for (const op of tela.opcoes) {
      afirma(op.proximo in TELAS, `grafo quebrado: ${id} → ${op.proximo} não existe`);
    }
  }
}

console.log(`\n✔ ${ok} asserções passaram`);
if (falhas.length) {
  console.error(`✘ ${falhas.length} falharam:`);
  for (const f of falhas) console.error('  - ' + f);
  process.exit(1);
}
console.log('Colheita verificada: métricas e quiz batem com o que está publicado no Figma.\n');
