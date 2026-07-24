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
  iniciar, responder, voltar, progresso, resultado, presetFinal, TELAS,
} from '../src/logica/quiz.js';
import {
  combinaComPerfil, vereditosDoMaterial, PERFIS_COM_CRITERIO, ROTULO_INTENCAO,
} from '../src/logica/recomendacao.js';
import {
  filtroVazio, parseQuery, serializeQuery, aplicar, alternarFaceta, comOrdenacao, facetas,
  Material,
} from '../src/logica/filtros.js';
import { etiquetasDoPreset } from '../src/logica/descrever-filtro.js';

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

// ───────── filtros: URL (D-12), aplicação e imutabilidade ─────────
const jeq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

// catálogo-fixture (dureza escolhida p/ tornar o Perdão verificável no sort)
const mat = (
  id: string, nivel: string, intencao: string, marca: string, tipo: string,
  preco: number, velocidade: number, spin: number, controle: number, dureza: number, rating: number,
): Material => ({
  id, nome: id, marca, tipo, nivel, intencao, preco,
  specs: { velocidade, spin, controle }, durabilidade: 8, durezaUnificada: dureza, rating, reviews: 10,
});
const CAT: Material[] = [
  mat('M1', 'Iniciante',     'controlar',   'Stiga',     'Borracha', 200, 5.0, 6.0, 9.0, 45, 4.3),
  mat('M2', 'Iniciante',     'controlar',   'Stiga',     'Raquete',  150, 4.0, 5.5, 8.5, 50, 4.2),
  mat('M3', 'Iniciante',     'atacar',      'DHS',       'Borracha', 180, 8.0, 8.0, 8.0, 40, 4.5),
  mat('M4', 'Avançado',      'atacar',      'Butterfly', 'Borracha', 450, 5.0, 9.0, 9.0, 47, 4.8),
  mat('M5', 'Iniciante',     'equilibrado', 'Tibhar',    'Borracha', 220, 5.0, 7.0, 7.0, 48, 4.4),
  mat('M6', 'Intermediário', 'equilibrado', 'Tibhar',    'Borracha', 320, 7.0, 8.0, 8.0, 45, 4.6),
  mat('M7', 'Intermediário', 'atacar',      'Butterfly', 'Borracha', 300, 6.5, 8.5, 7.5, 42, 4.8),
];
const ids = (ms: Material[]) => ms.map(m => m.id);

// os 4 presetURL EXATOS que o quiz gera (src/logica/quiz.ts)
const P_BASE = '/catalogo?nivel=iniciante&ctrl=8-10&vel=3-6&ordenar=perdao';
const P_ATAC = '/catalogo?nivel=intermediario&vel=6-8&ctrl=7-10';
const P_CTRL = '/catalogo?vel=5-7&ctrl=8-10&ordenar=controle';
const P_EXPL = '/catalogo?modo=simples';

// parse dos 4 perfis
const eBase = parseQuery(P_BASE);
afirma(jeq(eBase.niveis, ['iniciante']), 'base: nivel=iniciante');
afirma(jeq(eBase.velocidade, { min: 3, max: 6 }), 'base: vel 3-6');
afirma(jeq(eBase.controle, { min: 8, max: 10 }), 'base: ctrl 8-10');
afirma(eBase.ordenar === 'perdao', 'base: ordenar=perdao');

const eAtac = parseQuery(P_ATAC);
afirma(jeq(eAtac.niveis, ['intermediario']) && jeq(eAtac.velocidade, { min: 6, max: 8 })
  && jeq(eAtac.controle, { min: 7, max: 10 }), 'atacante: facetas');
afirma(eAtac.ordenar === 'relevancia', 'atacante: ordenar default = relevancia');

const eCtrl = parseQuery(P_CTRL);
afirma(jeq(eCtrl.velocidade, { min: 5, max: 7 }) && jeq(eCtrl.controle, { min: 8, max: 10 })
  && eCtrl.ordenar === 'controle', 'construtor: facetas + ordenar=controle');

const eExpl = parseQuery(P_EXPL);
afirma(jeq(eExpl, filtroVazio()), 'explorador: modo=simples → filtro vazio (modo ignorado)');

// round-trip: parse(serialize(e)) === e, nos 4 perfis
for (const [nome, url] of [['base', P_BASE], ['atac', P_ATAC], ['ctrl', P_CTRL], ['expl', P_EXPL]] as const) {
  const e = parseQuery(url);
  afirma(jeq(parseQuery(serializeQuery(e)), e), `round-trip preserva o estado (${nome})`);
}

// aplicar sobre o catálogo-fixture
afirma(jeq(ids(aplicar(CAT, eBase)), ['M1', 'M2']), 'base: iniciantes ctrl8-10/vel3-6, ord Perdão desc');
afirma(jeq(ids(aplicar(CAT, eCtrl)), ['M1', 'M4', 'M6']), 'construtor: vel5-7/ctrl8-10, ord Controle desc + desempate id');
afirma(jeq(ids(aplicar(CAT, eAtac)), ['M7', 'M6']), 'atacante: intermediários, ord relevância (rating desc)');
const expl = aplicar(CAT, eExpl);
afirma(expl.length === CAT.length, 'explorador não filtra nada');
afirma(expl.every((m, i, a) => i === 0 || a[i - 1].rating >= m.rating), 'explorador ordena por relevância (rating desc)');
afirma(expl[0].id === 'M4', 'explorador: topo por rating (desempate id)');

// valor único (D-12, ex.: ctrl=7) = piso {7,10}
afirma(jeq(parseQuery('ctrl=7').controle, { min: 7, max: 10 }), 'ctrl=7 → piso {7,10}');

// facetas derivadas dos dados (D-12)
afirma(facetas(CAT).tipos.find(t => t.slug === 'borracha')?.contagem === 6, 'facetas: 6 borrachas no fixture');

// imutabilidade
const catLen = CAT.length, cat0 = CAT[0].id;
aplicar(CAT, eBase);
afirma(CAT.length === catLen && CAT[0].id === cat0, 'aplicar não muta o array de entrada');
const f0 = filtroVazio();
const f1 = alternarFaceta(f0, 'tipos', 'borracha');
afirma(f0.tipos.length === 0 && jeq(f1.tipos, ['borracha']), 'alternarFaceta é imutável');
afirma(f0.ordenar === 'relevancia' && comOrdenacao(f0, 'perdao').ordenar === 'perdao', 'comOrdenacao é imutável');

// ───────── quiz enriquecido: cada resposta vira filtro REAL (D-18/D-12) ─────────
// Antes, orçamento/objetivo/estilo eram coletados mas NÃO mudavam nada. Agora refinam
// o preset final por cima do preset-base do perfil (que segue intacto).

// iniciante: "já competir" + até R$ 200
const pIni = responder(responder(responder(iniciar(), 'comecando'), 'jogar-ja'), 'ate-200');
const uIni = parseQuery(presetFinal(pIni) ?? '');
afirma(uIni.preco?.max === 200, 'orçamento vira filtro de preço real');
afirma(jeq(uIni.velocidade, { min: 6, max: 8 }), '"competir" sobrescreve a faixa de velocidade do perfil');
afirma(jeq(uIni.niveis, ['iniciante']), 'preset refinado preserva o nível do perfil');

// "sem teto" NÃO inventa faixa de preço; "aprender" aperta o controle
const pApr = responder(responder(responder(iniciar(), 'comecando'), 'aprender'), 'sem-teto');
const uApr = parseQuery(presetFinal(pApr) ?? '');
afirma(uApr.preco === null, 'sem-teto não cria filtro de preço (D-16)');
afirma(jeq(uApr.controle, { min: 9, max: 10 }), '"aprender o básico" aperta o controle');

// "raquete pronta" vira filtro de tipo
const pPro = responder(responder(responder(iniciar(), 'comecando'), 'pronta'), 'ate-400');
afirma(jeq(parseQuery(presetFinal(pPro) ?? '').tipos, ['raquete']), 'raquete pronta filtra tipo=raquete');

// "voltei depois de parado" abre o intermediário
const pVol = responder(responder(responder(iniciar(), 'voltando'), 'aprender'), 'sem-teto');
afirma(parseQuery(presetFinal(pVol) ?? '').niveis.includes('intermediario'), '"voltei" abre o intermediário');

// evolução: nível, estilo e prioridade contam
const pEvo = responder(responder(responder(iniciar(), 'serio'), 'ataque'), 'potencia');
const uEvo = parseQuery(presetFinal(pEvo) ?? '');
afirma(uEvo.niveis.includes('avancado'), '"treino sério" abre materiais avançados');
afirma(uEvo.velocidade?.min === 7, 'estilo de ataque puxa a velocidade');
afirma(uEvo.ordenar === 'spin', 'prioridade potência ordena por efeito');

const pCus = responder(responder(responder(iniciar(), 'casual'), 'allround'), 'custo');
const uCus = parseQuery(presetFinal(pCus) ?? '');
afirma(jeq(uCus.intencoes, ['equilibrado']), 'all-round filtra intenção equilibrada');
afirma(uCus.ordenar === 'preco-asc', 'custo-benefício ordena por preço');

// explorador não recebe fragmento; presetFinal só existe em resultado
afirma(presetFinal(ex) === P_EXPL, 'explorador mantém o preset base limpo');
afirma(presetFinal(iniciar()) === null, 'presetFinal é null fora de tela de resultado');

// o preset refinado continua VÁLIDO no motor e NUNCA cai em catálogo vazio (D-16)
for (const [nome, est] of [
  ['iniciante/competir', pIni], ['iniciante/aprender', pApr], ['iniciante/pronta', pPro],
  ['voltando', pVol], ['evolução/ataque', pEvo], ['evolução/custo', pCus],
] as const) {
  const e = parseQuery(presetFinal(est) ?? '');
  afirma(jeq(parseQuery(serializeQuery(e)), e), `preset refinado faz round-trip (${nome})`);
  afirma(aplicar(CAT, e).length > 0, `caminho ${nome} não pode cair em catálogo vazio`);
}

// nenhum filtro fingido: toda chave usada tem que existir no motor (D-16)
const CHAVES_MOTOR = ['nivel', 'marca', 'tipo', 'intencao', 'vel', 'spin', 'ctrl', 'preco', 'ordenar'];
for (const [id, tela] of Object.entries(TELAS)) {
  if (tela.tipo !== 'pergunta') continue;
  for (const op of tela.opcoes) {
    if (!op.filtro) continue;
    for (const par of op.filtro.split('&')) {
      const chave = par.split('=')[0];
      afirma(CHAVES_MOTOR.includes(chave), `filtro fingido em ${id}/${op.id}: chave '${chave}'`);
    }
  }
}

// ───────── leitura humana do preset (nada de query string na cara do usuário) ─────────
const valorDe = (url: string, rotulo: string) =>
  etiquetasDoPreset(url).find((e) => e.rotulo === rotulo)?.valor;

const uCusStr = presetFinal(pCus) ?? '';
afirma(valorDe(uCusStr, 'Estilo') === 'Equilibrado', 'intenção vira "Estilo: Equilibrado"');
afirma(valorDe(uCusStr, 'Ordem') === 'Menor preço', 'ordenar=preco-asc → "Menor preço"');
afirma(valorDe(uCusStr, 'Controle') === '8 ou mais', 'faixa no teto lê "8 ou mais"');
afirma(valorDe(uCusStr, 'Velocidade') === '5 a 7', 'faixa fechada lê "5 a 7"');
afirma(valorDe(uCusStr, 'Nível') === undefined, 'não inventa etiqueta de filtro ausente');

afirma(valorDe(presetFinal(pEvo) ?? '', 'Nível') === 'Intermediário · Avançado',
  'níveis traduzidos com acento e unidos');
afirma(valorDe(presetFinal(pIni) ?? '', 'Preço') === 'até R$ 200', 'preço-teto lê "até R$ 200"');
afirma(valorDe(presetFinal(pPro) ?? '', 'Tipo') === 'Raquete', 'tipo traduzido');
afirma(etiquetasDoPreset(P_EXPL).length === 0,
  'explorador não gera etiqueta (a UI diz "catálogo inteiro" em vez de caixa vazia)');

// ───────── recomendação: veredito material ↔ perfil (dado sincero) ─────────
afirma(PERFIS_COM_CRITERIO.length === 3, 'só os 3 perfis que filtram entram (explorador fora)');
afirma(!PERFIS_COM_CRITERIO.some(p => p.id === 'explorador'), 'explorador excluído (combinaria com tudo)');

// COERÊNCIA: o veredito tem que bater com o motor de filtros em TODOS os pares
for (const m of CAT) {
  for (const p of PERFIS_COM_CRITERIO) {
    const v = combinaComPerfil(m, p);
    const peloMotor = aplicar([m], parseQuery(p.presetURL)).length === 1;
    afirma(v.combina === peloMotor, `veredito de ${m.id}×${p.id} diverge do motor`);
  }
}

const baseSolida = PERFIS_COM_CRITERIO.find(p => p.id === 'base-solida')!;
const vM4 = combinaComPerfil(CAT[3], baseSolida); // M4: Avançado, vel 5.0, ctrl 9.0
afirma(!vM4.combina, 'M4 não combina com base-solida');
afirma(vM4.criterios[0].rotulo === 'Nível' && !vM4.criterios[0].atende, 'M4: nível reprova');
afirma(vM4.criterios[1].atende && vM4.criterios[2].atende, 'M4: vel 5.0 e ctrl 9.0 passam');

const atacante = PERFIS_COM_CRITERIO.find(p => p.id === 'atacante-em-formacao')!;
afirma(combinaComPerfil(CAT[5], atacante).combina, 'M6 combina com atacante-em-formacao');

afirma(vereditosDoMaterial(CAT[0]).length === 3, 'vereditosDoMaterial cobre os 3 perfis');
afirma(ROTULO_INTENCAO.atacar === 'Ataque', 'rótulo de intenção traduzido');

console.log(`\n✔ ${ok} asserções passaram`);
if (falhas.length) {
  console.error(`✘ ${falhas.length} falharam:`);
  for (const f of falhas) console.error('  - ' + f);
  process.exit(1);
}
console.log('Colheita verificada: métricas e quiz batem com o que está publicado no Figma.\n');
