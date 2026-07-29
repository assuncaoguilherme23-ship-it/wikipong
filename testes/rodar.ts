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
  buscar, normalizar, temDesempenho,
  Material,
} from '../src/logica/filtros.js';
import {
  paraESN, converter, faixaLegivel, sensacao, primeiroGrau, escalaDoTexto,
  DESLOCAMENTO_ATE_ESN, INCERTEZA, grauRepresentativo,
} from '../src/logica/escalas.js';
import { etiquetasDoPreset } from '../src/logica/descrever-filtro.js';
import { precoTotal, observacoes, completa, pecasDe } from '../src/logica/montagem.js';
import { MATERIAIS, materialPorId } from '../componentes/dados-materiais.js';
import { fabricantePorId } from '../componentes/dados-fabricante.js';
import { imagemDoMaterial } from '../componentes/dados-imagens.js';
import { precoMedio } from '../componentes/dados-ofertas.js';
import { existsSync } from 'node:fs';

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

// ───────── busca textual: compõe com o motor, não é campo do estado ─────────
afirma(normalizar('Lâmina') === 'lamina', 'normalizar tira acento e caixa');
afirma(jeq(ids(buscar(CAT, 'butterfly')), ['M4', 'M7']), 'busca acha por marca');
afirma(jeq(ids(buscar(CAT, 'stiga raquete')), ['M2']), 'termos separados combinam em E');
afirma(jeq(ids(buscar(CAT, 'intermediario')), ['M6', 'M7']), 'busca sem acento acha dado acentuado');
afirma(buscar(CAT, '   ').length === CAT.length, 'termo vazio devolve o catálogo inteiro');
afirma(buscar(CAT, 'zzz').length === 0, 'termo sem correspondência devolve vazio');
afirma(
  jeq(ids(aplicar(buscar(CAT, 'butterfly'), parseQuery('nivel=intermediario'))), ['M7']),
  'busca compõe com aplicar (faceta por cima do resultado)',
);
const antesBusca = CAT.length;
buscar(CAT, 'stiga');
afirma(CAT.length === antesBusca, 'buscar não muta o array de entrada');

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


// ───────── escalas de dureza: a tradução entre réguas (A VALIDAR — D-09) ─────────
afirma(DESLOCAMENTO_ATE_ESN.esn === 0, 'ESN é a régua de referência (deslocamento 0)');
// O caso que dá nome ao problema: 39° DHS é MUITO mais duro que 39° ESN.
const hDhs = paraESN(39, 'dhs');
afirma(hDhs.min === 49 && hDhs.max === 53, '39° DHS ≈ 49–53° ESN');
afirma(faixaLegivel(hDhs) === '49 a 53°', 'faixa legível sem casas decimais');
afirma(paraESN(47, 'esn').min === 47 - INCERTEZA, 'ESN→ESN só aplica a incerteza');
const idaDhs = converter(39, 'dhs', 'esn');
const centroIda = (idaDhs.min + idaDhs.max) / 2;
afirma(centroIda === 51, 'centro da conversão DHS→ESN é 51');
const voltaDhs = converter(centroIda, 'esn', 'dhs');
afirma((voltaDhs.min + voltaDhs.max) / 2 === 39, 'ida e volta entre escalas fecha no valor original');
afirma(sensacao(38).rotulo === 'Muito macia' && sensacao(51).rotulo === 'Dura', 'sensação por faixa ESN');
afirma(sensacao(57).rotulo === 'Muito dura', 'topo da escala');
afirma(primeiroGrau('46,7° a 47,7° (escala ESN)') === 46.7, 'lê grau com vírgula decimal');
afirma(primeiroGrau('sem número') === null, 'ficha sem grau devolve null');
afirma(escalaDoTexto('37° a 41° (escala DHS)') === 'dhs', 'reconhece a escala DHS na ficha');
afirma(escalaDoTexto('40° a 45° (≈ 42,5°)') === null, 'ficha que não diz a escala devolve null');


// ───────── montagem: soma real e observações derivadas (sem nota combinada) ─────────
const pecaM = (id: string, nivel: string, intencao: string, preco: number,
  vel: number, spin: number, ctrl: number, dureza: number) => ({
  id, nome: id, marca: 'X', tipo: 'Borracha', nivel, intencao, preco,
  specs: { velocidade: vel, spin, controle: ctrl }, durezaUnificada: dureza,
});
const laminaIni = { ...pecaM('L1', 'Iniciante', 'controlar', 300, 5, 6, 9, 47), tipo: 'Lâmina' };
const borrAvanc = pecaM('B1', 'Avançado', 'atacar', 450, 9, 9.3, 7, 47);
const borrIni = pecaM('B2', 'Iniciante', 'controlar', 200, 5, 6, 9, 41);

afirma(precoTotal({}) === 0, 'montagem vazia soma zero');
afirma(precoTotal({ lamina: laminaIni }) === 300, 'montagem parcial soma o que tem');
afirma(precoTotal({ lamina: laminaIni, fh: borrAvanc, bh: borrIni }) === 950, 'soma real das 3 peças');
afirma(!completa({ lamina: laminaIni }) && completa({ lamina: laminaIni, fh: borrAvanc, bh: borrIni }), 'completa exige as 3');
afirma(pecasDe({ lamina: laminaIni, bh: borrIni }).length === 2, 'pecasDe lista só o escolhido');

const obsNivel = observacoes({ lamina: laminaIni, fh: borrAvanc, bh: borrIni });
afirma(obsNivel.some(o => o.titulo === 'Níveis muito diferentes'), 'detecta Iniciante × Avançado');
afirma(obsNivel.some(o => o.titulo === 'Um lado bem mais duro que o outro'), 'detecta 6°+ de diferença entre lados');
afirma(obsNivel.some(o => o.tipo === 'atencao'), 'observação de nível é atenção, não info');
const obsIguais = observacoes({ lamina: laminaIni, fh: borrIni, bh: borrIni });
afirma(!obsIguais.some(o => o.titulo === 'Níveis muito diferentes'), 'mesmo nível não gera alerta');
afirma(observacoes({}).length === 0, 'montagem vazia não gera observação');


// ───────── dureza unificada DERIVADA da ficha do fabricante (fonte única) ─────────
// Fabricante costuma publicar FAIXA (vende a mesma borracha em várias durezas):
// o ponto médio representa a linha sem privilegiar um extremo.
afirma(grauRepresentativo('37° a 41° (escala DHS)') === 39, 'faixa vira ponto médio');
afirma(grauRepresentativo('36° (escala Butterfly)') === 36, 'grau único é ele mesmo');
afirma(grauRepresentativo('40° a 45° (≈ 42,5°)') === 42.5, 'ignora o resumo entre parênteses');
afirma(grauRepresentativo('sem grau') === null, 'texto sem grau devolve null');

// O bug que a derivação conserta: a semente invertia a ordem do PRÓPRIO fabricante.
// Butterfly publica Tenergy 36° e Dignics 40° — Dignics é mais dura, e agora é.
const tEN = materialPorId('tenergy05')!;
const dIG = materialPorId('dignics05')!;
afirma(dIG.durezaUnificada > tEN.durezaUnificada, 'Dignics (40° BF) é mais dura que Tenergy (36° BF)');
afirma(tEN.origemDureza === 'fabricante' && dIG.origemDureza === 'fabricante', 'ambas derivadas da ficha');

// Onde o fabricante não declara grau+régua, a semente segue valendo — e diz isso.
const mkV = materialPorId('markv')!;
afirma(mkV.origemDureza === 'semente', 'Mark V fica na semente (ficha não nomeia a régua)');

// Faixa de dureza tem DUAS grafias no mercado, e as duas precisam dar o meio.
// A Butterfly repete o símbolo ('37° a 41°'); a Tibhar escreve '42,4 – 44,4°',
// com o grau só no fim. A segunda grafia lia apenas o limite superior, o que
// deixava a marca inteira ~1° mais dura do que ela é.
afirma(grauRepresentativo('37° a 41°') === 39, 'faixa com símbolo nos dois lados dá o meio');
afirma(grauRepresentativo('42,4 – 44,4° (escala ESN)') === 43.4, 'faixa com símbolo só no fim dá o meio');
afirma(grauRepresentativo('39,1-41,1°') === 40.1, 'faixa com hífen simples também');
afirma(grauRepresentativo('50° (escala ESN)') === 50, 'grau único continua sendo ele mesmo');
afirma(grauRepresentativo('2,1 - 2,2 mm · 50°') === 50, 'espessura antes do grau não vira faixa');
afirma(MATERIAIS.every(m => m.origemDureza === 'fabricante' ? m.durezaFabricante !== undefined : m.durezaFabricante === undefined),
  'origemDureza e durezaFabricante andam juntos');
afirma(MATERIAIS.every(m => m.durezaUnificada === undefined || Number.isInteger(m.durezaUnificada)),
  'quando existe, a dureza unificada é grau inteiro');


// ───────── Q1: faixa de tempo como referência (não régua — A VALIDAR) ─────────
// Existe porque 'começando agora' e 'jogo casualmente' se sobrepunham e não havia
// como decidir entre as duas. Guarda-corpo: opção que leva a um branch de nível
// PRECISA de faixa; só 'explorar' (que pula pro resultado) pode ficar sem.
const telaInicio = TELAS['inicio'];
if (telaInicio.tipo === 'pergunta') {
  afirma(Boolean(telaInicio.nota), 'Q1 traz a ressalva de que frequência pesa mais que tempo');
  for (const op of telaInicio.opcoes) {
    const precisa = op.proximo !== 'resultado-explorador';
    afirma(precisa === Boolean(op.tempo), `opção '${op.id}': faixa de tempo só onde o nível importa`);
  }
} else {
  afirma(false, 'tela inicio deveria ser uma pergunta');
}


// ───────── perfil de desempenho OPCIONAL: nem todo material tem um ─────────
// Uma bola não tem 'controle 9.0'. Inventar o número pra preencher a coluna
// seria a precisão fingida que o produto combate (D-16).
const bola = materialPorId('d40')!;
afirma(!temDesempenho(bola), 'bola não tem perfil de desempenho');
afirma(bola.specs === undefined, 'bola não carrega specs');
// Material SEM specs é legítimo (bola; lâmina sem amostra na comunidade), mas
// não pode virar ficha vazia: quem não tem specs PRECISA ter ficha de fabricante
// com conteúdo, senão a página não diz nada ao visitante.
const semSpecs = MATERIAIS.filter((m) => !temDesempenho(m));
afirma(semSpecs.length > 0, 'existe material sem perfil de desempenho');
afirma(
  semSpecs.every((m) => {
    const f = fabricantePorId(m.id);
    return Boolean(f && ((f.ficha && f.ficha.length > 0) || f.indices));
  }),
  'todo material sem specs tem ficha de fabricante com conteúdo',
);

// Caso do meio: TEM specs (a comunidade mediu) mas NÃO tem dureza. A Sriver L
// saiu do catálogo da Butterfly e fonte nenhuma publica a esponja dela — a
// distribuidora só repete a ficha da Sriver comum, que é outra borracha. Sem
// dureza não há Perdão; velocidade/efeito/controle continuam valendo.
// Lâmina é de madeira: não ter dureza de esponja é o esperado. BORRACHA sem
// dureza é a exceção, e exceção precisa se explicar na própria ficha.
const semDureza = MATERIAIS.filter(
  (m) => m.tipo === 'Borracha' && temDesempenho(m) && m.durezaUnificada === undefined,
);
afirma(semDureza.length > 0, 'existe borracha com specs e sem dureza unificada');
afirma(
  semDureza.every((m) => Boolean(fabricantePorId(m.id)?.nota)),
  'borracha sem dureza diz na ficha por que a régua não se aplica',
);
afirma(
  semDureza.every((m) => m.origemDureza === 'semente' && m.durezaFabricante === undefined),
  'sem dureza confirmada, nada é carimbado como vindo do fabricante',
);

// Foto de produto é regra do projeto, não enfeite: TODO material tem imagem
// creditada, e o arquivo precisa existir de verdade em public/produtos/ —
// senão o site publica um Glifo de fallback sem ninguém perceber.
afirma(
  MATERIAIS.every((m) => imagemDoMaterial(m.id) !== undefined),
  'todo material tem imagem oficial registrada',
);
afirma(
  MATERIAIS.every((m) => {
    const img = imagemDoMaterial(m.id)!;
    return Boolean(img.fonte && img.fonteUrl) && existsSync(`public/produtos/${img.arquivo}`);
  }),
  'toda imagem tem crédito, origem e arquivo no disco',
);

// Preço publicado é preço REAL. O cartão do catálogo, a página da marca e o
// filtro de preço leem material.preco direto — se ele for a estimativa da
// semente, o site anuncia um preço que a loja não pratica. Foi o que acontecia:
// a Stiga Evolution figurava por R$ 150 custando R$ 443.
afirma(
  MATERIAIS.every((m) => {
    const real = precoMedio(m.id);
    return real === null || m.preco === Math.round(real);
  }),
  'preço da ficha bate com a oferta verificada',
);

// Fixture com um item sem perfil, pra exercitar o motor.
const semPerfil: Material = {
  id: 'X1', nome: 'X1', marca: 'DHS', tipo: 'Bola', nivel: 'Intermediário',
  intencao: 'equilibrado', preco: 25, rating: 5.0, reviews: 10,
};
const CAT2: Material[] = [...CAT, semPerfil];

// Filtro de spec ATIVO exclui quem não tem o dado — não pode alegar estar na faixa.
afirma(!ids(aplicar(CAT2, parseQuery('vel=0-10'))).includes('X1'), 'sem specs não passa por filtro de velocidade');
afirma(ids(aplicar(CAT2, parseQuery(''))).includes('X1'), 'sem filtro de spec, continua no catálogo');
afirma(ids(aplicar(CAT2, parseQuery('preco=100'))).includes('X1'), 'filtro de preço ainda alcança quem não tem spec');

// Ordenação por spec: quem não tem o dado afunda, nunca lidera.
afirma(ids(aplicar(CAT2, parseQuery('ordenar=velocidade'))).at(-1) === 'X1', 'sem specs afunda ao ordenar por velocidade');
afirma(ids(aplicar(CAT2, parseQuery('ordenar=perdao'))).at(-1) === 'X1', 'sem specs afunda ao ordenar por Perdão');
// Mas em ordenação que não depende de spec, participa normalmente.
afirma(ids(aplicar(CAT2, parseQuery('ordenar=preco-asc')))[0] === 'X1', 'no menor preço, lidera (R$ 25)');

// Veredito diz POR QUE reprova, em vez de reprovar em silêncio.
const vSemPerfil = combinaComPerfil(semPerfil, baseSolida);
afirma(!vSemPerfil.combina, 'sem perfil não combina com perfil que pede spec');
afirma(vSemPerfil.criterios.some(c => c.detalhe === 'não tem ficha de desempenho'),
  'o critério explica a ausência em vez de mostrar número falso');


// ───────── efeito é da BORRACHA, não da lâmina ─────────
// Nem o Revspin nem a Butterfly publicam 'spin' de lâmina — não é lacuna das
// fontes, é a realidade física. Lâmina entra sem o campo em vez de inventar.
afirma(MATERIAIS.filter(m => m.tipo === 'Lâmina').every(m => m.specs?.spin === undefined),
  'nenhuma lâmina carrega efeito inventado');
// A recíproca: borracha COM perfil de desempenho nunca pode vir sem efeito — ali
// o número existe e some por descuido. (Borracha sem perfil algum é outro caso,
// legítimo e já coberto acima: falta amostra na comunidade, e a ficha diz isso.)
afirma(
  MATERIAIS.filter((m) => m.tipo === 'Borracha' && temDesempenho(m)).every(
    (m) => m.specs.spin !== undefined,
  ),
  'borracha com perfil sempre traz o efeito',
);

// Lâmina não passa por filtro de efeito, mas passa nos outros.
const laminaSemSpin: Material = {
  id: 'L9', nome: 'L9', marca: 'Butterfly', tipo: 'Lâmina', nivel: 'Avançado',
  intencao: 'atacar', preco: 1500, rating: 4.9, reviews: 20,
  specs: { velocidade: 8.8, controle: 8.5 }, durabilidade: 8.5, durezaUnificada: 47,
};
const CAT3: Material[] = [...CAT, laminaSemSpin];
afirma(!ids(aplicar(CAT3, parseQuery('spin=0-10'))).includes('L9'), 'lâmina não passa por filtro de efeito');
afirma(ids(aplicar(CAT3, parseQuery('vel=8-10'))).includes('L9'), 'mas passa por filtro de velocidade');
// E o veredito explica a ausência em vez de reprovar como se fosse zero.
const perfilComSpin = { id: 'x', nome: 'x', descricao: 'x', presetURL: '/catalogo?spin=8-10' };
const vLam = combinaComPerfil(laminaSemSpin, perfilComSpin);
afirma(vLam.criterios.some(c => c.detalhe === 'efeito é da borracha, não da lâmina'),
  'veredito explica por que a lâmina não tem efeito');

console.log(`\n✔ ${ok} asserções passaram`);
if (falhas.length) {
  console.error(`✘ ${falhas.length} falharam:`);
  for (const f of falhas) console.error('  - ' + f);
  process.exit(1);
}
console.log('Colheita verificada: métricas e quiz batem com o que está publicado no Figma.\n');
