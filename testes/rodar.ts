/**
 * WikiPong · Testes da colheita (rodar: npx tsx testes/rodar.ts)
 * Asserções derivadas dos números PUBLICADOS no Figma (board Métricas · Derivadas
 * e telas de Comparação) — se o código divergir do que está desenhado, isto quebra.
 */
import {
  maciez, custoMensal, custoMensalPorClasse,
  paraBolinhas, paraPalavra, indicesDoMaximo, Specs,
  reguaDe, mesmaRegua, TETO_DA_REGUA,
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
import { precoTotal, observacoes, completa, pecasDe, vereditosDaMontagem, resumoDaMontagem } from '../src/logica/montagem.js';
import {
  validar, resumir, ordenar, recortar, ranking, wilson, aprovadas, maisRecentes,
  ROTULO_ESTILO, INTENCAO_DO_ESTILO, PISO_PARA_MEDIA, Avaliacao,
} from '../src/logica/avaliacoes.js';
import {
  validarTopico, ordenarTopicos, porAssunto, ultimaAtividade, ROTULO_ASSUNTO, Topico,
  buscarTopicos, respostasOrdenadas, temRespostaUtil, type Mensagem as MensagemForum,
} from '../src/logica/discussoes.js';
import { perfilVazio, temIdentidade, pecasEscolhidas } from '../src/logica/perfil.js';
import {
  traduzirFicha, familiaDaLamina, familiaDaBorracha, LAMINA, BORRACHA,
} from '../src/logica/traduzir.js';
import { metricasComparaveis, metricasDoRadar, temRadar } from '../src/logica/comparacao.js';
import { posicaoNaFaixa, fracaoNaFaixa, leituraDaPosicao } from '../src/logica/posicao.js';
import { similares, distancia, type Similar } from '../src/logica/similares.js';
import { filtrarPorTexto } from '../src/logica/busca-material.js';
import {
  validarPedido, parecidos, ordenarPedidos, atendidos, aprovados, type PedidoDePauta,
} from '../src/logica/pedidos-pauta.js';
import { MATERIAIS, materialPorId } from '../componentes/dados-materiais.js';
import { CONJUNTOS } from '../componentes/dados-conjuntos.js';
import { nomeComMarca } from '../componentes/formato.js';
import { fabricantePorId } from '../componentes/dados-fabricante.js';
import { imagemDoMaterial } from '../componentes/dados-imagens.js';
import { precoMedio } from '../componentes/dados-ofertas.js';
import { NOTICIAS } from '../componentes/dados-noticias.js';
import { RESUMO_MINIMO } from '../src/logica/noticias-fila.js';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

let ok = 0; const falhas: string[] = [];
function afirma(cond: boolean, msg: string) { if (cond) ok++; else falhas.push(msg); }
const aprox = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

// ───────── métricas: os exemplos do board reproduzidos exatamente ─────────
const tenergy: Specs = { velocidade: 9.0, spin: 9.3, controle: 7.0 };
const markv: Specs = { velocidade: 7.0, spin: 7.5, controle: 9.0 };

afirma(aprox(maciez(47), 4), 'maciez(47°) deve ser 4');
afirma(aprox(maciez(42), 5), 'maciez(42°) deve ser 5');
/* As duas asserções do Perdão saíram com a função (2026-08-03). `maciez`, que
   era insumo dele, continua testada acima: ela alimenta a tradução de dureza e
   sai de um grau declarado pelo fabricante, não de pesos escolhidos por nós. */

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
/* O Perdão saiu de PALAVRAS em 2026-08-03 (aparecia em 10 de 678 e era composto
   de pesos nossos). A durabilidade entrou no lugar como quarto índice. */
afirma(paraPalavra('durabilidade', 9.0) === 'Vida longa', 'durabilidade 9.0 → Vida longa');
afirma(paraPalavra('durabilidade', 7.5) === 'Dura bem', 'durabilidade 7.5 → Dura bem');
afirma(paraPalavra('durabilidade', 3.0) === 'Gasta rápido', 'durabilidade 3.0 → Gasta rápido');

afirma(JSON.stringify(indicesDoMaximo([9.0, 7.0])) === '[0]', 'máximo simples');
afirma(JSON.stringify(indicesDoMaximo([7, 7])) === '[0,1]', 'empate destaca ambos');

// ───────── quiz: grafo, progresso por branch, pilha, imutabilidade ─────────
const e0 = iniciar();
afirma(e0.atual === 'inicio', 'inicia na tela inicio');
afirma(progresso(e0)?.rotulo === 'Pergunta 1 de 3', 'progresso inicial 1 de 3');

const e1 = responder(e0, 'casual');
afirma(e1.atual === 'evo-estilo' && progresso(e1)?.n === 2, 'casual → evo-estilo (2 de 3)');
/* "Ataque" agora abre ramo próprio (evo-ataque-distancia): a pergunta que separa
   dois atacantes é ONDE eles jogam, não o que pesa mais na escolha. */
const e2 = responder(e1, 'ataque');
afirma(e2.atual === 'evo-ataque-distancia' && progresso(e2)?.n === 3,
  'ataque → pergunta de distância da mesa (3 de 3)');
const e3 = responder(e2, 'meia-distancia');
afirma(e3.atual === 'resultado-topspin', 'chega no resultado');
afirma(resultado(e3)?.nome === 'Topspin de meia-distância', 'perfil correto');
afirma((resultado(e3)?.presetURL ?? '').includes('intencao=atacar'), 'preset na URL (D-12)');
afirma(progresso(e3) === null, 'resultado não tem progresso');

/* Quem defende tinha as mesmas três respostas de quem ataca. Agora tem ramo. */
const d1 = responder(responder(iniciar(), 'serio'), 'defesa');
afirma(d1.atual === 'evo-defesa-como', 'defesa abre ramo próprio');
afirma(resultado(responder(d1, 'corte'))?.id === 'defensor', 'corte longe da mesa → Defensor');

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

// catálogo-fixture
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
const P_BASE = '/catalogo?nivel=iniciante&ordenar=controle';
const P_ATAC = '/catalogo?nivel=intermediario&vel=6-8&ctrl=7-10';
const P_CTRL = '/catalogo?vel=5-7&ctrl=8-10&ordenar=controle';
const P_EXPL = '/catalogo?modo=simples';

// parse dos 4 perfis
const eBase = parseQuery(P_BASE);
afirma(jeq(eBase.niveis, ['iniciante']), 'base: nivel=iniciante');
/* O preset do iniciante nao carrega mais FAIXA de spec: faixa descartava de
   saida os 470 materiais sem perfil de desempenho e deixava 6 de 678 na tela. */
afirma(eBase.velocidade === null && eBase.controle === null,
  'base: nenhuma faixa de spec — faceta filtra, spec ordena');
afirma(eBase.ordenar === 'controle', 'base: ordenar=controle');

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
afirma(jeq(ids(aplicar(CAT, eBase)), ['M1', 'M2', 'M3', 'M5']),
  'base: TODOS os iniciantes, ordenados por controle desc (9.0, 8.5, 8.0, 7.0)');
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
afirma(f0.ordenar === 'relevancia' && comOrdenacao(f0, 'durabilidade').ordenar === 'durabilidade', 'comOrdenacao é imutável');

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
afirma(uIni.ordenar === 'velocidade', '"competir" ordena por velocidade em vez de recortar por faixa');
afirma(jeq(uIni.niveis, ['iniciante']), 'preset refinado preserva o nível do perfil');

// "sem teto" NÃO inventa faixa de preço; "aprender" aperta o controle
const pApr = responder(responder(responder(iniciar(), 'comecando'), 'aprender'), 'sem-teto');
const uApr = parseQuery(presetFinal(pApr) ?? '');
afirma(uApr.preco === null, 'sem-teto não cria filtro de preço (D-16)');
afirma(uApr.ordenar === 'controle', '"aprender o básico" ordena por controle');
afirma(uApr.controle === null && uApr.velocidade === null,
  'nenhuma faixa de spec no preset do iniciante — ela deixava 6 materiais de 678');

// "raquete pronta" vira filtro de tipo
const pPro = responder(responder(responder(iniciar(), 'comecando'), 'pronta'), 'ate-400');
afirma(jeq(parseQuery(presetFinal(pPro) ?? '').tipos, ['raquete']), 'raquete pronta filtra tipo=raquete');

// "voltei depois de parado" abre o intermediário
const pVol = responder(responder(responder(iniciar(), 'voltando'), 'aprender'), 'sem-teto');
afirma(parseQuery(presetFinal(pVol) ?? '').niveis.includes('intermediario'), '"voltei" abre o intermediário');

/* Evolução: nível, estilo e distância da mesa se acumulam na URL.
   O estilo deixou de puxar FAIXA de velocidade e passou a puxar INTENÇÃO — a
   faixa descartava os 470 materiais sem perfil de desempenho antes de qualquer
   outro critério, e era o que esvaziava os resultados do quiz. */
const pEvo = responder(responder(responder(iniciar(), 'serio'), 'ataque'), 'meia-distancia');
const uEvo = parseQuery(presetFinal(pEvo) ?? '');
afirma(uEvo.niveis.includes('avancado'), '"treino sério" abre materiais avançados');
afirma(jeq(uEvo.intencoes, ['atacar']), 'estilo de ataque filtra por intenção, não por faixa de spec');
afirma(uEvo.velocidade === null, 'nenhuma faixa de spec entra no preset — ela descartaria 470 materiais');
afirma(uEvo.ordenar === 'spin', 'meia-distância ordena por efeito');

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
/* A leitura de faixa é do descritor, não do quiz — testar com URL literal
   desacopla os dois. Antes isto vinha de um preset do quiz, e mudar o quiz
   quebrava um teste que não era sobre o quiz. */
afirma(valorDe('/catalogo?ctrl=8-10', 'Controle') === '8 ou mais', 'faixa no teto lê "8 ou mais"');
afirma(valorDe('/catalogo?vel=5-7', 'Velocidade') === '5 a 7', 'faixa fechada lê "5 a 7"');
afirma(valorDe(uCusStr, 'Nível') === undefined, 'não inventa etiqueta de filtro ausente');

afirma(valorDe(presetFinal(pEvo) ?? '', 'Nível') === 'Intermediário · Avançado',
  'níveis traduzidos com acento e unidos');
afirma(valorDe(presetFinal(pIni) ?? '', 'Preço') === 'até R$ 200', 'preço-teto lê "até R$ 200"');
afirma(valorDe(presetFinal(pPro) ?? '', 'Tipo') === 'Raquete', 'tipo traduzido');
afirma(etiquetasDoPreset(P_EXPL).length === 0,
  'explorador não gera etiqueta (a UI diz "catálogo inteiro" em vez de caixa vazia)');

// ───────── recomendação: veredito material ↔ perfil (dado sincero) ─────────
/* Eram 3; agora são 6, com a defesa e as duas distâncias de mesa que o quiz
   passou a distinguir. Ficam de fora os que não filtram nada: `explorador` e
   `custo-beneficio` só ordenam, e um perfil que combina com tudo não é veredito. */
afirma(PERFIS_COM_CRITERIO.length === 6, 'os 6 perfis que filtram entram');
afirma(!PERFIS_COM_CRITERIO.some(p => p.id === 'explorador'), 'explorador excluído (combinaria com tudo)');
afirma(!PERFIS_COM_CRITERIO.some(p => p.id === 'custo-beneficio'),
  'custo-benefício excluído: só ordena, não filtra');

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
/* O perfil passou a ter UM critério só, o nível. As faixas de velocidade e
   controle saíram de propósito: elas reprovavam de saída todo material sem
   perfil de desempenho, que é a maioria do catálogo. */
afirma(vM4.criterios.length === 1, 'base-solida cobra só o nível');
afirma(vM4.criterios[0].rotulo === 'Nível' && !vM4.criterios[0].atende, 'M4: nível reprova');

const defensor = PERFIS_COM_CRITERIO.find(p => p.id === 'defensor')!;
afirma(defensor.presetURL.includes('intencao=controlar'), 'defensor filtra por intenção de controle');

afirma(vereditosDoMaterial(CAT[0]).length === 6, 'vereditosDoMaterial cobre os 6 perfis');
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
// Dois materiais NUNCA podem ter o mesmo arquivo byte a byte. Esta asserção
// nasce de um erro que passou por 193 materiais — Donic e Stiga inteiras — sem
// nenhum teste reclamar: o extrator pegava a PRIMEIRA imagem de /uploads/ da
// página, e na AmericaTT essa primeira imagem é o selo "COMPRA 100% SEGURA".
// Todas as fichas mostravam o mesmo banner no lugar do produto. As invariantes
// que existiam passavam todas — o arquivo existia, tinha crédito e tinha origem;
// só não era a foto certa. O que denuncia isso é a REPETIÇÃO: duas fotos de
// produtos diferentes não podem ser o mesmo arquivo.
{
  const porHash = new Map<string, string[]>();
  for (const m of MATERIAIS) {
    const arq = `public/produtos/${imagemDoMaterial(m.id)!.arquivo}`;
    if (!existsSync(arq)) continue;
    const h = createHash('md5').update(readFileSync(arq)).digest('hex');
    porHash.set(h, [...(porHash.get(h) ?? []), m.id]);
  }
  const repetidos = [...porHash.values()].filter((ids) => ids.length > 1);
  afirma(
    repetidos.length === 0,
    'nenhuma foto se repete entre materiais' +
      (repetidos.length ? ` — repetidas: ${repetidos.map((r) => r.join('/')).join(', ')}` : ''),
  );
}

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
afirma(ids(aplicar(CAT2, parseQuery('ordenar=durabilidade'))).at(-1) === 'X1', 'sem specs afunda ao ordenar por durabilidade');
// Mas em ordenação que não depende de spec, participa normalmente.
afirma(ids(aplicar(CAT2, parseQuery('ordenar=preco-asc')))[0] === 'X1', 'no menor preço, lidera (R$ 25)');

// Veredito diz POR QUE reprova, em vez de reprovar em silêncio.
/* Perfil sintético, porque nenhum perfil do quiz pede spec agora — e não é sobre
   o quiz: é sobre o veredito explicar a AUSÊNCIA de dado em vez de reprovar
   calado ou mostrar zero como se fosse medição. */
const perfilQuePedeSpec = {
  id: 'so-para-teste',
  nome: 'Perfil que pede spec',
  descricao: 'existe só neste teste',
  presetURL: '/catalogo?ctrl=8-10',
};
const vSemPerfil = combinaComPerfil(semPerfil, perfilQuePedeSpec);
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


// ─────────── Avaliações da comunidade (D-11 + emenda do estilo) ───────────

const av = (p: Partial<Avaliacao>): Avaliacao => ({
  id: p.id ?? 'a1', materialId: p.materialId ?? 'm1', autor: p.autor ?? 'Fulano',
  nota: p.nota ?? 5, texto: p.texto ?? 'Texto suficientemente longo pra passar.',
  nivel: p.nivel ?? 'Intermediário', tempoDeUso: p.tempoDeUso ?? '1 a 6 meses',
  estilo: p.estilo ?? 'allround', criadoEm: p.criadoEm ?? '2026-07-01',
  status: p.status ?? 'aprovado',
});

// O formulário mostra TUDO que falta de uma vez, não um erro por tentativa.
afirma(validar({}).length === 6, 'rascunho vazio acusa os 6 campos obrigatórios');
afirma(validar({ nota: 3.5 }).some(p => p.campo === 'nota'), 'meia-estrela é recusada');
afirma(validar({ nota: 6 }).some(p => p.campo === 'nota'), 'nota acima de 5 é recusada');
afirma(validar({ texto: 'curto' }).some(p => p.campo === 'texto'), 'texto curto demais é recusado');
afirma(validar({
  autor: 'Ana', nota: 4, texto: 'Uso há meses e o controle me surpreendeu bastante.',
  nivel: 'Avançado', tempoDeUso: '6 meses a 1 ano', estilo: 'atacante',
}).length === 0, 'rascunho completo passa');

// Só avaliação APROVADA entra em número público (pré-moderação do D-11).
const comPendente = [
  av({ id: 'p1', nota: 5, status: 'pendente' }),
  av({ id: 'p2', nota: 1, status: 'removido' }),
  av({ id: 'p3', nota: 4 }), av({ id: 'p4', nota: 4 }), av({ id: 'p5', nota: 4 }),
];
afirma(aprovadas(comPendente).length === 3, 'pendente e removida ficam fora da conta');
afirma(resumir(comPendente).media === 4, 'a média ignora o que não foi aprovado');

// Abaixo do piso o site mostra as avaliações, não a média.
afirma(resumir([av({ id: 'u1' })]).media === null, 'uma avaliação não vira média');
afirma(resumir([av({ id: 'x1' }), av({ id: 'x2' }), av({ id: 'x3' })]).media !== null,
  `com ${PISO_PARA_MEDIA} avaliações a média já sai`);

// O recorte que dá sentido à nota: a mesma borracha, lida por quem joga diferente.
const mesmaBorracha = [
  av({ id: 'r1', nota: 5, nivel: 'Avançado', estilo: 'atacante' }),
  av({ id: 'r2', nota: 5, nivel: 'Avançado', estilo: 'atacante' }),
  av({ id: 'r3', nota: 2, nivel: 'Iniciante', estilo: 'defensor' }),
];
const resAv = resumir(mesmaBorracha);
afirma(resAv.porNivel['Avançado']!.media === 5 && resAv.porNivel['Iniciante']!.media === 2,
  'a média por nível separa o 5★ do avançado do 2★ do iniciante');
afirma(resAv.porEstilo['atacante']!.total === 2, 'e o recorte por estilo também');
afirma(recortar(mesmaBorracha, { estilo: 'defensor' }).length === 1, 'recorte por estilo filtra');
afirma(resAv.distribuicao[4] === 2 && resAv.distribuicao[1] === 1, 'a distribuição por estrela bate');

// A ARMADILHA QUE O WILSON EXISTE PRA EVITAR: uma nota 5 não pode liderar sobre
// um material com muitas notas altas. Ordenar por média pura erraria isso.
const disputa = [
  av({ id: 'n1', materialId: 'novato', nota: 5 }),
  ...Array.from({ length: 40 }, (_, i) =>
    av({ id: 'v' + i, materialId: 'veterano', nota: i < 36 ? 5 : 3 })),
];
const tabela = ranking(disputa);
afirma(tabela[0].materialId === 'veterano',
  'no ranking, 40 avaliações vencem a única nota 5 (Wilson, D-11)');
afirma(tabela[1].media === 5 && tabela[1].total === 1,
  'e o novato segue com média 5 — o que muda é a ordem, não o fato');
afirma(wilson(1, 1) < wilson(36, 40), 'Wilson pune amostra de um');
afirma(wilson(0, 0) === 0, 'sem amostra, pontuação zero');

// Ordenação e feed.
const linhaAv = [
  av({ id: 'o1', criadoEm: '2026-01-01', nota: 2 }),
  av({ id: 'o2', criadoEm: '2026-06-01', nota: 5 }),
];
afirma(ordenar(linhaAv, 'recentes')[0].id === 'o2', 'recentes ordena por data');
afirma(ordenar(linhaAv, 'nota-baixa')[0].id === 'o1', 'nota-baixa mostra a crítica primeiro');
afirma(maisRecentes(linhaAv, 1).length === 1, 'o feed respeita o limite pedido');

// A tag do comentário e o guia /aprender/estilos-de-jogo falam a mesma língua,
// e o estilo de quem joga aponta pra intenção que o catálogo já usa.
afirma(ROTULO_ESTILO.allround === 'All-round', 'o rótulo do estilo é o do guia');
afirma(Object.values(INTENCAO_DO_ESTILO).every(i =>
  ['atacar', 'equilibrado', 'controlar'].includes(i)),
  'todo estilo aponta pra uma intenção que existe no catálogo');


// ─────────── Discussões e perfil (D-19, emenda) ───────────

const top = (p: Partial<Topico>): Topico => ({
  id: p.id ?? 't1', titulo: p.titulo ?? 'Qual lâmina combina com a MX-P?',
  texto: p.texto ?? 'Uso MX-P dos dois lados e quero trocar a madeira.',
  assunto: p.assunto ?? 'geral', autor: p.autor ?? 'Fulano',
  criadoEm: p.criadoEm ?? '2026-07-01', respostas: p.respostas ?? [],
  materialId: p.materialId,
});

afirma(validarTopico({}).length === 3, 'tópico vazio acusa título, texto e assinatura');
afirma(validarTopico({ titulo: 'curto' }).some(p => p.campo === 'titulo'),
  'título curto demais é recusado');
afirma(validarTopico({
  autor: 'Ana', titulo: 'Qual lâmina combina com a MX-P?',
  texto: 'Uso MX-P dos dois lados e quero trocar a madeira este ano.',
}).length === 0, 'tópico completo passa');

// A conversa VIVA sobe, não a mais recém-aberta: num fórum pequeno, ordenar por
// criação enterra o que está em movimento sob tópicos que ninguém respondeu.
const antigoComResposta = top({
  id: 'velho', criadoEm: '2026-01-01',
  respostas: [{ id: 'r1', autor: 'B', texto: 'oi', criadoEm: '2026-07-20' }],
});
const novoSemResposta = top({ id: 'novo', criadoEm: '2026-07-10' });
const fila = [antigoComResposta, novoSemResposta];
afirma(ordenarTopicos(fila, 'ativos')[0].id === 'velho',
  'com movimento: o tópico respondido ontem passa o aberto na semana passada');
afirma(ordenarTopicos(fila, 'novos')[0].id === 'novo', 'mais novos ordena por criação');
afirma(ordenarTopicos(fila, 'sem-resposta').length === 1,
  'sem-resposta mostra só quem ainda não teve resposta');
afirma(ultimaAtividade(antigoComResposta) === '2026-07-20',
  'a última atividade é a da resposta, não a da abertura');
afirma(porAssunto([top({ assunto: 'compra' }), top({ id: 't2' })], 'compra').length === 1,
  'filtro por assunto funciona');
afirma(ROTULO_ASSUNTO.montagem === 'Montagem da raquete', 'o assunto tem rótulo legível');

// Perfil.
const p0 = perfilVazio();
afirma(!temIdentidade(p0), 'perfil vazio não tem identidade');
afirma(!temIdentidade({ ...p0, nome: 'Ana' }), 'só o nome não basta — falta o estilo');
afirma(temIdentidade({ ...p0, nome: 'Ana', estilo: 'atacante' }),
  'nome + estilo já dá pra apresentar a pessoa');
afirma(pecasEscolhidas({ ...p0, equipamento: { lamina: 'x', fh: 'y' } }) === 2,
  'conta as peças já escolhidas do equipamento');

// ───────────────── Tradutor de ficha → linguagem de gente ─────────────────

const fichaDe = (v: string, rotulo = 'Construção') => [{ rotulo, valor: v }];

/* ONDE a fibra está muda a dinâmica inteira: externa dá saída seca e arco baixo,
   interna mantém toque de madeira no toque leve e só "acorda" na pancada (tempo
   de contato 15–20% maior). Chamar as duas de "com fibra" escondia justamente a
   informação que faz a pessoa escolher. */
afirma(familiaDaLamina(fichaDe('Madeira + carbono em posição interna')) === 'fibra-interna',
  'ficha que diz "interna" → família fibra-interna, não o genérico');
afirma(familiaDaLamina(fichaDe('5 madeiras + 2 de Axylium-Carbon externas')) === 'fibra-externa',
  'ficha que diz "externas" → família fibra-externa');
afirma(familiaDaLamina(fichaDe('Innerforce Layer ZLC')) === 'fibra-interna',
  '"Innerforce" na construção conta como declaração de fibra interna');
afirma(familiaDaLamina(fichaDe('Madeira + carbono')) === 'com-fibra',
  'sem dizer onde a fibra está, fica no genérico — não se deduz a posição');
afirma(familiaDaLamina(fichaDe('5 madeiras + 2 ZL-Carbon')) === 'com-fibra',
  'Carbon em inglês também conta como fibra');
afirma(familiaDaLamina(fichaDe('5 camadas de madeira pura (sem fibra)')) === 'madeira-pura',
  'a negação vence: "sem fibra" não pode cair em com-fibra por conter "fibra"');
afirma(familiaDaLamina(fichaDe('Madeira com miolo de balsa')) === 'balsa', 'balsa é família própria');

/* A REGRA QUE PEGOU O DEFEITO. A primeira versão do tradutor tinha
   `madeira-pura` como default do else final, e por isso classificou a Viscaria
   Super ALC, a Timo Boll ALC e mais treze lâminas de fibra como "madeira pura,
   sem fibra — a recomendada para quem está formando a técnica". A ficha delas
   não declara construção: só "Lâmina avulsa, o cabo se escolhe na loja".
   Ausência de dado virou afirmação. Sem sinal, agora é null. */
afirma(familiaDaLamina(fichaDe('Lâmina avulsa. O cabo se escolhe na loja', 'Tipo de lâmina')) === null,
  'ficha que só fala de cabo não autoriza afirmar família nenhuma');
afirma(traduzirFicha('Lâmina', fichaDe('Lâmina avulsa. O cabo se escolhe na loja', 'Tipo de lâmina')) === null,
  'sem família e sem traço, o tradutor cala a boca em vez de chutar (D-16)');

afirma(familiaDaBorracha(fichaDe('Lisa, tensionada', 'Superfície')) === 'tensor', 'tensionada → tensor');
afirma(familiaDaBorracha(fichaDe('Lisa aderente', 'Superfície')) === 'aderente', 'aderente → aderente');
afirma(familiaDaBorracha(fichaDe('Lisa aderente, tensionada', 'Superfície')) === 'hibrida',
  'aderente E tensionada é híbrida — a combinação é testada antes das puras');
/* A palavra do fabricante vale mais que a dedução. "Lisa aderente híbrida" saía
   como aderente porque `hibrid` estava dentro do teste de aderente: a palavra
   que dava a resposta era gasta como prova de outra coisa. 17 borrachas. */
afirma(familiaDaBorracha(fichaDe('Lisa aderente híbrida (capa chinesa + esponja alemã)', 'Superfície')) === 'hibrida',
  'ficha que diz "híbrida" é híbrida, mesmo sem a palavra tensionada');
afirma(familiaDaBorracha(fichaDe('Lisa levemente aderente (China Hybrid, capa H-Touch)', 'Superfície')) === 'hibrida',
  '"Hybrid" em inglês na ficha também conta');
afirma(familiaDaBorracha(fichaDe('Lisa', 'Superfície')) === 'classica', 'lisa e mais nada é clássica');
afirma(familiaDaBorracha(fichaDe('Lâmina avulsa', 'Tipo')) === null, 'ficha sem superfície → null');

/* Traço sobrevive sem família: a Defensive Pro JP e a Wavy Cybershape não
   declaram construção de madeira, mas dizem "defensiva" e "hexagonal". */
const soTraco = traduzirFicha('Lâmina', fichaDe('Construção defensiva, versão japonesa'));
afirma(soTraco !== null && soTraco.tracos.length > 0,
  'ficha sem família mas com traço ainda produz leitura');

// ── INVARIANTE DO CATÁLOGO: o tradutor não pode contradizer o nome do produto ──
// Uma lâmina cujo NOME diz ALC/ZLC/Carbon jamais pode ser descrita como madeira
// pura. É a asserção que teria quebrado no primeiro material afetado.
const NOME_DIZ_FIBRA = /\bALC\b|\bZLC\b|\bZLF\b|carbon|arylate|zylon|kevlar|\bCNF\b|fiber|fibra/i;
let contradicoes = 0;
let semLeituraNenhuma = 0;
for (const mat of MATERIAIS) {
  const f = fabricantePorId(mat.id)?.ficha;
  if (/mina/i.test(mat.tipo) && f && NOME_DIZ_FIBRA.test(mat.nome)
      && familiaDaLamina(f) === 'madeira-pura') contradicoes++;
  /* Todo material precisa de ALGO no modo Simples. A tela tem TRÊS fontes, nesta
     ordem: bolinhas (specs), resumo traduzido da ficha, e o texto editorial como
     último recurso. A asserção antiga só contava as duas primeiras e por isso
     afirmava mais do que a tela promete — quebrou na colheita da JOOLA com dois
     materiais que a loja não descreve, e que na tela aparecem normalmente pelo
     editorial. Corrigida para medir o que o cartão realmente faz. */
  if (!temDesempenho(mat) && traduzirFicha(mat.tipo, f) === null
      && !mat.simples.frase.trim()) semLeituraNenhuma++;
}
afirma(contradicoes === 0,
  `nenhuma lâmina com fibra no nome pode ser classificada como madeira pura (achadas: ${contradicoes})`);
afirma(semLeituraNenhuma === 0,
  `todo material tem o que dizer no modo Simples (mudos: ${semLeituraNenhuma})`);

/* E um PISO DE COBERTURA da tradução, separado. Sem ele, uma colheita futura que
   entrasse com 300 lâminas sem ficha passaria calada: cada uma teria editorial e
   a asserção acima continuaria verde, enquanto o modo Simples voltaria a ser
   texto de colheita para meio catálogo. */
const comTraducao = MATERIAIS.filter(
  (mat) => traduzirFicha(mat.tipo, fabricantePorId(mat.id)?.ficha) !== null,
).length;
afirma(comTraducao / MATERIAIS.length >= 0.9,
  `a tradução da ficha cobre ao menos 90% do catálogo (${comTraducao} de ${MATERIAIS.length})`);

// As tabelas são configuração exportada (D-07): toda família precisa de texto.
for (const k of Object.keys(LAMINA)) {
  afirma(LAMINA[k as keyof typeof LAMINA].resumo.length > 40, `resumo de lâmina "${k}" existe`);
}
for (const k of Object.keys(BORRACHA)) {
  afirma(BORRACHA[k as keyof typeof BORRACHA].resumo.length > 40, `resumo de borracha "${k}" existe`);
}

// ───────── Régua do catálogo: onde o material cai entre os semelhantes ─────────
/* O radar precisa de 3 eixos e por isso atendia 114 dos 678 materiais e NENHUMA
   das 393 lâminas. A régua funciona com um índice só. */
const universoTeste = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const pos = posicaoNaFaixa(8, universoTeste)!;
afirma(pos.percentil === 70, `8 supera 70% de 1..10 (veio ${pos.percentil})`);
afirma(pos.min === 1 && pos.max === 10, 'as pontas da régua são o mínimo e o máximo do universo');
afirma(aprox(fracaoNaFaixa(pos), 7 / 9), 'a fração desenhada é a posição REAL no intervalo, não o percentil');

/* Empate não conta como superado: sem isso, o mais lento de um grupo com muitos
   empates apareceria como "mais rápido que 40%", o contrário do que se vê. */
afirma(posicaoNaFaixa(5, [5, 5, 5, 5, 5, 5, 5, 5, 9])!.percentil === 0,
  'empate não conta como superado');

afirma(posicaoNaFaixa(5, [1, 2, 3]) === null, 'base pequena demais não vira régua');
afirma(posicaoNaFaixa(5, [5, 5, 5, 5, 5, 5, 5, 5, 5]) === null,
  'universo sem variação não tem "mais" nem "menos" a dizer');

afirma(leituraDaPosicao({ ...pos, percentil: 95 }, 'velocidade').includes('10%'),
  'percentil alto vira "entre os 10% de maior velocidade"');
afirma(leituraDaPosicao({ ...pos, percentil: 50 }, 'preço').includes('média'),
  'percentil no meio vira "na média"');

/* O alcance é o motivo de o módulo existir: TODO material precisa de gráfico. */
let comRegua = 0;
for (const mat of MATERIAIS) {
  const doMesmoTipo = MATERIAIS.filter((x) => x.tipo === mat.tipo && x.moeda === undefined);
  if (mat.moeda === undefined && posicaoNaFaixa(mat.preco, doMesmoTipo.map((x) => x.preco)) !== null) {
    comRegua++;
  }
}
afirma(comRegua > 650,
  `a régua de preço alcança quase todo o catálogo (${comRegua} de ${MATERIAIS.length})`);

// ───────── O quiz precisa RESPONDER: nenhum caminho pode morrer vazio ─────────
/* Percorre os 43 caminhos possíveis do grafo e conta quantos materiais a URL
   final de cada um devolve. Foi assim que apareceu o defeito: 4 caminhos
   terminavam em ZERO e 18 em menos de 10, porque os presets filtravam por FAIXA
   DE SPEC — e faixa de spec descarta de saída os 470 materiais sem perfil de
   desempenho. Agora faceta filtra e spec ordena.

   Os que sobram vazios são todos o ramo "raquete pronta": o catálogo tem duas
   montadas, a partir de R$ 295, e quem pede "até R$ 200" recebe lista vazia
   porque é verdade. A opção avisa isso antes. */
const TETO_VAZIOS_ACEITOS = 2;
let caminhosQuiz = 0;
let caminhosVazios = 0;
let caminhosMagros = 0;
function andarQuiz(e: ReturnType<typeof iniciar>) {
  const tela = TELAS[e.atual];
  if (!tela) return;
  if (tela.tipo === 'resultado') {
    caminhosQuiz++;
    const url = presetFinal(e);
    const n = url ? aplicar(MATERIAIS, parseQuery(url)).length : 0;
    if (n === 0) caminhosVazios++;
    else if (n < 10) caminhosMagros++;
    return;
  }
  for (const op of tela.opcoes) andarQuiz(responder(e, op.id));
}
andarQuiz(iniciar());
afirma(caminhosQuiz > 40, `o grafo do quiz tem ${caminhosQuiz} caminhos`);
afirma(caminhosVazios <= TETO_VAZIOS_ACEITOS,
  `caminhos do quiz que terminam vazios: ${caminhosVazios} (teto: ${TETO_VAZIOS_ACEITOS})`);
afirma(caminhosMagros <= 6,
  `caminhos com menos de 10 materiais: ${caminhosMagros}`);

// ───────── Moeda estrangeira: fora do FILTRO de preço, não do catálogo ─────────
/* Uma precedência errada (`a || b ? c : d`) fazia material em dólar sumir do
   catálogo inteiro, e não só do filtro de preço. Duas asserções guardam os dois
   lados da regra, porque só uma deixaria o bug voltar pelo outro. */
const semFiltro = aplicar(MATERIAIS, filtroVazio());
afirma(semFiltro.length === MATERIAIS.length,
  `sem filtro nenhum, o catálogo inteiro aparece (${semFiltro.length} de ${MATERIAIS.length})`);
afirma(semFiltro.some((m) => m.moeda !== undefined),
  'material em moeda estrangeira aparece quando não há filtro de preço');
const comTeto = aplicar(MATERIAIS, parseQuery('preco=2000'));
afirma(comTeto.every((m) => m.moeda === undefined),
  'com filtro de preço em reais, moeda estrangeira sai — dólar não se compara com real');

// ───────────────── Comparação: nenhum par pode quebrar a tela ─────────────────

const soVel = { specs: { velocidade: 8, controle: 7 } };               // lâmina
const completo = { specs: { velocidade: 8, spin: 9, controle: 7 }, durabilidade: 8, durezaUnificada: 47 };

afirma(metricasComparaveis(soVel, soVel).length === 2,
  'lâmina × lâmina: só velocidade e controle — sem efeito nem durabilidade');
afirma(metricasComparaveis(completo, completo).length === 4,
  'borracha completa × completa: velocidade, efeito, controle e durabilidade');
afirma(metricasComparaveis(completo, soVel).length === 2,
  'métrica só entra quando OS DOIS têm — o lado mais pobre manda');
afirma(!temRadar(metricasComparaveis(soVel, soVel)),
  'com 2 eixos não se desenha radar: polígono de 2 vértices é um traço');
afirma(temRadar(metricasComparaveis(completo, completo)), 'com 4 eixos o radar sai');

/* A INVARIANTE QUE FALTAVA, e que teria evitado o crash em produção.
   Varre TODOS os pares do mesmo tipo — a regra do fundador, borracha com
   borracha e madeira com madeira — e exige duas coisas de cada um:

     1. nenhuma célula undefined ou NaN. Era `durabilidade.toFixed(1)` em
        undefined, porque o tipo declarava obrigatório o que a guarda não
        checava. Todas as 94 lâminas estão sem durabilidade, então TODA
        comparação lâmina × lâmina quebrava: 4.371 dos 10.588 pares.

     2. tantos valores quanto eixos no radar. Eram duas listas paralelas, e o
        JSX passava quatro rótulos fixos para três valores — cada número
        plotado no eixo errado. Isso não quebrava; mentia. */
/* A varredura passou a cobrir o CATÁLOGO INTEIRO, não só quem tem specs: a
   comparação foi aberta aos 470 materiais sem perfil de desempenho, que se
   confrontam pela ficha do fabricante traduzida. São ~117 mil pares. */
const comparaveisTeste = MATERIAIS;
let paresVarridos = 0;
let celulasRuins = 0;
let radarDesalinhado = 0;
let paresSemMetrica = 0;
for (let i = 0; i < comparaveisTeste.length; i++) {
  for (let j = i + 1; j < comparaveisTeste.length; j++) {
    const x = comparaveisTeste[i];
    const y = comparaveisTeste[j];
    if (x.tipo !== y.tipo) continue;
    paresVarridos++;
    const met = metricasComparaveis(x, y);
    if (met.length === 0) paresSemMetrica++;
    for (const linha of met) {
      for (const v of linha.valores) {
        if (v === undefined || Number.isNaN(v)) celulasRuins++;
      }
    }
    const doRadar = metricasDoRadar(met);
    if (doRadar.map((r) => r.eixo).length !== doRadar.map((r) => r.valores[0]).length) {
      radarDesalinhado++;
    }
    /* Sem métrica nenhuma, a tela cai no confronto de ficha — e aí a ficha
       precisa existir dos dois lados, senão a comparação fica vazia. */
    if (met.length === 0) {
      const fa = fabricantePorId(x.id)?.ficha;
      const fb = fabricantePorId(y.id)?.ficha;
      if (!fa?.length || !fb?.length) celulasRuins++;
    }
  }
}
afirma(paresVarridos > 100000, `varreu os pares do mesmo tipo (${paresVarridos})`);
afirma(paresSemMetrica > 0,
  `há pares sem número nenhum, e eles se comparam pela ficha (${paresSemMetrica})`);
afirma(celulasRuins === 0,
  `nenhuma célula da comparação é undefined ou NaN (achadas: ${celulasRuins})`);
afirma(radarDesalinhado === 0,
  `radar sempre com tantos valores quanto eixos (desalinhados: ${radarDesalinhado})`);

// PARECIDOS COM ESTE: a comparacao que tem NOME
/* A mediana e a regua respondem "8,2 e muito?". Nenhuma responde "e o que mais
   existe parecido?" -- mediana nao tem nome, nao tem preco e nao se compra. */
const sim = (id: string, tipo: string, vel: number, ctrl: number, preco: number,
             extra: Partial<Similar> = {}): Similar =>
  ({ id, nome: id, tipo, nivel: 'Avancado', preco,
     specs: { velocidade: vel, controle: ctrl }, ...extra });

const alvoSim = sim('alvo', 'Borracha', 9, 7, 400);
const universoSim: Similar[] = [
  alvoSim,
  sim('quase-igual', 'Borracha', 9.1, 7.1, 410),
  sim('parecido', 'Borracha', 8.5, 7.5, 380),
  sim('distante', 'Borracha', 4, 9.5, 90),
  sim('outro-tipo', 'Lamina', 9, 7, 400),
];
const viz = similares(alvoSim, universoSim, 2);
afirma(viz.length === 2, 'devolve a quantidade pedida de vizinhos');
afirma(viz[0].id === 'quase-igual', 'o mais proximo vem primeiro');
afirma(!viz.some((v) => v.id === 'alvo'), 'o proprio material nunca entra na lista');
afirma(!viz.some((v) => v.tipo === 'Lamina'),
  'nunca cruza tipo: borracha so se compara com borracha');

/* Sem indice nenhum (470 materiais), a distancia cai no categorico: familia da
   construcao primeiro, nivel depois, preco como termo fraco. */
const semSpec = (id: string, familia: string | null, nivel: string, preco: number): Similar =>
  ({ id, nome: id, tipo: 'Lamina', nivel, preco, familia });
const alvoCego = semSpec('cego', 'madeira-pura', 'Iniciante', 300);
const vizCego = similares(alvoCego, [
  alvoCego,
  semSpec('mesma-familia', 'madeira-pura', 'Iniciante', 320),
  semSpec('outra-familia', 'fibra-externa', 'Iniciante', 310),
], 1);
afirma(vizCego[0].id === 'mesma-familia',
  'sem specs, a familia da construcao manda no vizinho');

afirma(distancia(alvoSim, { ...alvoSim, id: 'x' }, 400) === 0,
  'material identico a si mesmo tem distancia zero');
afirma(distancia({ id: 'a', nome: 'a', tipo: 'X', nivel: '', preco: 0 },
                 { id: 'b', nome: 'b', tipo: 'X', nivel: '', preco: 0 }, 0) === null,
  'sem nada em comum para medir, devolve null em vez de inventar proximidade');

// BUSCA DO SELETOR DE MATERIAL
/* O montador usava <select> nativo com 393 laminas: sem busca, sem imagem, e
   escondendo 469 das 675 pecas por exigir perfil de desempenho. */
afirma(filtrarPorTexto(MATERIAIS, '').length === MATERIAIS.length,
  'busca vazia devolve o catalogo inteiro');

/* Termos em QUALQUER ordem: quem procura nao sabe como o catalogo escreve. */
const porOrdem1 = filtrarPorTexto(MATERIAIS, 'timo boll').map((x) => x.id).sort();
const porOrdem2 = filtrarPorTexto(MATERIAIS, 'boll timo').map((x) => x.id).sort();
afirma(jeq(porOrdem1, porOrdem2), 'a ordem dos termos nao muda o resultado');
afirma(porOrdem1.length > 1, `"timo boll" acha as laminas da linha (${porOrdem1.length})`);

/* Acento ignorado dos dois lados: quem digita "lamina" acha "Lamina". */
afirma(filtrarPorTexto(MATERIAIS, 'lamina').length === filtrarPorTexto(MATERIAIS, 'lâmina').length,
  'acento na busca nao muda o resultado');

/* Marca tambem entra no alvo, nao so' o nome. */
const daButterfly = filtrarPorTexto(MATERIAIS, 'butterfly');
afirma(daButterfly.length > 40 && daButterfly.every((x) => x.marca === 'Butterfly'),
  `busca por marca traz so' a marca (${daButterfly.length} da Butterfly)`);

afirma(filtrarPorTexto(MATERIAIS, 'zzzz').length === 0, 'termo sem resultado devolve lista vazia');

/* O montador passou a oferecer TODAS as pecas de raquete. */
const pecasMontaveis = MATERIAIS.filter((x) => x.tipo === 'Lâmina' || x.tipo === 'Borracha');
afirma(pecasMontaveis.length > 660,
  `o montador oferece todas as laminas e borrachas (${pecasMontaveis.length})`);

// A MONTAGEM CONTRA O PERFIL DE QUEM MONTA
/* O configurador dizia o preco e apontava choques entre as pecas, e nunca
   relacionava nada com QUEM monta. A pessoa ja' declarou estilo e nivel na
   comunidade -- usar isso e' dado que ela mesma deu. */
const pc = (id: string, intencao: string, nivel: string): PecaMontagem =>
  ({ id, nome: id, marca: 'X', tipo: 'Borracha', nivel, intencao, preco: 100 });
const INT = { atacante: 'atacar', allround: 'equilibrado', defensor: 'controlar' };

const vAtac = vereditosDaMontagem(
  { fh: pc('rapida', 'atacar', 'Avançado'), bh: pc('lenta', 'controlar', 'Avançado') },
  'atacante', 'Avançado', INT);
afirma(vAtac[0].estilo === 'combina', 'peca de ataque combina com quem se diz atacante');
afirma(vAtac[1].estilo === 'destoa', 'peca de controle destoa de quem se diz atacante');

/* Equilibrado nunca destoa: e' o que serve a todo mundo. */
const vEq = vereditosDaMontagem({ fh: pc('meio', 'equilibrado', 'Avançado') },
  'atacante', 'Avançado', INT);
afirma(vEq[0].estilo === 'neutro', 'peca equilibrada nao destoa de estilo nenhum');

/* Nivel: DOIS degraus acima e' aviso; um degrau e' crescimento normal. */
const vNivel = vereditosDaMontagem(
  { fh: pc('dura', 'equilibrado', 'Avançado'), bh: pc('media', 'equilibrado', 'Intermediário') },
  undefined, 'Iniciante',
  INT);
afirma(vNivel[0].nivel === 'destoa', 'avancada para iniciante: dois degraus, vira aviso');
afirma(vNivel[1].nivel === 'neutro', 'intermediaria para iniciante: um degrau, sem alerta');

/* Sem perfil declarado, nada e' afirmado sobre a pessoa. */
const vMontagemSemPerfil = vereditosDaMontagem({ fh: pc('x', 'atacar', 'Avançado') },
  undefined, undefined, INT);
afirma(vMontagemSemPerfil[0].estilo === 'neutro' && vMontagemSemPerfil[0].nivel === 'neutro',
  'sem estilo nem nivel declarados, o veredito nao inventa nada');
afirma(vMontagemSemPerfil[0].texto === '', 'sem perfil, nao ha' + "'" + ' frase para mostrar');

afirma(vereditosDaMontagem({}, 'atacante', 'Avançado', INT).length === 0,
  'montagem vazia nao gera veredito');

// O RESUMO EM PROSA DA RAQUETE MONTADA
/* O cabecalho de montagem.ts proibe NOTA DE DESEMPENHO COMBINADA, e a proibicao
   continua de pe'. Texto e' outra coisa: descreve o conjunto compondo o que cada
   peca declara, sem ponderar nem somar nada. */
const pm = (id: string, tipo: string, intencao: string, nivel: string): PecaMontagem =>
  ({ id, nome: id, marca: 'M', tipo, nivel, intencao, preco: 200 });

const montagemAtaque = {
  lamina: pm('lam', 'Lâmina', 'atacar', 'Avançado'),
  fh: pm('b1', 'Borracha', 'atacar', 'Avançado'),
  bh: pm('b2', 'Borracha', 'equilibrado', 'Intermediário'),
};
const rAtaque = resumoDaMontagem(montagemAtaque,
  { lamina: 'fibra-externa', fh: 'tensor', bh: 'tensor' })!;
afirma(rAtaque.titulo.includes('ataque'), 'duas pecas de ataque -> raquete de ataque');
afirma(rAtaque.exige.includes('tecnica formada') || rAtaque.exige.includes('técnica formada'),
  'peca avancada no conjunto -> exige tecnica formada');
afirma(rAtaque.paragrafos[0].includes('fibra logo abaixo'),
  'a base descrita e' + "'" + ' a familia declarada da lamina');
afirma(rAtaque.paragrafos[1].includes('simetrica') || rAtaque.paragrafos[1].includes('simétrica'),
  'duas borrachas da mesma familia -> montagem simetrica');

/* Lados de familias diferentes sao descritos como diferentes, sem julgamento. */
const rMisto = resumoDaMontagem(montagemAtaque,
  { lamina: 'madeira-pura', fh: 'tensor', bh: 'aderente' })!;
afirma(rMisto.paragrafos[1].includes('forehand') || rMisto.paragrafos[1].includes('Lados')
  || rMisto.paragrafos[1].includes('O forehand'), 'lados diferentes viram descricao dos dois lados');

/* Montagem incompleta NAO ganha resumo: descrever meia raquete seria afirmar
   sobre um conjunto que ainda nao existe. */
afirma(resumoDaMontagem({ lamina: pm('so', 'Lâmina', 'atacar', 'Avançado') }, {}) === null,
  'montagem incompleta nao gera resumo');

/* Sem construcao declarada, o texto DIZ que nao da' pra afirmar -- nao inventa. */
const rSemFicha = resumoDaMontagem(montagemAtaque, { lamina: null, fh: null, bh: null })!;
afirma(rSemFicha.paragrafos[0].includes('sem chutar'),
  'lamina sem construcao declarada: o resumo admite em vez de inventar');
afirma(rSemFicha.paragrafos.length === 1,
  'sem familia das borrachas, o paragrafo dos lados nao e' + "'" + ' escrito');

/* A invariante que protege a decisao antiga: NENHUM numero de desempenho no
   resumo. Preco e' outra coisa e nao entra aqui. */
const todoTexto = [rAtaque.titulo, ...rAtaque.paragrafos, rAtaque.serve, rAtaque.exige].join(' ');
afirma(!/\d+[,.]\d/.test(todoTexto),
  'o resumo nao publica nota nem decimal do conjunto (nota combinada segue proibida)');

// ───────── Borracha não tem camada de madeira ─────────
/* Aconteceu de verdade na colheita da GEWO: eu recortava um trecho da pagina do
   produto e chamava de construcao. Numa borracha veio "5 camadas de hinoki,
   limba, carbono" -- texto de OUTRO produto da mesma pagina, atribuido ao
   errado. 25 borrachas sairam assim.

   Camada e nome de madeira sao propriedade de LAMINA. Numa borracha isso nao e'
   impreciso: e' de outro produto. */
const MADEIRA = /\b(\d\s*camadas?|hinoki|limba|koto|ayous|balsa|kiri|paulownia|sapele|nogueira)\b/i;
const borrachaComMadeira = MATERIAIS.filter(m => m.tipo === 'Borracha' && MADEIRA.test(m.simples.frase));
afirma(borrachaComMadeira.length === 0,
  `borracha descrevendo camada de madeira (texto de outro produto): ${borrachaComMadeira.slice(0, 4).map(m => m.id).join(', ')}`);

/* E o texto do modo Simples nao pode carregar lixo de loja nem ingles solto --
   o site e' PT-BR por convencao, e "Free US Shipping" nao descreve material. */
const LIXO = /Cancel\b|Free US Shipping|Add to Cart|\bthe\b.*\bblade\b|reliable choice/i;
const comLixo = MATERIAIS.filter(m => LIXO.test(m.simples.frase) || LIXO.test(m.simples.tag));
afirma(comLixo.length === 0,
  `texto do modo Simples com lixo de loja ou ingles: ${comLixo.slice(0, 4).map(m => m.id).join(', ')}`);

// ───────── Régua: número só se compara com número da mesma medida ─────────
/* A colheita internacional trouxe indice publicado pela Megaspin, onde uma
   borracha marca 118 e 128 -- passa de 100. Sem declarar a regua, esse 118
   apareceria na mesma coluna que o 9.0 da semente, e a tabela daria a entender
   que um esmaga o outro. Sao bases diferentes. */
const specSemente: Specs = { velocidade: 9.0, spin: 9.3, controle: 7.0 };
const specMegaspin: Specs = { velocidade: 118, spin: 128, controle: 96, regua: 'megaspin' };

afirma(reguaDe(specSemente) === 'semente',
  'quem nao declara regua e' + "'" + ' semente -- os 208 materiais anteriores continuam validos');
afirma(reguaDe(specMegaspin) === 'megaspin', 'regua declarada e' + "'" + ' respeitada');
afirma(mesmaRegua(specSemente, specMegaspin) === false, 'semente e megaspin nao sao a mesma regua');
afirma(mesmaRegua(specSemente, { velocidade: 7, controle: 9 }) === true,
  'dois sem declaracao sao a mesma regua');

const cmp = (s?: Specs) => ({ id: 'x', nome: 'X', preco: 100, specs: s });
afirma(metricasComparaveis(cmp(specSemente), cmp(specMegaspin)).length === 0,
  'reguas diferentes NAO geram tabela de comparacao');
afirma(metricasComparaveis(cmp(specSemente), cmp({ velocidade: 7, spin: 7.5, controle: 9 })).length > 0,
  'mesma regua continua comparando normalmente');
afirma(metricasComparaveis(cmp(specMegaspin), cmp({ ...specMegaspin, velocidade: 99 })).length > 0,
  'dois na regua megaspin se comparam entre si');

/* O teto existe para desenhar barra e radar sem achatar: contra 100, a borracha
   de 128 sairia estourada. */
afirma(TETO_DA_REGUA.megaspin > 100 && TETO_DA_REGUA.semente === 10,
  'cada regua tem o proprio teto, e o da megaspin passa de 100');

/* INVARIANTE DO CATALOGO: todo material com specs declara de onde veio a regua,
   ou nao declara nada e vale a semente. Numero com regua desconhecida e' numero
   que ninguem consegue defender depois. */
const REGUAS_VALIDAS = new Set(['semente', 'megaspin']);
const reguaInvalida = MATERIAIS.filter(
  m => m.specs && m.specs.regua !== undefined && !REGUAS_VALIDAS.has(m.specs.regua));
afirma(reguaInvalida.length === 0,
  `material com regua desconhecida: ${reguaInvalida.map(m => m.id).join(', ')}`);

// ───────── Conjuntos: a raquete inteira que a home anuncia ─────────
/* A home promete "raquete inteira, pronta para começar". A promessa se sustenta
   em duas coisas que nenhum texto garante sozinho. */
const deIniciante = CONJUNTOS.filter(c => c.nivel === 'Iniciante');
afirma(deIniciante.length > 0, 'existe conjunto de iniciante para a home mostrar');

for (const c of deIniciante) {
  /* TRÊS peças. `resolver()` descarta em silêncio a peça cujo id sumiu do
     catálogo -- e' o certo, um id velho nao pode derrubar a pagina. Mas aí o
     card mostraria duas fotos embaixo da palavra "inteira". */
  afirma(c.pecas.length === 3,
    `conjunto "${c.id}" tem as tres pecas (lamina + 2 borrachas)`);
  afirma(c.pecas.filter(p => p.material.tipo === 'Borracha').length === 2
      && c.pecas.filter(p => p.material.tipo === 'Lâmina').length === 1,
    `conjunto "${c.id}" e' 1 lamina + 2 borrachas, e nao outra combinacao`);

  /* MESMA MOEDA. Somar uma lamina em reais com uma borracha em dolar e publicar
     o resultado como preco e' inventar um numero que ninguem consegue pagar --
     e o catalogo tem 167 materiais fora do real, entao nao e' hipotese. */
  afirma(c.misturaMoedas === false,
    `conjunto "${c.id}" nao mistura moedas (senao o total nao existe)`);
  afirma(c.precoTotal === c.pecas.reduce((s, p) => s + p.material.preco, 0),
    `o total do conjunto "${c.id}" e' a soma real das pecas`);
}

/* O nome sozinho, sem a linha de marca ao lado, precisa dizer de quem e'. O
   catalogo tem DUAS convencoes: 789 guardam o nome nu ("Rozena") e 73 da semente
   trazem a marca embutida ("Yasaka Mark V"). Sem isto, o card da home mostrava
   "Rozena" ao lado de "Xiom Vega Intro" -- e quem esta' comecando nao tem como
   saber que a primeira e' uma Butterfly. */
afirma(nomeComMarca('Butterfly', 'Rozena') === 'Butterfly Rozena',
  'nome nu recebe a marca na frente');
afirma(nomeComMarca('Yasaka', 'Yasaka Mark V') === 'Yasaka Mark V',
  'nome que ja' + "'" + ' comeca pela marca nao a repete');
afirma(nomeComMarca('yasaka', 'Yasaka Mark V') === 'Yasaka Mark V',
  'a comparacao ignora caixa');
/* A regra e' PREFIXO, e nao "contem": um nome que cita a marca no meio ainda
   precisa dela na frente para o leitor saber de quem e' o produto. */
afirma(nomeComMarca('Stiga', 'Clipper com cabo Stiga') === 'Stiga Clipper com cabo Stiga',
  'marca citada no meio nao conta como prefixo');

for (const c of deIniciante) {
  for (const p of c.pecas) {
    const exibido = nomeComMarca(p.material.marca, p.material.nome);
    afirma(exibido.toLowerCase().startsWith(p.material.marca.toLowerCase()),
      `no card, "${p.material.nome}" aparece com a marca na frente`);
  }
}

/* A deteccao de mistura tem que morder de verdade. */
const misturado = CONJUNTOS.some(c => c.misturaMoedas);
afirma(misturado === false, 'hoje nenhum conjunto mistura moedas');
const umaEmDolar = MATERIAIS.find(m => m.moeda !== undefined);
afirma(umaEmDolar !== undefined,
  'o catalogo TEM material em moeda estrangeira (senao a trava acima nao prova nada)');

// ───────── Fórum: a consulta que precisa nomear a chave ─────────
/* Esta asserção olha o CÓDIGO-FONTE, e não uma função. É de propósito.

   Existem duas ligações entre `topicos` e `respostas` (as respostas de um
   tópico, e a resposta que resolveu, da migração 010). Com as duas no ar,
   `respostas(*)` é ambíguo e o PostgREST responde 300 em vez de dados -- o
   fórum lista vazio, e a tela trata falha de leitura como "não há nada", que é
   o certo pra não dar tela branca e é o que faz o defeito passar despercebido.

   Aconteceu de verdade: ficou quebrado em produção da 010 até ser encontrado
   conferindo contra o banco. Nenhum teste de unidade pega isso, porque a string
   da consulta só é julgada do outro lado da rede. O que dá pra garantir daqui é
   que ninguém "simplifique" o nome da chave de volta. */
const fonteDiscussoes = readFileSync('src/logica/discussoes.ts', 'utf8');
afirma(fonteDiscussoes.includes('respostas!respostas_topico_id_fkey'),
  'a consulta do forum nomeia a chave estrangeira (senao o PostgREST nao sabe por qual das duas embutir)');
afirma(!/select=\*,respostas\(\*\)/.test(fonteDiscussoes),
  'a forma ambigua `respostas(*)` nao pode voltar');

// ───────── Fórum: busca e a resposta que resolveu ─────────
const mensagemDeTeste = (id: string, texto: string, criadoEm: string): MensagemForum =>
  ({ id, autor: 'Alguém', texto, criadoEm });
const topicoDeTeste = (id: string, titulo: string, texto: string, respostas: MensagemForum[],
             respostaUtil?: string): Topico =>
  ({ id, titulo, texto, assunto: 'material', autor: 'A', criadoEm: '2026-08-01',
     respostas, respostaUtil });

const forum: Topico[] = [
  topicoDeTeste('t1', 'Vale a pena trocar agora?', 'Estou com a lâmina há dois anos.', [
    mensagemDeTeste('r1', 'Depende de quanto voce joga.', '2026-08-02'),
    mensagemDeTeste('r2', 'Eu troquei a minha Viscaria e senti diferenca.', '2026-08-03'),
  ], 'r2'),
  topicoDeTeste('t2', 'Primeira raquete montada', 'Nunca montei uma.', []),
];

/* A busca varre as RESPOSTAS. Num forum de equipamento o nome do material quase
   nunca esta' no titulo -- esta' na resposta de quem respondeu. Buscar so' o
   titulo esconderia justo o topico que a busca existe para achar. */
afirma(buscarTopicos(forum, 'viscaria').length === 1,
  'a busca acha o material citado dentro de uma RESPOSTA');
afirma(buscarTopicos(forum, 'VISCÁRIA').length === 1,
  'busca sem acento e sem caixa, como a do catalogo');
afirma(buscarTopicos(forum, 'trocar lamina').length === 1,
  'todos os termos precisam casar, em qualquer ordem');
afirma(buscarTopicos(forum, 'butterfly').length === 0, 'termo ausente nao devolve nada');
afirma(buscarTopicos(forum, '   ').length === 2, 'busca vazia devolve tudo, nao nada');

/* A resposta marcada SOBE, e as outras seguem na ordem em que foram escritas. */
const ordenadas = respostasOrdenadas(forum[0]);
afirma(ordenadas[0].id === 'r2', 'a resposta que resolveu vem primeiro');
afirma(ordenadas.length === 2 && ordenadas[1].id === 'r1',
  'as demais seguem na ordem original, sem sumir');
afirma(respostasOrdenadas(forum[1]).length === 0, 'topico sem resposta nao quebra');

/* Marcacao apontando pra resposta que nao existe mais (a 010 apaga com
   `on delete set null`, mas um dado velho pode chegar assim): a tela nao pode
   quebrar nem inventar uma resposta. */
const orfa = topicoDeTeste('t3', 'Titulo qualquer', 'Texto.', [mensagemDeTeste('r9', 'oi', '2026-08-02')], 'sumiu');
afirma(respostasOrdenadas(orfa).length === 1, 'marcacao orfa nao come a lista de respostas');
afirma(temRespostaUtil(orfa) === false, 'marcacao orfa nao vale como resolvida');
afirma(temRespostaUtil(forum[0]) === true, 'marcacao valida conta como resolvida');
afirma(temRespostaUtil(forum[1]) === false, 'topico sem marcacao nao aparece como resolvido');

/* Buscar nao pode mexer na lista recebida. */
const idsAntes = forum.map(t => t.id).join(',');
buscarTopicos(forum, 'viscaria');
respostasOrdenadas(forum[0]);
afirma(forum.map(t => t.id).join(',') === idsAntes, 'a busca nao muda a lista original');

// ───────── Pedidos de pauta: o leitor diz o tema que falta ─────────
const pedido = (id: string, tema: string, criadoEm: string, guiaSlug?: string): PedidoDePauta =>
  ({ id, tema, autor: 'Alguém', criadoEm, status: 'aprovado', guiaSlug });

afirma(validarPedido({ tema: 'cola', autor: 'Ana' }).some(p => p.campo === 'tema'),
  'tema curto demais nao vira guia, e o formulario diz isso');
afirma(validarPedido({ tema: 'quando trocar a borracha', autor: 'A' }).some(p => p.campo === 'autor'),
  'pedido sem assinatura e' + "'" + ' recusado');
afirma(validarPedido({ tema: 'quando trocar a borracha', autor: 'Ana' }).length === 0,
  'tema e assinatura bastam: detalhe e' + "'" + ' opcional de verdade');
afirma(validarPedido({ tema: 'x'.repeat(200), autor: 'Ana' }).some(p => p.campo === 'tema'),
  'tema gigante e' + "'" + ' recusado -- o resto cabe no detalhe');

/* PARECIDOS: a tela mostra o que ja' foi pedido ANTES de aceitar mais um. O
   que faz isso funcionar e' ignorar as palavras que aparecem em todo pedido. */
const feitos = [
  pedido('p1', 'como escolher a dureza da esponja', '2026-08-01T10:00:00Z'),
  pedido('p2', 'qual lâmina comprar para começar', '2026-08-02T10:00:00Z'),
  pedido('p3', 'como limpar a raquete', '2026-08-03T10:00:00Z'),
];
const achadosDureza = parecidos(feitos, 'quero entender melhor a dureza da esponja chinesa');
afirma(achadosDureza.length === 1 && achadosDureza[0].id === 'p1',
  'pedido parecido e' + "'" + ' encontrado pelas palavras que importam');
afirma(parecidos(feitos, 'como quero saber mais sobre o que é melhor').length === 0,
  'so' + "'" + ' palavra vazia nao casa com nada -- senao TODO pedido pareceria parecido');
afirma(parecidos(feitos, '').length === 0, 'campo vazio nao sugere nada');

/* A ordem 'atendidos' responde "pedir aqui adianta?" logo na primeira linha. */
const comAtendido = [
  pedido('a', 'tema antigo sem guia', '2026-08-01T10:00:00Z'),
  pedido('b', 'tema que virou guia', '2026-07-01T10:00:00Z', 'estilos-de-jogo'),
];
afirma(ordenarPedidos(comAtendido, 'atendidos')[0].id === 'b',
  'atendidos primeiro: o que virou guia encabeca a lista mesmo sendo mais velho');
afirma(ordenarPedidos(comAtendido, 'recentes')[0].id === 'a',
  'em recentes, quem manda e' + "'" + ' a data');
afirma(atendidos(comAtendido).length === 1, 'atendido e' + "'" + ' quem tem guia amarrado');

/* Ordenar nao pode mexer na lista recebida -- mesma regra dos outros modulos. */
const antesDeOrdenar = comAtendido.map(p => p.id).join(',');
ordenarPedidos(comAtendido, 'atendidos');
afirma(comAtendido.map(p => p.id).join(',') === antesDeOrdenar,
  'ordenarPedidos nao muda a lista original');

/* A lista publica mostra so' o aprovado. Nao basta a RLS: ela devolve o
   pendente para quem esta' logado como moderador, e o moderador abrindo
   /aprender veria na lista publica um pedido que o publico nao ve. */
const mistura: PedidoDePauta[] = [
  { id: '1', tema: 'aprovado', autor: 'A', criadoEm: '2026-08-01', status: 'aprovado' },
  { id: '2', tema: 'esperando leitura', autor: 'B', criadoEm: '2026-08-02', status: 'pendente' },
  { id: '3', tema: 'tirado do ar', autor: 'C', criadoEm: '2026-08-03', status: 'removido' },
];
afirma(aprovados(mistura).length === 1 && aprovados(mistura)[0].id === '1',
  'a lista publica mostra so' + "'" + ' o aprovado, nem pendente nem removido');
afirma(parecidos(aprovados(mistura), 'esperando leitura').length === 0,
  'pedido pendente nao vaza nem pelos "ja pediram algo parecido"');

/* Slug que nao existe em guias.tsx nao vira link: quem resolve isso e' o
   componente, que so' desenha "Virou guia" quando acha o titulo. Este modulo
   guarda o slug e nao conhece os guias -- e' o que mantem os dois soltos. */

// ───────── Nenhum pino disfarçado de borracha lisa ─────────
/* Pinos e anti-spin estao fora da colheita por decisao do fundador. O problema
   e' que o NOME nao denuncia: Nittaku Hammond e' lisa, Hammond FA e' pino curto;
   andro Hexer e' lisa, Hexer Pips e' pino. Ja' entraram 11 assim -- e o modo
   Simples falava delas como borracha lisa, que e' o oposto do que sao.

   Por isso a checagem e' contra o indice /pips/ do Revspin (dados/pinos-
   conhecidos.json), casando MARCA + NOME EXATO. Substring nao serve: "Hexer"
   casaria com "Hexer Pips Force" e derrubaria uma borracha lisa legitima. */
const PINOS = JSON.parse(readFileSync('dados/pinos-conhecidos.json', 'utf8')) as
  { marcas: Record<string, string[]> };
const chave = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9+]/g, '');
const listaPinos: Record<string, Set<string>> = {};
for (const [marca, nomes] of Object.entries(PINOS.marcas)) {
  listaPinos[marca] = new Set(nomes.map(chave));
}
const intrusos = MATERIAIS.filter(
  m => m.tipo === 'Borracha' && listaPinos[m.marca]?.has(chave(m.nome)));
afirma(intrusos.length === 0,
  `pino/anti-spin entrou como borracha lisa: ${intrusos.map(m => m.marca + ' ' + m.nome).join(', ')}`);

/* A lista so' serve se cobrir as marcas que existem no catalogo. Uma marca nova
   sem entrada aqui passa despercebida, e o teste acima nao acusa nada. */
const marcasDeBorracha = [...new Set(MATERIAIS.filter(m => m.tipo === 'Borracha').map(m => m.marca))];
const semLista = marcasDeBorracha.filter(m => !listaPinos[m]);
afirma(semLista.length === 0,
  `marca de borracha sem lista de pinos conhecidos (a checagem nao a cobre): ${semLista.join(', ')}`);

/* ---------------------------------------------------------------------------
   O resumo automático das notícias
   ---------------------------------------------------------------------------
   Estas checagens leem o CÓDIGO do colhedor, não o resultado dele: a rotina só
   roda no GitHub, com a chave, e uma falha ali é silenciosa por desenho — a
   notícia entra sem resumo e ninguém percebe que o robô parou de escrever. */
const colhedor = readFileSync('scripts/colher-noticias.mjs', 'utf8');
const redator = readFileSync('scripts/resumir-noticia.mjs', 'utf8');

/* `corpo` é matéria-prima do resumo, não campo do banco. Se escapar pro POST,
   o PostgREST recusa a linha inteira e a fila para de encher. */
afirma(/const \{ corpo, linhaFina, \.\.\.campos \} = n;/.test(colhedor),
  'o colhedor precisa separar `corpo` e `linhaFina` antes de enviar: nao sao colunas do banco');
afirma(!/body: JSON\.stringify\(n\)/.test(colhedor),
  'o colhedor esta enviando a noticia crua (com `corpo`) em vez dos campos');

/* Recortar prosa da fonte foi o erro da colheita da GEWO. Aqui o texto da
   notícia entra como INSUMO do modelo e nunca como resumo direto. */
afirma(!/resumo: *corpo|resumo: *texto/.test(colhedor + redator),
  'resumo recortado do texto da fonte: ele tem que ser escrito, nao copiado');

/* Resumo custa token. A home da CBTM tem sempre as mesmas 6 noticias, e sem
   conferir a fila antes seriam 18 resumos por dia pras 2 ou 3 novas de verdade
   -- pagos, e jogados fora no 409. A checagem tem que vir ANTES do resumo. */
afirma(/if \(existente\?\.resumo\) \{ repetidas\+\+; continue; \}/.test(colhedor),
  'o colhedor precisa pular o que ja esta na fila antes de resumir: resumo repetido e dinheiro fora');
afirma(colhedor.indexOf('existente?.resumo') < colhedor.indexOf('await resumir('),
  'a checagem da fila esta DEPOIS do resumo: pula tarde, ja pagou');

/* Mas so' pula quem JA TEM resumo. Noticia depositada antes de existir redator
   esta' na fila com resumo nulo -- pular essa por "ja estar na fila" a deixaria
   em branco pra sempre, que e' exatamente o que a automacao veio resolver. */
afirma(/method: 'PATCH'/.test(colhedor),
  'o colhedor precisa escrever o resumo da noticia que ja esta na fila sem ele, nao so inserir novas');

/* O PATCH mexe em resumo e tag. `status` e' decisao do fundador: sobrescrever
   devolveria pra fila uma noticia que ele ja tinha publicado ou descartado. */
const corpoDoPatch = (colhedor.match(/method: 'PATCH',[\s\S]*?body: (JSON\.stringify\(\{[^\n]*)/) || ['', ''])[1];
afirma(corpoDoPatch.length > 0 && !/status/.test(corpoDoPatch),
  'o PATCH esta mexendo em `status`: isso apaga a decisao do fundador sobre a noticia');

/* A linha fina e' palavra da CBTM. Entrar sem marcar a procedencia faria frase
   deles passar por nossa -- o erro da GEWO com roupa melhor. */
afirma(/campos\.resumo = linhaFina;[\s\S]{0,80}campos\.origem_resumo = 'fonte';/.test(colhedor),
  'a linha fina esta entrando sem marcar origem_resumo: frase da CBTM passando por nossa');
afirma(/campos\.resumo = escrito\.resumo;[\s\S]{0,80}campos\.origem_resumo = 'wikipong';/.test(colhedor),
  'o resumo do modelo esta entrando sem origem: a tela nao sabe se atribui ou nao');

/* E a tela tem que ATRIBUIR. A coluna sozinha nao protege ninguem: se a pagina
   publica nao mostrar de quem e' a frase, a procedencia so' existe no banco. */
const publica = readFileSync('componentes/NoticiasAprovadas.tsx', 'utf8');
afirma(/origemResumo === 'fonte'/.test(publica),
  'a pagina de noticias nao esta atribuindo a linha fina a quem escreveu');

/* Uma recusa vem como HTTP 200 com content vazio. Ler content sem conferir o
   stop_reason quebra a colheita inteira num erro que parece de rede. */
afirma(/stop_reason === 'refusal'/.test(redator),
  'o redator precisa conferir stop_reason antes de ler o content');

/* O banco exige RESUMO_MINIMO pra publicar. Devolver um resumo menor que isso
   enche a moderação de campo que o botão de publicar recusa. */
afirma(new RegExp(`length < ${RESUMO_MINIMO}`).test(redator),
  `o redator precisa descartar resumo abaixo de ${RESUMO_MINIMO} caracteres, como o banco faz`);

/* Sem a chave, a colheita continua: as notícias chegam sem resumo e o fundador
   escreve na moderação. Uma automação que morre por falta de segredo é pior. */
afirma(/ANTHROPIC_API_KEY/.test(redator) && /if \(!TEM_CHAVE\) return null;/.test(redator),
  'sem ANTHROPIC_API_KEY a colheita tem que seguir sem resumo, nao quebrar');

/* O modelo classifica dentro do vocabulário que as notícias já publicadas usam.
   Uma tag nova inventada por ele criaria uma categoria órfã no site. */
const tagsPublicadas = [...new Set(NOTICIAS.map(n => n.tag).filter(Boolean))];
const tagsDoRedator = (redator.match(/export const TAGS = \[([^\]]+)\]/) || [])[1] ?? '';
const orfas = tagsPublicadas.filter(t => !tagsDoRedator.includes(`'${t}'`));
afirma(orfas.length === 0,
  `tag publicada que o redator nao conhece (ele nunca vai atribuir): ${orfas.join(', ')}`);

/* A rotina precisa instalar o SDK e receber a chave, senao o import falha e a
   colheita inteira morre no primeiro `import`. */
const rotina = readFileSync('.github/workflows/noticias.yml', 'utf8');
afirma(/npm ci/.test(rotina), 'a rotina precisa de `npm ci`: o colhedor agora importa o SDK');
afirma(/ANTHROPIC_API_KEY: \$\{\{ secrets\.ANTHROPIC_API_KEY \}\}/.test(rotina),
  'a rotina precisa passar ANTHROPIC_API_KEY pro passo da colheita');

console.log(`\n✔ ${ok} asserções passaram`);
if (falhas.length) {
  console.error(`✘ ${falhas.length} falharam:`);
  for (const f of falhas) console.error('  - ' + f);
  process.exit(1);
}
console.log('Colheita verificada: métricas e quiz batem com o que está publicado no Figma.\n');
